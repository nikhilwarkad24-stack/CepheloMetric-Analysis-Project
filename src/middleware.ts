import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/google/callback', '/contributors', '/educational-resources'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow public routes
  if (PUBLIC_ROUTES.includes(path)) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login and preserve the original path so the user can be sent back after authentication
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));
  }

  try {
    // Verify token is still valid
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { role?: string; userId?: string; tokenVersion?: number };

    // Validate tokenVersion against DB record
    if (payload.userId) {
      try {
        await connectDB();
        const user = await User.findById(payload.userId).select('tokenVersion role');
        if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));

        if ((payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
          return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));
        }

        // Check if this is an admin route
        if (path.startsWith('/admin')) {
          if (user.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
          }
        }
      } catch (e) {
        console.error('Middleware DB validation failed:', e);
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Token is invalid or expired
    console.error('Token verification failed:', error);
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
