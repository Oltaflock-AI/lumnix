import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGA4Data, fetchGA4Properties, GA4_REPORTS } from '@/lib/connectors/ga4';
import { refreshAccessToken } from '@/lib/google-oauth';
import { rateLimit } from '@/lib/rate-limit';

// POST /api/sync/ga4
// Body: { integration_id, workspace_id, days?: number }
export async function POST(req: NextRequest) {
  try {
    const { integration_id, workspace_id, days = 30 } = await req.json();

    const rateLimited = rateLimit(`sync:ga4:${workspace_id}`, 5, 60 * 1000);
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

    // Get properties
    const properties = await fetchGA4Properties(accessToken);
    if (!properties.length) {
      await getSupabaseAdmin().from('sync_jobs').update({ status: 'failed', error_message: 'No GA4 properties found', completed_at: new Date().toISOString() }).eq('id', job?.id);
      return NextResponse.json({ error: 'No GA4 properties found' }, { status: 404 });
    }

    const propertyId = properties[0].id;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Delete existing data for date range
    await getSupabaseAdmin().from('ga4_data')
      .delete()
      .eq('workspace_id', workspace_id)
      .eq('integration_id', integration_id)
      .gte('date', formatDate(startDate))
      .lte('date', formatDate(endDate));

    let totalRows = 0;

    // Fetch each report type
    for (const [reportName, config] of Object.entries(GA4_REPORTS)) {
      try {
        const rows = await fetchGA4Data(
          accessToken,
          propertyId,
          formatDate(startDate),
          formatDate(endDate),
          config.metrics,
          config.dimensions
        );

        if (rows.length > 0) {
          const chunkSize = 500;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize).map(r => ({
              workspace_id,
              integration_id,
              date: r.date,
              metric_type: r.metricType,
              dimension_name: r.dimensionName,
              dimension_value: r.dimensionValue,
              value: r.value,
            }));
            await getSupabaseAdmin().from('ga4_data').insert(chunk);
          }
          totalRows += rows.length;
        }
      } catch (err) {
        console.error(`GA4 report ${reportName} failed:`, err);
      }
    }

    // Update job + integration
    await getSupabaseAdmin().from('sync_jobs').update({
      status: 'completed',
      result: { rows_synced: totalRows, property: properties[0].name },
      completed_at: new Date().toISOString(),
    }).eq('id', job?.id);

    await getSupabaseAdmin().from('integrations').update({
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      oauth_meta: { property_id: propertyId, property_name: properties[0].name, properties },
    }).eq('id', integration_id);

    return NextResponse.json({ success: true, rows_synced: totalRows, property: properties[0].name });
  } catch (error) {
    console.error('GA4 sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
