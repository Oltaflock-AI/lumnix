// Google Ads connector — uses Google Ads API v23
// Requires: Google Ads API enabled + developer token

async function safeParse(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Google Ads API returned non-JSON response (status ${res.status}): ${text.substring(0, 200)}`);
  }
}

export async function fetchGoogleAdsCampaigns(
  accessToken: string,
  customerId: string
) {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
  if (!devToken) throw new Error('Google Ads developer token not configured');

  // Strip dashes from customer ID
  const cleanId = customerId.replace(/-/g, '');

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
      AND metrics.cost_micros > 0
    ORDER BY segments.date DESC
  `;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'developer-token': devToken,
  };

  // Don't set login-customer-id for direct accounts — only needed for MCC

  const res = await fetch(
    `https://googleads.googleapis.com/v23/customers/${cleanId}/googleAds:search`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    }
  );

  const data = await safeParse(res);

  if (!res.ok) {
    // Extract the most useful error message
    const details = data?.error?.details;
    let errMsg = data?.error?.message || '';
    if (details?.length) {
      for (const d of details) {
        if (d.errors?.length) {
          errMsg = d.errors[0].message || errMsg;
        }
      }
    }
    throw new Error(`Google Ads API error: ${errMsg || JSON.stringify(data).substring(0, 300)}`);
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
    'https://googleads.googleapis.com/v23/customers:listAccessibleCustomers',
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

  return (data.resourceNames || []).map((r: string) => r.replace('customers/', '').replace(/-/g, ''));
}
