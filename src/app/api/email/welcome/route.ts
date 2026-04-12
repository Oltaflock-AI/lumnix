import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { WelcomeEmail } from '@/emails/welcome'

// POST /api/email/welcome — trigger full onboarding sequence on signup
export async function POST(req: NextRequest) {
  try {
    const { user_id, email, name, workspace_id } = await req.json()
    if (!user_id || !email) {
      return NextResponse.json({ error: 'user_id and email required' }, { status: 400 })
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
