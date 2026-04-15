import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/rate-limit';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// POST /api/competitors/monitor — check a competitor for changes
export async function POST(req: NextRequest) {
  const { workspace_id, competitor_id } = await req.json();
  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const rateLimited = rateLimit(`monitor:${workspace_id}`, 3, 60 * 1000);
  if (rateLimited) return rateLimited;

  const db = getSupabaseAdmin();

  // Get competitor domain
  const { data: competitor } = await db
    .from('competitors')
    .select('domain, name')
    .eq('id', competitor_id)
    .single();

  if (!competitor?.domain) {
    return NextResponse.json({ error: 'Competitor has no domain set' }, { status: 400 });
  }

  const domain = competitor.domain.replace(/^https?:\/\//, '');

  // Scrape the competitor's homepage via Jina
  let content = '';
  let title = '';
  try {
    const res = await fetch(`https://r.jina.ai/https://${domain}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      content = await res.text();
      const titleMatch = content.match(/Title:\s*(.+)/);
      title = titleMatch?.[1]?.trim() || domain;
    }
  } catch {
    return NextResponse.json({ error: 'Failed to scrape competitor website' }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: 'No content retrieved' }, { status: 400 });
  }

  const contentHash = simpleHash(content.slice(0, 5000));
  const description = content.slice(0, 500);
  const pageLinks = (content.match(/https?:\/\/[^\s)>"]+/g) || []).filter(u => u.includes(domain)).length;

  const snapshotData = {
    title,
    description,
    content_hash: contentHash,
    pages_count: pageLinks,
    content_length: content.length,
  };

  // Get previous snapshot
  const { data: prevSnapshot } = await db
    .from('competitor_snapshots')
    .select('snapshot_data')
    .eq('competitor_id', competitor_id)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .single();

  let changes: any = null;
  if (prevSnapshot) {
    const prev = prevSnapshot.snapshot_data as any;
    changes = {
      title_changed: prev.title !== snapshotData.title,
      content_changed: prev.content_hash !== snapshotData.content_hash,
      pages_count_changed: prev.pages_count !== snapshotData.pages_count,
      prev_pages: prev.pages_count,
      new_pages: snapshotData.pages_count,
    };
  }

  // Store snapshot
  await db.from('competitor_snapshots').insert({
    workspace_id,
    competitor_id,
    snapshot_data: snapshotData,
    changes,
  });

  return NextResponse.json({
    competitor: competitor.name,
    snapshot: snapshotData,
    changes,
    is_first_snapshot: !prevSnapshot,
  });
}

// GET /api/competitors/monitor?workspace_id=xxx&competitor_id=yyy — get snapshot history
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  const competitorId = req.nextUrl.searchParams.get('competitor_id');

  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  const db = getSupabaseAdmin();
  let query = db.from('competitor_snapshots')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('snapshot_at', { ascending: false })
    .limit(20);

  if (competitorId) {
    query = query.eq('competitor_id', competitorId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ snapshots: data || [] });
}
