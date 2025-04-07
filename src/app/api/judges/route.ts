import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';

/**
 * API endpoint for judges data
 * Handles three types of requests:
 * 1. Single judge lookup by ID
 * 2. Paginated & searchable list of judges
 * 3. Complete list of judges
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Extract and validate query parameters
  const judgeId = searchParams.get('judgeId');
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const search = searchParams.get('search');
  
  try {
    // Determine request type based on parameters
    if (judgeId) {
      return await getSingleJudge(judgeId);
    } else if (limitParam !== null || offsetParam !== null || search) {
      return await getPaginatedJudges(limitParam, offsetParam, search);
    } else {
      return await getAllJudges();
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Get a single judge by ID
 * @param judgeId - The ID of the judge to look up
 */
async function getSingleJudge(judgeId: string) {
  const parsedId = parseInt(judgeId, 10);
  
  // Check if ID is valid
  if (isNaN(parsedId)) {
    return NextResponse.json(
      { error: 'Invalid judge ID' },
      { status: 400 }
    );
  }

  try {
    const results = await query<any[]>(
      'SELECT judge_id as id, CONCAT_WS(" ", first, middle, last) as name FROM judges WHERE judge_id = ?',
      [parsedId]
    );
    
    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Judge not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error retrieving judge data' },
      { status: 500 }
    );
  }
}

/**
 * Get a paginated and searchable list of judges
 * @param limitParam - Number of results per page
 * @param offsetParam - Starting position for pagination
 * @param search - Text to search for in judge names
 */
async function getPaginatedJudges(limitParam: string | null, offsetParam: string | null, search: string | null) {
  try {
    // Parse and validate pagination parameters
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    
    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }
    
    // Different handling based on whether search is provided
    let judges;
    let totalResult;
    
    if (search && search.trim() !== '') {
      // Prepare search term for SQL LIKE query
      const searchTerm = `%${search}%`;
      
      // Get total count for pagination
      totalResult = await query<any[]>(
        'SELECT COUNT(*) as total FROM judges WHERE first LIKE ? OR middle LIKE ? OR last LIKE ?',
        [searchTerm, searchTerm, searchTerm]
      );
      
      // Get paginated judges with search - note the use of template literals for LIMIT/OFFSET
      judges = await query<any[]>(
        `SELECT judge_id as id, CONCAT_WS(' ', first, middle, last) as name 
         FROM judges 
         WHERE first LIKE ? OR middle LIKE ? OR last LIKE ? 
         ORDER BY total_cases DESC 
         LIMIT ${limit} OFFSET ${offset}`,
        [searchTerm, searchTerm, searchTerm]
      );
    } else {
      // Get total count without search filter
      totalResult = await query<any[]>('SELECT COUNT(*) as total FROM judges');
      
      // Get paginated judges without search - note the use of template literals for LIMIT/OFFSET
      judges = await query<any[]>(
        `SELECT judge_id as id, CONCAT_WS(' ', first, middle, last) as name 
         FROM judges 
         ORDER BY total_cases DESC 
         LIMIT ${limit} OFFSET ${offset}`
      );
    }
    
    return NextResponse.json({
      judges: judges,
      total: totalResult[0].total
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error retrieving judge data' },
      { status: 500 }
    );
  }
}

/**
 * Get the complete list of judges
 */
async function getAllJudges() {
  try {
    const results = await query<any[]>(
      'SELECT judge_id as id, CONCAT_WS(" ", first, middle, last) as name FROM judges ORDER BY total_cases DESC'
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error retrieving judge data' },
      { status: 500 }
    );
  }
}