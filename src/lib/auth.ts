import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies as getCookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

const JWT_SECRET_STR = process.env.JWT_SECRET || (() => {
  const defaultSecret = 'default-secret-do-not-use-in-production-generate-new-one';
  console.warn('⚠️ JWT_SECRET not configured! Using weak default. Set JWT_SECRET env var or create .env.local');
  return defaultSecret;
})();

const SECRET = new TextEncoder().encode(JWT_SECRET_STR);

const TOKEN_EXPIRY = '2h';
const COOKIE_MAX_AGE = 7200;
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 7;

const tokenBlacklist = new Set<string>();

export interface TokenPayload extends JWTPayload {
  username: string;
  iat?: number;
  exp?: number;
}

export async function signToken(payload: { username: string }) {
  return await new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  if (tokenBlacklist.has(token)) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function blacklistToken(token: string) {
  tokenBlacklist.add(token);
  // Cleanup old tokens from memory after 24 hours
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Check authentication — optionally returns the payload (with username)
 * @param withPayload If true, returns TokenPayload | null instead of boolean
 */
export async function isAuthenticated(withPayload?: true, req?: NextRequest): Promise<TokenPayload | null>;
export async function isAuthenticated(withPayload?: false, req?: NextRequest): Promise<boolean>;
export async function isAuthenticated(withPayload = false, req?: NextRequest): Promise<boolean | TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get('auth_token')?.value;
  } else {
    const cookieStore = await getCookies();
    token = cookieStore.get('auth_token')?.value;
  }

  if (!token) return withPayload ? null : false;
  const verified = await verifyToken(token);
  if (!verified) return withPayload ? null : false;
  return withPayload ? verified : true;
}

export function unauthorized(api = false) {
  if (api) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid authentication required' },
      { status: 401 }
    );
  }
  return NextResponse.redirect(new URL('/login', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));
}

export async function setAuthCookie(token: string, remember: boolean) {
  const cookieStore = await getCookies();
  const maxAge = remember ? REMEMBER_MAX_AGE : COOKIE_MAX_AGE;

  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: false, // Tunnel terminates SSL, internal is HTTP
    sameSite: 'lax',
    maxAge: maxAge,
    path: '/',
  });
}

export function getCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: false, // Tunnel terminates SSL, internal is HTTP
    sameSite: 'lax' as const,
    maxAge: remember ? REMEMBER_MAX_AGE : COOKIE_MAX_AGE,
    path: '/',
  };
}
