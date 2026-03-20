import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGSCData, fetchGSCSites } from '@/lib/connectors/gsc';
import { fetchGA4Data, fetchGA4Properties, GA4_REPORTS } from '@/lib/connectors/ga4';
import { refreshAccessToken } from '@/lib/google-oauth';

// GET /api/cron/sync — called by Vercel Cron every 24h
// Also callable manually: GET /api/cron/sync?workspace_id=xxx
export async function GET(req: NextRequest) {
  // Verify cron secret or allow manual trigger
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'lumnix-cron-2026';
  const workspaceIdParam = req.nextUrl.searchParams.get('workspace_id');

  if (authHeader !== `Bearer ${cronSecret}` && !workspaceIdParam) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const results: any[] = [];

  try {
    // Get all active integrations (or just for specific workspace)
    let query = db.from('integrations')
      .select('id, workspace_id, provider, status, oauth_tokens(id, access_token, refresh_token, expires_at)')
      .eq('status', 'connected')
      .in('provider', ['gsc', 'ga4']);

    if (workspaceIdParam) {
      query = query.eq('workspace_id', workspaceIdParam);
    }

    const { data: integrations, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    for (const integration of integrations || []) {
      const tokenRow = (integration.oauth_tokens as any)?.[0] || (integration as any).oauth_tokens;
      if (!tokenRow) { results.push({ id: integration.id, provider: integration.provider, status: 'no_token' }); continue; }

      // Refresh token if expired
      let accessToken = tokenRow.access_token;
      if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
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
      }

      const days = 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

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
        }
      }

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
        }
      }
    }

    return NextResponse.json({ success: true, synced: results.length, results, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
