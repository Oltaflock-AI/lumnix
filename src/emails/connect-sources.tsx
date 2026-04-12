import { Heading, Text, Section } from '@react-email/components'
import { EmailLayout } from './components/email-layout'
import { CtaButton } from './components/cta-button'

interface ConnectSourcesEmailProps {
  name: string
  workspace_id?: string
  user_id?: string
}

const integrations = [
  {
    initial: 'G',
    bg: '#34A853',
    name: 'Google Search Console',
    what: 'See which keywords bring you traffic, your rankings, and quick win opportunities',
    priority: '⭐ Start here',
    priorityBg: '#FEF3C7',
    priorityColor: '#92400E',
  },
  {
    initial: 'GA',
    bg: '#E37400',
    name: 'Google Analytics 4',
    what: 'Sessions, users, traffic sources, top pages, and conversion data',
    priority: 'Most popular',
    priorityBg: '#EDE9FF',
    priorityColor: '#5B21B6',
  },
  {
    initial: 'M',
    bg: '#1877F2',
    name: 'Meta Ads',
    what: 'Campaign spend, ROAS, impressions, CTR across Facebook & Instagram',
    priority: '',
    priorityBg: '',
    priorityColor: '',
  },
  {
    initial: 'G',
    bg: '#4285F4',
    name: 'Google Ads',
    what: 'Keyword campaigns, spend, conversions, and ROAS tracking',
    priority: '',
    priorityBg: '',
    priorityColor: '',
  },
]

export function ConnectSourcesEmail({ name, user_id }: ConnectSourcesEmailProps) {
  const firstName = name?.split(' ')[0] || 'there'
  const settingsUrl = 'https://lumnix-ai.vercel.app/dashboard/settings?tab=integrations'

  return (
    <EmailLayout
      previewText="Connect Google Search Console in 2 minutes and see your keyword rankings instantly"
      userId={user_id}
    >
      <Heading style={{
        fontSize: '28px', fontWeight: '800', color: '#18163A',
        letterSpacing: '-0.03em', lineHeight: '1.2', margin: '0 0 8px',
        fontFamily: "'DM Sans', Arial, sans-serif",
      }}>
        One connection unlocks everything
      </Heading>
      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 6px' }}>
        Hey {firstName}, connecting your first data source takes about 2 minutes and unlocks everything Lumnix can do for you.
      </Text>
      <Text style={{ fontSize: '18px', fontWeight: '700', color: '#18163A', margin: '0 0 24px' }}>
        Takes 2 minutes. Works instantly.
      </Text>

      {/* Integration cards — 2x2 grid using table */}
      <table cellPadding={0} cellSpacing={0} style={{ width: '100%', marginBottom: '28px' }}>
        <tr>
          {integrations.slice(0, 2).map((item, i) => (
            <td key={i} style={{ width: '50%', padding: i === 0 ? '0 6px 12px 0' : '0 0 12px 6px', verticalAlign: 'top' }}>
              <div style={{ border: '1px solid #EAE8FF', borderRadius: '10px', padding: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', backgroundColor: item.bg,
                  color: '#FFFFFF', fontSize: item.initial.length > 1 ? '12px' : '16px',
                  fontWeight: '700', textAlign: 'center' as const, lineHeight: '36px',
                  marginBottom: '10px',
                }}>
                  {item.initial}
                </div>
                <Text style={{ fontSize: '14px', fontWeight: '600', color: '#18163A', margin: '0 0 4px' }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px', lineHeight: '1.5' }}>
                  {item.what}
                </Text>
                {item.priority && (
                  <span style={{
                    display: 'inline-block', padding: '3px 8px', borderRadius: '100px',
                    fontSize: '11px', fontWeight: '600',
                    backgroundColor: item.priorityBg, color: item.priorityColor,
                  }}>
                    {item.priority}
                  </span>
                )}
              </div>
            </td>
          ))}
        </tr>
        <tr>
          {integrations.slice(2, 4).map((item, i) => (
            <td key={i} style={{ width: '50%', padding: i === 0 ? '0 6px 0 0' : '0 0 0 6px', verticalAlign: 'top' }}>
              <div style={{ border: '1px solid #EAE8FF', borderRadius: '10px', padding: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', backgroundColor: item.bg,
                  color: '#FFFFFF', fontSize: '16px', fontWeight: '700',
                  textAlign: 'center' as const, lineHeight: '36px', marginBottom: '10px',
                }}>
                  {item.initial}
                </div>
                <Text style={{ fontSize: '14px', fontWeight: '600', color: '#18163A', margin: '0 0 4px' }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: '13px', color: '#6B7280', margin: '0', lineHeight: '1.5' }}>
                  {item.what}
                </Text>
              </div>
            </td>
          ))}
        </tr>
      </table>

      {/* CTA */}
      <Section style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
        <CtaButton href={settingsUrl}>{"Connect your first source →"}</CtaButton>
      </Section>

      <Text style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' as const, margin: '0' }}>
        OAuth only — we never store your passwords. Disconnect anytime.
      </Text>
    </EmailLayout>
  )
}
