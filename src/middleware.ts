import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Constant-time string compare. Web-Crypto compatible; safe in Edge runtime
// (unlike node:crypto `timingSafeEqual`, which breaks Turbopack parsing).
function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  '/api/auth/callback',
  '/api/health',              // Health check (sanitized — no secrets)
  '/api/share',               // Public share links
  '/api/data-deletion',       // Meta data deletion callback (has own confirmation flow)
  '/api/integrations/callback', // OAuth callback (HMAC-verified state)
  '/api/email/unsubscribe',   // Email unsubscribe link
  '/api/team/accept',         // Invite acceptance (rate-limited per IP)
  '/api/waitlist',            // Public waitlist signup
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
    const expected = `Bearer ${cronSecret}`;
    if (!authHeader || !timingSafeStringEqual(authHeader, expected)) {
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

    // Extract workspace_id from query params (GET) or JSON body (POST/PATCH/PUT)
    let workspaceId = req.nextUrl.searchParams.get('workspace_id');
    let clonedBody: string | null = null;

    if (!workspaceId && ['POST', 'PATCH', 'PUT'].includes(req.method)) {
      const contentType = req.headers.get('content-type') || '';
      const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
      // Only attempt body parse for JSON payloads under 1MB (skip file uploads)
      if (contentType.includes('application/json') && contentLength > 0 && contentLength < 1024 * 1024) {
        try {
          clonedBody = await req.clone().text();
          const parsed = JSON.parse(clonedBody);
          if (parsed && typeof parsed.workspace_id === 'string') {
            workspaceId = parsed.workspace_id;
          }
        } catch {
          // Invalid JSON — let route handle it
        }
      }
    }

    if (workspaceId) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { data: member } = await admin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();
      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Pass user ID + email to the route handler as REQUEST headers.
    // Strip any client-supplied values first to prevent spoofing.
    const forwardedHeaders = new Headers(req.headers);
    forwardedHeaders.delete('x-user-id');
    forwardedHeaders.delete('x-user-email');
    forwardedHeaders.set('x-user-id', user.id);
    if (user.email) forwardedHeaders.set('x-user-email', user.email);
    return NextResponse.next({ request: { headers: forwardedHeaders } });
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
