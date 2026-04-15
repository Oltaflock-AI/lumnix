import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const rawRedirect = requestUrl.searchParams.get('redirect') || '/dashboard';

  // Open-redirect guard: only accept same-origin paths that start with a
  // single "/". Reject protocol-relative ("//attacker.com"), absolute URLs,
  // and control chars. Otherwise attackers can craft OAuth callback links
  // that bounce the authenticated user to a phishing domain.
  const isSafeRedirect =
    typeof rawRedirect === 'string'
    && rawRedirect.startsWith('/')
    && !rawRedirect.startsWith('//')
    && !rawRedirect.startsWith('/\\')
    && !/[\r\n\t]/.test(rawRedirect);
  const redirect = isSafeRedirect ? rawRedirect : '/dashboard';

  const res = NextResponse.redirect(new URL(redirect, request.url));

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  return res;
}
