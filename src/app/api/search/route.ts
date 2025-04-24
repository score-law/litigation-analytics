import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { SearchResultItem } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Helper function to prepare search patterns for both BOOLEAN MODE search and LIKE queries.
 * Generates appropriate wildcards for partial word matching.
 * @param searchTerm The user's search term
 * @returns Object containing patterns for different search types
 */
function prepareSearchPatterns(searchTerm: string) {
  if (!searchTerm || !searchTerm.trim()) {
    return { 
      original: '',
      boolean: '',
      like: '',
      words: []
    };
  }

  const trimmed = searchTerm.trim();
  // Split search term into words for multi-word searches
  const words = trimmed.split(/\s+/);
  
  // For BOOLEAN MODE: add * wildcard to each word for partial matching
  const booleanTerms = words.map(word => `${word}*`).join(' ');

  return {
    original: trimmed,
    boolean: booleanTerms,
    like: `%${trimmed}%`,
    words: words
  };
}

/**
 * Builds a scoring expression for relevance-based sorting of search results.
 * Prioritizes exact matches, prefix matches, and then contains matches.
 * @param fieldExpressions Array of field expressions to search in (e.g., 'first', 'last')
 * @param searchPatterns Search patterns from prepareSearchPatterns
 * @returns SQL expression for scoring and WHERE clause conditions
 */
function buildScoringExpression(fieldExpressions: string[], searchPatterns: ReturnType<typeof prepareSearchPatterns>) {
  if (!searchPatterns.original) {
    return {
      scoreExpr: '0 AS search_score',
      whereConditions: '',
      params: []
    };
  }

  const { original, boolean, like, words } = searchPatterns;
  const params: any[] = [];
  
  // Build scoring components
  const scoringComponents: string[] = [];
  const whereConditions: string[] = [];
  
  // Position-based scoring for LIKE queries (higher score for prefix matches)
  const likeConditions: string[] = [];
  
  // Add LIKE conditions for all field expressions
  fieldExpressions.forEach(field => {
    // Contains (medium priority) - for filtering and scoring
    likeConditions.push(`${field} LIKE ?`);
    params.push(like);
    
    // For scoring only - add these to scoring components
    
    // Exact match (highest priority)
    scoringComponents.push(`((${field} = ?) * 30)`);
    params.push(original);
    
    // Starts with (high priority)
    scoringComponents.push(`((${field} LIKE ?) * 15)`);
    params.push(`${original}%`);
    
    // For multi-word searches, check if any individual word matches at the start
    if (words.length > 1) {
      words.forEach(word => {
        if (word.length >= 2) {
          scoringComponents.push(`((${field} LIKE ?) * 5)`);
          params.push(`${word}%`);
        }
      });
    }
  });
  
  // 1. FULLTEXT BOOLEAN MODE for flexible matching with wildcards - only for scoring if term is long enough
  if (original.length >= 2) {
    const matchFields = fieldExpressions.join(', ');
    
    // Use FULLTEXT for scoring only
    scoringComponents.push(`(MATCH(${matchFields}) AGAINST(? IN BOOLEAN MODE) * 10)`);
    params.push(boolean);
    
    // Add the match condition to where clause too (as an alternative to LIKE)
    whereConditions.push(`(MATCH(${matchFields}) AGAINST(? IN BOOLEAN MODE))`);
    params.push(boolean);
  }
  
  // Always include LIKE conditions in the WHERE clause
  whereConditions.push(`(${likeConditions.join(' OR ')})`);
  
  return {
    scoreExpr: `(${scoringComponents.length > 0 ? scoringComponents.join(' + ') : '0'}) AS search_score`,
    whereConditions: whereConditions.length > 0 ? `AND (${whereConditions.join(' OR ')})` : '',
    params: params
  };
}

/**
 * /api/search
 * Centralized search endpoint for Judges, Courts, Charges, and Charge Groups.
 * Supports filtering by selected entity, search term, pagination, and sorts by relevancy and total_case_dispositions.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const searchCategory = params.get('searchCategory');
  const searchTerm = params.get('searchTerm') || '';
  const selectedCategory = params.get('selectedCategory');
  const selectedId = params.get('selectedId');
  const offset = (parseInt(params.get('offset') || '0', 10)).toString();
  const limit = (parseInt(params.get('limit') || '20', 10)).toString();

  try {
    let results: SearchResultItem[] = [];

    switch (searchCategory) {
      case 'Judges':
        results = await searchJudges(searchTerm, selectedCategory, selectedId, offset, limit);
        break;
      case 'Courts':
        results = await searchCourts(searchTerm, selectedCategory, selectedId, offset, limit);
        break;
      case 'Charges':
        results = await searchCharges(searchTerm, selectedCategory, selectedId, offset, limit);
        break;
      case 'Charge Groups':
        results = await searchChargeGroups(searchTerm, selectedCategory, selectedId, offset, limit);
        break;
      default:
        return NextResponse.json({ error: 'Invalid searchCategory' }, { status: 400 });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper to exclude "ANY" (id=0) rows from search results.
 * Ensures that rows with id=0 (the "ANY" row) are never returned to the user.
 * Should be added to the WHERE clause for each entity table.
 */
function excludeAnyRow(entityAlias: string, idField: string = 'id') {
    return `AND ${entityAlias}.${idField} != 0`;
}

/**
 * Helper to build composite key filter for the specification table.
 * For each composite key, if it's the main or selected filter, use the id.
 * Otherwise, require it to be 0 (or 'any' for trial_category).
 */
function buildCompositeKeyFilter(
    mainKey: string,
    mainIdField: string,
    selectedCategory: string | null,
    selectedId: string | null
  ) {
    // Map of all composite keys and their default values
    const keys = [
      { key: 'judge_id', default: 0 },
      { key: 'charge_id', default: 0 },
      { key: 'court_id', default: 0 },
      { key: 'trial_category', default: "'any'" }
    ];
    let where = '';
    const params: any[] = [];
  
    for (const { key, default: def } of keys) {
      if (key === mainKey) {
        where += ` AND s.${key} = ${mainIdField}`;
      } else if (selectedCategory && selectedId) {
        // Map selectedCategory to composite key
        let selectedKey = '';
        if (selectedCategory === 'Judges') selectedKey = 'judge_id';
        else if (selectedCategory === 'Courts') selectedKey = 'court_id';
        else if (selectedCategory === 'Charges') selectedKey = 'charge_id';
        else if (selectedCategory === 'Charge Groups') selectedKey = 'charge_id';
        else if (selectedCategory === 'Trial Category') selectedKey = 'trial_category';
  
        if (key === selectedKey && key !== mainKey) {
          where += ` AND s.${key} = ?`;
          params.push(Number(selectedId));
        } else if (key !== 'trial_category') {
          where += ` AND s.${key} = 0`;
        } else {
          where += ` AND s.${key} = 'any'`;
        }
      } else if (key !== 'trial_category') {
        where += ` AND s.${key} = 0`;
      } else {
        where += ` AND s.${key} = 'any'`;
      }
    }
    return { where, params };
}

/**
 * Search Judges with optional filter by selected entity.
 * Uses a specialized concatenated name approach to better handle searching across first, middle, and last names.
 */
async function searchJudges(
  searchTerm: string,
  selectedCategory: string | null,
  selectedId: string | null,
  offset: string,
  limit: string 
): Promise<SearchResultItem[]> {
  const params: any[] = [];

  // Composite key filter: main is judge_id
  const { where: compositeWhere, params: compositeParams } = buildCompositeKeyFilter(
    'judge_id', 'j.judge_id', selectedCategory, selectedId
  );
  params.push(...compositeParams);

  // Generate search patterns for concatenated name search
  const searchPatterns = prepareSearchPatterns(searchTerm);
  const { original, like } = searchPatterns;

  // Define search conditions specifically for judges
  let whereConditions = '';
  const scoringExpressions = [];
  
  if (searchTerm && searchTerm.trim()) {
    // Use CONCAT_WS to search across all name components
    const fullNameExpr = `CONCAT_WS(' ', j.first, j.middle, j.last)`;
    
    // Scoring components - prioritize different match types
    // Exact match - highest priority
    scoringExpressions.push(`((${fullNameExpr} = ?) * 30)`);
    params.push(original);
    
    // Starts with - high priority
    scoringExpressions.push(`((${fullNameExpr} LIKE ?) * 20)`);
    params.push(`${original}%`);
    
    // Contains in fullname - medium priority
    scoringExpressions.push(`((${fullNameExpr} LIKE ?) * 10)`);
    params.push(`%${original}%`);
    
    // Last name exact match - high priority
    scoringExpressions.push(`((j.last = ?) * 25)`);
    params.push(original);
    
    // Last name starts with - medium-high priority
    scoringExpressions.push(`((j.last LIKE ?) * 15)`);
    params.push(`${original}%`);
    
    // First name exact match - medium priority
    scoringExpressions.push(`((j.first = ?) * 20)`);
    params.push(original);
    
    // First name starts with - lower-medium priority
    scoringExpressions.push(`((j.first LIKE ?) * 10)`);
    params.push(`${original}%`);
    
    // WHERE conditions - much more inclusive to ensure we find all relevant matches
    const whereExpressions = [
      `${fullNameExpr} LIKE ?`,    // Full name contains
      `j.last LIKE ?`,             // Last name contains
      `j.first LIKE ?`,            // First name contains
    ];
    
    // We'll use the same "contains" parameter for all conditions
    params.push(`%${original}%`, `%${original}%`, `%${original}%`);
    
    // If middle name is commonly searched, add it too
    if (original.length > 1) {
      whereExpressions.push(`j.middle LIKE ?`);
      params.push(`%${original}%`);
    }
    
    whereConditions = `AND (${whereExpressions.join(' OR ')})`;
  }

  const scoreExpr = scoringExpressions.length > 0 
    ? `(${scoringExpressions.join(' + ')}) AS search_score` 
    : '0 AS search_score';

  const sql = `
    SELECT 
      j.judge_id AS id,
      CONCAT_WS(' ', j.first, j.middle, j.last) AS name,
      COALESCE(SUM(s.total_case_dispositions), 0) AS total_case_dispositions,
      ${scoreExpr}
    FROM judges j
    JOIN specification s ON s.judge_id = j.judge_id
    WHERE 1=1
      ${excludeAnyRow('j', 'judge_id')}
      ${whereConditions}
      ${compositeWhere}
    GROUP BY j.judge_id
    ORDER BY search_score DESC, total_case_dispositions DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  return (await query<RowDataPacket[]>(sql, params)) as SearchResultItem[];
}

/**
 * Search Courts with optional filter by selected entity.
 */
async function searchCourts(
    searchTerm: string,
    selectedCategory: string | null,
    selectedId: string | null,
    offset: string,
    limit: string
  ): Promise<SearchResultItem[]> {
    const params: any[] = [];
  
    // Composite key filter: main is court_id
    const { where: compositeWhere, params: compositeParams } = buildCompositeKeyFilter(
      'court_id', 'c.id', selectedCategory, selectedId
    );
    params.push(...compositeParams);
  
    const searchPatterns = prepareSearchPatterns(searchTerm);
    const { scoreExpr, whereConditions, params: scoringParams } = buildScoringExpression(
      ['c.name'], searchPatterns
    );
    params.push(...scoringParams);
  
    const sql = `
      SELECT 
        c.id AS id,
        c.name AS name,
        COALESCE(SUM(s.total_case_dispositions), 0) AS total_case_dispositions,
        ${scoreExpr}
      FROM courts c
        JOIN specification s ON s.court_id = c.id
      WHERE 1=1
        ${excludeAnyRow('c', 'id')}
        ${whereConditions}
        ${compositeWhere}
      GROUP BY c.id
      ORDER BY search_score DESC, total_case_dispositions DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  
    return (await query<RowDataPacket[]>(sql, params)) as SearchResultItem[];
  }

/**
 * Search Charges with optional filter by selected entity.
 */
async function searchCharges(
    searchTerm: string,
    selectedCategory: string | null,
    selectedId: string | null,
    offset: string,
    limit: string
  ): Promise<SearchResultItem[]> {
    const params: any[] = [];
  
    // Composite key filter: main is charge_id
    const { where: compositeWhere, params: compositeParams } = buildCompositeKeyFilter(
      'charge_id', 'c.id', selectedCategory, selectedId
    );
    params.push(...compositeParams);
  
    const searchPatterns = prepareSearchPatterns(searchTerm);
    const { scoreExpr, whereConditions, params: scoringParams } = buildScoringExpression(
      ['c.name'], searchPatterns
    );
    params.push(...scoringParams);
  
    const sql = `
      SELECT 
        c.id AS id,
        c.name AS name,
        COALESCE(SUM(s.total_case_dispositions), 0) AS total_case_dispositions,
        ${scoreExpr}
      FROM charge_options c
        JOIN specification s ON s.charge_id = c.id
      WHERE type = 'charge'
        ${excludeAnyRow('c', 'id')}
        ${whereConditions}
        ${compositeWhere}
      GROUP BY c.id
      ORDER BY search_score DESC, total_case_dispositions DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  
    return (await query<RowDataPacket[]>(sql, params)) as SearchResultItem[];
  }
/**
 * Search Charge Groups with optional filter by selected entity.
 */
async function searchChargeGroups(
    searchTerm: string,
    selectedCategory: string | null,
    selectedId: string | null,
    offset: string,
    limit: string
  ): Promise<SearchResultItem[]> {
    const params: any[] = [];
  
    // Composite key filter: main is charge_id (from charges in the join)
    const { where: compositeWhere, params: compositeParams } = buildCompositeKeyFilter(
      'charge_id', 'cg.id', selectedCategory, selectedId
    );
    params.push(...compositeParams);
  
    const searchPatterns = prepareSearchPatterns(searchTerm);
    const { scoreExpr, whereConditions, params: scoringParams } = buildScoringExpression(
      ['cg.name'], searchPatterns
    );
    params.push(...scoringParams);
  
    const sql = `
      SELECT 
        cg.id AS id,
        cg.name AS name,
        COALESCE(SUM(s.total_case_dispositions), 0) AS total_case_dispositions,
        ${scoreExpr}
      FROM charge_options cg
        JOIN specification s ON s.charge_id = cg.id
      WHERE type != 'charge'
        ${excludeAnyRow('cg', 'id')}
        ${whereConditions}
        ${compositeWhere}
      GROUP BY cg.id
      ORDER BY search_score DESC, total_case_dispositions DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  
    return (await query<RowDataPacket[]>(sql, params)) as SearchResultItem[];
  }