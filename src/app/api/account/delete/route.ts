import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { confirmation } = await req.json();
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json({ error: 'Please type DELETE MY ACCOUNT to confirm' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Get user's workspaces
    const { data: memberships } = await db
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id);

    const workspaceIds = (memberships || []).map(m => m.workspace_id);

    // Delete all workspace data
    for (const wsId of workspaceIds) {
      // Analytics data
      await db.from('analytics_data').delete().eq('workspace_id', wsId);
      await db.from('meta_ads_data').delete().eq('workspace_id', wsId);
      await db.from('google_ads_data').delete().eq('workspace_id', wsId);

      // Integrations + tokens
      const { data: integrations } = await db.from('integrations').select('id').eq('workspace_id', wsId);
      for (const int of integrations || []) {
        await db.from('oauth_tokens').delete().eq('integration_id', int.id);
      }
      await db.from('integrations').delete().eq('workspace_id', wsId);

      // Competitors
      const { data: competitors } = await db.from('competitor_brands').select('id').eq('workspace_id', wsId);
      for (const comp of competitors || []) {
        await db.from('competitor_ads').delete().eq('competitor_id', comp.id);
        await db.from('ai_analysis').delete().eq('competitor_id', comp.id);
        await db.from('ad_ideas').delete().eq('competitor_id', comp.id);
        await db.from('change_alerts').delete().eq('competitor_id', comp.id);
      }
      await db.from('competitor_brands').delete().eq('workspace_id', wsId);

      // Reports, insights, alerts
      await db.from('reports').delete().eq('workspace_id', wsId);
      await db.from('alert_rules').delete().eq('workspace_id', wsId);
      await db.from('alert_history').delete().eq('workspace_id', wsId);
      await db.from('seo_audits').delete().eq('workspace_id', wsId);
      await db.from('content_ideas').delete().eq('workspace_id', wsId);

      // Team members
      await db.from('workspace_members').delete().eq('workspace_id', wsId);

      // Workspace itself
      await db.from('workspaces').delete().eq('id', wsId);
    }

    // Delete the user from Supabase Auth
    const { error: deleteError } = await db.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
      // Data is already deleted, auth user removal failed
      return NextResponse.json({ success: true, warning: 'Data deleted but auth account removal failed. Contact support.' });
    }

    // Send notification email
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Lumnix <notifications@oltaflock.ai>',
            to: ['admin@oltaflock.ai'],
            subject: `🗑️ Account Deleted: ${user.email}`,
            html: `<p>User <strong>${user.email}</strong> deleted their account and all associated data on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>`,
          }),
        });
      }
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 });
  }
}
