import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authenticateRequest, isAuthError } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/export?workspace_id=xxx&type=gsc|ga4|google_ads|meta_ads|all&format=json|csv&days=30
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (isAuthError(auth)) return auth;

  const rateLimited = rateLimit(`export:${auth.workspaceId}`, 3, 60 * 1000);
  if (rateLimited) return rateLimited;

  const dataType = req.nextUrl.searchParams.get('type') || 'all';
  const format = req.nextUrl.searchParams.get('format') || 'json';
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
  const dateFrom = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const db = getSupabaseAdmin();
  const result: Record<string, any[]> = {};

  if (dataType === 'gsc' || dataType === 'all') {
    const { data } = await db.from('gsc_data')
      .select('query, page, clicks, impressions, ctr, position, date, country, device')
      .eq('workspace_id', auth.workspaceId)
      .gte('date', dateFrom)
      .order('date', { ascending: false })
      .limit(5000);
    result.gsc = data || [];
  }

  if (dataType === 'ga4' || dataType === 'all') {
    const { data } = await db.from('ga4_data')
      .select('metric_type, dimension_name, dimension_value, value, date')
      .eq('workspace_id', auth.workspaceId)
      .gte('date', dateFrom)
      .order('date', { ascending: false })
      .limit(5000);
    result.ga4 = data || [];
  }

  if (dataType === 'google_ads' || dataType === 'meta_ads' || dataType === 'all') {
    const providers = dataType === 'all' ? ['google_ads', 'meta_ads'] : [dataType];
    const { data } = await db.from('analytics_data')
      .select('provider, data, date_range_start, date_range_end')
      .eq('workspace_id', auth.workspaceId)
      .in('provider', providers)
      .gte('date_range_start', dateFrom)
      .order('date_range_start', { ascending: false })
      .limit(1000);
    result.ads = data || [];
  }

  if (format === 'csv') {
    // Convert to CSV — flatten the largest dataset
    const mainData = result.gsc || result.ga4 || result.ads || [];
    if (mainData.length === 0) {
      return new Response('No data to export', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // Block CSV formula injection (CWE-1236). Prefixing any cell that begins
    // with =, +, -, @, tab, or CR with a leading single quote forces Excel /
    // Sheets to treat the value as plain text instead of evaluating a formula.
    const escapeCsvCell = (raw: string): string => {
      const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
      if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
        return `"${safe.replace(/"/g, '""')}"`;
      }
      return safe;
    };

    const headers = Object.keys(mainData[0]);
    const csvRows = [
      headers.join(','),
      ...mainData.map((row: any) =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return escapeCsvCell(JSON.stringify(val));
          return escapeCsvCell(String(val));
        }).join(',')
      ),
    ];

    return new Response(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="lumnix-export-${dataType}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    workspace_id: auth.workspaceId,
    exported_at: new Date().toISOString(),
    date_range: { from: dateFrom, days },
    ...result,
  });
}
