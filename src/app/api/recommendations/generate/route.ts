import { NextRequest, NextResponse, after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { callClaude } from '@/lib/anthropic';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

// GET /api/recommendations/generate?workspace_id=xxx
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  const auth = await verifyWorkspaceAccess(req, workspaceId);
  if (auth instanceof NextResponse) return auth;

  const db = getSupabaseAdmin();

  // Return cached recommendations if less than 24h old
  const { data: cached } = await db
    .from('recommendations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_dismissed', false)
    .gte('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('priority', { ascending: true })
    .limit(10);

  if (cached && cached.length > 0) {
    return NextResponse.json({ recommendations: cached, cached: true });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ recommendations: [], error: 'AI not configured' });
  }

  after(() => generateRecommendations(workspaceId));

  return NextResponse.json({ recommendations: [], cached: false, generating: true });
}

async function generateRecommendations(workspaceId: string) {
  const db = getSupabaseAdmin();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().slice(0, 10);

  const [gscCurrent, gscPrevious, ga4Current, anomalies, competitors, gaps] = await Promise.allSettled([
    db.from('gsc_data').select('query, clicks, impressions, position').eq('workspace_id', workspaceId).gte('date', thirtyDaysAgo).order('clicks', { ascending: false }).limit(100),
    db.from('gsc_data').select('query, clicks, impressions, position').eq('workspace_id', workspaceId).gte('date', sixtyDaysAgo).lt('date', thirtyDaysAgo).order('clicks', { ascending: false }).limit(100),
    db.from('ga4_data').select('metric_type, dimension_name, dimension_value, value').eq('workspace_id', workspaceId).gte('date', thirtyDaysAgo).limit(200),
    db.from('anomalies').select('type, severity, title, description').eq('workspace_id', workspaceId).gte('detected_at', new Date(now.getTime() - 14 * 86400000).toISOString()).limit(10),
    db.from('competitors').select('name, domain').eq('workspace_id', workspaceId).limit(5),
    db.from('keyword_gaps').select('keyword, difficulty, recommended_action').eq('workspace_id', workspaceId).limit(20),
  ]);

  const gscRows = gscCurrent.status === 'fulfilled' ? (gscCurrent.value.data || []) : [];
  const gscPrev = gscPrevious.status === 'fulfilled' ? (gscPrevious.value.data || []) : [];
  const ga4Rows = ga4Current.status === 'fulfilled' ? (ga4Current.value.data || []) : [];
  const anomalyRows = anomalies.status === 'fulfilled' ? (anomalies.value.data || []) : [];
  const competitorRows = competitors.status === 'fulfilled' ? (competitors.value.data || []) : [];
  const gapRows = gaps.status === 'fulfilled' ? (gaps.value.data || []) : [];

  const totalClicks = gscRows.reduce((s: number, r: any) => s + (r.clicks || 0), 0);
  const prevClicks = gscPrev.reduce((s: number, r: any) => s + (r.clicks || 0), 0);
  const sessions = ga4Rows.filter((r: any) => r.metric_type === 'sessions').reduce((s: number, r: any) => s + (r.value || 0), 0);
  const quickWins = gscRows
    .filter((r: any) => r.position >= 4 && r.position <= 20 && r.impressions >= 10)
    .sort((a: any, b: any) => a.position - b.position)
    .slice(0, 5);

  const dataContext = JSON.stringify({
    gsc: { totalClicks, prevClicks, topKeywords: gscRows.slice(0, 10), quickWins },
    ga4: { sessions },
    anomalies: anomalyRows,
    competitors: competitorRows,
    keywordGaps: gapRows.slice(0, 10),
  });

  const aiText = await callClaude(
    [{ role: 'user', content: dataContext }],
    {
      maxTokens: 1500,
      system: `You are a marketing strategist. Analyze this workspace's marketing data and generate 3-6 prioritized, actionable recommendations. Each recommendation should reference specific data.

Return a JSON object with a "recommendations" key containing an array: [{ "type": "seo|traffic|ads|competitor", "priority": "high|medium|low", "title": "Short title (max 60 chars)", "description": "1-2 sentence actionable advice with specific data points", "action_url": "/dashboard/seo or /dashboard/analytics or /dashboard/competitors" }]

Prioritize: high-impact quick wins > anomalies to address > competitive gaps > general optimization. Only output JSON, no other text.`,
    },
  );

  let recs: any[] = [];
  try {
    const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiText];
    const parsed = JSON.parse(jsonMatch[1]!.trim());
    recs = parsed.recommendations || parsed.items || (Array.isArray(parsed) ? parsed : []);
  } catch {
    recs = [];
  }

  if (recs.length > 0) {
    await db.from('recommendations').delete().eq('workspace_id', workspaceId);
    const inserts = recs.map((r: any) => ({
      workspace_id: workspaceId,
      type: r.type || 'seo',
      priority: r.priority || 'medium',
      title: r.title,
      description: r.description,
      action_url: r.action_url || null,
      generated_at: now.toISOString(),
    }));
    await db.from('recommendations').insert(inserts);
  }
}

// PATCH /api/recommendations/generate — dismiss a recommendation
export async function PATCH(req: NextRequest) {
  const { id, workspace_id } = await req.json();
  if (!id || !workspace_id) return NextResponse.json({ error: 'id and workspace_id required' }, { status: 400 });

  const auth = await verifyWorkspaceAccess(req, workspace_id);
  if (auth instanceof NextResponse) return auth;

  const db = getSupabaseAdmin();
  await db.from('recommendations').update({ is_dismissed: true }).eq('id', id).eq('workspace_id', workspace_id);
  return NextResponse.json({ success: true });
}
