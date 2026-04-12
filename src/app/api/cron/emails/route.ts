import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ConnectSourcesEmail } from '@/emails/connect-sources'
import { FirstInsightEmail } from '@/emails/first-insight'
import { FeatureSpotlightEmail } from '@/emails/feature-spotlight'
import { CheckinEmail } from '@/emails/checkin'

// GET /api/cron/emails — process pending scheduled emails (runs every hour)
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  // Find all pending emails that are due
  const { data: pending, error: fetchError } = await db
    .from('email_sequences')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString())
    .neq('email_type', 'welcome') // welcome is sent immediately, not via cron
    .limit(50)

  if (fetchError) {
    console.error('[cron/emails] Fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  let processed = 0

  for (const record of pending ?? []) {
    try {
      // Check if user has opted out
      const { data: prefs } = await db
        .from('email_preferences')
        .select('opted_out')
        .eq('user_id', record.user_id)
        .single()

      if (prefs?.opted_out) {
        await db.from('email_sequences')
          .update({ status: 'skipped', error_message: 'User opted out' })
          .eq('id', record.id)
        continue
      }

      // Get user email and name from auth
      const { data: { user } } = await db.auth.admin.getUserById(record.user_id)
      if (!user?.email) {
        await db.from('email_sequences')
          .update({ status: 'failed', error_message: 'User not found or no email' })
          .eq('id', record.id)
        continue
      }

      // Verify user actually owns/belongs to this workspace before fetching any data
      let verifiedWorkspaceId: string | null = null
      if (record.workspace_id) {
        const { data: membership } = await db
          .from('workspace_members')
          .select('workspace_id')
          .eq('workspace_id', record.workspace_id)
          .eq('user_id', record.user_id)
          .single()

        verifiedWorkspaceId = membership?.workspace_id ?? null

        if (!verifiedWorkspaceId) {
          console.warn(
            `[cron/emails] User ${record.user_id} is not a member of workspace ${record.workspace_id} — sending email without data`
          )
        }
      }

      const email = user.email
      const name = user.user_metadata?.full_name || user.user_metadata?.name || 'there'
      const props = {
        name,
        workspace_id: verifiedWorkspaceId || '',
        user_id: record.user_id,
      }

      const { subject, component } = await getEmailComponent(record.email_type, props, db)

      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject,
        react: component,
      })

      await db.from('email_sequences')
        .update({ status: 'sent', sent_at: now.toISOString() })
        .eq('id', record.id)

      processed++
    } catch (err: any) {
      console.error(`[cron/emails] Failed to send ${record.email_type} to ${record.user_id}:`, err)
      await db.from('email_sequences')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', record.id)
    }
  }

  return NextResponse.json({ processed })
}

async function getEmailComponent(
  type: string,
  props: { name: string; workspace_id: string; user_id: string },
  db: ReturnType<typeof getSupabaseAdmin>
): Promise<{ subject: string; component: React.ReactElement }> {
  switch (type) {
    case 'connect_sources':
      return {
        subject: 'Connect your first data source — takes 2 minutes',
        component: ConnectSourcesEmail(props),
      }

    case 'first_insight': {
      // Only fetch data if we have a verified workspace_id
      let hasData = false
      let topKeyword: string | undefined
      let topPosition: number | undefined
      let totalClicks: number | undefined
      let totalSessions: number | undefined

      if (props.workspace_id) {
        const { data: gscData } = await db
          .from('gsc_data')
          .select('query, clicks, impressions, position')
          .eq('workspace_id', props.workspace_id)
          .order('clicks', { ascending: false })
          .limit(5)

        const { data: ga4Data } = await db
          .from('ga4_data')
          .select('metric_type, value')
          .eq('workspace_id', props.workspace_id)
          .eq('metric_type', 'sessions')

        if (gscData && gscData.length > 0) {
          hasData = true
          topKeyword = gscData[0].query
          topPosition = Math.round(gscData[0].position)
          totalClicks = gscData.reduce((sum: number, r: any) => sum + (r.clicks || 0), 0)
        }

        totalSessions = ga4Data?.reduce((sum: number, r: any) => sum + (r.value || 0), 0) ?? 0
        if (totalSessions > 0) hasData = true
      }

      return {
        subject: "Your Lumnix data is ready — here's what we found",
        component: FirstInsightEmail({
          ...props,
          hasData,
          topKeyword,
          topPosition,
          totalClicks,
          totalSessions,
        }),
      }
    }

    case 'feature_spotlight':
      return {
        subject: 'Two features most Lumnix users miss in week one',
        component: FeatureSpotlightEmail(props),
      }

    case 'checkin':
      return {
        subject: 'Quick check-in — is Lumnix working for you?',
        component: CheckinEmail(props),
      }

    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}
