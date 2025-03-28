import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { RowDataPacket } from 'mysql2/promise';

/**
 * API endpoint to fetch a single charge by ID
 * Returns detailed information about a specific charge
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chargeId = parseInt(searchParams.get('chargeId') || '0', 10);
  
  // Check if ID is valid
  if (isNaN(chargeId)) {
    return NextResponse.json(
      { error: 'Invalid charge ID' },
      { status: 400 }
    );
  }

  try {
    const charges = await query<any & RowDataPacket[]>(
      'SELECT name, charge_id, severity FROM charges WHERE charge_id = ?',
      [chargeId]
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