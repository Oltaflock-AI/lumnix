import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { WelcomeEmail } from '@/emails/welcome'
import { rateLimit } from '@/lib/rate-limit'

// POST /api/email/welcome — schedule onboarding email sequence for the caller.
// Client-supplied user_id / email / workspace_id are NOT trusted — previously
// any authed user could schedule a sequence for another user_id and poison
// their email_sequences rows, or blast welcome mail to arbitrary addresses.
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(`email-welcome:${user.id}`, 1, 24 * 60 * 60 * 1000)
    if (limited) return limited

    const user_id = user.id
    const email = user.email
    const { workspace_id: bodyWorkspaceId } = await req.json().catch(() => ({}))
    const name = (user.user_metadata?.full_name || user.user_metadata?.name || '') as string

    // Only accept a workspace_id that this user actually belongs to.
    let workspace_id: string | null = null
    if (typeof bodyWorkspaceId === 'string' && /^[0-9a-f-]{36}$/i.test(bodyWorkspaceId)) {
      const adminDb = getSupabaseAdmin()
      const { data: member } = await adminDb
        .from('workspace_members')
        .select('workspace_id')
        .eq('workspace_id', bodyWorkspaceId)
        .eq('user_id', user_id)
        .maybeSingle()
      if (member) workspace_id = bodyWorkspaceId
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
    }

    const resend = new Resend(resendKey)
    const db = getSupabaseAdmin()
    const now = new Date()
    const fromName = process.env.EMAIL_FROM_NAME || 'Khush from Lumnix'
    const fromEmail = process.env.EMAIL_FROM || 'lumnix@oltaflock.ai'

    // Schedule all 5 emails in the sequence
    const schedule = [
      { type: 'welcome', delay: 0 },
      { type: 'connect_sources', delay: 24 * 60 * 60 * 1000 },
      { type: 'first_insight', delay: 48 * 60 * 60 * 1000 },
      { type: 'feature_spotlight', delay: 5 * 24 * 60 * 60 * 1000 },
      { type: 'checkin', delay: 7 * 24 * 60 * 60 * 1000 },
    ]

    for (const item of schedule) {
      await db.from('email_sequences').insert({
        user_id,
        workspace_id: workspace_id || null,
        email_type: item.type,
        status: 'pending',
        scheduled_for: new Date(now.getTime() + item.delay).toISOString(),
      })
    }

    // Send welcome email immediately
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Welcome to Lumnix — your marketing intelligence is ready',
      react: WelcomeEmail({ name: name || 'there', workspace_id: workspace_id || '', user_id }),
    })

    // Mark welcome as sent
    await db
      .from('email_sequences')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('email_type', 'welcome')

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[email/welcome] Error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
