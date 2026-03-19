import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function fetchWorkspaceContext(workspaceId: string) {
  if (!workspaceId) return null;
  const db = getSupabaseAdmin();

  try {
    // Fetch in parallel
    const [workspaceRes, ga4Res, gscRes, integrationsRes, competitorsRes] = await Promise.allSettled([
      db.from('workspaces').select('name, plan').eq('id', workspaceId).single(),
      db
        .from('ga4_data')
        .select('sessions, users, page_path, source_medium, date')
        .eq('workspace_id', workspaceId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
        .order('sessions', { ascending: false })
        .limit(50),
      db
        .from('gsc_data')
        .select('query, clicks, impressions, position, date')
        .eq('workspace_id', workspaceId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
        .order('clicks', { ascending: false })
        .limit(20),
      db
        .from('integrations')
        .select('provider, status, last_sync_at')
        .eq('workspace_id', workspaceId),
      db
        .from('competitors')
        .select('name, domain')
        .eq('workspace_id', workspaceId)
        .limit(5),
    ]);

    const workspace = workspaceRes.status === 'fulfilled' ? workspaceRes.value.data : null;
    const ga4Rows = ga4Res.status === 'fulfilled' ? (ga4Res.value.data || []) : [];
    const gscRows = gscRes.status === 'fulfilled' ? (gscRes.value.data || []) : [];
    const integrations = integrationsRes.status === 'fulfilled' ? (integrationsRes.value.data || []) : [];
    const competitors = competitorsRes.status === 'fulfilled' ? (competitorsRes.value.data || []) : [];

    // Summarize GA4
    const totalSessions = ga4Rows.reduce((s: number, r: any) => s + (r.sessions || 0), 0);
    const totalUsers = ga4Rows.reduce((s: number, r: any) => s + (r.users || 0), 0);
    const topPages = Object.entries(
      ga4Rows.reduce((acc: Record<string, number>, r: any) => {
        if (r.page_path) acc[r.page_path] = (acc[r.page_path] || 0) + (r.sessions || 0);
        return acc;
      }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([page, sessions]) => ({ page, sessions }));

    const topSources = Object.entries(
      ga4Rows.reduce((acc: Record<string, number>, r: any) => {
        if (r.source_medium) acc[r.source_medium] = (acc[r.source_medium] || 0) + (r.sessions || 0);
        return acc;
      }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([source, sessions]) => ({ source, sessions }));

    // Summarize GSC
    const topKeywords = gscRows.slice(0, 10).map((r: any) => ({
      query: r.query,
      clicks: r.clicks,
      impressions: r.impressions,
      avgPosition: r.position ? Math.round(r.position * 10) / 10 : null,
    }));

    return {
      workspaceName: workspace?.name || 'your workspace',
      plan: workspace?.plan || 'free',
      ga4: {
        last30Days: { totalSessions, totalUsers },
        topPages,
        topSources,
        hasData: ga4Rows.length > 0,
      },
      gsc: {
        topKeywords,
        hasData: gscRows.length > 0,
      },
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response('Anthropic API key not configured', { status: 500 });
    }

    // Fetch real data context
    const context = workspace_id ? await fetchWorkspaceContext(workspace_id) : null;

    const systemPrompt = context
      ? `You are Krato AI, a marketing intelligence assistant for ${context.workspaceName}. You have access to their real marketing data from the last 30 days.

Here is their current data context:
${JSON.stringify(context, null, 2)}

Answer questions about their marketing performance, suggest improvements, explain trends, and provide actionable recommendations. Be concise and data-driven. Always reference specific numbers from their data when available. If data for a specific metric is missing or empty (hasData: false), mention they need to connect that integration.`
      : `You are Krato AI, a marketing intelligence assistant. Help users analyze their marketing data, identify trends, and make strategic decisions. Be concise and actionable.`;

    const stream = anthropic.messages.stream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    return new Response(error?.message || 'Internal server error', { status: 500 });
  }
}
