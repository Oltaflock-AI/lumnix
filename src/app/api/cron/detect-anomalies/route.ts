import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function sendSlackMessage(webhookUrl: string, blocks: any[]) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
  } catch (e) {
    console.error('Slack notification failed:', e);
  }
}

function buildSlackBlocks(workspaceName: string, anomaly: { title: string; description: string; severity: string }) {
  const emoji = anomaly.severity === 'high' ? '🚨' : anomaly.severity === 'medium' ? '⚠️' : 'ℹ️';
  return [
    { type: 'header', text: { type: 'plain_text', text: `${emoji} Lumnix Alert — ${workspaceName}`, emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', text: `*${anomaly.title}*\n${anomaly.description}` } },
    { type: 'context', elements: [{ type: 'mrkdwn', text: `Severity: *${anomaly.severity}* | <https://lumnix-ai.vercel.app/dashboard|View in Lumnix>` }] },
    { type: 'divider' },
  ];
}

// GET /api/cron/detect-anomalies — daily at 8am UTC
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'lumnix-cron-2026';

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const results: any[] = [];
  const errors: any[] = [];

  try {
    // Get all workspaces with active integrations
    const { data: integrations } = await db
      .from('integrations')
      .select('workspace_id, provider')
      .eq('status', 'connected');

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ success: true, message: 'No active integrations', anomalies: 0 });
    }

    // Group by workspace
    const workspaceMap = new Map<string, string[]>();
    for (const i of integrations) {
      const providers = workspaceMap.get(i.workspace_id) || [];
      providers.push(i.provider);
      workspaceMap.set(i.workspace_id, providers);
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);

    for (const [workspaceId, providers] of workspaceMap) {
      try {
        const anomaliesFound: any[] = [];

        // --- GA4 anomaly detection ---
        if (providers.includes('ga4')) {
          const { data: recentGA4 } = await db
            .from('ga4_data')
            .select('date, value, metric_type')
            .eq('workspace_id', workspaceId)
            .in('metric_type', ['sessions', 'totalUsers'])
            .gte('date', fourteenDaysAgo)
            .order('date', { ascending: true });

          if (recentGA4 && recentGA4.length > 0) {
            for (const metricType of ['sessions', 'totalUsers']) {
              const rows = recentGA4.filter(r => r.metric_type === metricType);
              const current = rows.filter(r => r.date >= sevenDaysAgo);
              const previous = rows.filter(r => r.date < sevenDaysAgo);

              const currentSum = current.reduce((s, r) => s + (r.value || 0), 0);
              const previousSum = previous.reduce((s, r) => s + (r.value || 0), 0);

              if (previousSum > 0) {
                const changePct = ((currentSum - previousSum) / previousSum) * 100;
                const label = metricType === 'sessions' ? 'sessions' : 'users';

                if (changePct <= -20) {
                  anomaliesFound.push({
                    type: 'traffic_drop',
                    severity: changePct <= -40 ? 'high' : 'medium',
                    metric_before: previousSum,
                    metric_after: currentSum,
                    change_pct: Math.round(changePct * 10) / 10,
                    context: `Organic ${label} dropped ${Math.abs(Math.round(changePct))}% (${previousSum} → ${currentSum}) comparing last 7 days vs previous 7 days.`,
                  });
                } else if (changePct >= 20) {
                  anomaliesFound.push({
                    type: 'traffic_spike',
                    severity: changePct >= 50 ? 'high' : 'low',
                    metric_before: previousSum,
                    metric_after: currentSum,
                    change_pct: Math.round(changePct * 10) / 10,
                    context: `Organic ${label} spiked ${Math.round(changePct)}% (${previousSum} → ${currentSum}) comparing last 7 days vs previous 7 days.`,
                  });
                }
              }
            }
          }
        }

        // --- GSC anomaly detection ---
        if (providers.includes('gsc')) {
          const { data: recentGSC } = await db
            .from('gsc_data')
            .select('date, query, page, clicks, impressions, ctr, position')
            .eq('workspace_id', workspaceId)
            .gte('date', fourteenDaysAgo)
            .order('date', { ascending: true });

          if (recentGSC && recentGSC.length > 0) {
            // Overall clicks/impressions comparison
            const currentGSC = recentGSC.filter(r => r.date >= sevenDaysAgo);
            const previousGSC = recentGSC.filter(r => r.date < sevenDaysAgo);

            const currentClicks = currentGSC.reduce((s, r) => s + (r.clicks || 0), 0);
            const prevClicks = previousGSC.reduce((s, r) => s + (r.clicks || 0), 0);

            if (prevClicks > 0) {
              const clickChange = ((currentClicks - prevClicks) / prevClicks) * 100;
              if (clickChange <= -20) {
                anomaliesFound.push({
                  type: 'traffic_drop',
                  severity: clickChange <= -40 ? 'high' : 'medium',
                  metric_before: prevClicks,
                  metric_after: currentClicks,
                  change_pct: Math.round(clickChange * 10) / 10,
                  context: `GSC clicks dropped ${Math.abs(Math.round(clickChange))}% (${prevClicks} → ${currentClicks}) week-over-week.`,
                });
              }
            }

            // Ranking drops per page — find pages that dropped >3 positions
            const pagePositions = new Map<string, { current: number[]; previous: number[] }>();
            for (const row of recentGSC) {
              const key = row.page || row.query;
              if (!key) continue;
              const entry = pagePositions.get(key) || { current: [], previous: [] };
              if (row.date >= sevenDaysAgo) entry.current.push(row.position || 0);
              else entry.previous.push(row.position || 0);
              pagePositions.set(key, entry);
            }

            const droppedPages: string[] = [];
            for (const [page, data] of pagePositions) {
              if (data.current.length === 0 || data.previous.length === 0) continue;
              const avgCurrent = data.current.reduce((a, b) => a + b, 0) / data.current.length;
              const avgPrevious = data.previous.reduce((a, b) => a + b, 0) / data.previous.length;
              if (avgCurrent - avgPrevious > 3) {
                droppedPages.push(page);
              }
            }

            if (droppedPages.length > 0) {
              anomaliesFound.push({
                type: 'ranking_drop',
                severity: droppedPages.length >= 5 ? 'high' : droppedPages.length >= 2 ? 'medium' : 'low',
                affected_pages: droppedPages.slice(0, 10),
                context: `${droppedPages.length} page(s) lost >3 average positions: ${droppedPages.slice(0, 3).join(', ')}${droppedPages.length > 3 ? ` and ${droppedPages.length - 3} more` : ''}`,
              });
            }

            // CTR drops per page (>30% drop)
            const pageCTR = new Map<string, { current: number[]; previous: number[] }>();
            for (const row of recentGSC) {
              const key = row.page || row.query;
              if (!key || !row.ctr) continue;
              const entry = pageCTR.get(key) || { current: [], previous: [] };
              if (row.date >= sevenDaysAgo) entry.current.push(row.ctr);
              else entry.previous.push(row.ctr);
              pageCTR.set(key, entry);
            }

            const ctrDropPages: string[] = [];
            for (const [page, data] of pageCTR) {
              if (data.current.length === 0 || data.previous.length === 0) continue;
              const avgCurrent = data.current.reduce((a, b) => a + b, 0) / data.current.length;
              const avgPrevious = data.previous.reduce((a, b) => a + b, 0) / data.previous.length;
              if (avgPrevious > 0 && ((avgCurrent - avgPrevious) / avgPrevious) * 100 <= -30) {
                ctrDropPages.push(page);
              }
            }

            if (ctrDropPages.length > 0) {
              anomaliesFound.push({
                type: 'ctr_drop',
                severity: ctrDropPages.length >= 5 ? 'high' : 'medium',
                affected_pages: ctrDropPages.slice(0, 10),
                context: `${ctrDropPages.length} page(s) saw CTR drop >30%: ${ctrDropPages.slice(0, 3).join(', ')}`,
              });
            }
          }
        }

        // --- No data detection ---
        if (providers.includes('ga4') || providers.includes('gsc')) {
          const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10);

          if (providers.includes('ga4')) {
            const { data: recent } = await db
              .from('ga4_data')
              .select('id')
              .eq('workspace_id', workspaceId)
              .gte('date', threeDaysAgo)
              .limit(1);
            if (!recent || recent.length === 0) {
              anomaliesFound.push({
                type: 'no_data',
                severity: 'medium',
                context: 'No GA4 data received in the last 3 days. Check if the integration is still connected.',
              });
            }
          }

          if (providers.includes('gsc')) {
            const { data: recent } = await db
              .from('gsc_data')
              .select('id')
              .eq('workspace_id', workspaceId)
              .gte('date', threeDaysAgo)
              .limit(1);
            if (!recent || recent.length === 0) {
              anomaliesFound.push({
                type: 'no_data',
                severity: 'medium',
                context: 'No GSC data received in the last 3 days. Check if the integration is still connected.',
              });
            }
          }
        }

        if (anomaliesFound.length === 0) continue;

        // Use GPT-4o-mini to generate human-readable titles + descriptions
        const openai = getOpenAI();
        const prompt = anomaliesFound.map((a, i) => `Anomaly ${i + 1} (type: ${a.type}, severity: ${a.severity}):\n${a.context}${a.affected_pages ? `\nAffected pages: ${a.affected_pages.join(', ')}` : ''}`).join('\n\n');

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a marketing analytics assistant. For each anomaly described, write a concise, specific title (max 80 chars) and a 1-2 sentence description with actionable advice. Return JSON array: [{"title": "...", "description": "..."}]. Match the order of input anomalies.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        let generated: { title: string; description: string }[] = [];
        try {
          const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
          generated = parsed.anomalies || parsed.items || parsed.results || (Array.isArray(parsed) ? parsed : []);
        } catch {
          generated = anomaliesFound.map(a => ({
            title: `${a.type.replace(/_/g, ' ')} detected`,
            description: a.context,
          }));
        }

        // Ensure we have the right number of generated items
        while (generated.length < anomaliesFound.length) {
          const a = anomaliesFound[generated.length];
          generated.push({ title: `${a.type.replace(/_/g, ' ')} detected`, description: a.context });
        }

        // Get workspace info for Slack
        const { data: workspace } = await db
          .from('workspaces')
          .select('name, slack_webhook_url')
          .eq('id', workspaceId)
          .single();

        // Insert anomalies
        const inserts = anomaliesFound.map((a, i) => ({
          workspace_id: workspaceId,
          type: a.type,
          severity: a.severity,
          title: generated[i]?.title || `${a.type} detected`,
          description: generated[i]?.description || a.context,
          affected_pages: a.affected_pages || [],
          metric_before: a.metric_before || null,
          metric_after: a.metric_after || null,
          change_pct: a.change_pct || null,
          detected_at: now.toISOString(),
          is_read: false,
        }));

        const { error: insertError } = await db.from('anomalies').insert(inserts);
        if (insertError) {
          errors.push({ workspace_id: workspaceId, error: insertError.message });
          continue;
        }

        // Send Slack notifications for high/medium severity
        if (workspace?.slack_webhook_url) {
          for (let i = 0; i < inserts.length; i++) {
            if (inserts[i].severity === 'high' || inserts[i].severity === 'medium') {
              await sendSlackMessage(
                workspace.slack_webhook_url,
                buildSlackBlocks(workspace.name || 'Your workspace', inserts[i])
              );
            }
          }
        }

        results.push({ workspace_id: workspaceId, anomalies_found: inserts.length });
      } catch (e: any) {
        errors.push({ workspace_id: workspaceId, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      workspaces_checked: workspaceMap.size,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
