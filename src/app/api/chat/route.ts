import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function fetchWorkspaceContext(workspaceId: string) {
  if (!workspaceId) return null;
  const db = getSupabaseAdmin();

  try {
    const [workspaceRes, ga4Res, gscRes, integrationsRes, competitorsRes] = await Promise.allSettled([
      db.from('workspaces').select('name, plan').eq('id', workspaceId).single(),
      db.from('ga4_data').select('metric_type, dimension_name, dimension_value, value, date')
        .eq('workspace_id', workspaceId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
        .order('value', { ascending: false })
        .limit(100),
      db.from('gsc_data').select('query, clicks, impressions, position, page, date')
        .eq('workspace_id', workspaceId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
        .order('clicks', { ascending: false })
        .limit(30),
      db.from('integrations').select('provider, status, last_sync_at').eq('workspace_id', workspaceId),
      db.from('competitors').select('name, domain').eq('workspace_id', workspaceId).limit(5),
    ]);

    const workspace = workspaceRes.status === 'fulfilled' ? workspaceRes.value.data : null;
    const ga4Rows = ga4Res.status === 'fulfilled' ? (ga4Res.value.data || []) : [];
    const gscRows = gscRes.status === 'fulfilled' ? (gscRes.value.data || []) : [];
    const integrations = integrationsRes.status === 'fulfilled' ? (integrationsRes.value.data || []) : [];
    const competitors = competitorsRes.status === 'fulfilled' ? (competitorsRes.value.data || []) : [];

    // Aggregate GA4
    const sessionRows = ga4Rows.filter((r: any) => r.metric_type === 'sessions');
    const totalSessions = sessionRows.reduce((s: number, r: any) => s + (r.value || 0), 0);
    const userRows = ga4Rows.filter((r: any) => r.metric_type === 'totalUsers');
    const totalUsers = userRows.reduce((s: number, r: any) => s + (r.value || 0), 0);

    const topSources = Object.entries(
      ga4Rows.filter((r: any) => r.metric_type === 'sessions' && r.dimension_name === 'sessionSource')
        .reduce((acc: Record<string, number>, r: any) => {
          acc[r.dimension_value] = (acc[r.dimension_value] || 0) + r.value;
          return acc;
        }, {})
    ).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5);

    // Aggregate GSC
    const topKeywords = Object.values(
      gscRows.reduce((acc: Record<string, any>, r: any) => {
        if (!acc[r.query]) acc[r.query] = { query: r.query, clicks: 0, impressions: 0, positions: [] };
        acc[r.query].clicks += r.clicks || 0;
        acc[r.query].impressions += r.impressions || 0;
        if (r.position) acc[r.query].positions.push(r.position);
        return acc;
      }, {})
    ).map((k: any) => ({
      query: k.query,
      clicks: k.clicks,
      impressions: k.impressions,
      avgPosition: k.positions.length > 0 ? Math.round(k.positions.reduce((a: number, b: number) => a + b, 0) / k.positions.length * 10) / 10 : null,
    })).sort((a: any, b: any) => b.clicks - a.clicks).slice(0, 15);

    return {
      workspaceName: workspace?.name || 'your workspace',
      ga4: { totalSessions, totalUsers, topSources, hasData: ga4Rows.length > 0 },
      gsc: { topKeywords, hasData: gscRows.length > 0 },
      integrations: integrations.map((i: any) => ({ provider: i.provider, status: i.status })),
      competitors: competitors.map((c: any) => ({ name: c.name, domain: c.domain })),
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, workspace_id } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    const context = workspace_id ? await fetchWorkspaceContext(workspace_id) : null;

    const systemPrompt = context
      ? `You are Lumnix AI, a marketing intelligence assistant for ${context.workspaceName}. You have access to their real marketing data from the last 30 days.

Current data:
${JSON.stringify(context, null, 2)}

Answer questions about their marketing performance. Be concise, data-driven, and always reference specific numbers from their data. If data is missing (hasData: false), tell them to connect that integration.`
      : `You are Lumnix AI, a marketing intelligence assistant. Help users analyze their marketing data and make strategic decisions. Be concise and actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        stream: true,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return new Response(err?.error?.message || 'OpenAI error', { status: 500 });
    }

    // Stream response
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
              const data = line.replace('data: ', '').trim();
              if (data === '[DONE]') continue;
              try {
                const json = JSON.parse(data);
                const text = json.choices?.[0]?.delta?.content;
                if (text) controller.enqueue(new TextEncoder().encode(text));
              } catch {}
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (error: any) {
    return new Response(error?.message || 'Internal server error', { status: 500 });
  }
}
