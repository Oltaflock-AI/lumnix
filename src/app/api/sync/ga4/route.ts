import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGA4Data, fetchGA4Properties, GA4_REPORTS } from '@/lib/connectors/ga4';
import { refreshAccessToken } from '@/lib/google-oauth';
import { rateLimit } from '@/lib/rate-limit';
import { verifyIntegrationInWorkspace } from '@/lib/auth-guard';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000];

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

// POST /api/sync/ga4
// Body: { integration_id, workspace_id, days?: number }
export async function POST(req: NextRequest) {
  try {
    const { integration_id, workspace_id, days = 30 } = await req.json();

    const rateLimited = rateLimit(`sync:ga4:${workspace_id}`, 5, 60 * 1000);
    if (rateLimited) return rateLimited;

    // Block cross-workspace integration exfil. Without this, a caller could
    // pair their workspace_id with another workspace's integration_id and
    // sync the other workspace's GA4 data via their token.
    const integrationCheck = await verifyIntegrationInWorkspace(integration_id, workspace_id);
    if (integrationCheck) return integrationCheck;

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
        console.error('GA4 token refresh error:', err);
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

    // Get properties (with retry)
    const properties = await withRetry(() => fetchGA4Properties(accessToken), 'GA4 fetchProperties');
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

    // Fetch each report type (with retry per report)
    for (const [reportName, config] of Object.entries(GA4_REPORTS)) {
      try {
        const rows = await withRetry(
          () => fetchGA4Data(
            accessToken,
            propertyId,
            formatDate(startDate),
            formatDate(endDate),
            config.metrics,
            config.dimensions
          ),
          `GA4 report ${reportName}`,
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
        console.error(`GA4 report ${reportName} failed after retries:`, err);
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
  } catch (error: any) {
    console.error('GA4 sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
