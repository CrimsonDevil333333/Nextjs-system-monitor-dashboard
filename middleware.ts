import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth';

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/favicon.ico'];
const STATIC_PATTERNS = ['/_next', '/public'];

// Check if path should bypass auth
function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (STATIC_PATTERNS.some(pattern => pathname.startsWith(pattern))) return true;
  if (pathname.startsWith('/api/auth')) return true;
  return false;
}

// Check if request is for an API route
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public/static paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get and verify token
  const token = request.cookies.get('auth_token')?.value;
  const verified = token ? await verifyToken(token) : null;

  if (!verified) {
    // API routes: return 401 JSON response
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Authentication required. Please log in.' 
        }, 
        { status: 401 }
      );
    }

    // Page routes: redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
