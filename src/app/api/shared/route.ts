import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

// GET /api/shared?workspace_id=... — list shared dashboards
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('shared_dashboards')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ dashboards: data || [] });
}

// POST /api/shared — create a shared dashboard link
export async function POST(req: NextRequest) {
  try {
    const { workspace_id, title, sections, custom_logo_url, custom_brand_color, expires_at } = await req.json();
    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

    // Middleware already verified membership when workspace_id is in body,
    // but re-check defensively to guarantee ownership.
    const access = await verifyWorkspaceAccess(req, workspace_id);
    if (access instanceof NextResponse) return access;

    const safeSections = Array.isArray(sections)
      ? sections.filter((s) => typeof s === 'string').slice(0, 20)
      : ['overview', 'seo', 'analytics', 'ads'];

    const { data, error } = await getSupabaseAdmin()
      .from('shared_dashboards')
      .insert({
        workspace_id,
        title: typeof title === 'string' ? title.slice(0, 200) : 'Client Dashboard',
        sections: safeSections,
        custom_logo_url: typeof custom_logo_url === 'string' ? custom_logo_url.slice(0, 500) : null,
        custom_brand_color: typeof custom_brand_color === 'string' ? custom_brand_color.slice(0, 32) : null,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumnix-ai.vercel.app';
    return NextResponse.json({ dashboard: data, share_url: `${appUrl}/share/${data.share_token}` });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/shared?id=...
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getSupabaseAdmin();

  // Resolve the dashboard's workspace, then check the caller belongs to it
  const { data: dashboard } = await db
    .from('shared_dashboards')
    .select('id, workspace_id')
    .eq('id', id)
    .single();
  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  const access = await verifyWorkspaceAccess(req, dashboard.workspace_id);
  if (access instanceof NextResponse) return access;

  const { error } = await db.from('shared_dashboards').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete dashboard' }, { status: 500 });
  return NextResponse.json({ success: true });
}
