import { Section, Text, Link } from '@react-email/components'
import { signUnsubscribeToken } from '@/lib/email-tokens'

interface EmailFooterProps {
  userId?: string
}

export function EmailFooter({ userId }: EmailFooterProps) {
  // Token is an HMAC-signed payload binding the link to this user. Without
  // signing, the endpoint used to accept a bare user_id in the URL and anyone
  // iterating UUIDs could opt-out every user.
  const unsubscribeUrl = userId
    ? `https://lumnix-ai.vercel.app/api/email/unsubscribe?token=${encodeURIComponent(signUnsubscribeToken(userId))}`
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
            <Link href={unsubscribeUrl} style={{ color: '#FF0066', textDecoration: 'underline' }}>
              Unsubscribe
            </Link>
            {' · '}
          </>
        )}
        Oltaflock AI
        {' · '}
        <Link href="https://oltaflock.ai" style={{ color: '#FF0066', textDecoration: 'none' }}>
          oltaflock.ai
        </Link>
      </Text>
    </Section>
  )
}
