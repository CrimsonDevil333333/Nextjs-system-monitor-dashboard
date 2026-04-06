import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  const payload = await isAuthenticated(true);
  
  if (payload && typeof payload === 'object' && 'username' in payload) {
    return NextResponse.json({ authenticated: true, username: payload.username });
  }
  
  return NextResponse.json({ authenticated: false });
}
