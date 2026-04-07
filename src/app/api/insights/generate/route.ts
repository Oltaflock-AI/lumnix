import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { workspace_id } = await req.json();
    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
    }

    const db = getSupabaseAdmin();

    // Fetch workspace data in parallel
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [integrationsRes, ga4Res, gscRes] = await Promise.allSettled([
      db.from('integrations').select('provider, status, last_sync_at').eq('workspace_id', workspace_id),
      db.from('ga4_data')
        .select('metric_type, dimension_name, dimension_value, value, date')
        .eq('workspace_id', workspace_id)
        .gte('date', thirtyDaysAgo)
        .order('value', { ascending: false })
        .limit(200),
      db.from('gsc_data')
        .select('query, clicks, impressions, position, page, date')
        .eq('workspace_id', workspace_id)
        .gte('date', thirtyDaysAgo)
        .order('clicks', { ascending: false })
        .limit(100),
    ]);

    const integrations = integrationsRes.status === 'fulfilled' ? (integrationsRes.value.data || []) : [];
    const ga4Rows = ga4Res.status === 'fulfilled' ? (ga4Res.value.data || []) : [];
    const gscRows = gscRes.status === 'fulfilled' ? (gscRes.value.data || []) : [];

    const connected = integrations.filter((i: any) => i.status === 'connected').map((i: any) => i.provider);
    const hasData = ga4Rows.length > 0 || gscRows.length > 0;

    let prompt: string;

    if (!hasData) {
      prompt = `You are Lumnix AI, a marketing analytics assistant. The user has no marketing data connected yet.
Connected integrations: ${connected.length > 0 ? connected.join(', ') : 'none'}

Generate exactly 3 helpful setup tips as JSON. Each tip should guide them to connect data sources and get value from the platform.

Return ONLY a JSON array (no markdown, no code fences) of objects with these fields:
- type: "tip"
- title: string (short, actionable)
- description: string (1-2 sentences explaining why and how)
- priority: "high" | "medium" | "low"
- action: string (specific next step)`;
    } else {
      // Build data summary for the prompt
      const sessionRows = ga4Rows.filter((r: any) => r.metric_type === 'sessions');
      const totalSessions = sessionRows.reduce((s: number, r: any) => s + (r.value || 0), 0);
      const userRows = ga4Rows.filter((r: any) => r.metric_type === 'totalUsers');
      const totalUsers = userRows.reduce((s: number, r: any) => s + (r.value || 0), 0);
      const bounceRows = ga4Rows.filter((r: any) => r.metric_type === 'bounceRate');
      const avgBounce = bounceRows.length > 0
        ? (bounceRows.reduce((s: number, r: any) => s + (r.value || 0), 0) / bounceRows.length).toFixed(1)
        : null;

      const topSources = ga4Rows
        .filter((r: any) => r.metric_type === 'sessions' && r.dimension_name === 'sessionSource')
        .reduce((acc: Record<string, number>, r: any) => {
          acc[r.dimension_value] = (acc[r.dimension_value] || 0) + r.value;
          return acc;
        }, {});

      const topPages = ga4Rows
        .filter((r: any) => r.dimension_name === 'pagePath')
        .reduce((acc: Record<string, number>, r: any) => {
          acc[r.dimension_value] = (acc[r.dimension_value] || 0) + r.value;
          return acc;
        }, {});

      // Aggregate GSC keywords
      const keywordMap: Record<string, { clicks: number; impressions: number; positions: number[] }> = {};
      for (const r of gscRows) {
        if (!keywordMap[r.query]) keywordMap[r.query] = { clicks: 0, impressions: 0, positions: [] };
        keywordMap[r.query].clicks += r.clicks || 0;
        keywordMap[r.query].impressions += r.impressions || 0;
        if (r.position) keywordMap[r.query].positions.push(r.position);
      }
      const keywords = Object.entries(keywordMap).map(([query, d]) => ({
        query,
        clicks: d.clicks,
        impressions: d.impressions,
        avgPosition: d.positions.length > 0
          ? Math.round(d.positions.reduce((a, b) => a + b, 0) / d.positions.length * 10) / 10
          : null,
      })).sort((a, b) => b.clicks - a.clicks);

      const nearPageOne = keywords.filter(k => k.avgPosition && k.avgPosition >= 4 && k.avgPosition <= 10);

      // Build detailed data sections, skipping anything with 0/missing values
      const dataSections: string[] = [];

      if (totalSessions > 0) {
        dataSections.push(`SESSIONS: ${totalSessions.toLocaleString()} total sessions in the last 30 days.`);
      }
      if (totalUsers > 0) {
        dataSections.push(`USERS: ${totalUsers.toLocaleString()} total users in the last 30 days.`);
      }
      if (avgBounce) {
        dataSections.push(`BOUNCE RATE: ${avgBounce}% average bounce rate across all pages.`);
      }

      const topSourceEntries = Object.entries(topSources).slice(0, 5);
      if (topSourceEntries.length > 0) {
        const sourceLines = topSourceEntries.map(([source, sessions]) => {
          const pct = totalSessions > 0 ? ((sessions as number) / totalSessions * 100).toFixed(1) : '0';
          return `  - ${source}: ${(sessions as number).toLocaleString()} sessions (${pct}% of total)`;
        });
        dataSections.push(`TOP TRAFFIC SOURCES:\n${sourceLines.join('\n')}`);
      }

      const topPageEntries = Object.entries(topPages).slice(0, 5);
      if (topPageEntries.length > 0) {
        const pageLines = topPageEntries.map(([page, views]) =>
          `  - ${page}: ${(views as number).toLocaleString()} views`
        );
        dataSections.push(`TOP PAGES:\n${pageLines.join('\n')}`);
      }

      // Bounce rate per page (if available)
      const pageBounceRows = ga4Rows.filter((r: any) => r.metric_type === 'bounceRate' && r.dimension_name === 'pagePath');
      if (pageBounceRows.length > 0) {
        const pageBounces = pageBounceRows
          .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
          .slice(0, 5)
          .map((r: any) => `  - ${r.dimension_value}: ${r.value}% bounce rate`);
        dataSections.push(`HIGHEST BOUNCE RATE PAGES:\n${pageBounces.join('\n')}`);
      }

      const topKw = keywords.slice(0, 5);
      if (topKw.length > 0) {
        const kwLines = topKw.map(k =>
          `  - '${k.query}': ${k.clicks} clicks, ${k.impressions.toLocaleString()} impressions, avg position ${k.avgPosition ?? 'N/A'}`
        );
        dataSections.push(`TOP 5 KEYWORDS BY CLICKS:\n${kwLines.join('\n')}`);
      }

      if (nearPageOne.length > 0) {
        const npLines = nearPageOne.slice(0, 5).map(k =>
          `  - '${k.query}': position ${k.avgPosition}, ${k.impressions.toLocaleString()} impressions, ${k.clicks} clicks`
        );
        dataSections.push(`KEYWORDS CLOSE TO PAGE 1 (position 4-10):\n${npLines.join('\n')}`);
      }

      prompt = `You are Lumnix AI, a marketing analytics assistant. Analyze this REAL marketing data from the last 30 days and generate exactly 6 insights.

=== ACTUAL DATA ===
Connected integrations: ${connected.join(', ')}

${dataSections.join('\n\n')}
=== END DATA ===

STRICT RULES:
- Every insight MUST include specific numbers from the data above. If you cannot find a specific number to support an insight, do not include it. Never give generic advice without data to back it up.
- Reference actual keyword names, page paths, session counts, and percentages from the data.
- If a data field is 0 or missing above, do NOT make up numbers for it. Skip it entirely.
- The "metric" field must be a specific number from the data (e.g. "1,847 sessions", "#4 position", "82% bounce rate").
- The "change" field should be a real delta only if the data supports it (e.g. "+23% vs last month"). If no comparison data exists, set it to null. Do NOT invent deltas.

EXAMPLES OF GOOD INSIGHTS:
- "Organic search drove 1,847 sessions this month. Your top keyword 'best AI tools' ranks #4 with 234 clicks."
- "Your /pricing page has a 82% bounce rate vs 45% site average. Add social proof or a comparison table to reduce drop-off."
- "'AI automation agency' (pos 6.2, 89 impressions), 'n8n workflow builder' (pos 7.1, 67 impressions) are 1-2 spots from page 1. A 300-word content update could push these up."

EXAMPLES OF BAD INSIGHTS (never do this):
- "Your organic traffic is performing well" (too generic, no numbers)
- "Consider improving your bounce rate" (no specific page or number)
- "3 keywords are close to page 1" (doesn't name the keywords or their positions)

Generate exactly 6 insights with a good mix of types (win, warning, opportunity, tip).

Return ONLY a JSON array (no markdown, no code fences) of objects with these fields:
- type: "win" | "warning" | "opportunity" | "tip"
- title: string (short, includes a specific number, e.g. "Organic traffic hit 1,847 sessions")
- description: string (2-3 sentences referencing specific data points — keyword names, page paths, exact numbers)
- metric: string (a specific number from the data, e.g. "1,847 sessions", "#4 position", "82% bounce rate")
- change: string | null (real delta if data supports it, e.g. "+23%", otherwise null)
- action: string | null (specific actionable next step referencing the data)
- priority: "high" | "medium" | "low"`;
    }

    // Call Claude
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.json().catch(() => ({}));
      return NextResponse.json({ error: err?.error?.message || 'AI error' }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const rawContent = (aiData.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '[]';

    // Parse JSON — strip markdown fences if present
    let insights: any[];
    try {
      const cleaned = rawContent.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
      insights = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Delete old insights for this workspace, then insert new ones
    await db.from('ai_insights').delete().eq('workspace_id', workspace_id);

    const rows = insights.map((ins: any) => ({
      workspace_id,
      type: ins.type,
      title: ins.title,
      description: ins.description,
      metric: ins.metric || null,
      change: ins.change || null,
      action: ins.action || null,
      priority: ins.priority || 'medium',
    }));

    const { data: saved, error: insertErr } = await db.from('ai_insights').insert(rows).select();
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ insights: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
