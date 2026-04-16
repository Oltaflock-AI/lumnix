import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/html-escape';

function getNextSendDate(frequency: string): string {
  const now = new Date();
  if (frequency === 'daily') {
    now.setDate(now.getDate() + 1);
    now.setHours(8, 0, 0, 0);
  } else if (frequency === 'weekly') {
    now.setDate(now.getDate() + 7);
    now.setHours(8, 0, 0, 0);
  } else {
    now.setMonth(now.getMonth() + 1, 1);
    now.setHours(8, 0, 0, 0);
  }
  return now.toISOString();
}

async function buildReportHTML(db: ReturnType<typeof getSupabaseAdmin>, workspaceId: string, workspaceName: string): Promise<string> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  const [ga4Res, gscRes] = await Promise.allSettled([
    db.from('ga4_data')
      .select('metric_type, value')
      .eq('workspace_id', workspaceId)
      .gte('date', sevenDaysAgo)
      .in('metric_type', ['sessions', 'totalUsers']),
    db.from('gsc_data')
      .select('clicks, impressions')
      .eq('workspace_id', workspaceId)
      .gte('date', sevenDaysAgo),
  ]);

  const ga4Rows = ga4Res.status === 'fulfilled' ? (ga4Res.value.data || []) : [];
  const gscRows = gscRes.status === 'fulfilled' ? (gscRes.value.data || []) : [];

  const sessions = ga4Rows.filter((r: any) => r.metric_type === 'sessions').reduce((s: number, r: any) => s + (r.value || 0), 0);
  const users = ga4Rows.filter((r: any) => r.metric_type === 'totalUsers').reduce((s: number, r: any) => s + (r.value || 0), 0);
  const clicks = gscRows.reduce((s: number, r: any) => s + (r.clicks || 0), 0);
  const impressions = gscRows.reduce((s: number, r: any) => s + (r.impressions || 0), 0);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
.container { max-width: 560px; margin: 40px auto; padding: 40px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; }
.logo { font-size: 28px; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 24px; }
.logo .l { color: #7c3aed; }
h1 { font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 8px; }
p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px; }
.stats { display: flex; gap: 12px; flex-wrap: wrap; margin: 20px 0; }
.stat { flex: 1; min-width: 100px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; color: #f8fafc; }
.stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
.btn { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
.footer { font-size: 11px; color: #475569; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; }
</style></head><body>
<div class="container">
  <div class="logo"><span class="l">L</span>umnix</div>
  <h1>Weekly Report — ${escapeHtml(workspaceName)}</h1>
  <p>Here's your marketing performance summary for the last 7 days.</p>
  <div class="stats">
    <div class="stat"><div class="stat-value">${sessions.toLocaleString()}</div><div class="stat-label">Sessions</div></div>
    <div class="stat"><div class="stat-value">${users.toLocaleString()}</div><div class="stat-label">Users</div></div>
    <div class="stat"><div class="stat-value">${clicks.toLocaleString()}</div><div class="stat-label">Clicks</div></div>
    <div class="stat"><div class="stat-value">${impressions.toLocaleString()}</div><div class="stat-label">Impressions</div></div>
  </div>
  <a href="https://lumnix-ai.vercel.app/dashboard" class="btn">View Full Dashboard</a>
  <div class="footer">Sent by Lumnix. You're receiving this because you're subscribed to scheduled reports.</div>
</div>
</body></html>`;
}

// GET /api/cron/send-reports — called by Vercel Cron daily at 8am UTC
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Get all schedules that are due
  const { data: schedules } = await db
    .from('report_schedules')
    .select('*, workspaces(name)')
    .eq('enabled', true)
    .lte('next_send_at', now);

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ success: true, message: 'No reports due', sent: 0 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  let sent = 0;
  const errors: any[] = [];

  for (const schedule of schedules) {
    try {
      const workspaceName = (schedule as any).workspaces?.name || 'Your workspace';
      const html = await buildReportHTML(db, schedule.workspace_id, workspaceName);

      for (const recipient of schedule.recipients) {
        await resend.emails.send({
          from: 'Lumnix <noreply@oltaflock.ai>',
          to: recipient,
          subject: `${String(schedule.name).slice(0, 60)} — ${String(workspaceName).slice(0, 60)}`,
          html,
        });
      }

      // Update schedule
      await db.from('report_schedules').update({
        last_sent_at: now,
        next_send_at: getNextSendDate(schedule.frequency),
      }).eq('id', schedule.id);

      sent++;
    } catch (e: any) {
      errors.push({ schedule_id: schedule.id, error: e.message });
    }
  }

  return NextResponse.json({ success: true, sent, errors: errors.length > 0 ? errors : undefined });
}
