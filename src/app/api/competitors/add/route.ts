import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { checkPlanLimit } from '@/lib/plan-limits';
import { safeFetchUrl } from '@/lib/url-guard';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

function sanitizeHttpsUrl(input: unknown): string | null {
  if (typeof input !== 'string' || !input.trim()) return null;
  const safe = safeFetchUrl(input.trim());
  if (!safe || (safe.protocol !== 'https:' && safe.protocol !== 'http:')) return null;
  return safe.href.slice(0, 500);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workspace_id, facebook_page_id, facebook_page_name, facebook_page_url, logo_url, website_url } = body;

  if (
    typeof workspace_id !== 'string' ||
    typeof facebook_page_id !== 'string' ||
    typeof facebook_page_name !== 'string'
  ) {
    return NextResponse.json({ error: 'workspace_id, facebook_page_id, and facebook_page_name required' }, { status: 400 });
  }
  if (!/^[0-9]{5,25}$/.test(facebook_page_id)) {
    return NextResponse.json({ error: 'Invalid facebook_page_id' }, { status: 400 });
  }
  if (facebook_page_name.length > 200) {
    return NextResponse.json({ error: 'facebook_page_name too long' }, { status: 400 });
  }

  const auth = await verifyWorkspaceAccess(req, workspace_id);
  if (auth instanceof NextResponse) return auth;

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
      facebook_page_url: sanitizeHttpsUrl(facebook_page_url),
      logo_url: sanitizeHttpsUrl(logo_url),
      website_url: sanitizeHttpsUrl(website_url),
      fb_page_id: facebook_page_id,
      scrape_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    // DB trigger raises plan_limit_exceeded to close the check-then-insert race.
    if (typeof error.message === 'string' && error.message.includes('plan_limit_exceeded')) {
      return NextResponse.json({ error: 'Plan limit reached', resource: 'competitors' }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Enqueue a scrape job. The VPS/Windows worker (spy_pipeline.mjs queue)
  // claims it, runs the Playwright scrape + Claude analysis on a residential
  // IP, and writes results back to competitor_ads. (The old official Meta Ad
  // Library API path is a dead end — token never approved.)
  const { error: jobErr } = await supabase
    .from('scrape_jobs')
    .insert({ workspace_id, competitor_id: data.id });
  if (jobErr) {
    console.error('Failed to enqueue scrape job:', jobErr.message);
    // Brand is still tracked; surface so the UI can show the queue failed.
    return NextResponse.json({ competitor: data, queued: false });
  }

  return NextResponse.json({ competitor: data, queued: true });
}
