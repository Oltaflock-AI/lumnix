import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { checkPlanLimit } from '@/lib/plan-limits';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workspace_id, facebook_page_id, facebook_page_name, facebook_page_url, logo_url, website_url } = body;

  if (!workspace_id || !facebook_page_id || !facebook_page_name) {
    return NextResponse.json({ error: 'workspace_id, facebook_page_id, and facebook_page_name required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check plan limit
  const { data: ws } = await supabase.from('workspaces').select('plan').eq('id', workspace_id).single();
  const limitError = await checkPlanLimit(workspace_id, ws?.plan || 'free', 'competitors');
  if (limitError) return limitError;

  // Check if this page is already tracked in this workspace
  const { data: existing } = await supabase
    .from('competitor_brands')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('facebook_page_id', facebook_page_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'This brand is already being tracked', competitor: existing }, { status: 409 });
  }

  // Insert competitor
  const { data, error } = await supabase
    .from('competitor_brands')
    .insert({
      workspace_id,
      name: facebook_page_name,
      facebook_page_id,
      facebook_page_name_resolved: facebook_page_name,
      facebook_page_url: facebook_page_url || null,
      logo_url: logo_url || null,
      website_url: website_url || null,
      fb_page_id: facebook_page_id,
      scrape_status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });

  // Trigger first scrape asynchronously
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  fetch(`${appUrl}/api/competitors/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ competitor_id: data.id, workspace_id }),
  }).catch(() => {});

  return NextResponse.json({ competitor: data });
}
