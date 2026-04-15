import { NextRequest, NextResponse } from 'next/server';

// GET /api/cron/sync-and-process — consolidated daily cron (2 AM UTC)
// Runs in order: sync → sync-all → detect-anomalies → spy-agent → generate-recommendations → daily-briefing
export async function GET(req: NextRequest) {
  // Auth validated by middleware — defense-in-depth check
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const headers = { Authorization: `Bearer ${cronSecret}` };

  const steps = [
    { name: 'sync', path: '/api/cron/sync' },
    { name: 'sync-all', path: '/api/cron/sync-all' },
    { name: 'detect-anomalies', path: '/api/cron/detect-anomalies' },
    { name: 'spy-agent', path: '/api/cron/spy-agent' },
    { name: 'generate-recommendations', path: '/api/cron/generate-recommendations' },
    { name: 'daily-briefing', path: '/api/cron/daily-briefing' },
  ];

  const results: Record<string, { status: string; duration_ms: number; error?: string }> = {};

  for (const step of steps) {
    const start = Date.now();
    try {
      const res = await fetch(`${appUrl}${step.path}`, { headers });
      const duration_ms = Date.now() - start;

      if (res.ok) {
        results[step.name] = { status: 'ok', duration_ms };
      } else {
        const body = await res.text().catch(() => '');
        results[step.name] = { status: 'error', duration_ms, error: `${res.status}: ${body.slice(0, 200)}` };
      }
    } catch (err: any) {
      results[step.name] = { status: 'error', duration_ms: Date.now() - start, error: err.message };
    }
  }

  const failed = Object.values(results).filter(r => r.status === 'error').length;

  return NextResponse.json({
    success: failed === 0,
    steps_run: steps.length,
    steps_failed: failed,
    results,
    timestamp: new Date().toISOString(),
  });
}
