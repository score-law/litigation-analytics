import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { RowDataPacket } from 'mysql2/promise';

/**
 * API endpoint for charges data
 * Handles three types of requests:
 * 1. Single charge lookup by ID
 * 2. Paginated & searchable list of charges
 * 3. Complete list of charges
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Extract and validate query parameters
  const chargeId = searchParams.get('chargeId');
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const search = searchParams.get('search');
  
  try {
    // Determine request type based on parameters
    if (chargeId) {
      // Single charge lookup
      return await getSingleCharge(chargeId);
    } else if (limitParam !== null || offsetParam !== null || search) {
      // Paginated/searchable list
      return await getPaginatedCharges(limitParam, offsetParam, search);
    } else {
      // Complete list (existing functionality)
      return await getAllCharges();
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: 'An error occurred processing the request' },
      { status: 500 }
    );
  }
}

/**
 * Get a single charge by ID
 * @param chargeId - The ID of the charge to look up
 */
async function getSingleCharge(chargeId: string) {
  const parsedId = parseInt(chargeId, 10);
  
  // Check if ID is valid
  if (isNaN(parsedId)) {
    return NextResponse.json(
      { error: 'Invalid charge ID' },
      { status: 400 }
    );
  }

  try {
    const charges = await query<any & RowDataPacket[]>(
      'SELECT charge_id as id, name FROM charges WHERE is_active = 1 AND charge_id = ?',
      [parsedId]
    );

    if (charges.length === 0) {
      return NextResponse.json(
        { error: 'Charge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(charges[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charge' },
      { status: 500 }
    );
  }
}

/**
 * Get a paginated and searchable list of charges
 * @param limitParam - Number of results per page
 * @param offsetParam - Starting position for pagination
 * @param search - Text to search for in charge names
 */
async function getPaginatedCharges(limitParam: string | null, offsetParam: string | null, search: string | null) {
  try {
    // Parse limit and offset parameters with defaults
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    
    // Validate numeric parameters
    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Create the SQL query without parameterized LIMIT and OFFSET
    let charges;
    let totalResult;
    
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      // For searches, use parameterized query for the search term only
      charges = await query<any & RowDataPacket[]>(
        `SELECT DISTINCT charge_id as id, name FROM charges WHERE is_active = 1 AND name LIKE ? ORDER BY name LIMIT ${limit} OFFSET ${offset}`,
        [searchTerm]
      );
      
      totalResult = await query<any & RowDataPacket[]>(
        'SELECT COUNT(DISTINCT charge_id) as total FROM charges WHERE is_active = 1 AND name LIKE ?',
        [searchTerm]
      );
    } else {
      // No search parameters, hard-code limit and offset
      charges = await query<any & RowDataPacket[]>(
        `SELECT DISTINCT charge_id as id, name FROM charges WHERE is_active = 1 ORDER BY name LIMIT ${limit} OFFSET ${offset}`,
        []
      );
      
      totalResult = await query<any & RowDataPacket[]>(
        'SELECT COUNT(DISTINCT charge_id) as total FROM charges WHERE is_active = 1',
        []
      );
    }
    
    const total = totalResult[0].total;
    
    return NextResponse.json({
      charges,
      total
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charges' },
      { status: 500 }
    );
  }
}

/**
 * Get the complete list of charges
 * Preserves existing functionality
 */
async function getAllCharges() {
  try {
    const charges = await query<any & RowDataPacket[]>(
      'SELECT DISTINCT charge_id as id, name FROM charges WHERE is_active = 1 ORDER BY name',
      []
    );
    return NextResponse.json(charges);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charges' },
      { status: 500 }
    );
  }
}