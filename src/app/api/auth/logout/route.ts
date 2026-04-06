import { NextResponse } from 'next/server';
import { blacklistToken, getCookieOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  // Get the token to blacklist it
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    await blacklistToken(token);
  }

  // Delete the cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', { ...getCookieOptions(false), maxAge: 0 });

  return response;
}
