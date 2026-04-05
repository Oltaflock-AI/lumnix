import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGSCData, fetchGSCSites } from '@/lib/connectors/gsc';
import { fetchGA4Data, fetchGA4Properties, GA4_REPORTS } from '@/lib/connectors/ga4';
import { fetchGoogleAdsCampaigns, fetchGoogleAdsAccounts } from '@/lib/connectors/google-ads';
import { fetchMetaAdAccounts, fetchMetaInsights } from '@/lib/connectors/meta-ads';
import { refreshAccessToken } from '@/lib/google-oauth';

// GET /api/cron/sync-all — called by Vercel Cron every 6 hours
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const results: any[] = [];
  const errors: any[] = [];

  try {
    // Get all workspaces with active integrations
    const { data: integrations, error } = await db
      .from('integrations')
      .select('id, workspace_id, provider, status, oauth_tokens(id, access_token, refresh_token, expires_at)')
      .eq('status', 'connected')
      .in('provider', ['gsc', 'ga4', 'google_ads', 'meta_ads']);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    for (const integration of integrations || []) {
      const tokenRow = (integration.oauth_tokens as any)?.[0] || (integration as any).oauth_tokens;
      if (!tokenRow) {
        results.push({ id: integration.id, provider: integration.provider, status: 'no_token' });
        continue;
      }

      // Refresh token if expired (Google integrations)
      let accessToken = tokenRow.access_token;
      if (['gsc', 'ga4', 'google_ads'].includes(integration.provider)) {
        if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
          try {
            const refreshed = await refreshAccessToken(tokenRow.refresh_token);
            if (refreshed.error) {
              await db.from('integrations').update({ status: 'error' }).eq('id', integration.id);
              results.push({ id: integration.id, provider: integration.provider, status: 'token_refresh_failed' });
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
      const now = formatDate(new Date());
      const start = formatDate(startDate);

      // Log sync job start
      const { data: syncJob } = await db.from('sync_jobs').insert({
        workspace_id: integration.workspace_id,
        integration_id: integration.id,
        provider: integration.provider,
        status: 'running',
        started_at: new Date().toISOString(),
      }).select('id').single();

      let syncStatus = 'synced';
      let rowCount = 0;

      try {
        if (integration.provider === 'gsc') {
          const sites = await fetchGSCSites(accessToken);
          if (sites.length > 0) {
            const rows = await fetchGSCData(accessToken, sites[0].siteUrl, start, now);
            if (rows.length > 0) {
              await db.from('gsc_data').delete()
                .eq('workspace_id', integration.workspace_id)
                .eq('integration_id', integration.id)
                .gte('date', start);
              for (let i = 0; i < rows.length; i += 500) {
                await db.from('gsc_data').insert(
                  rows.slice(i, i + 500).map(r => ({ workspace_id: integration.workspace_id, integration_id: integration.id, ...r }))
                );
              }
              rowCount = rows.length;
            }
          }
        }

        if (integration.provider === 'ga4') {
          const properties = await fetchGA4Properties(accessToken);
          if (properties.length > 0) {
            const propertyId = properties[0].id;
            await db.from('ga4_data').delete()
              .eq('workspace_id', integration.workspace_id)
              .eq('integration_id', integration.id)
              .gte('date', start);
            for (const [, config] of Object.entries(GA4_REPORTS)) {
              try {
                const rows = await fetchGA4Data(accessToken, propertyId, start, now, config.metrics, config.dimensions);
                if (rows.length > 0) {
                  for (let i = 0; i < rows.length; i += 500) {
                    await db.from('ga4_data').insert(
                      rows.slice(i, i + 500).map(r => ({
                        workspace_id: integration.workspace_id, integration_id: integration.id,
                        date: r.date, metric_type: r.metricType,
                        dimension_name: r.dimensionName, dimension_value: r.dimensionValue,
                        value: r.value,
                      }))
                    );
                  }
                  rowCount += rows.length;
                }
              } catch {}
            }
          }
        }

        if (integration.provider === 'google_ads') {
          const customerIds = await fetchGoogleAdsAccounts(accessToken);
          if (customerIds.length > 0) {
            const customerId = customerIds[0].replace(/-/g, '');
            const campaigns = await fetchGoogleAdsCampaigns(accessToken, customerId);
            await db.from('google_ads_data').delete()
              .eq('workspace_id', integration.workspace_id)
              .gte('date', start);
            if (campaigns.length > 0) {
              const rows = campaigns.map(c => ({
                workspace_id: integration.workspace_id, integration_id: integration.id,
                customer_id: customerId, campaign_id: String(c.id || ''),
                campaign_name: c.name, status: c.status,
                impressions: c.impressions || 0, clicks: c.clicks || 0,
                cost: c.spend || 0, conversions: c.conversions || 0,
                conversions_value: c.conversions_value || 0,
                ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
                avg_cpc: c.cpc || 0, date: c.date || now,
              }));
              for (let i = 0; i < rows.length; i += 500) {
                await db.from('google_ads_data').insert(rows.slice(i, i + 500));
              }
              rowCount = campaigns.length;
            }
          }
        }

        if (integration.provider === 'meta_ads') {
          const accounts = await fetchMetaAdAccounts(accessToken);
          if (accounts.length > 0) {
            const adAccountId = accounts[0].id;
            const insights = await fetchMetaInsights(accessToken, adAccountId);
            await db.from('meta_ads_data').delete()
              .eq('workspace_id', integration.workspace_id)
              .gte('date', start);
            if (insights.length > 0) {
              const rows = insights.map((i: any) => ({
                workspace_id: integration.workspace_id, integration_id: integration.id,
                account_id: adAccountId, campaign_id: '',
                campaign_name: i.campaign_name, impressions: i.impressions || 0,
                clicks: i.clicks || 0, spend: i.spend || 0,
                reach: i.reach || 0, ctr: i.ctr || 0, cpc: i.cpc || 0,
                conversions: i.conversions || 0, revenue: i.revenue || 0,
                date: i.date_start || now,
              }));
              for (let j = 0; j < rows.length; j += 500) {
                await db.from('meta_ads_data').insert(rows.slice(j, j + 500));
              }
              rowCount = insights.length;
            }
          }
        }

        await db.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);
      } catch (e: any) {
        syncStatus = 'error';
        errors.push({ provider: integration.provider, workspace_id: integration.workspace_id, error: e.message });
      }

      // Update sync job
      if (syncJob?.id) {
        await db.from('sync_jobs').update({
          status: syncStatus,
          completed_at: new Date().toISOString(),
          rows_synced: rowCount,
          error_message: syncStatus === 'error' ? errors[errors.length - 1]?.error : null,
        }).eq('id', syncJob.id);
      }

      results.push({ id: integration.id, provider: integration.provider, status: syncStatus, rows: rowCount });
    }

    const synced = results.filter(r => r.status === 'synced').length;
    return NextResponse.json({ success: true, synced, total: results.length, errors: errors.length, results, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
