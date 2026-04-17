import { Heading, Text, Section, Link, Hr, Row, Column } from '@react-email/components'
import { EmailLayout } from './components/email-layout'
import { CtaButton } from './components/cta-button'

interface CheckinEmailProps {
  name: string
  workspace_id?: string
  user_id?: string
}

export function CheckinEmail({ name, user_id }: CheckinEmailProps) {
  const firstName = name?.split(' ')[0] || 'there'
  const dashboardUrl = 'https://lumnix-ai.vercel.app/dashboard'
  const settingsUrl = 'https://lumnix-ai.vercel.app/dashboard/settings?tab=integrations'

  const checklist = [
    { text: 'SEO Quick Wins', desc: "keywords you rank for but get 0 clicks — free traffic you're missing" },
    { text: 'Competitor Ad Spy', desc: 'see which ads your rivals have been running for 90+ days' },
    { text: 'AI Assistant', desc: 'ask Lumi to summarize your week in 30 seconds' },
  ]

  return (
    <EmailLayout
      previewText="Quick check — is Lumnix actually useful for you? Reply with one word"
      userId={user_id}
    >
      <Heading style={{
        fontSize: '26px', fontWeight: '800', color: '#111827',
        letterSpacing: '-0.02em', margin: '0 0 20px',
        fontFamily: "'DM Sans', Arial, sans-serif",
      }}>
        One week in — honest question
      </Heading>

      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 16px' }}>
        Hey {firstName},
      </Text>

      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 16px' }}>
        {"You've been using Lumnix for a week now — and I wanted to check in personally."}
      </Text>

      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 20px' }}>
        {"Are you getting value? Are there features you can't find? Is anything confusing?"}
      </Text>

      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 12px', fontWeight: '600' }}>
        {"Here's what most people find most useful in week one:"}
      </Text>

      {/* Styled checklist */}
      <Section style={{ marginBottom: '20px' }}>
        {checklist.map((item, i) => (
          <Row key={i} style={{ marginBottom: '10px' }}>
            <Column style={{ width: '24px', verticalAlign: 'top' as const, paddingTop: '2px' }}>
              <Text style={{ fontSize: '14px', color: '#059669', margin: '0', fontWeight: '700' }}>✓</Text>
            </Column>
            <Column>
              <Text style={{ fontSize: '14px', margin: '0', lineHeight: '1.6' }}>
                <span style={{ fontWeight: '700', color: '#111827' }}>{item.text}</span>
                <span style={{ color: '#6B7280' }}> — {item.desc}</span>
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 20px' }}>
        {"If you haven't connected your data sources yet, here's a direct link: "}
        <Link href={settingsUrl} style={{ color: '#FF0066', fontWeight: '600' }}>
          {"Connect in Settings →"}
        </Link>
      </Text>

      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 24px' }}>
        {"And if you've run into any issues, or just want to share feedback, just reply to this email — I read every response personally."}
      </Text>

      <Hr style={{ border: 'none', borderTop: '1px solid #EAE8FF', margin: '0 0 20px' }} />

      {/* Signature */}
      <Text style={{ fontSize: '14px', color: '#111827', margin: '0 0 4px', fontWeight: '600' }}>
        — Khush
      </Text>
      <Text style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', margin: '0 0 24px' }}>
        Founder, Lumnix / Oltaflock AI{'\n'}
        khush@oltaflock.ai{'\n'}
        lumnix-ai.vercel.app
      </Text>

      {/* Two CTAs side by side */}
      <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
        <tr>
          <td style={{ textAlign: 'center' as const, paddingRight: '8px' }}>
            <CtaButton href={dashboardUrl}>{"Open Dashboard →"}</CtaButton>
          </td>
          <td style={{ textAlign: 'center' as const, paddingLeft: '8px' }}>
            <CtaButton href="mailto:khush@oltaflock.ai" variant="outline">Give feedback</CtaButton>
          </td>
        </tr>
      </table>
    </EmailLayout>
  )
}
