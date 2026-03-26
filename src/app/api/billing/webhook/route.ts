import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey) {
      return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });

    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // In development without webhook secret, parse the body directly
      event = JSON.parse(body);
    }

    const db = getSupabaseAdmin();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const workspaceId = session.metadata?.workspace_id;
        const plan = session.metadata?.plan;

        if (workspaceId && plan) {
          await db.from('workspaces').update({
            plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          }).eq('id', workspaceId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        // Find workspace by subscription ID and downgrade to free
        const { data: workspace } = await db
          .from('workspaces')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (workspace) {
          await db.from('workspaces').update({
            plan: 'free',
            stripe_subscription_id: null,
          }).eq('id', workspace.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        // Handle plan changes if subscription is still active
        if (subscription.status === 'active') {
          const { data: workspace } = await db
            .from('workspaces')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (workspace) {
            await db.from('workspaces').update({
              plan: subscription.metadata?.plan || 'free',
            }).eq('id', workspace.id);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
