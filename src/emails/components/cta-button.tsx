import { Button } from '@react-email/components'

interface CtaButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'outline'
}

export function CtaButton({ href, children, variant = 'primary' }: CtaButtonProps) {
  const styles = variant === 'primary'
    ? {
        backgroundColor: '#7C3AED', color: '#FFFFFF',
        padding: '16px 36px', borderRadius: '12px',
        fontSize: '16px', fontWeight: '700',
        letterSpacing: '-0.01em',
        fontFamily: "'DM Sans', Arial, sans-serif",
        textDecoration: 'none', display: 'inline-block' as const,
      }
    : {
        backgroundColor: 'transparent', color: '#7C3AED',
        padding: '14px 32px', borderRadius: '12px',
        fontSize: '16px', fontWeight: '700',
        letterSpacing: '-0.01em',
        fontFamily: "'DM Sans', Arial, sans-serif",
        textDecoration: 'none', display: 'inline-block' as const,
        border: '2px solid #7C3AED',
      }

  return (
    <Button href={href} style={styles}>
      {children}
    </Button>
  )
}
