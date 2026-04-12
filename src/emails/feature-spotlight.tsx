import { Heading, Text, Section, Link, Hr } from '@react-email/components'
import { EmailLayout } from './components/email-layout'
import { CtaButton } from './components/cta-button'

interface FeatureSpotlightEmailProps {
  name: string
  workspace_id?: string
  user_id?: string
}

export function FeatureSpotlightEmail({ name, user_id }: FeatureSpotlightEmailProps) {
  const firstName = name?.split(' ')[0] || 'there'

  return (
    <EmailLayout
      previewText="Competitor Ad Spy + AI Assistant — the two features that save most users hours per week"
      userId={user_id}
    >
      <Heading style={{
        fontSize: '28px', fontWeight: '800', color: '#18163A',
        letterSpacing: '-0.03em', lineHeight: '1.2', margin: '0 0 14px',
        fontFamily: "'DM Sans', Arial, sans-serif",
      }}>
        {firstName}, two features that change how you work
      </Heading>
      <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 28px' }}>
        Most users find these in week 4. {"You're"} getting them in week 1.
      </Text>

      {/* Feature 1: Competitor Ad Spy */}
      <Section style={{
        backgroundColor: '#FAFAFE',
        border: '1px solid #EAE8FF',
        borderLeft: '4px solid #7C3AED',
        borderRadius: '0 12px 12px 0',
        padding: '22px 26px',
        marginBottom: '14px',
      }}>
        <Text style={{
          fontSize: '10px', fontWeight: '800', color: '#7C3AED',
          textTransform: 'uppercase' as const, letterSpacing: '0.12em', margin: '0 0 8px',
        }}>
          FEATURE 01
        </Text>
        <Heading as="h2" style={{
          fontSize: '20px', fontWeight: '800', color: '#18163A',
          letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: '1.2',
        }}>
          Competitor Ad Spy
        </Heading>
        <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 12px' }}>
          {"Add any competitor's name or website and we'll pull every Meta ad they're running. "}
          {"We flag ads that have been running 90+ days — those are their winners. "}
          {"Then our AI tells you exactly what hooks, pain points, and offers they're using, "}
          {"so you know what to make before you spend a rupee on creative."}
        </Text>
        <Link href="https://lumnix-ai.vercel.app/dashboard/competitors" style={{ color: '#7C3AED', fontSize: '14px', fontWeight: '600' }}>
          {"Try it →"}
        </Link>
      </Section>

      <Hr style={{ border: 'none', borderTop: '1px solid #EAE8FF', margin: '8px 0' }} />

      {/* Feature 2: AI Assistant */}
      <Section style={{
        backgroundColor: '#FAFAFE',
        border: '1px solid #EAE8FF',
        borderLeft: '4px solid #059669',
        borderRadius: '0 12px 12px 0',
        padding: '22px 26px',
        marginBottom: '24px',
      }}>
        <Text style={{
          fontSize: '10px', fontWeight: '800', color: '#059669',
          textTransform: 'uppercase' as const, letterSpacing: '0.12em', margin: '0 0 8px',
        }}>
          FEATURE 02
        </Text>
        <Heading as="h2" style={{
          fontSize: '20px', fontWeight: '800', color: '#18163A',
          letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: '1.2',
        }}>
          Ask Lumi anything
        </Heading>
        <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 16px' }}>
          {"Lumi knows your GA4, GSC, Google Ads, and Meta Ads data. "}
          {"Try asking: \"What should I focus on this week?\" "}
          {"Or: \"Why did my traffic drop last Tuesday?\" "}
          {"Or: \"Compare my organic vs paid performance this month.\" "}
          {"It's not a generic AI — it knows YOUR numbers."}
        </Text>

        {/* Chat bubble mockup — using float for email client compat */}
        <div style={{ marginBottom: '12px' }}>
          {/* User bubble - right aligned */}
          <div style={{
            background: '#7C3AED', color: '#FFFFFF',
            padding: '10px 16px', borderRadius: '18px 18px 4px 18px',
            fontSize: '14px', lineHeight: '1.5',
            display: 'inline-block', maxWidth: '85%',
            float: 'right' as const, clear: 'both' as const,
            marginBottom: '10px',
          }}>
            What should I focus on this week?
          </div>
          <div style={{ clear: 'both' as const }} />
          {/* Lumi bubble - left aligned */}
          <div style={{
            background: '#F4F2FF', color: '#18163A',
            padding: '10px 16px', borderRadius: '18px 18px 18px 4px',
            fontSize: '13px', lineHeight: '1.6',
            display: 'inline-block', maxWidth: '90%',
            clear: 'both' as const, marginTop: '4px',
          }}>
            {"Based on your data, I'd focus on optimizing your meta titles for \"soya mini chunks\" — 190 impressions and 0% CTR is a big opportunity sitting on page 1..."}
          </div>
          <div style={{ clear: 'both' as const }} />
        </div>

        <Link href="https://lumnix-ai.vercel.app/dashboard/ai-assistant" style={{ color: '#059669', fontSize: '14px', fontWeight: '600' }}>
          {"Chat with Lumi →"}
        </Link>
      </Section>

      <Section style={{ textAlign: 'center' as const }}>
        <CtaButton href="https://lumnix-ai.vercel.app/dashboard">{"Open Lumnix →"}</CtaButton>
      </Section>
    </EmailLayout>
  )
}
