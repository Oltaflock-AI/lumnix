import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGSCData, fetchGSCSites } from '@/lib/connectors/gsc';
import { refreshAccessToken } from '@/lib/google-oauth';
import { rateLimit } from '@/lib/rate-limit';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000]; // delays between attempts

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === MAX_RETRIES) throw err;
      console.warn(`${label} attempt ${attempt} failed: ${err.message}, retrying...`);
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]));
    }
  }
  throw new Error(`${label} failed after ${MAX_RETRIES} attempts`);
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

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

    // Proactively refresh if token expires within 5 minutes
    let accessToken = tokenRow.access_token;
    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now() + FIVE_MINUTES_MS) {
      try {
        const refreshed = await refreshAccessToken(tokenRow.refresh_token);
        if (refreshed.error) {
          await getSupabaseAdmin().from('integrations').update({ status: 'error' }).eq('id', integration_id);
          await getSupabaseAdmin().from('sync_jobs').insert({
            workspace_id,
            integration_id,
            job_type: 'manual',
            status: 'error',
            error_message: 'Token refresh failed — user must reconnect',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          });
          return NextResponse.json({ error: 'Token refresh failed — user must reconnect' }, { status: 401 });
        }
        accessToken = refreshed.access_token;
        await getSupabaseAdmin().from('oauth_tokens').update({
          access_token: refreshed.access_token,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          last_refreshed_at: new Date().toISOString(),
        }).eq('id', tokenRow.id);
      } catch (err: any) {
        console.error('GSC token refresh error:', err);
        await getSupabaseAdmin().from('integrations').update({ status: 'error' }).eq('id', integration_id);
        await getSupabaseAdmin().from('sync_jobs').insert({
          workspace_id,
          integration_id,
          job_type: 'manual',
          status: 'error',
          error_message: 'Token refresh failed — user must reconnect',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
        return NextResponse.json({ error: 'Token refresh failed — user must reconnect' }, { status: 401 });
      }
    }

    // Create sync job
    const { data: job } = await getSupabaseAdmin().from('sync_jobs').insert({
      workspace_id,
      integration_id,
      job_type: 'manual',
      status: 'running',
      started_at: new Date().toISOString(),
    }).select().single();

    // Get site list first (with retry)
    const sites = await withRetry(() => fetchGSCSites(accessToken), 'GSC fetchSites');
    if (!sites.length) {
      await getSupabaseAdmin().from('sync_jobs').update({ status: 'failed', error_message: 'No sites found', completed_at: new Date().toISOString() }).eq('id', job?.id);
      return NextResponse.json({ error: 'No GSC sites found for this account' }, { status: 404 });
    }

    const siteUrl = sites[0].siteUrl;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Fetch data (with retry)
    const rows = await withRetry(
      () => fetchGSCData(accessToken, siteUrl, formatDate(startDate), formatDate(endDate)),
      'GSC fetchData',
    );

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
  } catch (error: any) {
    console.error('GSC sync error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
