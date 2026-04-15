import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// POST /api/reports/generate — fetch real data for selected report sections
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, sections, days } = await req.json();
    if (!workspace_id) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

    const db = getSupabaseAdmin();
    const dateOffset = days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateOffset);
    const start = startDate.toISOString().split('T')[0];

    // Get workspace info
    const { data: workspace } = await db
      .from('workspaces')
      .select('id, name, logo_url, brand_color')
      .eq('id', workspace_id)
      .single();

    const result: any = { workspace, sections: {} };
    const selectedSections: string[] = sections || ['overview', 'ga4', 'gsc', 'insights'];

    // Overview / GA4 Traffic
    if (selectedSections.includes('overview') || selectedSections.includes('ga4')) {
      const { data: ga4Data } = await db
        .from('ga4_data')
        .select('*')
        .eq('workspace_id', workspace_id)
        .gte('date', start)
        .order('date', { ascending: false });

      const sessions = (ga4Data || []).filter(r => r.metric_type === 'sessions');
      const users = (ga4Data || []).filter(r => r.metric_type === 'totalUsers');
      const sources = (ga4Data || []).filter(r => r.metric_type === 'sessions' && r.dimension_name === 'sessionSource');
      const pages = (ga4Data || []).filter(r => r.metric_type === 'screenPageViews' && r.dimension_name === 'pagePath');

      result.sections.ga4 = {
        totalSessions: sessions.reduce((s: number, r: any) => s + (r.value || 0), 0),
        totalUsers: users.reduce((s: number, r: any) => s + (r.value || 0), 0),
        dailyData: sessions.reduce((acc: any[], r: any) => {
          const existing = acc.find(a => a.date === r.date);
          if (existing) existing.sessions += r.value || 0;
          else acc.push({ date: r.date, sessions: r.value || 0 });
          return acc;
        }, []),
        sources: Object.values(sources.reduce((acc: any, r: any) => {
          const key = r.dimension_value || 'direct';
          if (!acc[key]) acc[key] = { source: key, sessions: 0 };
          acc[key].sessions += r.value || 0;
          return acc;
        }, {})),
        pages: Object.values(pages.reduce((acc: any, r: any) => {
          const key = r.dimension_value || '/';
          if (!acc[key]) acc[key] = { page: key, pageviews: 0 };
          acc[key].pageviews += r.value || 0;
          return acc;
        }, {})),
      };
    }

    // GSC Keywords
    if (selectedSections.includes('gsc')) {
      const { data: gscData } = await db
        .from('gsc_data')
        .select('query, clicks, impressions, ctr, position')
        .eq('workspace_id', workspace_id)
        .gte('date', start)
        .order('clicks', { ascending: false })
        .limit(200);

      // Aggregate by query
      const queryMap: Record<string, any> = {};
      for (const row of gscData || []) {
        if (!queryMap[row.query]) {
          queryMap[row.query] = { query: row.query, clicks: 0, impressions: 0, position: 0, count: 0 };
        }
        queryMap[row.query].clicks += row.clicks || 0;
        queryMap[row.query].impressions += row.impressions || 0;
        queryMap[row.query].position += row.position || 0;
        queryMap[row.query].count += 1;
      }
      const keywords = Object.values(queryMap).map((q: any) => ({
        query: q.query,
        clicks: q.clicks,
        impressions: q.impressions,
        position: q.count > 0 ? q.position / q.count : 0,
        ctr: q.impressions > 0 ? (q.clicks / q.impressions) * 100 : 0,
      })).sort((a: any, b: any) => b.clicks - a.clicks);

      result.sections.gsc = { keywords, totalKeywords: keywords.length };
    }

    // AI Insights
    if (selectedSections.includes('insights')) {
      const { data: insights } = await db
        .from('ai_insights')
        .select('title, description, type, priority')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })
        .limit(10);

      result.sections.insights = insights || [];
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
