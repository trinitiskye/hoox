import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'experimental-edge';

// Auth protection is handled client-side in src/app/admin/layout.tsx
// Middleware only handles non-auth concerns here
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
