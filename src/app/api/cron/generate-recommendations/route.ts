import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/cron/generate-recommendations — weekly cron to pre-generate recommendations
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const { data: workspaces } = await db
    .from('integrations')
    .select('workspace_id')
    .eq('status', 'connected');

  if (!workspaces || workspaces.length === 0) {
    return NextResponse.json({ success: true, message: 'No active workspaces', generated: 0 });
  }

  const uniqueWorkspaces = [...new Set(workspaces.map(w => w.workspace_id))];
  let generated = 0;
  const errors: any[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  for (const workspaceId of uniqueWorkspaces) {
    try {
      const res = await fetch(`${appUrl}/api/recommendations/generate?workspace_id=${workspaceId}`);
      if (res.ok) generated++;
      else errors.push({ workspace_id: workspaceId, status: res.status });
    } catch (e: any) {
      errors.push({ workspace_id: workspaceId, error: e.message });
    }
  }

  return NextResponse.json({ success: true, generated, errors: errors.length > 0 ? errors : undefined });
}
