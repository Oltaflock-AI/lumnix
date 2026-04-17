'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { Wordmark } from '@/components/Wordmark';

function PrivacyInner() {
  const { c } = useTheme();
  const router = useRouter();

  const heading = (text: string): React.CSSProperties => ({
    fontSize: 22, fontWeight: 700, color: c.text, letterSpacing: '-0.5px',
    marginTop: 48, marginBottom: 16, lineHeight: 1.3,
  });

  const subheading: React.CSSProperties = {
    fontSize: 16, fontWeight: 600, color: c.text, marginTop: 28, marginBottom: 10,
  };

  const para: React.CSSProperties = {
    fontSize: 14, color: c.textSecondary, lineHeight: 1.8, marginBottom: 16,
  };

  const listStyle: React.CSSProperties = {
    fontSize: 14, color: c.textSecondary, lineHeight: 1.8, marginBottom: 16,
    paddingLeft: 24,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.bgPage, color: c.text }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 40px', height: 64,
        backgroundColor: '#000000',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button onClick={() => router.push('/')} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', fontSize: 14,
          padding: 0,
        }}>
          <ArrowLeft size={16} color="#FFFFFF" />
          <Wordmark size={28} variant="light" />
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.5px', color: c.text, marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: c.textMuted, marginBottom: 48 }}>
          Last updated: March 31, 2026
        </p>

        <p style={para}>
          Lumnix ("we," "our," or "us") is operated by Oltaflock AI. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our marketing intelligence platform at lumnix.vercel.app (the "Service"). Please read this policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.
        </p>

        <h2 style={heading('1')}>1. Information We Collect</h2>

        <h3 style={subheading}>a) Information You Provide</h3>
        <ul style={listStyle}>
          <li><strong style={{ color: c.text }}>Account Information:</strong> When you create an account, we collect your name, email address, and password.</li>
          <li><strong style={{ color: c.text }}>Workspace Data:</strong> Brand name, logo, and other workspace configuration you provide.</li>
          <li><strong style={{ color: c.text }}>Payment Information:</strong> If you subscribe to a paid plan, payment is processed by Razorpay. We do not store your credit card details.</li>
          <li><strong style={{ color: c.text }}>Support Communications:</strong> Any messages you send us via email or in-app support.</li>
        </ul>

        <h3 style={subheading}>b) Information Collected Automatically</h3>
        <ul style={listStyle}>
          <li><strong style={{ color: c.text }}>Analytics Data:</strong> We collect data from third-party services you connect (Google Analytics 4, Google Search Console, Google Ads, Meta Ads) through OAuth. This data is used solely to power your dashboard and reports.</li>
          <li><strong style={{ color: c.text }}>Usage Data:</strong> Pages visited, features used, session duration, and browser/device type.</li>
          <li><strong style={{ color: c.text }}>Cookies:</strong> We use essential cookies for authentication and session management. No third-party advertising cookies are used.</li>
        </ul>

        <h3 style={subheading}>c) Third-Party Integrations</h3>
        <p style={para}>
          When you connect Google or Meta accounts via OAuth, we request only the permissions necessary to read your analytics, search console, and advertising data. We access this data in read-only mode. We never modify your Google or Meta accounts, campaigns, or settings.
        </p>

        <h2 style={heading('2')}>2. How We Use Your Information</h2>
        <ul style={listStyle}>
          <li>To provide, operate, and maintain the Service</li>
          <li>To display your marketing analytics, SEO data, and advertising performance in a unified dashboard</li>
          <li>To generate AI-powered insights, anomaly detection, and automated reports</li>
          <li>To track competitor ads via the Meta Ad Library (publicly available data)</li>
          <li>To send you service-related emails (account verification, billing, feature updates)</li>
          <li>To improve and develop new features</li>
          <li>To respond to support requests</li>
        </ul>

        <h2 style={heading('3')}>3. How We Share Your Information</h2>
        <p style={para}>
          We do not sell, rent, or trade your personal information. We may share data only in the following circumstances:
        </p>
        <ul style={listStyle}>
          <li><strong style={{ color: c.text }}>Service Providers:</strong> We use third-party services (Supabase for database hosting, Vercel for deployment, Razorpay for payments, OpenAI/Anthropic for AI analysis) that process data on our behalf under strict data processing agreements.</li>
          <li><strong style={{ color: c.text }}>Legal Requirements:</strong> If required by law, regulation, or legal process.</li>
          <li><strong style={{ color: c.text }}>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
        </ul>

        <h2 style={heading('4')}>4. Data Storage & Security</h2>
        <ul style={listStyle}>
          <li>Your data is stored on Supabase (hosted on AWS) with row-level security (RLS) enabled.</li>
          <li>All data is encrypted in transit (TLS 1.2+) and at rest.</li>
          <li>OAuth tokens are stored encrypted and are never exposed to client-side code.</li>
          <li>We conduct regular security reviews and follow industry best practices.</li>
        </ul>

        <h2 style={heading('5')}>5. Data Retention</h2>
        <p style={para}>
          We retain your data for as long as your account is active. If you delete your account, we will delete your personal data and connected analytics data within 30 days. Aggregated, anonymized data may be retained for analytics purposes.
        </p>

        <h2 style={heading('6')}>6. Your Rights</h2>
        <p style={para}>Depending on your jurisdiction, you may have the right to:</p>
        <ul style={listStyle}>
          <li>Access, correct, or delete your personal data</li>
          <li>Export your data in a portable format</li>
          <li>Withdraw consent for data processing</li>
          <li>Object to or restrict certain processing activities</li>
          <li>Lodge a complaint with a supervisory authority</li>
        </ul>
        <p style={para}>
          To exercise any of these rights, contact us at <a href="mailto:admin@oltaflock.ai" style={{ color: c.accent }}>admin@oltaflock.ai</a>.
        </p>

        <h2 style={heading('7')}>7. Third-Party Services</h2>
        <p style={para}>Our Service integrates with:</p>
        <ul style={listStyle}>
          <li><strong style={{ color: c.text }}>Google APIs:</strong> Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: c.accent }}>Google's Privacy Policy</a>. Our use of Google data complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: c.accent }}>Google API Services User Data Policy</a>.</li>
          <li><strong style={{ color: c.text }}>Meta APIs:</strong> Subject to <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" style={{ color: c.accent }}>Meta's Privacy Policy</a>. Competitor ad data is sourced from the publicly accessible Meta Ad Library.</li>
          <li><strong style={{ color: c.text }}>Razorpay:</strong> Payment processing subject to <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" style={{ color: c.accent }}>Razorpay's Privacy Policy</a>.</li>
        </ul>

        <h2 style={heading('8')}>8. Children's Privacy</h2>
        <p style={para}>
          The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us personal information, please contact us and we will promptly delete it.
        </p>

        <h2 style={heading('9')}>9. Changes to This Policy</h2>
        <p style={para}>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
        </p>

        <h2 style={heading('10')}>10. Contact Us</h2>
        <p style={para}>
          If you have questions about this Privacy Policy or our data practices, contact us at:
        </p>
        <div style={{
          padding: 20, borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
          marginTop: 8,
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: c.text }}>Oltaflock AI</p>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: c.textSecondary }}>Email: <a href="mailto:admin@oltaflock.ai" style={{ color: c.accent }}>admin@oltaflock.ai</a></p>
          <p style={{ margin: 0, fontSize: 14, color: c.textSecondary }}>Website: <a href="https://oltaflock.ai" target="_blank" rel="noopener noreferrer" style={{ color: c.accent }}>oltaflock.ai</a></p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '24px 40px', borderTop: `1px solid ${c.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: c.textMuted }}>&copy; 2026 Oltaflock AI. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/privacy" style={{ fontSize: 13, color: c.accent, textDecoration: 'none', fontWeight: 500 }}>Privacy</a>
          <a href="/terms" style={{ fontSize: 13, color: c.textMuted, textDecoration: 'none' }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <ThemeProvider>
      <PrivacyInner />
    </ThemeProvider>
  );
}
