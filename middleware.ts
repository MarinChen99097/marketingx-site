import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const CANONICAL_HOST = 'salecraft.ai';
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isCloudRun = host.includes('.run.app');

  // 1. Direct Cloud Run access → 301 redirect to canonical domain
  if (isCloudRun) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.port = '';
    url.protocol = 'https:';
    return NextResponse.redirect(url.toString(), 301);
  }

  // 2. Normal request through salecraft.ai → run intl middleware
  const response = intlMiddleware(request);

  // 3. If intl middleware produced a redirect, rewrite the Location header
  //    to use the canonical domain (Cloud Run may have set its own host)
  const location = response.headers.get('location');
  if (location && location.includes('.run.app')) {
    const fixed = location.replace(
      /https?:\/\/[^/]*\.run\.app/g,
      CANONICAL_ORIGIN
    );
    response.headers.set('location', fixed);
  }

  return response;
}

export const config = {
  matcher: ['/', '/(en|zh-TW|ko|ja|vi|fr|th|es|pt|ar)/:path*']
};
