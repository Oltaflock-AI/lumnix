import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchMetaAdAccounts, fetchMetaCampaigns, fetchMetaInsights } from '@/lib/connectors/meta-ads';

export async function POST(req: NextRequest) {
  try {
    const { integration_id, workspace_id } = await req.json();

    const { data: tokenRow } = await getSupabaseAdmin()
      .from('oauth_tokens')
      .select('*')
      .eq('integration_id', integration_id)
      .single();

    if (!tokenRow) return NextResponse.json({ error: 'No tokens found' }, { status: 404 });

    const accessToken = tokenRow.access_token;

    const accounts = await fetchMetaAdAccounts(accessToken);
    if (!accounts.length) {
      return NextResponse.json({ error: 'No Meta Ad accounts found.' }, { status: 404 });
    }

    const adAccountId = accounts[0].id;
    const insights = await fetchMetaInsights(accessToken, adAccountId);

    await getSupabaseAdmin().from('analytics_data').delete()
      .eq('workspace_id', workspace_id)
      .eq('provider', 'meta_ads');

    // Also fetch campaigns
    const campaignsRaw = await fetchMetaCampaigns(accessToken, adAccountId);
    const campaigns = campaignsRaw.map((c: any) => ({
      name: c.name,
      status: c.status,
      objective: c.objective,
      budget: c.daily_budget ? `$${(parseInt(c.daily_budget) / 100).toFixed(0)}/day` : c.lifetime_budget ? `$${(parseInt(c.lifetime_budget) / 100).toFixed(0)} lifetime` : 'N/A',
      // merge insights for this campaign
      spend: '$' + (insights.filter((i: any) => i.campaign_name === c.name).reduce((s: number, i: any) => s + i.spend, 0)).toFixed(0),
      impressions: insights.filter((i: any) => i.campaign_name === c.name).reduce((s: number, i: any) => s + i.impressions, 0).toLocaleString(),
      clicks: insights.filter((i: any) => i.campaign_name === c.name).reduce((s: number, i: any) => s + i.clicks, 0).toLocaleString(),
      ctr: insights.filter((i: any) => i.campaign_name === c.name).length > 0
        ? (insights.filter((i: any) => i.campaign_name === c.name).reduce((s: number, i: any) => s + i.ctr, 0) / insights.filter((i: any) => i.campaign_name === c.name).length).toFixed(2) + '%'
        : '0%',
      roas: (() => {
        const spend = insights.filter((i: any) => i.campaign_name === c.name).reduce((s: number, i: any) => s + i.spend, 0);
        const rev = insights.filter((i: any) => i.campaign_name === c.name).reduce((s: number, i: any) => s + i.revenue, 0);
        return spend > 0 && rev > 0 ? (rev / spend).toFixed(1) + 'x' : '—';
      })(),
      cpc: (() => {
        const clicks = insights.filter((i: any) => i.campaign_name === c.name).reduce((s: number, i: any) => s + i.clicks, 0);
        const spend = insights.filter((i: any) => i.campaign_name === c.name).reduce((s: number, i: any) => s + i.spend, 0);
        return clicks > 0 ? '$' + (spend / clicks).toFixed(2) : '—';
      })(),
    }));

    if (campaigns.length > 0 || insights.length > 0) {
      await getSupabaseAdmin().from('analytics_data').insert({
        workspace_id,
        provider: 'meta_ads',
        metric_type: 'campaigns',
        data: campaigns.length > 0 ? campaigns : insights,
        date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_range_end: new Date().toISOString().split('T')[0],
        synced_at: new Date().toISOString(),
      });
    }

    await getSupabaseAdmin().from('integrations').update({
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      oauth_meta: { ad_account_id: adAccountId, account_name: accounts[0].name },
    }).eq('id', integration_id);

    return NextResponse.json({ success: true, adsets_synced: insights.length, account: accounts[0].name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
