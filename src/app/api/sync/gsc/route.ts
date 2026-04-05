import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGSCData, fetchGSCSites } from '@/lib/connectors/gsc';
import { refreshAccessToken } from '@/lib/google-oauth';
import { rateLimit } from '@/lib/rate-limit';

// POST /api/sync/gsc
// Body: { integration_id, workspace_id, days?: number }
export async function POST(req: NextRequest) {
  try {
    const { integration_id, workspace_id, days = 28 } = await req.json();

    // Rate limit: 5 syncs per minute per workspace
    const rateLimited = rateLimit(`sync:gsc:${workspace_id}`, 5, 60 * 1000);
    if (rateLimited) return rateLimited;

    // Get tokens
    const { data: tokenRow } = await getSupabaseAdmin()
      .from('oauth_tokens')
      .select('*')
      .eq('integration_id', integration_id)
      .single();

    if (!tokenRow) {
      return NextResponse.json({ error: 'No tokens found' }, { status: 404 });
    }

    // Refresh if expired
    let accessToken = tokenRow.access_token;
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token);
      if (refreshed.error) {
        await getSupabaseAdmin().from('integrations').update({ status: 'error' }).eq('id', integration_id);
        return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
      }
      accessToken = refreshed.access_token;
      await getSupabaseAdmin().from('oauth_tokens').update({
        access_token: refreshed.access_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        last_refreshed_at: new Date().toISOString(),
      }).eq('id', tokenRow.id);
    }

    // Create sync job
    const { data: job } = await getSupabaseAdmin().from('sync_jobs').insert({
      workspace_id,
      integration_id,
      job_type: 'manual',
      status: 'running',
      started_at: new Date().toISOString(),
    }).select().single();

    // Get site list first
    const sites = await fetchGSCSites(accessToken);
    if (!sites.length) {
      await getSupabaseAdmin().from('sync_jobs').update({ status: 'failed', error_message: 'No sites found', completed_at: new Date().toISOString() }).eq('id', job?.id);
      return NextResponse.json({ error: 'No GSC sites found for this account' }, { status: 404 });
    }

    const siteUrl = sites[0].siteUrl;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Fetch data
    const rows = await fetchGSCData(accessToken, siteUrl, formatDate(startDate), formatDate(endDate));

    // Batch insert
    if (rows.length > 0) {
      // Delete existing data for date range to avoid duplicates
      await getSupabaseAdmin().from('gsc_data')
        .delete()
        .eq('workspace_id', workspace_id)
        .eq('integration_id', integration_id)
        .gte('date', formatDate(startDate))
        .lte('date', formatDate(endDate));

      // Insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize).map(r => ({
          workspace_id,
          integration_id,
          ...r,
        }));
        await getSupabaseAdmin().from('gsc_data').insert(chunk);
      }
    }

    // Update job + integration
    await getSupabaseAdmin().from('sync_jobs').update({
      status: 'completed',
      result: { rows_synced: rows.length, site: siteUrl },
      completed_at: new Date().toISOString(),
    }).eq('id', job?.id);

    await getSupabaseAdmin().from('integrations').update({
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      oauth_meta: { site_url: siteUrl, sites: sites.map((s: any) => s.siteUrl) },
    }).eq('id', integration_id);

    return NextResponse.json({ success: true, rows_synced: rows.length, site: siteUrl });
  } catch (error) {
    console.error('GSC sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
