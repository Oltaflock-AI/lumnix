import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGSCData, fetchGSCSites } from '@/lib/connectors/gsc';
import { fetchGA4Data, fetchGA4Properties, GA4_REPORTS } from '@/lib/connectors/ga4';
import { fetchGoogleAdsCampaigns, fetchGoogleAdsAccounts } from '@/lib/connectors/google-ads';
import { fetchMetaAdAccounts, fetchMetaInsights } from '@/lib/connectors/meta-ads';
import { refreshAccessToken } from '@/lib/google-oauth';

// GET /api/cron/sync — called by Vercel Cron every 24h
// Also callable manually: GET /api/cron/sync?workspace_id=xxx
export async function GET(req: NextRequest) {
  // Verify cron secret or allow manual trigger
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const workspaceIdParam = req.nextUrl.searchParams.get('workspace_id');

  if (authHeader !== `Bearer ${cronSecret}` && !workspaceIdParam) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const results: any[] = [];
  const errors: any[] = [];

  try {
    // Get all active integrations (or just for specific workspace)
    let query = db.from('integrations')
      .select('id, workspace_id, provider, status, oauth_tokens(id, access_token, refresh_token, expires_at)')
      .eq('status', 'connected')
      .in('provider', ['gsc', 'ga4', 'google_ads', 'meta_ads']);

    if (workspaceIdParam) {
      query = query.eq('workspace_id', workspaceIdParam);
    }

    const { data: integrations, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    for (const integration of integrations || []) {
      const tokenRow = (integration.oauth_tokens as any)?.[0] || (integration as any).oauth_tokens;
      if (!tokenRow) { results.push({ id: integration.id, provider: integration.provider, status: 'no_token' }); continue; }

      // Refresh token if expired (Google integrations only)
      let accessToken = tokenRow.access_token;
      if (['gsc', 'ga4', 'google_ads'].includes(integration.provider)) {
        if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
          try {
            const refreshed = await refreshAccessToken(tokenRow.refresh_token);
            if (refreshed.error) {
              await db.from('integrations').update({ status: 'error' }).eq('id', integration.id);
              results.push({ id: integration.id, provider: integration.provider, status: 'token_refresh_failed' });
              errors.push({ provider: integration.provider, workspace_id: integration.workspace_id, error: 'Token refresh failed' });
              continue;
            }
            accessToken = refreshed.access_token;
            await db.from('oauth_tokens').update({
              access_token: refreshed.access_token,
              expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
              last_refreshed_at: new Date().toISOString(),
            }).eq('id', tokenRow.id);
          } catch (e: any) {
            errors.push({ provider: integration.provider, workspace_id: integration.workspace_id, error: e.message });
            continue;
          }
        }
      }

      const days = 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      // --- GSC ---
      if (integration.provider === 'gsc') {
        try {
          const sites = await fetchGSCSites(accessToken);
          if (!sites.length) { results.push({ id: integration.id, provider: 'gsc', status: 'no_sites' }); continue; }
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

          await db.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);
          results.push({ id: integration.id, provider: 'gsc', status: 'synced', rows: rows.length });
        } catch (e: any) {
          results.push({ id: integration.id, provider: 'gsc', status: 'error', error: e.message });
          errors.push({ provider: 'gsc', workspace_id: integration.workspace_id, error: e.message });
        }
      }

      // --- GA4 ---
      if (integration.provider === 'ga4') {
        try {
          const properties = await fetchGA4Properties(accessToken);
          if (!properties.length) { results.push({ id: integration.id, provider: 'ga4', status: 'no_properties' }); continue; }
          const propertyId = properties[0].id;

          await db.from('ga4_data').delete()
            .eq('workspace_id', integration.workspace_id)
            .eq('integration_id', integration.id)
            .gte('date', formatDate(startDate));

          let totalRows = 0;
          for (const [, config] of Object.entries(GA4_REPORTS)) {
            try {
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
            } catch {}
          }

          await db.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);
          results.push({ id: integration.id, provider: 'ga4', status: 'synced', rows: totalRows });
        } catch (e: any) {
          results.push({ id: integration.id, provider: 'ga4', status: 'error', error: e.message });
          errors.push({ provider: 'ga4', workspace_id: integration.workspace_id, error: e.message });
        }
      }

      // --- Google Ads ---
      if (integration.provider === 'google_ads') {
        try {
          const customerIds = await fetchGoogleAdsAccounts(accessToken);
          if (!customerIds.length) { results.push({ id: integration.id, provider: 'google_ads', status: 'no_accounts' }); continue; }

          const customerId = customerIds[0].replace(/-/g, '');
          const campaigns = await fetchGoogleAdsCampaigns(accessToken, customerId);

          // Store in dedicated table
          await db.from('google_ads_data').delete()
            .eq('workspace_id', integration.workspace_id)
            .gte('date', formatDate(startDate));

          if (campaigns.length > 0) {
            const rows = campaigns.map(c => ({
              workspace_id: integration.workspace_id,
              integration_id: integration.id,
              customer_id: customerId,
              campaign_id: String(c.id || ''),
              campaign_name: c.name,
              status: c.status,
              impressions: c.impressions || 0,
              clicks: c.clicks || 0,
              cost: c.spend || 0,
              conversions: c.conversions || 0,
              conversions_value: c.conversions_value || 0,
              ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
              avg_cpc: c.cpc || 0,
              date: c.date || formatDate(new Date()),
            }));

            const chunkSize = 500;
            for (let i = 0; i < rows.length; i += chunkSize) {
              await db.from('google_ads_data').insert(rows.slice(i, i + chunkSize));
            }
          }

          // Also update analytics_data for backward compat
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

          await db.from('integrations').update({
            last_sync_at: new Date().toISOString(),
            oauth_meta: { customer_id: customerId },
          }).eq('id', integration.id);

          results.push({ id: integration.id, provider: 'google_ads', status: 'synced', rows: campaigns.length });
        } catch (e: any) {
          results.push({ id: integration.id, provider: 'google_ads', status: 'error', error: e.message });
          errors.push({ provider: 'google_ads', workspace_id: integration.workspace_id, error: e.message });
        }
      }

      // --- Meta Ads ---
      if (integration.provider === 'meta_ads') {
        try {
          const accounts = await fetchMetaAdAccounts(accessToken);
          if (!accounts.length) { results.push({ id: integration.id, provider: 'meta_ads', status: 'no_accounts' }); continue; }

          const account = accounts[0];
          const adAccountId = account.id;
          const insights = await fetchMetaInsights(accessToken, adAccountId);

          // Store in dedicated table
          await db.from('meta_ads_data').delete()
            .eq('workspace_id', integration.workspace_id)
            .gte('date', formatDate(startDate));

          if (insights.length > 0) {
            const rows = insights.map((i: any) => ({
              workspace_id: integration.workspace_id,
              integration_id: integration.id,
              account_id: adAccountId,
              campaign_id: '',
              campaign_name: i.campaign_name,
              impressions: i.impressions || 0,
              clicks: i.clicks || 0,
              spend: i.spend || 0,
              reach: i.reach || 0,
              ctr: i.ctr || 0,
              cpc: i.cpc || 0,
              conversions: i.conversions || 0,
              revenue: i.revenue || 0,
              date: i.date_start || formatDate(new Date()),
            }));

            const chunkSize = 500;
            for (let j = 0; j < rows.length; j += chunkSize) {
              await db.from('meta_ads_data').insert(rows.slice(j, j + chunkSize));
            }
          }

          await db.from('integrations').update({
            last_sync_at: new Date().toISOString(),
            oauth_meta: { ad_account_id: adAccountId, account_name: account.name, currency: account.currency || 'USD' },
          }).eq('id', integration.id);

          results.push({ id: integration.id, provider: 'meta_ads', status: 'synced', rows: insights.length });
        } catch (e: any) {
          results.push({ id: integration.id, provider: 'meta_ads', status: 'error', error: e.message });
          errors.push({ provider: 'meta_ads', workspace_id: integration.workspace_id, error: e.message });
        }
      }
    }

    const synced = results.filter(r => r.status === 'synced').length;
    return NextResponse.json({ success: true, synced, errors, results, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
