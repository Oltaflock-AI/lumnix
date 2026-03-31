import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchMetaAdAccounts, fetchMetaCampaigns, fetchMetaInsights } from '@/lib/connectors/meta-ads';

// Meta returns budgets in the smallest currency unit (paise for INR, cents for USD)
function formatBudget(amount: string | undefined, currency: string): string {
  if (!amount) return 'N/A';
  const raw = parseInt(amount);
  if (isNaN(raw)) return 'N/A';
  const val = raw / 100;
  const sym = getCurrencySymbol(currency);
  return `${sym}${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function getCurrencySymbol(currency: string): string {
  const map: Record<string, string> = {
    INR: '\u20B9', // ₹
    USD: '$',
    EUR: '\u20AC', // €
    GBP: '\u00A3', // £
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
  };
  return map[currency?.toUpperCase()] || currency + ' ';
}

function formatSpend(spend: number, currency: string): string {
  const sym = getCurrencySymbol(currency);
  return `${sym}${spend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export async function POST(req: NextRequest) {
  try {
    const { integration_id, workspace_id, ad_account_id } = await req.json();

    const db = getSupabaseAdmin();

    const { data: tokenRow } = await db
      .from('oauth_tokens')
      .select('*')
      .eq('integration_id', integration_id)
      .single();

    if (!tokenRow) return NextResponse.json({ error: 'No tokens found' }, { status: 404 });

    const accessToken = tokenRow.access_token;

    // Get the integration to check saved ad_account_id
    const { data: integration } = await db
      .from('integrations')
      .select('oauth_meta')
      .eq('id', integration_id)
      .single();

    const accounts = await fetchMetaAdAccounts(accessToken);
    if (!accounts.length) {
      return NextResponse.json({ error: 'No Meta Ad accounts found.' }, { status: 404 });
    }

    // Priority: explicit ad_account_id param > saved in oauth_meta > first account
    const targetAccountId = ad_account_id || integration?.oauth_meta?.ad_account_id || accounts[0].id;
    const account = accounts.find((a: any) => a.id === targetAccountId) || accounts[0];
    const adAccountId = account.id;
    const currency = account.currency || 'USD';

    const insights = await fetchMetaInsights(accessToken, adAccountId);

    // Store in dedicated meta_ads_data table
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    await db.from('meta_ads_data')
      .delete()
      .eq('workspace_id', workspace_id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (insights.length > 0) {
      const rows = insights.map((i: any) => ({
        workspace_id,
        integration_id,
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
        date: i.date_start || endDate,
      }));

      const chunkSize = 500;
      for (let j = 0; j < rows.length; j += chunkSize) {
        await db.from('meta_ads_data').insert(rows.slice(j, j + chunkSize));
      }
    }

    // Also keep analytics_data for backward compat
    await db.from('analytics_data').delete()
      .eq('workspace_id', workspace_id)
      .eq('provider', 'meta_ads');

    const campaignsRaw = await fetchMetaCampaigns(accessToken, adAccountId);

    const campaigns = campaignsRaw.map((c: any) => {
      const campInsights = insights.filter((i: any) => i.campaign_name === c.name);
      const totalSpend = campInsights.reduce((s: number, i: any) => s + i.spend, 0);
      const totalClicks = campInsights.reduce((s: number, i: any) => s + i.clicks, 0);
      const totalImpressions = campInsights.reduce((s: number, i: any) => s + i.impressions, 0);
      const totalRevenue = campInsights.reduce((s: number, i: any) => s + i.revenue, 0);
      const avgCTR = campInsights.length > 0
        ? campInsights.reduce((s: number, i: any) => s + i.ctr, 0) / campInsights.length : 0;
      const sym = getCurrencySymbol(currency);

      return {
        name: c.name,
        status: c.status,
        objective: c.objective,
        currency,
        budget: c.daily_budget
          ? `${formatBudget(c.daily_budget, currency)}/day`
          : c.lifetime_budget
          ? `${formatBudget(c.lifetime_budget, currency)} lifetime`
          : 'N/A',
        spend: formatSpend(totalSpend, currency),
        impressions: totalImpressions.toLocaleString('en-IN'),
        clicks: totalClicks.toLocaleString('en-IN'),
        ctr: avgCTR > 0 ? avgCTR.toFixed(2) + '%' : '0%',
        roas: totalSpend > 0 && totalRevenue > 0 ? (totalRevenue / totalSpend).toFixed(1) + 'x' : '-',
        cpc: totalClicks > 0 ? `${sym}${(totalSpend / totalClicks).toFixed(2)}` : '-',
      };
    });

    if (campaigns.length > 0 || insights.length > 0) {
      await db.from('analytics_data').insert({
        workspace_id,
        provider: 'meta_ads',
        metric_type: 'campaigns',
        data: campaigns.length > 0 ? campaigns : insights,
        date_range_start: startDate,
        date_range_end: endDate,
        synced_at: new Date().toISOString(),
      });
    }

    await db.from('integrations').update({
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      oauth_meta: { ad_account_id: adAccountId, account_name: account.name, currency },
    }).eq('id', integration_id);

    return NextResponse.json({ success: true, campaigns_synced: campaigns.length, account: account.name, currency });
  } catch (error: any) {
    const msg = error.message || 'Sync failed';
    if (msg.includes('OAuthException') || msg.includes('permission') || msg.includes('token') || msg.includes('Session has expired') || msg.includes('Error validating access token')) {
      return NextResponse.json({ error: 'Meta token expired or missing permissions. Please reconnect Meta Ads in Settings.' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
