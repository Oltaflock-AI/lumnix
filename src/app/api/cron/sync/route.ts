import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGSCData, fetchGSCSites } from '@/lib/connectors/gsc';
import { fetchGA4Data, fetchGA4Properties, GA4_REPORTS } from '@/lib/connectors/ga4';
import { fetchGoogleAdsCampaigns, fetchGoogleAdsAccounts } from '@/lib/connectors/google-ads';
import { fetchMetaAdAccounts, fetchMetaInsights } from '@/lib/connectors/meta-ads';
import { refreshAccessToken } from '@/lib/google-oauth';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<{ data?: T; error?: string; attempts: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await fn();
      return { data, attempts: attempt };
    } catch (err: any) {
      const isLast = attempt === MAX_RETRIES;
      if (isLast) {
        return { error: `${label} failed after ${MAX_RETRIES} attempts: ${err.message}`, attempts: attempt };
      }
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt - 1)));
    }
  }
  return { error: `${label} failed`, attempts: MAX_RETRIES };
}

async function createSyncJob(db: ReturnType<typeof getSupabaseAdmin>, workspaceId: string, provider: string) {
  const { data } = await db.from('sync_jobs').insert({
    workspace_id: workspaceId,
    job_type: `${provider}_sync`,
    status: 'running',
    started_at: new Date().toISOString(),
  }).select('id').single();
  return data?.id;
}

async function completeSyncJob(db: ReturnType<typeof getSupabaseAdmin>, jobId: string, status: 'completed' | 'failed', result: any, errorMessage?: string) {
  await db.from('sync_jobs').update({
    status,
    completed_at: new Date().toISOString(),
    result,
    error_message: errorMessage || null,
  }).eq('id', jobId);
}

// GET /api/cron/sync — called by Vercel Cron every 24h
// Also callable manually: GET /api/cron/sync?workspace_id=xxx
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'lumnix-cron-2026';
  const workspaceIdParam = req.nextUrl.searchParams.get('workspace_id');

  if (authHeader !== `Bearer ${cronSecret}` && !workspaceIdParam) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const results: any[] = [];
  const errors: any[] = [];

  try {
    // Get all active integrations — now includes all 4 providers
    let query = db.from('integrations')
      .select('id, workspace_id, provider, status, oauth_meta, oauth_tokens(id, access_token, refresh_token, expires_at)')
      .eq('status', 'connected')
      .in('provider', ['gsc', 'ga4', 'google_ads', 'meta_ads']);

    if (workspaceIdParam) {
      query = query.eq('workspace_id', workspaceIdParam);
    }

    const { data: integrations, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    for (const integration of integrations || []) {
      const tokenRow = (integration.oauth_tokens as any)?.[0] || (integration as any).oauth_tokens;
      if (!tokenRow) {
        results.push({ id: integration.id, provider: integration.provider, status: 'no_token' });
        continue;
      }

      // Create sync job for tracking
      const jobId = await createSyncJob(db, integration.workspace_id, integration.provider);

      // Refresh token if expired (Google providers only — Meta uses long-lived tokens)
      let accessToken = tokenRow.access_token;
      if (integration.provider !== 'meta_ads' && tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
        const refreshResult = await withRetry(
          () => refreshAccessToken(tokenRow.refresh_token),
          `${integration.provider} token refresh`,
        );

        if (refreshResult.error || refreshResult.data?.error) {
          const errMsg = refreshResult.error || refreshResult.data?.error_description || 'Token refresh failed';
          await db.from('integrations').update({ status: 'error' }).eq('id', integration.id);
          if (jobId) await completeSyncJob(db, jobId, 'failed', null, errMsg);
          errors.push({ id: integration.id, provider: integration.provider, error: errMsg });
          results.push({ id: integration.id, provider: integration.provider, status: 'token_refresh_failed' });
          continue;
        }

        accessToken = refreshResult.data.access_token;
        await db.from('oauth_tokens').update({
          access_token: refreshResult.data.access_token,
          expires_at: new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString(),
          last_refreshed_at: new Date().toISOString(),
        }).eq('id', tokenRow.id);
      }

      const days = 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      // ── GSC sync ──
      if (integration.provider === 'gsc') {
        const result = await withRetry(async () => {
          const sites = await fetchGSCSites(accessToken);
          if (!sites.length) throw new Error('No GSC sites found');
          const siteUrl = sites[0].siteUrl;
          const rows = await fetchGSCData(accessToken, siteUrl, formatDate(startDate), formatDate(new Date()));

          if (rows.length > 0) {
            await db.from('gsc_data').delete()
              .eq('workspace_id', integration.workspace_id)
              .eq('integration_id', integration.id)
              .gte('date', formatDate(startDate));

            const chunkSize = 500;
            for (let i = 0; i < rows.length; i += chunkSize) {
              await db.from('gsc_data').insert(
                rows.slice(i, i + chunkSize).map(r => ({ workspace_id: integration.workspace_id, integration_id: integration.id, ...r }))
              );
            }
          }
          return { rows: rows.length };
        }, 'GSC sync');

        if (result.error) {
          if (jobId) await completeSyncJob(db, jobId, 'failed', null, result.error);
          errors.push({ id: integration.id, provider: 'gsc', error: result.error, attempts: result.attempts });
          results.push({ id: integration.id, provider: 'gsc', status: 'error', error: result.error });
        } else {
          await db.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);
          if (jobId) await completeSyncJob(db, jobId, 'completed', result.data);
          results.push({ id: integration.id, provider: 'gsc', status: 'synced', ...result.data, attempts: result.attempts });
        }
      }

      // ── GA4 sync ──
      if (integration.provider === 'ga4') {
        const result = await withRetry(async () => {
          const properties = await fetchGA4Properties(accessToken);
          if (!properties.length) throw new Error('No GA4 properties found');
          const propertyId = properties[0].id;

          await db.from('ga4_data').delete()
            .eq('workspace_id', integration.workspace_id)
            .eq('integration_id', integration.id)
            .gte('date', formatDate(startDate));

          let totalRows = 0;
          for (const [, config] of Object.entries(GA4_REPORTS)) {
            const rows = await fetchGA4Data(accessToken, propertyId, formatDate(startDate), formatDate(new Date()), config.metrics, config.dimensions);
            if (rows.length > 0) {
              const chunkSize = 500;
              for (let i = 0; i < rows.length; i += chunkSize) {
                await db.from('ga4_data').insert(
                  rows.slice(i, i + chunkSize).map(r => ({
                    workspace_id: integration.workspace_id,
                    integration_id: integration.id,
                    date: r.date, metric_type: r.metricType,
                    dimension_name: r.dimensionName, dimension_value: r.dimensionValue,
                    value: r.value,
                  }))
                );
              }
              totalRows += rows.length;
            }
          }
          return { rows: totalRows };
        }, 'GA4 sync');

        if (result.error) {
          if (jobId) await completeSyncJob(db, jobId, 'failed', null, result.error);
          errors.push({ id: integration.id, provider: 'ga4', error: result.error, attempts: result.attempts });
          results.push({ id: integration.id, provider: 'ga4', status: 'error', error: result.error });
        } else {
          await db.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);
          if (jobId) await completeSyncJob(db, jobId, 'completed', result.data);
          results.push({ id: integration.id, provider: 'ga4', status: 'synced', ...result.data, attempts: result.attempts });
        }
      }

      // ── Google Ads sync ──
      if (integration.provider === 'google_ads') {
        const result = await withRetry(async () => {
          const customerIds = await fetchGoogleAdsAccounts(accessToken);
          if (!customerIds.length) throw new Error('No Google Ads accounts found');
          const customerId = customerIds[0].replace(/-/g, '');
          const campaigns = await fetchGoogleAdsCampaigns(accessToken, customerId);

          await db.from('analytics_data').delete()
            .eq('workspace_id', integration.workspace_id)
            .eq('provider', 'google_ads');

          if (campaigns.length > 0) {
            await db.from('analytics_data').insert({
              workspace_id: integration.workspace_id,
              provider: 'google_ads',
              metric_type: 'campaigns',
              data: campaigns,
              date_range_start: formatDate(startDate),
              date_range_end: formatDate(new Date()),
            });
          }

          // Keep customer_id in oauth_meta
          await db.from('integrations').update({
            oauth_meta: { ...(integration.oauth_meta as any || {}), customer_id: customerId },
          }).eq('id', integration.id);

          return { campaigns: campaigns.length, customer_id: customerId };
        }, 'Google Ads sync');

        if (result.error) {
          if (jobId) await completeSyncJob(db, jobId, 'failed', null, result.error);
          errors.push({ id: integration.id, provider: 'google_ads', error: result.error, attempts: result.attempts });
          results.push({ id: integration.id, provider: 'google_ads', status: 'error', error: result.error });
        } else {
          await db.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);
          if (jobId) await completeSyncJob(db, jobId, 'completed', result.data);
          results.push({ id: integration.id, provider: 'google_ads', status: 'synced', ...result.data, attempts: result.attempts });
        }
      }

      // ── Meta Ads sync ──
      if (integration.provider === 'meta_ads') {
        const result = await withRetry(async () => {
          const accounts = await fetchMetaAdAccounts(accessToken);
          if (!accounts.length) throw new Error('No Meta Ad accounts found');
          const adAccountId = accounts[0].id;
          const insights = await fetchMetaInsights(accessToken, adAccountId);

          await db.from('analytics_data').delete()
            .eq('workspace_id', integration.workspace_id)
            .eq('provider', 'meta_ads');

          if (insights.length > 0) {
            await db.from('analytics_data').insert({
              workspace_id: integration.workspace_id,
              provider: 'meta_ads',
              metric_type: 'adsets',
              data: insights,
              date_range_start: formatDate(startDate),
              date_range_end: formatDate(new Date()),
            });
          }

          // Keep ad account info in oauth_meta
          await db.from('integrations').update({
            oauth_meta: { ...(integration.oauth_meta as any || {}), ad_account_id: adAccountId, account_name: accounts[0].name },
          }).eq('id', integration.id);

          return { adsets: insights.length, account: accounts[0].name };
        }, 'Meta Ads sync');

        if (result.error) {
          if (jobId) await completeSyncJob(db, jobId, 'failed', null, result.error);
          errors.push({ id: integration.id, provider: 'meta_ads', error: result.error, attempts: result.attempts });
          results.push({ id: integration.id, provider: 'meta_ads', status: 'error', error: result.error });
        } else {
          await db.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);
          if (jobId) await completeSyncJob(db, jobId, 'completed', result.data);
          results.push({ id: integration.id, provider: 'meta_ads', status: 'synced', ...result.data, attempts: result.attempts });
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter(r => r.status === 'synced').length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
