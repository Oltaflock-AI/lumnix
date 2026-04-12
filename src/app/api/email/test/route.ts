import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { ConnectSourcesEmail } from '@/emails/connect-sources'
import { FirstInsightEmail } from '@/emails/first-insight'
import { FeatureSpotlightEmail } from '@/emails/feature-spotlight'
import { CheckinEmail } from '@/emails/checkin'

// POST /api/email/test — send all onboarding emails for testing
// DELETE THIS ROUTE BEFORE PRODUCTION
export async function POST(req: NextRequest) {
  const { email, name, type } = await req.json()
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const resend = new Resend(resendKey)
  const fromName = process.env.EMAIL_FROM_NAME || 'Khush from Lumnix'
  const fromEmail = process.env.EMAIL_FROM || 'lumnix@oltaflock.ai'
  const props = { name: name || 'Khush', workspace_id: 'test', user_id: 'test' }

  const emails: Record<string, { subject: string; component: React.ReactElement }> = {
    connect_sources: {
      subject: 'Connect your first data source — takes 2 minutes',
      component: ConnectSourcesEmail(props),
    },
    first_insight_no_data: {
      subject: 'Your Lumnix data is ready — here\'s what we found',
      component: FirstInsightEmail({ ...props, hasData: false }),
    },
    first_insight_with_data: {
      subject: 'Your Lumnix data is ready — here\'s what we found',
      component: FirstInsightEmail({
        ...props, hasData: true, topKeyword: 'soya mini chunks',
        topPosition: 4, totalClicks: 342, totalSessions: 1850,
      }),
    },
    feature_spotlight: {
      subject: 'Two features most Lumnix users miss in week one',
      component: FeatureSpotlightEmail(props),
    },
    checkin: {
      subject: 'Quick check-in — is Lumnix working for you?',
      component: CheckinEmail(props),
    },
  }

  const toSend = type ? { [type]: emails[type] } : emails
  const results: Record<string, string> = {}

  for (const [key, { subject, component }] of Object.entries(toSend)) {
    if (!component) { results[key] = 'unknown type'; continue }
    try {
      const res = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject: `[TEST] ${subject}`,
        react: component,
      })
      results[key] = `sent: ${res.data?.id}`
    } catch (err: any) {
      results[key] = `failed: ${err.message}`
    }
  }

  return NextResponse.json({ results })
}
