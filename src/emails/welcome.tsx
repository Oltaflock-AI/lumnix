import { Heading, Text, Section, Row, Column, Link } from '@react-email/components'
import { EmailLayout } from './components/email-layout'
import { CtaButton } from './components/cta-button'

interface WelcomeEmailProps {
  name: string
  workspace_id: string
  user_id?: string
}

export function WelcomeEmail({ name, workspace_id, user_id }: WelcomeEmailProps) {
  const firstName = name?.split(' ')[0] || 'there'
  const dashboardUrl = 'https://lumnix-ai.vercel.app/dashboard'

  const features = [
    { icon: '📊', title: 'Unified Analytics', desc: 'GA4 + GSC + Google Ads + Meta Ads in one view' },
    { icon: '🤖', title: 'AI Assistant (Lumi)', desc: 'Ask anything about your marketing data' },
    { icon: '🕵️', title: 'Competitor Ad Spy', desc: 'See what ads your competitors are running — and why they work' },
    { icon: '🚨', title: 'Smart Alerts', desc: 'Get notified when traffic drops or anomalies are detected' },
  ]

  return (
    <EmailLayout
      previewText={"Your AI marketing intelligence is live — here's how to get started in 3 minutes"}
      userId={user_id}
    >
      <Heading style={{
        fontSize: '28px', fontWeight: '800', color: '#111827',
        letterSpacing: '-0.03em', lineHeight: '1.2', margin: '0 0 14px',
        fontFamily: "'DM Sans', Arial, sans-serif",
      }}>
        Your marketing intelligence is live, {firstName} 🎉
      </Heading>
      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 24px' }}>
        {"You're about to stop switching between 5 different dashboards and start seeing your entire marketing picture in one place."}
      </Text>

      {/* Feature list */}
      <Section style={{ backgroundColor: '#F8F7FC', borderRadius: '12px', padding: '20px 24px', marginBottom: '28px' }}>
        <Text style={{ fontSize: '13px', fontWeight: '600', color: '#5B21B6', textTransform: 'uppercase' as const, letterSpacing: '0.07em', margin: '0 0 14px' }}>
          {"WHAT'S WAITING FOR YOU"}
        </Text>
        {features.map((item, i) => (
          <Row key={i} style={{ marginBottom: i < features.length - 1 ? '12px' : '0' }}>
            <Column style={{ width: '36px', verticalAlign: 'top' as const, paddingTop: '2px' }}>
              <Text style={{ fontSize: '18px', margin: '0' }}>{item.icon}</Text>
            </Column>
            <Column>
              <Text style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 2px' }}>{item.title}</Text>
              <Text style={{ fontSize: '13px', color: '#6B7280', margin: '0' }}>{item.desc}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: 'center' as const, marginBottom: '28px' }}>
        <CtaButton href={dashboardUrl}>{"Open Your Dashboard →"}</CtaButton>
      </Section>

      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 8px' }}>
        Your first step: connect at least one data source in{' '}
        <Link href={`${dashboardUrl}/settings?tab=integrations`} style={{ color: '#FF0066' }}>
          {"Settings → Integrations"}
        </Link>
        . It takes about 2 minutes and unlocks everything.
      </Text>
    </EmailLayout>
  )
}
