import { NextResponse } from 'next/server';

// Simple ping endpoint to test connection
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
} 