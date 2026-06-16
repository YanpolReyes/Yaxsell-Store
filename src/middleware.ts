import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of search engine indexers and SEO crawlers to block
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'baiduspider',
  'ahrefsbot',
  'semrushbot',
  'dotbot',
  'mj12bot',
  'screaming frog',
  'pinterest',
  'applebot',
  'rogerbot',
  'exabot',
  'feedburner',
  'ia_archiver'
];

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const isBot = BOT_USER_AGENTS.some(bot => ua.toLowerCase().includes(bot));

  if (isBot) {
    console.log(`[Middleware] Blocked bot request. UA: ${ua} | Path: ${request.nextUrl.pathname}`);
    return new NextResponse('Access Denied (Crawlers Blocked)', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
