import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  '/api/auth/callback',
  '/api/billing/webhook',     // Stripe webhook (validates its own signature)
  '/api/health',              // Health check (sanitized — no secrets)
  '/api/share',               // Public share links
  '/api/data-deletion',       // Meta data deletion callback
  '/api/integrations/callback', // OAuth callback (no session yet)
  '/api/email/unsubscribe',   // Email unsubscribe link
]);

// Routes that use CRON_SECRET instead of user auth
const CRON_ROUTES_PREFIX = '/api/cron/';

// Routes that are not API routes (pages, assets, etc.)
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate API routes
  if (!isApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.has(pathname) || PUBLIC_ROUTES.has(pathname.replace(/\/+$/, ''))) {
    return NextResponse.next();
  }

  // Allow share sub-routes (e.g. /api/share/[token])
  if (pathname.startsWith('/api/share/')) {
    return NextResponse.next();
  }

  // Cron routes validate their own CRON_SECRET
  if (pathname.startsWith(CRON_ROUTES_PREFIX)) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // All other API routes require a valid Supabase session
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Validate the token by calling Supabase getUser
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Pass user ID downstream via header so routes don't need to re-validate
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
