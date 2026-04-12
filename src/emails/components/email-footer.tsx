import { Section, Text, Link } from '@react-email/components'

interface EmailFooterProps {
  userId?: string
}

export function EmailFooter({ userId }: EmailFooterProps) {
  const unsubscribeUrl = userId
    ? `https://lumnix-ai.vercel.app/api/email/unsubscribe?user_id=${userId}`
    : '#'

  return (
    <Section style={{
      backgroundColor: '#F8F7FC',
      borderRadius: '0 0 16px 16px',
      padding: '24px 40px',
      border: '1px solid #EAE8FF',
      borderTop: '1px solid #EAE8FF',
      textAlign: 'center' as const,
    }}>
      <Text style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 8px', lineHeight: '1.5' }}>
        {"You're receiving this because you signed up for Lumnix."}
      </Text>
      <Text style={{ fontSize: '12px', color: '#9CA3AF', margin: '0' }}>
        {userId && (
          <>
            <Link href={unsubscribeUrl} style={{ color: '#7C3AED', textDecoration: 'underline' }}>
              Unsubscribe
            </Link>
            {' · '}
          </>
        )}
        Oltaflock AI
        {' · '}
        <Link href="https://oltaflock.ai" style={{ color: '#7C3AED', textDecoration: 'none' }}>
          oltaflock.ai
        </Link>
      </Text>
    </Section>
  )
}
