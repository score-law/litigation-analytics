import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  console.log(password);

  if (password === process.env.NEXT_PUBLIC_PASSWORD) {
    return NextResponse.json({ message: 'Authenticated' });;
  } else {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: `Method ${req.method} Not Allowed` }, { status: 405 });
}