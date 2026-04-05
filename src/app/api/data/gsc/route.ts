import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/data/gsc?workspace_id=...&days=28&type=keywords|pages|overview&page=1&per_page=50
export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspace_id');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '28');
    const type = req.nextUrl.searchParams.get('type') || 'keywords';
    const customStart = req.nextUrl.searchParams.get('start_date');
    const customEnd = req.nextUrl.searchParams.get('end_date');
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
    const perPage = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('per_page') || '50')));

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });
    }

    let startDateStr: string;
    if (customStart) {
      startDateStr = customStart;
    } else {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDateStr = startDate.toISOString().split('T')[0];
    }

    if (type === 'keywords') {
      // Top keywords with aggregate metrics
      const { data, error } = await getSupabaseAdmin().rpc('gsc_top_keywords', {
        p_workspace_id: workspaceId,
        p_start_date: startDateStr,
        p_limit: 50,
      });

      // Fallback: manual query if RPC doesn't exist
      if (error) {
        const { data: rawData } = await getSupabaseAdmin()
          .from('gsc_data')
          .select('query, clicks, impressions, ctr, position, date')
          .eq('workspace_id', workspaceId)
          .gte('date', startDateStr)
          .order('clicks', { ascending: false })
          .limit(500);

        // Aggregate by keyword
        const kwMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }>();
        for (const row of rawData || []) {
          const existing = kwMap.get(row.query) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
          existing.clicks += row.clicks;
          existing.impressions += row.impressions;
          existing.ctr += row.ctr;
          existing.position += row.position;
          existing.count++;
          kwMap.set(row.query, existing);
        }

        const allKeywords = Array.from(kwMap.entries())
          .map(([query, data]) => ({
            query,
            clicks: data.clicks,
            impressions: data.impressions,
            ctr: data.count > 0 ? data.ctr / data.count : 0,
            position: data.count > 0 ? Math.round(data.position / data.count * 10) / 10 : 0,
          }))
          .sort((a, b) => b.clicks - a.clicks);

        const total = allKeywords.length;
        const keywords = allKeywords.slice((page - 1) * perPage, page * perPage);

        return NextResponse.json({ keywords, pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } });
      }

      return NextResponse.json({ keywords: data });
    }

    if (type === 'overview') {
      // Daily totals
      const { data: rawData } = await getSupabaseAdmin()
        .from('gsc_data')
        .select('date, clicks, impressions')
        .eq('workspace_id', workspaceId)
        .gte('date', startDateStr)
        .order('date');

      const dailyMap = new Map<string, { clicks: number; impressions: number }>();
      for (const row of rawData || []) {
        const existing = dailyMap.get(row.date) || { clicks: 0, impressions: 0 };
        existing.clicks += row.clicks;
        existing.impressions += row.impressions;
        dailyMap.set(row.date, existing);
      }

      const overview = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json({ overview });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
