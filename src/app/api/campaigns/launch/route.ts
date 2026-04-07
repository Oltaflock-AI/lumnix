import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// POST /api/campaigns/launch — launch a draft campaign to Meta or Google
export async function POST(req: NextRequest) {
  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: campaign, error } = await db
      .from('campaigns_managed')
      .select('*, workspaces(id)')
      .eq('id', campaign_id)
      .single();

    if (error || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    // Get OAuth tokens for the platform
    const { data: integration } = await db
      .from('integrations')
      .select('id, oauth_tokens(access_token)')
      .eq('workspace_id', campaign.workspace_id)
      .eq('provider', campaign.platform)
      .eq('status', 'connected')
      .single();

    if (!integration) {
      await db.from('campaigns_managed').update({ status: 'error', error_message: `${campaign.platform} not connected` }).eq('id', campaign_id);
      return NextResponse.json({ error: `${campaign.platform} integration not connected` }, { status: 400 });
    }

    const tokenRow = (integration.oauth_tokens as any)?.[0] || (integration as any).oauth_tokens;
    const accessToken = tokenRow?.access_token;
    if (!accessToken) {
      await db.from('campaigns_managed').update({ status: 'error', error_message: 'No access token' }).eq('id', campaign_id);
      return NextResponse.json({ error: 'No access token found' }, { status: 400 });
    }

    await db.from('campaigns_managed').update({ status: 'pending' }).eq('id', campaign_id);

    let platformResponse: any = null;
    let platformCampaignId: string | null = null;

    try {
      if (campaign.platform === 'meta_ads') {
        platformResponse = await launchMetaCampaign(accessToken, campaign);
        platformCampaignId = platformResponse?.id || null;
      } else if (campaign.platform === 'google_ads') {
        platformResponse = await launchGoogleAdsCampaign(accessToken, campaign);
        platformCampaignId = platformResponse?.id || null;
      } else {
        throw new Error(`Unsupported platform: ${campaign.platform}`);
      }

      await db.from('campaigns_managed').update({
        status: 'active',
        platform_campaign_id: platformCampaignId,
        platform_response: platformResponse,
        launched_at: new Date().toISOString(),
        error_message: null,
      }).eq('id', campaign_id);

      return NextResponse.json({ success: true, platform_campaign_id: platformCampaignId, response: platformResponse });
    } catch (launchError: any) {
      await db.from('campaigns_managed').update({
        status: 'error',
        error_message: launchError.message,
        platform_response: platformResponse,
      }).eq('id', campaign_id);
      return NextResponse.json({ error: launchError.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Meta Ads Campaign Creation ──
async function launchMetaCampaign(accessToken: string, campaign: any) {
  // Get ad account
  const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&access_token=${accessToken}`);
  const accounts = await accountsRes.json();
  const adAccountId = accounts.data?.[0]?.id;
  if (!adAccountId) throw new Error('No Meta ad account found');

  // 1. Create campaign
  const campaignRes = await fetch(`https://graph.facebook.com/v19.0/${adAccountId}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: campaign.name,
      objective: campaign.objective || 'OUTCOME_TRAFFIC',
      status: 'PAUSED', // Launch as paused for safety — user activates manually
      special_ad_categories: [],
      access_token: accessToken,
    }),
  });
  const campaignData = await campaignRes.json();
  if (campaignData.error) throw new Error(campaignData.error.message);

  // 2. Create ad set
  const adSetRes = await fetch(`https://graph.facebook.com/v19.0/${adAccountId}/adsets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${campaign.name} - Ad Set`,
      campaign_id: campaignData.id,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
      daily_budget: Math.round((campaign.budget_amount || 10) * 100), // in cents
      targeting: campaign.targeting?.geo_locations
        ? campaign.targeting
        : { geo_locations: { countries: ['US'] }, age_min: 18 },
      status: 'PAUSED',
      access_token: accessToken,
    }),
  });
  const adSetData = await adSetRes.json();
  if (adSetData.error) throw new Error(adSetData.error.message);

  // 3. Create ad with creative
  const adCopy = campaign.ad_copy || campaign.name;
  const creativeRes = await fetch(`https://graph.facebook.com/v19.0/${adAccountId}/adcreatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${campaign.name} - Creative`,
      object_story_spec: {
        link_data: {
          message: adCopy,
          link: 'https://example.com', // User should set this
          call_to_action: { type: 'LEARN_MORE' },
        },
        page_id: campaign.targeting?.page_id || undefined,
      },
      access_token: accessToken,
    }),
  });
  const creativeData = await creativeRes.json();

  return {
    id: campaignData.id,
    campaign: campaignData,
    ad_set: adSetData,
    creative: creativeData,
    status: 'PAUSED',
    note: 'Campaign created as PAUSED. Activate it in Meta Ads Manager when ready.',
  };
}

// ── Google Ads Campaign Creation ──
async function launchGoogleAdsCampaign(accessToken: string, campaign: any) {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not configured');

  // Get customer ID
  const customersRes = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
    headers: { Authorization: `Bearer ${accessToken}`, 'developer-token': devToken },
  });
  const customers = await customersRes.json();
  const customerId = (customers.resourceNames || [])[0]?.replace('customers/', '')?.replace(/-/g, '');
  if (!customerId) throw new Error('No Google Ads customer account found');

  // Create campaign via mutate
  const budgetMutate = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/campaignBudgets:mutate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operations: [{
        create: {
          name: `${campaign.name} Budget`,
          amountMicros: Math.round((campaign.budget_amount || 10) * 1_000_000).toString(),
          deliveryMethod: 'STANDARD',
        },
      }],
    }),
  });
  const budgetData = await budgetMutate.json();
  if (budgetData.error) throw new Error(budgetData.error.message || 'Budget creation failed');
  const budgetResourceName = budgetData.results?.[0]?.resourceName;

  const campaignMutate = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/campaigns:mutate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operations: [{
        create: {
          name: campaign.name,
          advertisingChannelType: 'SEARCH',
          status: 'PAUSED',
          campaignBudget: budgetResourceName,
          startDate: campaign.start_date?.replace(/-/g, '') || undefined,
          endDate: campaign.end_date?.replace(/-/g, '') || undefined,
        },
      }],
    }),
  });
  const campaignData = await campaignMutate.json();
  if (campaignData.error) throw new Error(campaignData.error.message || 'Campaign creation failed');

  return {
    id: campaignData.results?.[0]?.resourceName,
    campaign: campaignData,
    budget: budgetData,
    status: 'PAUSED',
    note: 'Campaign created as PAUSED. Add ad groups and ads in Google Ads, then activate.',
  };
}
