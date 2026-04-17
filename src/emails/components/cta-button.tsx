import { Button } from '@react-email/components'

interface CtaButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'outline'
}

export function CtaButton({ href, children, variant = 'primary' }: CtaButtonProps) {
  const styles = variant === 'primary'
    ? {
        backgroundColor: '#FF0066', color: '#FFFFFF',
        padding: '16px 36px', borderRadius: '12px',
        fontSize: '16px', fontWeight: '700',
        letterSpacing: '-0.01em',
        fontFamily: "'DM Sans', Arial, sans-serif",
        textDecoration: 'none', display: 'inline-block' as const,
      }
    : {
        backgroundColor: 'transparent', color: '#FF0066',
        padding: '14px 32px', borderRadius: '12px',
        fontSize: '16px', fontWeight: '700',
        letterSpacing: '-0.01em',
        fontFamily: "'DM Sans', Arial, sans-serif",
        textDecoration: 'none', display: 'inline-block' as const,
        border: '2px solid #FF0066',
      }

  return (
    <Button href={href} style={styles}>
      {children}
    </Button>
  )
}
