import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchGoogleAdsCampaigns, fetchGoogleAdsAccounts } from '@/lib/connectors/google-ads';
import { refreshAccessToken } from '@/lib/google-oauth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const { integration_id, workspace_id } = await req.json();

    const rateLimited = rateLimit(`sync:gads:${workspace_id}`, 5, 60 * 1000);
    if (rateLimited) return rateLimited;

    const { data: tokenRow } = await getSupabaseAdmin()
      .from('oauth_tokens')
      .select('*')
      .eq('integration_id', integration_id)
      .single();

    if (!tokenRow) return NextResponse.json({ error: 'No tokens found' }, { status: 404 });

    let accessToken = tokenRow.access_token;
    // Always try to refresh if we have a refresh token (token might be expired even if expires_at is wrong)
    if (tokenRow.refresh_token) {
      try {
        const refreshed = await refreshAccessToken(tokenRow.refresh_token);
        if (refreshed.access_token) {
          accessToken = refreshed.access_token;
          await getSupabaseAdmin().from('oauth_tokens').update({
            access_token: refreshed.access_token,
            expires_at: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(),
          }).eq('id', tokenRow.id);
        }
      } catch {
        // If refresh fails, try with existing token — it might still work
      }
    }
    if (!accessToken) {
      return NextResponse.json({ error: 'Google Ads token expired. Please reconnect in Settings → Integrations.' }, { status: 401 });
    }

    // Get customer accounts
    const customerIds = await fetchGoogleAdsAccounts(accessToken);
    if (!customerIds.length) {
      return NextResponse.json({ error: 'No Google Ads accounts found. Make sure you have access to a Google Ads account.' }, { status: 404 });
    }

    const customerId = customerIds[0].replace(/-/g, '');
    const campaigns = await fetchGoogleAdsCampaigns(accessToken, customerId);

    const db = getSupabaseAdmin();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    // Delete existing data for this workspace in the date range
    await db.from('google_ads_data')
      .delete()
      .eq('workspace_id', workspace_id)
      .gte('date', startDate)
      .lte('date', endDate);

    // Insert into dedicated google_ads_data table
    if (campaigns.length > 0) {
      const rows = campaigns.map(c => ({
        workspace_id,
        integration_id,
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
        date: c.date || endDate,
      }));

      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        await db.from('google_ads_data').insert(rows.slice(i, i + chunkSize));
      }
    }

    // Also keep analytics_data for backward compat
    await db.from('analytics_data').delete()
      .eq('workspace_id', workspace_id)
      .eq('provider', 'google_ads');

    if (campaigns.length > 0) {
      await db.from('analytics_data').insert({
        workspace_id,
        provider: 'google_ads',
        metric_type: 'campaigns',
        data: campaigns,
        date_range_start: startDate,
        date_range_end: endDate,
      });
    }

    await db.from('integrations').update({
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      oauth_meta: { customer_id: customerId },
    }).eq('id', integration_id);

    return NextResponse.json({ success: true, campaigns_synced: campaigns.length, customer_id: customerId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
