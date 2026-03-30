import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// POST /api/settings/slack/test — send test Slack message
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workspace_id } = body;

  if (!workspace_id) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: workspace, error } = await db
    .from('workspaces')
    .select('name, slack_webhook_url')
    .eq('id', workspace_id)
    .single();

  if (error || !workspace?.slack_webhook_url) {
    return NextResponse.json({ error: 'No Slack webhook configured' }, { status: 400 });
  }

  try {
    const res = await fetch(workspace.slack_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '✅ Lumnix — Test Message', emoji: true },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Your Slack integration for *${workspace.name || 'your workspace'}* is working correctly!\n\nYou'll receive alerts and anomaly notifications here.`,
            },
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `<https://lumnix-ai.vercel.app/dashboard|View Dashboard>` },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Slack returned: ${text}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to send test message' }, { status: 500 });
  }
}
