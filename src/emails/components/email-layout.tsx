import { Html, Head, Body, Container, Preview, Font } from '@react-email/components'
import { EmailHeader } from './email-header'
import { EmailFooter } from './email-footer'

interface EmailLayoutProps {
  children: React.ReactNode
  previewText?: string
  userId?: string
}

export function EmailLayout({ children, previewText, userId }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/dmsans/v11/rP2Hp2ywxg089UriCZOIHQ.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={{
        backgroundColor: '#F8F7FC', margin: '0', padding: '40px 0',
        fontFamily: "'DM Sans', Arial, sans-serif",
      }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <EmailHeader />

          {/* White content area */}
          <div style={{
            backgroundColor: '#FFFFFF', padding: '40px 40px 32px',
            borderLeft: '1px solid #EAE8FF', borderRight: '1px solid #EAE8FF',
          }}>
            {children}
          </div>

          <EmailFooter userId={userId} />
        </Container>
      </Body>
    </Html>
  )
}
