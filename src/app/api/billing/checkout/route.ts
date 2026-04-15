import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_growth',
  agency: process.env.STRIPE_PRICE_AGENCY || 'price_agency',
};

const PLAN_PRICES: Record<string, number> = {
  starter: 99,
  growth: 179,
  agency: 299,
};

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 });
    }

    const { plan, workspace_id } = await req.json();

    if (!plan || !workspace_id) {
      return NextResponse.json({ error: 'Missing plan or workspace_id' }, { status: 400 });
    }

    if (!PRICE_IDS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Verify user is owner of this workspace (only owners can change billing)
    const { data: workspace } = await getSupabaseAdmin()
      .from('workspaces')
      .select('id, name, created_by, owner_id')
      .eq('id', workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.owner_id !== userId && workspace.created_by !== userId) {
      return NextResponse.json({ error: 'Only workspace owner can manage billing' }, { status: 403 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?tab=billing&checkout=success`,
      cancel_url: `${appUrl}/dashboard/settings?tab=billing&checkout=cancelled`,
      metadata: {
        workspace_id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
