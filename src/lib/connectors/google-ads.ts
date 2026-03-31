// Google Ads connector — uses Google Ads API v18
// Requires: Google Ads API enabled + developer token

async function safeParse(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // API returned HTML or non-JSON (e.g. error page)
    throw new Error(`Google Ads API returned non-JSON response (status ${res.status}): ${text.substring(0, 200)}`);
  }
}

export async function fetchGoogleAdsCampaigns(
  accessToken: string,
  customerId: string
) {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
  if (!devToken) throw new Error('Google Ads developer token not configured');

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions,
      metrics.conversions_value,
      metrics.average_cpc,
      segments.date
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `;

  // Use search (not searchStream) for simpler JSON response
  const res = await fetch(
    `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'developer-token': devToken,
        'login-customer-id': customerId,
      },
      body: JSON.stringify({ query, pageSize: 50 }),
    }
  );

  const data = await safeParse(res);

  if (!res.ok) {
    const errMsg = data?.error?.message || data?.error?.details?.[0]?.errors?.[0]?.message || JSON.stringify(data).substring(0, 200);
    throw new Error(`Google Ads API error: ${errMsg}`);
  }

  const campaigns: any[] = [];
  for (const row of data.results || []) {
    campaigns.push({
      id: row.campaign?.id,
      name: row.campaign?.name,
      status: row.campaign?.status,
      spend: (row.metrics?.costMicros || 0) / 1_000_000,
      clicks: row.metrics?.clicks || 0,
      impressions: row.metrics?.impressions || 0,
      conversions: row.metrics?.conversions || 0,
      conversions_value: row.metrics?.conversionsValue || 0,
      cpc: (row.metrics?.averageCpc || 0) / 1_000_000,
      date: row.segments?.date,
    });
  }

  return campaigns;
}

export async function fetchGoogleAdsAccounts(accessToken: string): Promise<string[]> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
  if (!devToken) throw new Error('Google Ads developer token not configured');

  const res = await fetch(
    'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': devToken,
      },
    }
  );

  const data = await safeParse(res);

  if (!res.ok) {
    const errMsg = data?.error?.message || 'Failed to list Google Ads accounts';
    throw new Error(errMsg);
  }

  return (data.resourceNames || []).map((r: string) => r.replace('customers/', ''));
}
