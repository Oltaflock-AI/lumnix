import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/campaigns?workspace_id=... — list managed campaigns
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('campaigns_managed')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data || [] });
}

// POST /api/campaigns — create a campaign draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspace_id, platform, name, objective, budget_type, budget_amount,
            currency, targeting, creatives, ad_copy, keywords, start_date, end_date } = body;

    if (!workspace_id || !platform || !name) {
      return NextResponse.json({ error: 'workspace_id, platform, and name required' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('campaigns_managed')
      .insert({
        workspace_id, platform, name, objective,
        budget_type: budget_type || 'daily',
        budget_amount: budget_amount || 0,
        currency: currency || 'USD',
        targeting: targeting || {},
        creatives: creatives || [],
        ad_copy, keywords: keywords || [],
        start_date, end_date,
        status: 'draft',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/campaigns?id=... — delete a campaign
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 });

  const { error } = await getSupabaseAdmin().from('campaigns_managed').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
