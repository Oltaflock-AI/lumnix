'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/lib/theme';

function TermsInner() {
  const { c } = useTheme();
  const router = useRouter();

  const heading: React.CSSProperties = {
    fontSize: 22, fontWeight: 700, color: c.text, letterSpacing: '-0.5px',
    marginTop: 48, marginBottom: 16, lineHeight: 1.3,
  };

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
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 40px', height: 64,
        backgroundColor: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: `1px solid ${c.border}`,
      }}>
        <button onClick={() => router.push('/')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary, fontSize: 14,
        }}>
          <ArrowLeft size={16} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: c.text }}>
            <span style={{ color: c.accent }}>L</span>umnix
          </span>
        </button>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.5px', color: c.text, marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: c.textMuted, marginBottom: 48 }}>
          Last updated: March 31, 2026
        </p>

        <p style={para}>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Lumnix, a marketing intelligence platform operated by Oltaflock AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 style={heading}>1. Eligibility</h2>
        <p style={para}>
          You must be at least 16 years old and have the legal capacity to enter into a binding agreement to use the Service. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
        </p>

        <h2 style={heading}>2. Account Registration</h2>
        <ul style={listStyle}>
          <li>You must provide accurate, complete, and current information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You are responsible for all activities that occur under your account.</li>
          <li>You must notify us immediately of any unauthorized use of your account.</li>
        </ul>

        <h2 style={heading}>3. Use of the Service</h2>
        <h3 style={subheading}>a) Permitted Use</h3>
        <p style={para}>
          You may use the Service to connect your marketing data sources (Google Analytics 4, Google Search Console, Google Ads, Meta Ads), view unified analytics, generate reports, monitor competitors, and receive AI-powered insights — all in accordance with these Terms.
        </p>
        <h3 style={subheading}>b) Prohibited Use</h3>
        <p style={para}>You agree not to:</p>
        <ul style={listStyle}>
          <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
          <li>Attempt to reverse-engineer, decompile, or disassemble any part of the Service</li>
          <li>Scrape, crawl, or use automated means to access the Service beyond the provided APIs</li>
          <li>Resell, sublicense, or redistribute access to the Service without written permission</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Upload malicious code, viruses, or harmful content</li>
          <li>Impersonate any person or entity or misrepresent your affiliation</li>
        </ul>

        <h2 style={heading}>4. Third-Party Integrations</h2>
        <p style={para}>
          The Service integrates with third-party platforms including Google and Meta. Your use of these integrations is subject to the respective third-party terms of service and privacy policies. We are not responsible for the availability, accuracy, or policies of third-party services.
        </p>
        <p style={para}>
          By connecting your Google or Meta accounts, you authorize us to access your data through their APIs in read-only mode. You may revoke this access at any time through the respective platform&apos;s settings or through Lumnix&apos;s integrations page.
        </p>

        <h2 style={heading}>5. Subscription & Billing</h2>
        <ul style={listStyle}>
          <li><strong style={{ color: c.text }}>Free Trial:</strong> We may offer a free trial period. At the end of the trial, your account will be paused unless you subscribe to a paid plan.</li>
          <li><strong style={{ color: c.text }}>Billing Cycle:</strong> Paid subscriptions are billed monthly or annually, depending on the plan you choose. Charges are non-refundable except as required by law.</li>
          <li><strong style={{ color: c.text }}>Price Changes:</strong> We may change subscription prices with 30 days&apos; notice. Continued use after the price change constitutes acceptance.</li>
          <li><strong style={{ color: c.text }}>Cancellation:</strong> You may cancel your subscription at any time from your dashboard. Your access continues until the end of the current billing period.</li>
          <li><strong style={{ color: c.text }}>Payment Processing:</strong> Payments are processed by Stripe. We do not store your payment card details.</li>
        </ul>

        <h2 style={heading}>6. Intellectual Property</h2>
        <p style={para}>
          The Service, including its design, code, features, documentation, and branding, is owned by Oltaflock AI and protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service for its intended purpose during your subscription.
        </p>
        <p style={para}>
          You retain ownership of all data you upload to or connect with the Service. By using the Service, you grant us a limited license to process your data solely for the purpose of providing the Service to you.
        </p>

        <h2 style={heading}>7. Data & Privacy</h2>
        <p style={para}>
          Your use of the Service is also governed by our <a href="/privacy" style={{ color: c.accent }}>Privacy Policy</a>, which describes how we collect, use, and protect your data. By using the Service, you consent to our data practices as described in the Privacy Policy.
        </p>

        <h2 style={heading}>8. AI-Generated Content</h2>
        <p style={para}>
          The Service uses artificial intelligence to generate insights, summaries, anomaly alerts, and content recommendations. AI-generated content is provided for informational purposes only and should not be relied upon as the sole basis for business decisions. We do not guarantee the accuracy, completeness, or reliability of AI-generated outputs.
        </p>

        <h2 style={heading}>9. Competitor Monitoring</h2>
        <p style={para}>
          The competitor ad spy feature accesses publicly available data from the Meta Ad Library. We do not access any non-public data about competitors. You are responsible for ensuring that your use of competitor intelligence complies with applicable laws and regulations in your jurisdiction.
        </p>

        <h2 style={heading}>10. Service Availability</h2>
        <p style={para}>
          We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We will make reasonable efforts to notify users of planned downtime in advance.
        </p>

        <h2 style={heading}>11. Limitation of Liability</h2>
        <p style={para}>
          To the maximum extent permitted by law, Oltaflock AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of the Service.
        </p>
        <p style={para}>
          Our total liability for any claims related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
        </p>

        <h2 style={heading}>12. Disclaimer of Warranties</h2>
        <p style={para}>
          The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>

        <h2 style={heading}>13. Termination</h2>
        <ul style={listStyle}>
          <li>You may terminate your account at any time by contacting us or using the account deletion feature.</li>
          <li>We may suspend or terminate your access if you violate these Terms or engage in activity that harms the Service or other users.</li>
          <li>Upon termination, your right to use the Service ceases immediately. We will retain your data for 30 days, after which it will be permanently deleted.</li>
        </ul>

        <h2 style={heading}>14. Changes to These Terms</h2>
        <p style={para}>
          We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
        </p>

        <h2 style={heading}>15. Governing Law</h2>
        <p style={para}>
          These Terms are governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in Indore, Madhya Pradesh, India.
        </p>

        <h2 style={heading}>16. Contact Us</h2>
        <p style={para}>
          If you have questions about these Terms, contact us at:
        </p>
        <div style={{
          padding: 20, borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
          marginTop: 8,
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: c.text }}>Oltaflock AI</p>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: c.textSecondary }}>Email: <a href="mailto:khush@oltaflock.ai" style={{ color: c.accent }}>khush@oltaflock.ai</a></p>
          <p style={{ margin: 0, fontSize: 14, color: c.textSecondary }}>Website: <a href="https://oltaflock.ai" target="_blank" rel="noopener noreferrer" style={{ color: c.accent }}>oltaflock.ai</a></p>
        </div>
      </div>

      <footer style={{
        padding: '24px 40px', borderTop: `1px solid ${c.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: c.textMuted }}>&copy; 2026 Oltaflock AI. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/privacy" style={{ fontSize: 13, color: c.textMuted, textDecoration: 'none' }}>Privacy</a>
          <a href="/terms" style={{ fontSize: 13, color: c.accent, textDecoration: 'none', fontWeight: 500 }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}

export default function TermsPage() {
  return (
    <ThemeProvider>
      <TermsInner />
    </ThemeProvider>
  );
}
