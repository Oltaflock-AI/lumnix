import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

async function resolveRuleWorkspace(ruleId: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from('alert_rules')
    .select('workspace_id')
    .eq('id', ruleId)
    .single();
  return data?.workspace_id ?? null;
}

// GET /api/alerts — list alert rules + history for a workspace
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = req.nextUrl.searchParams.get('workspace_id');
    if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

    const db = getSupabaseAdmin();

    const [rulesRes, historyRes] = await Promise.all([
      db.from('alert_rules').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
      db.from('alert_history').select('*, alert_rules!inner(workspace_id)').eq('alert_rules.workspace_id', workspaceId).order('triggered_at', { ascending: false }).limit(50),
    ]);

    return NextResponse.json({
      rules: rulesRes.data || [],
      history: historyRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/alerts — create a new alert rule
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, metric, threshold, comparison, recipient_email } = await req.json();
    if (!workspace_id || !metric || threshold === undefined || !comparison || !recipient_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validMetrics = ['gsc_clicks', 'gsc_impressions', 'gsc_avg_position', 'ga4_sessions', 'ga4_users', 'google_ads_spend', 'google_ads_clicks', 'meta_ads_spend', 'meta_ads_roas'];
    if (!validMetrics.includes(metric)) {
      return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    if (!['above', 'below', 'equals'].includes(comparison)) {
      return NextResponse.json({ error: 'Invalid comparison. Use above, below, or equals' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    const { data, error } = await db.from('alert_rules').insert({
      workspace_id,
      metric,
      threshold: Number(threshold),
      comparison,
      recipient_email,
      is_active: true,
    }).select().single();

    if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });

    return NextResponse.json({ success: true, rule: data });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/alerts — toggle alert rule active/inactive or delete
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { rule_id, is_active } = await req.json();
    if (!rule_id) return NextResponse.json({ error: 'Missing rule_id' }, { status: 400 });

    // The rule is addressed by id only, so we must resolve its workspace and
    // verify the caller belongs to it — middleware has nothing to check against.
    const workspaceId = await resolveRuleWorkspace(rule_id);
    if (!workspaceId) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    const access = await verifyWorkspaceAccess(req, workspaceId);
    if (access instanceof NextResponse) return access;

    const db = getSupabaseAdmin();
    const { error } = await db.from('alert_rules')
      .update({ is_active: Boolean(is_active) })
      .eq('id', rule_id)
      .eq('workspace_id', workspaceId);

    if (error) return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

// DELETE /api/alerts — delete an alert rule
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ruleId = req.nextUrl.searchParams.get('rule_id');
    if (!ruleId) return NextResponse.json({ error: 'Missing rule_id' }, { status: 400 });

    const workspaceId = await resolveRuleWorkspace(ruleId);
    if (!workspaceId) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    const access = await verifyWorkspaceAccess(req, workspaceId);
    if (access instanceof NextResponse) return access;

    const db = getSupabaseAdmin();
    // Delete history first, then rule — constrain both to this workspace.
    await db.from('alert_history').delete().eq('rule_id', ruleId);
    const { error } = await db.from('alert_rules').delete().eq('id', ruleId).eq('workspace_id', workspaceId);

    if (error) return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
