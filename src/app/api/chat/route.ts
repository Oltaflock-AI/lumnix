import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/rate-limit';
import { checkAIChatLimit } from '@/lib/plan-limits';

// Tool definitions for function calling
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'query_gsc_data',
      description: 'Query Google Search Console data for keywords, pages, clicks, impressions, and positions. Use this to answer questions about SEO performance, keyword rankings, or organic search.',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: ['top_keywords', 'top_pages', 'overview'], description: 'Type of data to query' },
          days: { type: 'number', description: 'Number of days to look back (default: 30)' },
          limit: { type: 'number', description: 'Max results to return (default: 20)' },
          query_filter: { type: 'string', description: 'Optional keyword filter' },
        },
        required: ['metric'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_ga4_data',
      description: 'Query Google Analytics 4 data for sessions, users, traffic sources, top pages, and device breakdown. Use this to answer questions about website traffic and user behavior.',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: ['sessions', 'users', 'sources', 'pages', 'devices', 'overview'], description: 'Type of data to query' },
          days: { type: 'number', description: 'Number of days to look back (default: 30)' },
        },
        required: ['metric'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_ads_data',
      description: 'Query Google Ads or Meta Ads campaign data including spend, clicks, conversions, and ROAS. Use for questions about paid advertising performance.',
      parameters: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['google_ads', 'meta_ads', 'both'], description: 'Which ad platform to query' },
          days: { type: 'number', description: 'Number of days to look back (default: 30)' },
        },
        required: ['provider'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_competitors',
      description: 'Get competitor list and any keyword gap analysis data. Use for questions about competitive intelligence.',
      parameters: {
        type: 'object',
        properties: {
          include_keyword_gaps: { type: 'boolean', description: 'Include keyword gap data if available' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_anomalies',
      description: 'Get recent anomalies and alerts detected in the workspace. Use for questions about unusual changes or issues.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days to look back (default: 14)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_cross_channel',
      description: 'Get a unified cross-channel overview combining organic (GSC + GA4) and paid (Google Ads + Meta Ads) metrics. Best for comparing organic vs paid performance, total marketing overview, or answering "how is my marketing doing?"',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days to look back (default: 30)' },
        },
      },
    },
  },
];

// Tool execution functions
async function executeToolCall(
  name: string,
  args: any,
  workspaceId: string
): Promise<string> {
  const db = getSupabaseAdmin();
  const dateFrom = (days: number) =>
    new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  try {
    switch (name) {
      case 'query_gsc_data': {
        const days = args.days || 30;
        let query = db.from('gsc_data')
          .select('query, page, clicks, impressions, ctr, position, date')
          .eq('workspace_id', workspaceId)
          .gte('date', dateFrom(days))
          .order('clicks', { ascending: false });

        if (args.query_filter) {
          query = query.ilike('query', `%${args.query_filter}%`);
        }

        const { data } = await query.limit(args.limit || 50);
        if (!data || data.length === 0) return JSON.stringify({ message: 'No GSC data available. The user may need to connect Google Search Console.' });

        if (args.metric === 'overview') {
          const totalClicks = data.reduce((s: number, r: any) => s + (r.clicks || 0), 0);
          const totalImpressions = data.reduce((s: number, r: any) => s + (r.impressions || 0), 0);
          const avgPosition = data.reduce((s: number, r: any) => s + (r.position || 0), 0) / data.length;
          return JSON.stringify({ totalClicks, totalImpressions, avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) + '%' : '0%', avgPosition: avgPosition.toFixed(1), totalKeywords: data.length, period: `last ${days} days` });
        }

        if (args.metric === 'top_pages') {
          const pages: Record<string, { clicks: number; impressions: number }> = {};
          for (const r of data) {
            if (!r.page) continue;
            if (!pages[r.page]) pages[r.page] = { clicks: 0, impressions: 0 };
            pages[r.page].clicks += r.clicks || 0;
            pages[r.page].impressions += r.impressions || 0;
          }
          const sorted = Object.entries(pages).sort(([, a], [, b]) => b.clicks - a.clicks).slice(0, args.limit || 20);
          return JSON.stringify({ topPages: sorted.map(([page, d]) => ({ page, ...d })), period: `last ${days} days` });
        }

        // top_keywords
        const kws: Record<string, { clicks: number; impressions: number; positions: number[] }> = {};
        for (const r of data) {
          if (!r.query) continue;
          if (!kws[r.query]) kws[r.query] = { clicks: 0, impressions: 0, positions: [] };
          kws[r.query].clicks += r.clicks || 0;
          kws[r.query].impressions += r.impressions || 0;
          if (r.position) kws[r.query].positions.push(r.position);
        }
        const sorted = Object.entries(kws)
          .map(([query, d]) => ({ query, clicks: d.clicks, impressions: d.impressions, avgPosition: d.positions.length > 0 ? (d.positions.reduce((a, b) => a + b, 0) / d.positions.length).toFixed(1) : null }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, args.limit || 20);
        return JSON.stringify({ topKeywords: sorted, period: `last ${days} days` });
      }

      case 'query_ga4_data': {
        const days = args.days || 30;
        const { data } = await db.from('ga4_data')
          .select('metric_type, dimension_name, dimension_value, value, date')
          .eq('workspace_id', workspaceId)
          .gte('date', dateFrom(days))
          .order('value', { ascending: false })
          .limit(200);

        if (!data || data.length === 0) return JSON.stringify({ message: 'No GA4 data available. The user may need to connect Google Analytics.' });

        if (args.metric === 'overview' || args.metric === 'sessions' || args.metric === 'users') {
          const sessions = data.filter((r: any) => r.metric_type === 'sessions').reduce((s: number, r: any) => s + (r.value || 0), 0);
          const users = data.filter((r: any) => r.metric_type === 'totalUsers').reduce((s: number, r: any) => s + (r.value || 0), 0);
          return JSON.stringify({ sessions, users, period: `last ${days} days` });
        }

        if (args.metric === 'sources') {
          const sources: Record<string, number> = {};
          for (const r of data.filter((r: any) => r.metric_type === 'sessions' && r.dimension_name === 'sessionSource')) {
            sources[r.dimension_value] = (sources[r.dimension_value] || 0) + (r.value || 0);
          }
          const sorted = Object.entries(sources).sort(([, a], [, b]) => b - a).slice(0, 10);
          return JSON.stringify({ sources: sorted.map(([source, sessions]) => ({ source, sessions })), period: `last ${days} days` });
        }

        if (args.metric === 'pages') {
          const pages: Record<string, number> = {};
          for (const r of data.filter((r: any) => r.dimension_name === 'pagePath')) {
            pages[r.dimension_value] = (pages[r.dimension_value] || 0) + (r.value || 0);
          }
          const sorted = Object.entries(pages).sort(([, a], [, b]) => b - a).slice(0, 10);
          return JSON.stringify({ topPages: sorted.map(([page, views]) => ({ page, views })), period: `last ${days} days` });
        }

        if (args.metric === 'devices') {
          const devices: Record<string, number> = {};
          for (const r of data.filter((r: any) => r.dimension_name === 'deviceCategory')) {
            devices[r.dimension_value] = (devices[r.dimension_value] || 0) + (r.value || 0);
          }
          return JSON.stringify({ devices, period: `last ${days} days` });
        }

        return JSON.stringify({ rawDataPoints: data.length, period: `last ${days} days` });
      }

      case 'query_ads_data': {
        const days = args.days || 30;
        const result: Record<string, any> = {};

        if (args.provider === 'google_ads' || args.provider === 'both') {
          const { data: gAds } = await db.from('google_ads_data')
            .select('campaign_name, status, clicks, impressions, cost, conversions, conversions_value')
            .eq('workspace_id', workspaceId)
            .gte('date', dateFrom(days));

          if (gAds && gAds.length > 0) {
            const spend = gAds.reduce((s, r) => s + Number(r.cost || 0), 0);
            const clicks = gAds.reduce((s, r) => s + Number(r.clicks || 0), 0);
            const conversions = gAds.reduce((s, r) => s + Number(r.conversions || 0), 0);
            const revenue = gAds.reduce((s, r) => s + Number(r.conversions_value || 0), 0);
            result.google_ads = { spend, clicks, conversions, revenue, roas: spend > 0 ? +(revenue / spend).toFixed(2) : 0, rows: gAds.length };
          }
          // Fallback to analytics_data JSONB
          if (!result.google_ads) {
            const { data: fb } = await db.from('analytics_data').select('data').eq('workspace_id', workspaceId).eq('provider', 'google_ads').order('synced_at', { ascending: false }).limit(1).single();
            if (fb?.data && Array.isArray(fb.data)) {
              const spend = fb.data.reduce((s: number, c: any) => s + (c.spend || 0), 0);
              const clicks = fb.data.reduce((s: number, c: any) => s + (c.clicks || 0), 0);
              result.google_ads = { spend, clicks, campaigns: fb.data.length };
            }
          }
        }

        if (args.provider === 'meta_ads' || args.provider === 'both') {
          const { data: meta } = await db.from('meta_ads_data')
            .select('campaign_name, clicks, impressions, spend, conversions, revenue')
            .eq('workspace_id', workspaceId)
            .gte('date', dateFrom(days));

          if (meta && meta.length > 0) {
            const spend = meta.reduce((s, r) => s + Number(r.spend || 0), 0);
            const clicks = meta.reduce((s, r) => s + Number(r.clicks || 0), 0);
            const conversions = meta.reduce((s, r) => s + Number(r.conversions || 0), 0);
            const revenue = meta.reduce((s, r) => s + Number(r.revenue || 0), 0);
            result.meta_ads = { spend, clicks, conversions, revenue, roas: spend > 0 ? +(revenue / spend).toFixed(2) : 0, rows: meta.length };
          }
          if (!result.meta_ads) {
            const { data: fb } = await db.from('analytics_data').select('data').eq('workspace_id', workspaceId).eq('provider', 'meta_ads').order('synced_at', { ascending: false }).limit(1).single();
            if (fb?.data && Array.isArray(fb.data)) {
              const spend = fb.data.reduce((s: number, c: any) => s + (c.spend || 0), 0);
              const clicks = fb.data.reduce((s: number, c: any) => s + (c.clicks || 0), 0);
              result.meta_ads = { spend, clicks, adsets: fb.data.length };
            }
          }
        }

        if (Object.keys(result).length === 0) return JSON.stringify({ message: 'No ads data available. The user may need to connect Google Ads or Meta Ads.' });
        return JSON.stringify({ adPerformance: result, period: `last ${days} days` });
      }

      case 'query_competitors': {
        const { data: competitors } = await db.from('competitors')
          .select('id, name, domain')
          .eq('workspace_id', workspaceId)
          .limit(10);

        if (!competitors || competitors.length === 0) return JSON.stringify({ message: 'No competitors tracked yet.' });

        let gaps: any[] = [];
        if (args.include_keyword_gaps) {
          const { data: gapData } = await db.from('keyword_gaps')
            .select('keyword, difficulty, recommended_action, competitor_id')
            .eq('workspace_id', workspaceId)
            .limit(30);
          gaps = gapData || [];
        }

        return JSON.stringify({ competitors, keywordGaps: gaps.length > 0 ? gaps : undefined });
      }

      case 'query_anomalies': {
        const days = args.days || 14;
        const { data: anomalies } = await db.from('anomalies')
          .select('type, severity, title, description, detected_at')
          .eq('workspace_id', workspaceId)
          .gte('detected_at', new Date(Date.now() - days * 86400000).toISOString())
          .order('detected_at', { ascending: false })
          .limit(10);

        if (!anomalies || anomalies.length === 0) return JSON.stringify({ message: 'No anomalies detected recently.' });
        return JSON.stringify({ anomalies, period: `last ${days} days` });
      }

      case 'query_cross_channel': {
        const days = args.days || 30;
        const [gscRes, ga4Res, gAdsRes, metaRes] = await Promise.all([
          db.from('gsc_data').select('clicks, impressions').eq('workspace_id', workspaceId).gte('date', dateFrom(days)),
          db.from('ga4_data').select('metric_type, dimension_name, value').eq('workspace_id', workspaceId).gte('date', dateFrom(days)),
          db.from('google_ads_data').select('clicks, cost, conversions, conversions_value').eq('workspace_id', workspaceId).gte('date', dateFrom(days)),
          db.from('meta_ads_data').select('clicks, spend, conversions, revenue').eq('workspace_id', workspaceId).gte('date', dateFrom(days)),
        ]);

        const organic = {
          clicks: (gscRes.data || []).reduce((s, r) => s + (r.clicks || 0), 0),
          impressions: (gscRes.data || []).reduce((s, r) => s + (r.impressions || 0), 0),
        };

        const ga4Rows = ga4Res.data || [];
        const sessions = ga4Rows.filter(r => r.metric_type === 'sessions' && (r.dimension_name === 'total' || r.dimension_name === 'date')).reduce((s, r) => s + (r.value || 0), 0)
          || ga4Rows.filter(r => r.metric_type === 'sessions' && r.dimension_name === 'sessionSource').reduce((s, r) => s + (r.value || 0), 0);

        const gAds = gAdsRes.data || [];
        const googleAds = {
          spend: gAds.reduce((s, r) => s + Number(r.cost || 0), 0),
          clicks: gAds.reduce((s, r) => s + Number(r.clicks || 0), 0),
          conversions: gAds.reduce((s, r) => s + Number(r.conversions || 0), 0),
          revenue: gAds.reduce((s, r) => s + Number(r.conversions_value || 0), 0),
        };

        const meta = metaRes.data || [];
        const metaAds = {
          spend: meta.reduce((s, r) => s + Number(r.spend || 0), 0),
          clicks: meta.reduce((s, r) => s + Number(r.clicks || 0), 0),
          conversions: meta.reduce((s, r) => s + Number(r.conversions || 0), 0),
          revenue: meta.reduce((s, r) => s + Number(r.revenue || 0), 0),
        };

        const totalAdSpend = googleAds.spend + metaAds.spend;
        const totalRevenue = googleAds.revenue + metaAds.revenue;
        const totalPaidClicks = googleAds.clicks + metaAds.clicks;

        return JSON.stringify({
          overview: {
            sessions,
            organicClicks: organic.clicks,
            organicImpressions: organic.impressions,
            paidClicks: totalPaidClicks,
            totalAdSpend: +totalAdSpend.toFixed(2),
            totalRevenue: +totalRevenue.toFixed(2),
            roas: totalAdSpend > 0 ? +(totalRevenue / totalAdSpend).toFixed(2) : 0,
            totalConversions: googleAds.conversions + metaAds.conversions,
          },
          byPlatform: {
            google_ads: googleAds.spend > 0 ? googleAds : undefined,
            meta_ads: metaAds.spend > 0 ? metaAds : undefined,
          },
          period: `last ${days} days`,
        });
      }

      default:
        return JSON.stringify({ error: 'Unknown tool' });
    }
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

async function fetchWorkspaceOverview(workspaceId: string) {
  if (!workspaceId) return null;
  const db = getSupabaseAdmin();
  try {
    const [workspaceRes, integrationsRes] = await Promise.allSettled([
      db.from('workspaces').select('name, plan').eq('id', workspaceId).single(),
      db.from('integrations').select('provider, status, last_sync_at').eq('workspace_id', workspaceId),
    ]);
    const workspace = workspaceRes.status === 'fulfilled' ? workspaceRes.value.data : null;
    const integrations = integrationsRes.status === 'fulfilled' ? (integrationsRes.value.data || []) : [];
    return {
      workspaceName: workspace?.name || 'your workspace',
      connectedIntegrations: integrations.filter((i: any) => i.status === 'connected').map((i: any) => i.provider),
    };
  } catch {
    return null;
  }
}

// Convert our OpenAI-style tool definitions to Anthropic format
function toAnthropicTools() {
  return tools.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { messages, workspace_id } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response('Anthropic API key not configured', { status: 500 });
    }

    // Rate limit: 10 requests per minute per workspace
    if (workspace_id) {
      const rateLimited = rateLimit(`chat:${workspace_id}`, 10, 60 * 1000);
      if (rateLimited) return rateLimited;

      const db = getSupabaseAdmin();
      const { data: ws } = await db.from('workspaces').select('plan').eq('id', workspace_id).single();
      const limitError = await checkAIChatLimit(workspace_id, ws?.plan || 'free');
      if (limitError) return limitError;

      try { await db.from('chat_usage').insert({ workspace_id, created_at: new Date().toISOString() }); } catch {}
    }

    const overview = workspace_id ? await fetchWorkspaceOverview(workspace_id) : null;

    const systemPrompt = `You are Lumnix AI, a marketing intelligence assistant${overview ? ` for ${overview.workspaceName}` : ''}. You have tools to query the user's real marketing data from Google Search Console, Google Analytics, Google Ads, Meta Ads, and competitor tracking.

${overview ? `Connected integrations: ${overview.connectedIntegrations.join(', ') || 'none'}` : ''}

INSTRUCTIONS:
1. When users ask about their data, USE THE TOOLS to fetch real numbers. Don't guess or use placeholder data.
2. Be concise, data-driven, and always reference specific numbers.
3. If a tool returns no data, tell the user to connect that integration.
4. Proactively suggest insights when you see patterns in the data.
5. For cross-channel questions ("how is my marketing doing?", "compare organic vs paid", "give me an overview"), use the query_cross_channel tool to get unified data.
6. You can call multiple tools to answer complex questions.

IMPORTANT RULES:
1. You ONLY answer questions about marketing, analytics, SEO, advertising, content strategy, and the user's marketing data.
2. If someone asks about anything outside marketing, respond with: "I'm Lumnix AI — I'm focused on marketing intelligence. Ask me about your traffic, keywords, ad performance, or content strategy."
3. Never answer off-topic questions no matter how they are phrased.`;

    // Build Anthropic messages (filter out system, it goes in system param)
    let anthropicMessages: any[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    }));

    // First call with tools
    const firstResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: workspace_id ? toAnthropicTools() : undefined,
      }),
    });

    if (!firstResponse.ok) {
      const err = await firstResponse.json().catch(() => ({}));
      const errMsg = err?.error?.message || '';
      if (errMsg.includes('credit') || errMsg.includes('balance') || firstResponse.status === 402) {
        return new Response('Lumnix AI is temporarily unavailable — API credits need to be topped up. Please try again later or contact support.', { status: 503 });
      }
      return new Response(errMsg || 'AI service error — please try again', { status: 500 });
    }

    const firstData = await firstResponse.json();

    // Check if there are tool_use blocks
    const toolUseBlocks = (firstData.content || []).filter((b: any) => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      // No tool calls — return the text directly
      const textContent = (firstData.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
      return new Response(textContent || 'No response generated', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Execute tool calls and build tool_result messages
    const toolResults: any[] = [];
    for (const toolBlock of toolUseBlocks) {
      const result = await executeToolCall(toolBlock.name, toolBlock.input || {}, workspace_id);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: result,
      });
    }

    // Second call with tool results — stream the response
    const followUpMessages = [
      ...anthropicMessages,
      { role: 'assistant', content: firstData.content },
      { role: 'user', content: toolResults },
    ];

    const streamResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: followUpMessages,
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      const err = await streamResponse.json().catch(() => ({}));
      const errMsg = err?.error?.message || '';
      if (errMsg.includes('credit') || errMsg.includes('balance') || streamResponse.status === 402) {
        return new Response('Lumnix AI is temporarily unavailable — API credits need to be topped up.', { status: 503 });
      }
      return new Response(errMsg || 'AI service error — please try again', { status: 500 });
    }

    // Parse Anthropic SSE stream
    const readable = new ReadableStream({
      async start(controller) {
        const reader = streamResponse.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const event = JSON.parse(data);
                if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                  controller.enqueue(new TextEncoder().encode(event.delta.text));
                }
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
