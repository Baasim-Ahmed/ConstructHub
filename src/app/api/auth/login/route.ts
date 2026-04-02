import { NextResponse } from 'next/server';

// Authentication has been removed from this app. Keep this endpoint for
// backward compatibility; respond with 410 Gone so clients know it's disabled.
export async function POST(req: Request) {
  return NextResponse.json({ error: 'Authentication disabled' }, { status: 410 });
}
