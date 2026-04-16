import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const CANONICAL_HOST = 'salecraft.ai';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Redirect Cloud Run URL → canonical domain (salecraft.ai)
  if (
    host.includes('.run.app') &&
    !host.includes('localhost') &&
    process.env.NODE_ENV === 'production'
  ) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.port = '';
    url.protocol = 'https:';
    return NextResponse.redirect(url.toString(), 301);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|zh-TW|ko|ja|vi|fr|th|es|pt|ar)/:path*']
};
