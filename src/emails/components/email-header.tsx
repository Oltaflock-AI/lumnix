import { Section, Row, Column, Text } from '@react-email/components'

export function EmailHeader() {
  return (
    <Section style={{
      backgroundColor: '#5B21B6',
      borderRadius: '16px 16px 0 0',
      padding: '32px 40px',
      backgroundImage: 'linear-gradient(135deg, #5B21B6 0%, #4C1D95 100%)',
    }}>
      <Row>
        <Column>
          <table cellPadding={0} cellSpacing={0}>
            <tr>
              <td>
                <div style={{
                  width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '9px', display: 'inline-block', textAlign: 'center' as const,
                  lineHeight: '32px', fontSize: '16px', fontWeight: '700', color: '#FFFFFF',
                  marginRight: '10px', verticalAlign: 'middle' as const,
                }}>
                  L
                </div>
              </td>
              <td>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', verticalAlign: 'middle' as const }}>
                  Lumnix
                </span>
              </td>
            </tr>
          </table>
          <Text style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.55)',
            margin: '6px 0 0',
            fontFamily: "'DM Sans', Arial, sans-serif",
            letterSpacing: '0.04em',
          }}>
            Marketing Intelligence Platform
          </Text>
        </Column>
      </Row>
    </Section>
  )
}
