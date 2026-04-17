import { Heading, Text, Section } from '@react-email/components'
import { EmailLayout } from './components/email-layout'
import { CtaButton } from './components/cta-button'

interface FirstInsightEmailProps {
  name: string
  workspace_id?: string
  user_id?: string
  hasData?: boolean
  topKeyword?: string
  topPosition?: number
  totalClicks?: number
  totalSessions?: number
  insightText?: string
}

export function FirstInsightEmail({
  name,
  user_id,
  hasData = false,
  topKeyword,
  topPosition,
  totalClicks,
  totalSessions,
  insightText,
}: FirstInsightEmailProps) {
  const firstName = name?.split(' ')[0] || 'there'
  const dashboardUrl = 'https://lumnix-ai.vercel.app/dashboard'
  const settingsUrl = 'https://lumnix-ai.vercel.app/dashboard/settings?tab=integrations'

  if (!hasData) {
    return (
      <EmailLayout
        previewText="Your dashboard is waiting — one click to connect and start seeing your data"
        userId={user_id}
      >
        <Heading style={{
          fontSize: '28px', fontWeight: '800', color: '#111827',
          letterSpacing: '-0.03em', lineHeight: '1.2', margin: '0 0 14px',
          fontFamily: "'DM Sans', Arial, sans-serif",
        }}>
          Your dashboard is waiting — and so is Lumi
        </Heading>
        <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 24px' }}>
          {"Hey"} {firstName}, we noticed you {"haven't"} connected a data source yet. Once you do, Lumnix will start pulling insights automatically — it takes about 30 seconds.
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
          <CtaButton href={settingsUrl}>{"Sync your data now →"}</CtaButton>
        </Section>

        <Text style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' as const, margin: '0' }}>
          {"It takes about 30 seconds once you've connected."}
        </Text>
      </EmailLayout>
    )
  }

  // Generate insight text based on data
  const insight = insightText || (
    topPosition && topPosition < 5
      ? "You're already ranking on page 1 for key terms. Focus on CTR optimization — small title tag changes can drive big click improvements."
      : (totalSessions && totalSessions > 1000)
        ? "Strong organic traffic. Your paid and organic data are now unified — check cross-channel attribution for the full picture."
        : "Your data pipeline is healthy. Check your dashboard for full insights and AI-powered recommendations."
  )

  const previewText = topKeyword
    ? `Your top keyword is ranking at position ${topPosition} — and Lumi found quick wins`
    : 'Your Lumnix data is ready — check your insights'

  return (
    <EmailLayout previewText={previewText} userId={user_id}>
      <Heading style={{
        fontSize: '28px', fontWeight: '800', color: '#111827',
        letterSpacing: '-0.03em', lineHeight: '1.2', margin: '0 0 14px',
        fontFamily: "'DM Sans', Arial, sans-serif",
      }}>
        {"Your data is in, "}{firstName}{". Here's what Lumi found."}
      </Heading>

      {topKeyword && (
        <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 24px' }}>
          {"Your top keyword \""}{topKeyword}{"\" is ranking at position "}{topPosition}{"."}
        </Text>
      )}

      {/* Stat cards */}
      <table cellPadding={0} cellSpacing={0} style={{ width: '100%', marginBottom: '24px' }}>
        <tr>
          {[
            { value: totalClicks?.toLocaleString() ?? '—', label: 'TOTAL CLICKS' },
            { value: totalSessions?.toLocaleString() ?? '—', label: 'TOTAL SESSIONS' },
            { value: topKeyword ? `#${topPosition}` : '—', label: 'TOP RANKING' },
          ].map((stat, i) => (
            <td key={i} style={{
              width: '33.33%', textAlign: 'center' as const,
              padding: '20px 16px',
              background: '#F8F7FC',
              border: '1px solid #EAE8FF',
              borderRadius: i === 0 ? '10px 0 0 10px' : i === 2 ? '0 10px 10px 0' : '0',
              verticalAlign: 'middle' as const,
            }}>
              <Text style={{
                fontSize: '36px', fontWeight: '800', color: '#111827',
                letterSpacing: '-0.03em', margin: '0', lineHeight: '1',
                fontFamily: "'DM Sans', Arial, sans-serif",
              }}>
                {stat.value}
              </Text>
              <Text style={{
                fontSize: '12px', color: '#9CA3AF', margin: '5px 0 0',
                textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: '600',
              }}>
                {stat.label}
              </Text>
            </td>
          ))}
        </tr>
      </table>

      {/* AI insight */}
      <Section style={{
        backgroundColor: '#F4F2FF',
        border: '1px solid #DDD8FF',
        borderLeft: '4px solid #FF0066',
        borderRadius: '0 10px 10px 0',
        padding: '20px 22px',
        margin: '20px 0',
      }}>
        <Text style={{
          fontSize: '10px', fontWeight: '700', color: '#FF0066',
          textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 8px',
        }}>
          {"LUMI'S INSIGHT"}
        </Text>
        <Text style={{
          fontSize: '15px', color: '#111827', lineHeight: '1.65',
          margin: '0', fontWeight: '500',
        }}>
          {insight}
        </Text>
      </Section>

      <Section style={{ textAlign: 'center' as const }}>
        <CtaButton href={dashboardUrl}>{"See your full dashboard →"}</CtaButton>
      </Section>
    </EmailLayout>
  )
}
