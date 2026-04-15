import { NextRequest, NextResponse } from 'next/server';
import { safeFetchUrl } from '@/lib/url-guard';

function getMetaToken(): string | null {
  if (process.env.META_ACCESS_TOKEN) return process.env.META_ACCESS_TOKEN;
  // Fallback: app-level token for read-only Ad Library access
  if (process.env.META_APP_ID && process.env.META_APP_SECRET) {
    return `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`;
  }
  return null;
}

async function resolveFromFacebookUrl(slug: string, token: string) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(slug)}?fields=id,name,picture,fan_count&access_token=${token}`
    );
    const data = await res.json();
    if (data.id) {
      // Get ad count for this page
      const adCount = await getAdCountForPage(data.id, token);
      return [{
        page_id: data.id,
        page_name: data.name || slug,
        page_url: `https://facebook.com/${slug}`,
        picture_url: data.picture?.data?.url || null,
        ad_count: adCount,
      }];
    }
  } catch {}
  return null;
}

async function resolveFromWebsite(url: string, token: string) {
  try {
    // SSRF guard: reject non-http(s), loopback, private IPs, cloud metadata, etc.
    // Without this, a crafted query lets us fetch 169.254.169.254 / 127.0.0.1 / intranet hosts.
    const safeUrl = safeFetchUrl(url);
    if (!safeUrl) return null;
    const res = await fetch(safeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Lumnix/1.0)' },
      signal: AbortSignal.timeout(8000),
      redirect: 'manual',
    });
    // Only treat successful direct responses as HTML. Manual-redirect responses
    // return a 3xx with no body here, avoiding redirect chains into private space.
    if (!res.ok) return null;
    const html = await res.text();

    // Search for facebook.com links in HTML
    const fbPatterns = [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]+)/gi,
    ];

    const slugs = new Set<string>();
    for (const pattern of fbPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const slug = match[1];
        if (!['sharer', 'share', 'dialog', 'plugins', 'tr', 'hashtag', 'groups', 'events', 'pages'].includes(slug.toLowerCase())) {
          slugs.add(slug);
        }
      }
    }

    if (slugs.size > 0) {
      const firstSlug = [...slugs][0];
      const result = await resolveFromFacebookUrl(firstSlug, token);
      if (result) return result;
    }
  } catch {}
  return null;
}

async function searchAdLibrary(query: string, token: string) {
  const params = new URLSearchParams({
    search_terms: query,
    ad_type: 'ALL',
    ad_reached_countries: JSON.stringify(['IN', 'US', 'GB']),
    fields: 'page_id,page_name',
    limit: '50',
    access_token: token,
  });

  const res = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || 'Meta API error');
  }

  if (!json.data || json.data.length === 0) return [];

  // De-duplicate by page_id and count ads per page
  const pageMap = new Map<string, { page_id: string; page_name: string; count: number }>();
  for (const ad of json.data) {
    if (!ad.page_id) continue;
    const existing = pageMap.get(ad.page_id);
    if (existing) {
      existing.count++;
    } else {
      pageMap.set(ad.page_id, { page_id: ad.page_id, page_name: ad.page_name || 'Unknown', count: 1 });
    }
  }

  // Sort by ad count descending, take top 5
  const sorted = [...pageMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  // Fetch profile pictures and full ad counts for each
  const results = await Promise.all(
    sorted.map(async (page) => {
      let picture_url = null;
      let ad_count = page.count;
      try {
        const pageRes = await fetch(
          `https://graph.facebook.com/v19.0/${page.page_id}?fields=id,name,picture&access_token=${token}`
        );
        const pageData = await pageRes.json();
        if (pageData.picture?.data?.url) picture_url = pageData.picture.data.url;
        // Try to get full ad count
        const fullCount = await getAdCountForPage(page.page_id, token);
        if (fullCount > 0) ad_count = fullCount;
      } catch {}
      return {
        page_id: page.page_id,
        page_name: page.page_name,
        page_url: `https://facebook.com/${page.page_id}`,
        picture_url,
        ad_count,
      };
    })
  );

  return results;
}

async function getAdCountForPage(pageId: string, token: string): Promise<number> {
  try {
    const params = new URLSearchParams({
      search_page_ids: pageId,
      ad_type: 'ALL',
      ad_reached_countries: JSON.stringify(['IN', 'US', 'GB', 'AU', 'CA']),
      fields: 'id',
      limit: '1',
      access_token: token,
    });
    const res = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
    const json = await res.json();
    // Meta doesn't return total count easily — estimate from first page
    return json.data?.length || 0;
  } catch {
    return 0;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, workspace_id } = await req.json();
    if (!query || !workspace_id) {
      return NextResponse.json({ error: 'query and workspace_id required' }, { status: 400 });
    }

    const token = await getMetaToken();
    if (!token) {
      return NextResponse.json({ error: 'Meta token not configured. Set META_ACCESS_TOKEN or META_APP_ID + META_APP_SECRET.' }, { status: 500 });
    }

    const trimmed = query.trim();

    // Path B: Facebook URL
    if (trimmed.includes('facebook.com/')) {
      const slug = trimmed.split('facebook.com/').pop()?.split('/')[0]?.split('?')[0];
      if (slug) {
        const result = await resolveFromFacebookUrl(slug, token);
        if (result) return NextResponse.json({ results: result });
      }
      // Fall through to search
    }

    // Path A: Website URL (contains a dot but not facebook.com)
    if (trimmed.includes('.') && !trimmed.includes('facebook.com')) {
      const result = await resolveFromWebsite(trimmed, token);
      if (result) return NextResponse.json({ results: result });
      // Fall through to search
    }

    // Path C: Brand name search
    const results = await searchAdLibrary(trimmed, token);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
