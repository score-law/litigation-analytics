import { NextResponse } from 'next/server';
import { query } from '@/db/connection';

export async function GET() {
  try {
    const result = await query("SELECT 1 + 1 AS test");
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
