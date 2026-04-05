import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// GET /api/cron/check-alerts — called by Vercel Cron every hour
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const triggered: any[] = [];
  const errors: any[] = [];

  try {
    // Fetch all active alert rules
    const { data: rules, error } = await db
      .from('alert_rules')
      .select('*')
      .eq('is_active', true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!rules || rules.length === 0) {
      return NextResponse.json({ success: true, checked: 0, triggered: 0, message: 'No active alert rules' });
    }

    for (const rule of rules) {
      try {
        let metricValue: number | null = null;

        // Get latest metric value based on rule.metric
        if (rule.metric === 'gsc_clicks' || rule.metric === 'gsc_impressions' || rule.metric === 'gsc_avg_position') {
          const { data: gscData } = await db
            .from('gsc_data')
            .select('clicks, impressions, position')
            .eq('workspace_id', rule.workspace_id)
            .order('date', { ascending: false })
            .limit(50);

          if (gscData && gscData.length > 0) {
            if (rule.metric === 'gsc_clicks') {
              metricValue = gscData.reduce((s, r) => s + (r.clicks || 0), 0);
            } else if (rule.metric === 'gsc_impressions') {
              metricValue = gscData.reduce((s, r) => s + (r.impressions || 0), 0);
            } else {
              metricValue = gscData.reduce((s, r) => s + (r.position || 0), 0) / gscData.length;
            }
          }
        }

        if (rule.metric === 'ga4_sessions' || rule.metric === 'ga4_users') {
          const metricType = rule.metric === 'ga4_sessions' ? 'sessions' : 'totalUsers';
          const { data: ga4Data } = await db
            .from('ga4_data')
            .select('value')
            .eq('workspace_id', rule.workspace_id)
            .eq('metric_type', metricType)
            .order('date', { ascending: false })
            .limit(30);

          if (ga4Data && ga4Data.length > 0) {
            metricValue = ga4Data.reduce((s, r) => s + (r.value || 0), 0);
          }
        }

        if (rule.metric === 'google_ads_spend' || rule.metric === 'google_ads_clicks') {
          const field = rule.metric === 'google_ads_spend' ? 'cost' : 'clicks';
          const { data: adsData } = await db
            .from('google_ads_data')
            .select(field)
            .eq('workspace_id', rule.workspace_id)
            .order('date', { ascending: false })
            .limit(30);

          if (adsData && adsData.length > 0) {
            metricValue = adsData.reduce((s, r) => s + (r[field] || 0), 0);
          }
        }

        if (rule.metric === 'meta_ads_spend' || rule.metric === 'meta_ads_roas') {
          const { data: metaData } = await db
            .from('meta_ads_data')
            .select('spend, revenue')
            .eq('workspace_id', rule.workspace_id)
            .order('date', { ascending: false })
            .limit(30);

          if (metaData && metaData.length > 0) {
            if (rule.metric === 'meta_ads_spend') {
              metricValue = metaData.reduce((s, r) => s + (r.spend || 0), 0);
            } else {
              const totalSpend = metaData.reduce((s, r) => s + (r.spend || 0), 0);
              const totalRevenue = metaData.reduce((s, r) => s + (r.revenue || 0), 0);
              metricValue = totalSpend > 0 ? totalRevenue / totalSpend : 0;
            }
          }
        }

        if (metricValue === null) continue;

        // Check threshold
        let shouldTrigger = false;
        if (rule.comparison === 'above' && metricValue > rule.threshold) shouldTrigger = true;
        if (rule.comparison === 'below' && metricValue < rule.threshold) shouldTrigger = true;
        if (rule.comparison === 'equals' && Math.abs(metricValue - rule.threshold) < 0.01) shouldTrigger = true;

        if (!shouldTrigger) continue;

        // Check if already triggered recently (within last 24h) to avoid spam
        const { data: recentHistory } = await db
          .from('alert_history')
          .select('id')
          .eq('rule_id', rule.id)
          .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (recentHistory && recentHistory.length > 0) continue;

        // Get workspace name for email
        const { data: workspace } = await db
          .from('workspaces')
          .select('name')
          .eq('id', rule.workspace_id)
          .single();

        const metricLabel = rule.metric.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        const message = `Alert: ${metricLabel} is ${metricValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} (threshold: ${rule.comparison} ${rule.threshold.toLocaleString()})`;

        // Log to alert_history
        await db.from('alert_history').insert({
          rule_id: rule.id,
          triggered_at: new Date().toISOString(),
          metric_value: metricValue,
          message,
        });

        // Send email via Resend
        if (rule.recipient_email) {
          try {
            await getResend().emails.send({
              from: 'Lumnix Alerts <onboarding@resend.dev>',
              to: rule.recipient_email,
              subject: `[Lumnix] Alert: ${metricLabel} ${rule.comparison} threshold`,
              html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
.container { max-width: 520px; margin: 40px auto; padding: 40px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; }
.logo { font-size: 28px; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 32px; }
.logo .l { color: #7c3aed; }
h1 { font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 12px; }
p { font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 0 0 16px; }
.metric-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 16px 0; }
.metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.metric-value { font-size: 32px; font-weight: 800; color: #ef4444; }
.threshold { font-size: 13px; color: #64748b; margin-top: 8px; }
.btn { display: inline-block; padding: 14px 28px; background: #7c3aed; color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; }
.footer { font-size: 12px; color: #475569; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; }
</style></head>
<body>
<div class="container">
  <div class="logo"><span class="l">L</span>umnix</div>
  <h1>Alert Triggered</h1>
  <p>An alert rule for <strong style="color:#f8fafc">${workspace?.name || 'your workspace'}</strong> has been triggered.</p>
  <div class="metric-box">
    <div class="metric-label">${metricLabel}</div>
    <div class="metric-value">${metricValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
    <div class="threshold">Threshold: ${rule.comparison} ${rule.threshold.toLocaleString()}</div>
  </div>
  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://lumnix-ai.vercel.app'}/dashboard/alerts" class="btn">View Dashboard →</a>
  <div class="footer">You're receiving this because you set up an alert in Lumnix. · © 2026 Oltaflock AI</div>
</div>
</body>
</html>`,
            });
          } catch (e) {
            console.error('Alert email failed:', e);
          }
        }

        // Send Slack notification if workspace has webhook
        const { data: wsData } = await db
          .from('workspaces')
          .select('slack_webhook_url')
          .eq('id', rule.workspace_id)
          .single();

        if (wsData?.slack_webhook_url) {
          try {
            await fetch(wsData.slack_webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                blocks: [
                  { type: 'header', text: { type: 'plain_text', text: `🚨 Lumnix Alert — ${workspace?.name || 'Your workspace'}`, emoji: true } },
                  { type: 'section', text: { type: 'mrkdwn', text: `*${metricLabel}*\n${message}` } },
                  { type: 'context', elements: [{ type: 'mrkdwn', text: `<https://lumnix-ai.vercel.app/dashboard/alerts|View Alerts in Lumnix>` }] },
                  { type: 'divider' },
                ],
              }),
            });
          } catch (slackErr) {
            console.error('Slack alert notification failed:', slackErr);
          }
        }

        triggered.push({ rule_id: rule.id, metric: rule.metric, value: metricValue, threshold: rule.threshold });
      } catch (e: any) {
        errors.push({ rule_id: rule.id, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      checked: rules.length,
      triggered: triggered.length,
      alerts: triggered,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
