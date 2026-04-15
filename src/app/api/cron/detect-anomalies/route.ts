import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { callClaude } from '@/lib/anthropic';

// GET /api/cron/detect-anomalies — daily at 8am UTC
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

        // Use Claude to generate human-readable titles + descriptions
        const prompt = anomaliesFound.map((a, i) => `Anomaly ${i + 1} (type: ${a.type}, severity: ${a.severity}):\n${a.context}${a.affected_pages ? `\nAffected pages: ${a.affected_pages.join(', ')}` : ''}`).join('\n\n');

        const aiText = await callClaude(
          [{ role: 'user', content: prompt }],
          { maxTokens: 1000, system: 'You are a marketing analytics assistant. For each anomaly described, write a concise, specific title (max 80 chars) and a 1-2 sentence description with actionable advice. Return a JSON object with an "items" key containing an array: [{"title": "...", "description": "..."}]. Match the order of input anomalies. Only output JSON.' },
        );

        let generated: { title: string; description: string }[] = [];
        try {
          const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiText];
          const parsed = JSON.parse(jsonMatch[1]!.trim());
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
