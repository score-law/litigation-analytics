

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { SearchResultItem } from '@/types';
import { RowDataPacket } from 'mysql2';

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
  
    let searchClause = '';
    if (searchTerm && searchTerm.trim().length >= 3) {
      searchClause = `AND MATCH(j.first, j.middle, j.last) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      params.unshift(searchTerm.trim());
    } else if (searchTerm) {
      searchClause = `AND (j.first LIKE ? OR j.middle LIKE ? OR j.last LIKE ?)`;
      const likeTerm = `%${searchTerm.trim()}%`;
      params.unshift(likeTerm, likeTerm, likeTerm);
    }
  
    const sql = `
      SELECT 
        j.judge_id AS id,
        CONCAT_WS(' ', j.first, j.middle, j.last) AS name,
        COALESCE(SUM(s.total_case_dispositions), 0) AS total_case_dispositions
      FROM judges j
      JOIN specification s ON s.judge_id = j.judge_id
      WHERE 1=1
        ${excludeAnyRow('j', 'judge_id')}
        ${searchClause}
        ${compositeWhere}
      GROUP BY j.judge_id
      ORDER BY total_case_dispositions DESC
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
  
    let searchClause = '';
    if (searchTerm && searchTerm.trim().length >= 3) {
      searchClause = `AND MATCH(c.name) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      params.unshift(searchTerm.trim());
    } else if (searchTerm) {
      searchClause = `AND c.name LIKE ?`;
      params.unshift(`%${searchTerm.trim()}%`);
    }
  
    const sql = `
      SELECT 
        c.id AS id,
        c.name AS name,
        COALESCE(SUM(s.total_case_dispositions), 0) AS total_case_dispositions
      FROM courts c
        JOIN specification s ON s.court_id = c.id
      WHERE 1=1
        ${excludeAnyRow('c', 'id')}
        ${searchClause}
        ${compositeWhere}
      GROUP BY c.id
      ORDER BY total_case_dispositions DESC
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
  
    let searchClause = '';
    if (searchTerm && searchTerm.trim().length >= 3) {
      searchClause = `AND MATCH(c.name) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      params.unshift(searchTerm.trim());
    } else if (searchTerm) {
      searchClause = `AND c.name LIKE ?`;
      params.unshift(`%${searchTerm.trim()}%`);
    }
  
    const sql = `
      SELECT 
        c.id AS id,
        c.name AS name,
        COALESCE(SUM(s.total_case_dispositions), 0) AS total_case_dispositions
      FROM charge_options c
        JOIN specification s ON s.charge_id = c.id
      WHERE type = 'charge'
        ${excludeAnyRow('c', 'id')}
        ${searchClause}
        ${compositeWhere}
      GROUP BY c.id
      ORDER BY total_case_dispositions DESC
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
  
    let searchClause = '';
    if (searchTerm && searchTerm.trim().length >= 3) {
      searchClause = `AND MATCH(cg.name) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      params.unshift(searchTerm.trim());
    } else if (searchTerm) {
      searchClause = `AND cg.name LIKE ?`;
      params.unshift(`%${searchTerm.trim()}%`);
    }
  
    const sql = `
      SELECT 
        cg.id AS id,
        cg.name AS name,
        COALESCE(SUM(s.total_case_dispositions), 0) AS total_case_dispositions
      FROM charge_options cg
        JOIN specification s ON s.charge_id = cg.id
      WHERE type != 'charge'
        ${excludeAnyRow('cg', 'id')}
        ${searchClause}
        ${compositeWhere}
      GROUP BY cg.id
      ORDER BY total_case_dispositions DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  
    return (await query<RowDataPacket[]>(sql, params)) as SearchResultItem[];
  }