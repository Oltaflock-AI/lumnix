import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchMetaAdAccounts, fetchMetaCampaigns, fetchMetaInsights } from '@/lib/connectors/meta-ads';
import { rateLimit } from '@/lib/rate-limit';
import { verifyIntegrationInWorkspace } from '@/lib/auth-guard';

// Lumnix is India-first — all money is persisted and displayed in INR,
// regardless of the raw account currency returned by Meta.
const INR_SYMBOL = '\u20B9';

// Meta returns budgets in the smallest currency unit (paise for INR, cents for USD).
// We normalize everything to INR symbol — the numeric value itself is whatever
// the ad account reports (we display it as ₹ without FX conversion).
function formatBudget(amount: string | undefined): string {
  if (!amount) return 'N/A';
  const raw = parseInt(amount);
  if (isNaN(raw)) return 'N/A';
  const val = raw / 100;
  return `${INR_SYMBOL}${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatSpend(spend: number): string {
  return `${INR_SYMBOL}${spend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

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

export async function POST(req: NextRequest) {
  try {
    const { integration_id, workspace_id, ad_account_id } = await req.json();

    const rateLimited = rateLimit(`sync:meta:${workspace_id}`, 5, 60 * 1000);
    if (rateLimited) return rateLimited;

    // Block cross-workspace exfil via a stolen integration_id.
    const integrationCheck = await verifyIntegrationInWorkspace(integration_id, workspace_id);
    if (integrationCheck) return integrationCheck;

    const db = getSupabaseAdmin();

    const { data: tokenRow } = await db
      .from('oauth_tokens')
      .select('*')
      .eq('integration_id', integration_id)
      .single();

    if (!tokenRow) return NextResponse.json({ error: 'No tokens found' }, { status: 404 });

    // Check if Meta token is expired or expiring within 5 minutes
    // Meta uses long-lived tokens (60 days) — if expired, user must reconnect
    let accessToken = tokenRow.access_token;
    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now() + FIVE_MINUTES_MS) {
      console.error('Meta Ads token expired or expiring soon for integration:', integration_id);
      await db.from('integrations').update({ status: 'error' }).eq('id', integration_id);
      await db.from('sync_jobs').insert({
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

    // Get the integration to check saved ad_account_id
    const { data: integration } = await db
      .from('integrations')
      .select('oauth_meta')
      .eq('id', integration_id)
      .single();

    const accounts = await withRetry(() => fetchMetaAdAccounts(accessToken), 'Meta fetchAdAccounts');
    if (!accounts.length) {
      return NextResponse.json({ error: 'No Meta Ad accounts found.' }, { status: 404 });
    }

    // Priority: explicit ad_account_id param > saved in oauth_meta > first account
    const targetAccountId = ad_account_id || integration?.oauth_meta?.ad_account_id || accounts[0].id;
    const account = accounts.find((a: any) => a.id === targetAccountId) || accounts[0];
    const adAccountId = account.id;
    // Lumnix displays everything in INR — we don't honor the raw account currency
    const currency = 'INR';

    const insights = await withRetry(() => fetchMetaInsights(accessToken, adAccountId), 'Meta fetchInsights');

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

    const campaignsRaw = await withRetry(() => fetchMetaCampaigns(accessToken, adAccountId), 'Meta fetchCampaigns');

    const campaigns = campaignsRaw.map((c: any) => {
      const campInsights = insights.filter((i: any) => i.campaign_name === c.name);
      const totalSpend = campInsights.reduce((s: number, i: any) => s + i.spend, 0);
      const totalClicks = campInsights.reduce((s: number, i: any) => s + i.clicks, 0);
      const totalImpressions = campInsights.reduce((s: number, i: any) => s + i.impressions, 0);
      const totalRevenue = campInsights.reduce((s: number, i: any) => s + i.revenue, 0);
      const avgCTR = campInsights.length > 0
        ? campInsights.reduce((s: number, i: any) => s + i.ctr, 0) / campInsights.length : 0;

      return {
        name: c.name,
        status: c.status,
        objective: c.objective,
        currency: 'INR',
        budget: c.daily_budget
          ? `${formatBudget(c.daily_budget)}/day`
          : c.lifetime_budget
          ? `${formatBudget(c.lifetime_budget)} lifetime`
          : 'N/A',
        spend: formatSpend(totalSpend),
        impressions: totalImpressions.toLocaleString('en-IN'),
        clicks: totalClicks.toLocaleString('en-IN'),
        ctr: avgCTR > 0 ? avgCTR.toFixed(2) + '%' : '0%',
        roas: totalSpend > 0 && totalRevenue > 0 ? (totalRevenue / totalSpend).toFixed(1) + 'x' : '-',
        cpc: totalClicks > 0 ? `${INR_SYMBOL}${(totalSpend / totalClicks).toFixed(2)}` : '-',
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
