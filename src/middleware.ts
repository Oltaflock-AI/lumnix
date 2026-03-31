import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update request cookies for SSR
        cookiesToSet.forEach(({ name, value }) => {
          req.cookies.set(name, value);
        });
        // Clone response and set cookies
        res = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session (this also reads/writes cookies)
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/onboarding');

  // Not logged in trying to access dashboard → redirect to signin
  if (!user && isDashboard) {
    const signinUrl = new URL('/auth/signin', req.url);
    signinUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Logged in trying to access auth pages → redirect to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/auth/signin', '/auth/signup'],
};
