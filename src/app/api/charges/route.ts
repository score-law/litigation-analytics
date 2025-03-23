import { NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  try {
    const charges = await query<any & RowDataPacket[]>('SELECT DISTINCT name, charge_id, severity FROM charges GROUP BY name');
    return NextResponse.json(charges);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charges' },
      { status: 500 }
    );
  }
}