import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { global: { headers: { Authorization: authHeader } } }
  );
}

// GET /api/profile
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getUserClient(authHeader);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    profile: profile || {
      id: user.id,
      full_name: user.user_metadata?.full_name || '',
      email: user.email || '',
      company: user.user_metadata?.company || '',
    }
  });
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getUserClient(authHeader);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const admin = getSupabaseAdmin();

  // Bound untrusted strings so a malicious client cannot stuff megabytes
  // into the profile table (DoS / storage abuse).
  const fullName = typeof body.full_name === 'string' ? body.full_name.slice(0, 100) : '';
  const company = typeof body.company === 'string' ? body.company.slice(0, 200) : '';

  // Upsert into profiles table
  const { data: profile, error } = await admin
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: fullName,
      company,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    // Profiles table might not exist — fall back to updating auth metadata
    await supabase.auth.updateUser({
      data: { full_name: fullName, company }
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ profile });
}
