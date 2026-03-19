import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) {
    // Supabase handles the exchange client-side via the auth helper
    return NextResponse.redirect(`${origin}/dashboard`);
  }
  // No code param — implicit flow returns hash tokens client-side; redirect to dashboard and let client handle
  return NextResponse.redirect(`${origin}/dashboard`);
}
