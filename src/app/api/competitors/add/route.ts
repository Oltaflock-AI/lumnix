import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authenticateRequest, isAuthError } from '@/lib/auth-guard';
import { checkPlanLimit } from '@/lib/plan-limits';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workspace_id, name, facebook_page_name, domain } = body;
  if (!workspace_id || !name) {
    return NextResponse.json({ error: 'workspace_id and name required' }, { status: 400 });
  }

  // Check plan limit for competitors
  const supabase = getSupabaseAdmin();

  // Get workspace plan
  const { data: ws } = await supabase.from('workspaces').select('plan').eq('id', workspace_id).single();
  const limitError = await checkPlanLimit(workspace_id, ws?.plan || 'free', 'competitors');
  if (limitError) return limitError;

  const { data, error } = await supabase
    .from('competitor_brands')
    .insert({ workspace_id, name, facebook_page_name: facebook_page_name || null, domain: domain || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitor: data });
}
