import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('hoox_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
    try {
      const user = JSON.parse(decodeURIComponent(session.value));
      if (user?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
