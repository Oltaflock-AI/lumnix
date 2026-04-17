// Meta Ads connector — uses Meta Marketing API v19

export async function fetchMetaAdAccounts(accessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`
  );
  const data = await res.json();
  return data.data || [];
}

export async function fetchMetaCampaigns(accessToken: string, adAccountId: string) {
  const fields = 'id,name,status,objective,daily_budget,lifetime_budget';
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=${fields}&date_preset=last_30d&access_token=${accessToken}`
  );
  const data = await res.json();
  return data.data || [];
}

export async function fetchMetaInsights(accessToken: string, adAccountId: string, days: number = 90) {
  const fields = 'campaign_name,adset_name,spend,reach,impressions,clicks,ctr,cpc,cpp,actions,action_values,date_start,date_stop';
  // time_increment=1 splits the response into per-day rows so the dashboard
  // date-range picker can filter meaningfully. Clamp between 7 and 90 days.
  const preset = days >= 90 ? 'last_90d' : days >= 30 ? 'last_30d' : days >= 14 ? 'last_14d' : 'last_7d';
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=${fields}&date_preset=${preset}&time_increment=1&level=adset&limit=500&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return (data.data || []).map((row: any) => {
    const purchases = (row.actions || []).find((a: any) => a.action_type === 'purchase');
    const purchaseValue = (row.action_values || []).find((a: any) => a.action_type === 'purchase');
    const spend = parseFloat(row.spend || '0');
    const revenue = parseFloat(purchaseValue?.value || '0');
    return {
      campaign_name: row.campaign_name,
      adset_name: row.adset_name,
      spend,
      reach: parseInt(row.reach || '0'),
      impressions: parseInt(row.impressions || '0'),
      clicks: parseInt(row.clicks || '0'),
      ctr: parseFloat(row.ctr || '0'),
      cpc: parseFloat(row.cpc || '0'),
      conversions: parseInt(purchases?.value || '0'),
      revenue,
      roas: spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0,
      date_start: row.date_start,
      date_stop: row.date_stop,
    };
  });
}
