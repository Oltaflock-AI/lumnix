import { NextRequest, NextResponse } from 'next/server';
import { generateCompetitorBrief } from '@/lib/competitor-brief';

// Thin wrapper — the brief generator lives in src/lib/competitor-brief.ts so
// server-side callers (scrape after() hook, spy-agent cron) can invoke it
// directly without an HTTP round-trip through auth middleware.
export async function POST(req: NextRequest) {
  const { competitor_id, workspace_id } = await req.json();
  if (!competitor_id || !workspace_id) {
    return NextResponse.json({ error: 'competitor_id and workspace_id required' }, { status: 400 });
  }

  try {
    const result = await generateCompetitorBrief(competitor_id, workspace_id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'AI analysis failed' }, { status: result.status || 500 });
    }
    return NextResponse.json({ success: true, ads_analyzed: result.adsAnalyzed });
  } catch (err: any) {
    console.error('AI analysis error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
