import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { escapeHtml } from '@/lib/html-escape';

// GET /api/cron/daily-briefing — generates daily briefing for all workspaces
export async function GET(req: NextRequest) {
  // Auth validated by middleware — defense-in-depth check
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  // Get all workspaces with connected integrations
  const { data: integrations } = await db.from('integrations')
    .select('workspace_id').eq('status', 'connected');
  const workspaceIds = [...new Set((integrations || []).map(i => i.workspace_id))];

  let generated = 0;

  for (const workspaceId of workspaceIds) {
    try {
      // Check if already generated today
      const { data: existing } = await db.from('daily_briefings')
        .select('id').eq('workspace_id', workspaceId).eq('briefing_date', today).single();
      if (existing) continue;

      // Gather data for briefing
      const [gscRes, ga4Res, gAdsRes, metaRes, anomalyRes] = await Promise.all([
        db.from('gsc_data').select('clicks, impressions').eq('workspace_id', workspaceId).gte('date', weekAgo),
        db.from('ga4_data').select('metric_type, value, dimension_name').eq('workspace_id', workspaceId).gte('date', weekAgo),
        db.from('google_ads_data').select('clicks, cost, conversions').eq('workspace_id', workspaceId).gte('date', weekAgo),
        db.from('meta_ads_data').select('clicks, spend, conversions, revenue').eq('workspace_id', workspaceId).gte('date', weekAgo),
        db.from('anomalies').select('title, severity').eq('workspace_id', workspaceId).gte('detected_at', yesterday).eq('is_read', false),
      ]);

      const gscClicks = (gscRes.data || []).reduce((s, r) => s + (r.clicks || 0), 0);
      const gscImpressions = (gscRes.data || []).reduce((s, r) => s + (r.impressions || 0), 0);
      const sessions = (ga4Res.data || []).filter(r => r.metric_type === 'sessions' && (r.dimension_name === 'total' || r.dimension_name === 'date')).reduce((s, r) => s + (r.value || 0), 0);
      const gAdSpend = (gAdsRes.data || []).reduce((s, r) => s + Number(r.cost || 0), 0);
      const gAdConv = (gAdsRes.data || []).reduce((s, r) => s + Number(r.conversions || 0), 0);
      const metaSpend = (metaRes.data || []).reduce((s, r) => s + Number(r.spend || 0), 0);
      const metaRev = (metaRes.data || []).reduce((s, r) => s + Number(r.revenue || 0), 0);
      const unreadAnomalies = anomalyRes.data || [];

      const totalSpend = gAdSpend + metaSpend;
      const roas = totalSpend > 0 ? +(metaRev / totalSpend).toFixed(2) : 0;

      // Build changes array
      const changes: any[] = [];
      if (sessions > 0) changes.push({ metric: 'Sessions', value: sessions, period: '7d' });
      if (gscClicks > 0) changes.push({ metric: 'Organic Clicks', value: gscClicks, period: '7d' });
      if (totalSpend > 0) changes.push({ metric: 'Ad Spend', value: `₹${totalSpend.toFixed(0)}`, period: '7d' });
      if (roas > 0) changes.push({ metric: 'ROAS', value: `${roas}x`, period: '7d' });

      // Build recommendations
      const recommendations: any[] = [];
      if (roas > 0 && roas < 1.5) recommendations.push({ action: 'Review underperforming ad campaigns', reason: `ROAS is ${roas}x — below the 1.5x breakeven threshold`, priority: 'high' });
      if (roas >= 3) recommendations.push({ action: 'Consider scaling ad spend', reason: `ROAS is ${roas}x — strong returns indicate room to grow`, priority: 'medium' });
      if (unreadAnomalies.length > 0) recommendations.push({ action: `Review ${unreadAnomalies.length} unread anomalies`, reason: unreadAnomalies.map(a => a.title).join('; '), priority: 'high' });
      if (gscClicks > 0 && gscImpressions > 0 && (gscClicks / gscImpressions) < 0.02) recommendations.push({ action: 'Optimize title tags for better CTR', reason: 'Your average organic CTR is below 2%', priority: 'medium' });

      // Generate summary using Claude
      const parts: string[] = [];
      if (sessions > 0) parts.push(`${sessions.toLocaleString()} sessions`);
      if (gscClicks > 0) parts.push(`${gscClicks.toLocaleString()} organic clicks`);
      if (totalSpend > 0) parts.push(`₹${totalSpend.toFixed(0)} ad spend (${roas}x ROAS)`);
      const anomalyNote = unreadAnomalies.length > 0 ? `${unreadAnomalies.length} anomalies need attention.` : 'No anomalies detected.';
      let summary = parts.length > 0
        ? `Weekly snapshot: ${parts.join(', ')}. ${anomalyNote}`
        : `No new data this week. ${anomalyNote} Connect more integrations to get richer briefings.`;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey && changes.length > 0) {
        try {
          const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 300,
              messages: [{ role: 'user', content: `Write a 2-3 sentence daily marketing briefing based on this data: ${JSON.stringify({ changes, recommendations, anomalies: unreadAnomalies.length })}. Be concise, mention specific numbers, and end with one actionable suggestion.` }],
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const aiText = (aiData.content || []).find((b: any) => b.type === 'text')?.text;
            if (aiText) summary = aiText;
          }
        } catch {}
      }

      // Save briefing
      await db.from('daily_briefings').insert({
        workspace_id: workspaceId,
        briefing_date: today,
        summary,
        changes,
        recommendations,
      });

      // Send email if workspace owner has email
      const { data: workspace } = await db.from('workspaces').select('name, owner_id').eq('id', workspaceId).single();
      if (workspace?.owner_id) {
        const { data: { user } } = await db.auth.admin.getUserById(workspace.owner_id);
        const email = user?.email;
        const resendKey = process.env.RESEND_API_KEY;
        if (email && resendKey) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'Lumnix <hello@oltaflock.ai>',
                to: [email],
                subject: `Lumnix Daily Briefing — ${String(workspace.name).slice(0, 60)}`,
                html: `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0A0A0A; color: #E5E5E5;">
                  <h2 style="color: #7C3AED; margin-bottom: 16px;">Daily Briefing</h2>
                  <p style="line-height: 1.7; font-size: 15px;">${escapeHtml(summary)}</p>
                  ${recommendations.length > 0 ? `<hr style="border: none; border-top: 1px solid #222; margin: 20px 0;">
                  <h3 style="font-size: 14px; color: #888; margin-bottom: 10px;">Recommended Actions</h3>
                  <ul style="padding-left: 20px;">${recommendations.map(r => `<li style="margin-bottom: 8px; font-size: 14px;"><strong style="color: #E5E5E5;">${escapeHtml(r.action)}</strong><br><span style="color: #888; font-size: 13px;">${escapeHtml(r.reason)}</span></li>`).join('')}</ul>` : ''}
                  <div style="margin-top: 24px; text-align: center;"><a href="https://lumnix-ai.vercel.app/dashboard" style="display: inline-block; padding: 12px 28px; background: #7C3AED; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Open Dashboard</a></div>
                  <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #555;">Lumnix · AI Marketing Intelligence</p>
                </div>`,
              }),
            });
            await db.from('daily_briefings').update({ sent_email: true, sent_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('briefing_date', today);
          } catch {}
        }
      }

      generated++;
    } catch (e: any) {
      console.error(`Briefing failed for ${workspaceId}:`, e.message);
    }
  }

  return NextResponse.json({ success: true, generated, total_workspaces: workspaceIds.length });
}
