'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Trash2, Check, Mail } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/lib/theme';

function DataDeletionInner() {
  const { c } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    setError('');
    // In production this would trigger actual deletion — for now, sends notification
    try {
      await fetch('/api/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please email us directly.');
    }
    setSubmitting(false);
  };

  const para: React.CSSProperties = {
    fontSize: 14, color: c.textSecondary, lineHeight: 1.8, marginBottom: 16,
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
          Data Deletion
        </h1>
        <p style={{ fontSize: 14, color: c.textMuted, marginBottom: 48 }}>
          Request deletion of your data from Lumnix
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 16 }}>How to Delete Your Data</h2>

        <p style={para}>
          At Lumnix (operated by Oltaflock AI), we respect your right to control your personal data. You can request deletion of all data associated with your account through any of the following methods:
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginTop: 28, marginBottom: 12 }}>Option 1: Submit a Deletion Request Below</h3>
        <p style={para}>
          Use the form below to submit a data deletion request. We will process your request and delete all associated data within 30 days.
        </p>

        {submitted ? (
          <div style={{
            padding: 32, borderRadius: 16, backgroundColor: c.bgCard, border: `1px solid ${c.successBorder}`,
            textAlign: 'center', marginBottom: 32,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', backgroundColor: c.successSubtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', border: `2px solid ${c.success}`,
            }}>
              <Check size={24} color={c.success} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 8 }}>Request Received</h3>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: 0, lineHeight: 1.7 }}>
              We&apos;ve received your data deletion request for <strong style={{ color: c.text }}>{email}</strong>.
              <br />You&apos;ll receive a confirmation email within 48 hours. All data will be deleted within 30 days.
            </p>
          </div>
        ) : (
          <div style={{
            padding: 28, borderRadius: 16, backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
            marginBottom: 32,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>
                  Email address associated with your account *
                </label>
                <input
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" type="email"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: `1px solid ${c.border}`, backgroundColor: c.bgPage,
                    color: c.text, fontSize: 14, boxSizing: 'border-box' as const,
                  }}
                  onFocus={e => e.target.style.borderColor = c.accent}
                  onBlur={e => e.target.style.borderColor = c.border}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              {error && <p style={{ fontSize: 13, color: c.danger, margin: 0 }}>{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: 12, borderRadius: 10, border: 'none',
                  backgroundColor: c.danger, color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                }}
              >
                <Trash2 size={15} />
                {submitting ? 'Submitting...' : 'Request Data Deletion'}
              </button>
            </div>
          </div>
        )}

        <h3 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginTop: 28, marginBottom: 12 }}>Option 2: Email Us Directly</h3>
        <p style={para}>
          Send an email to <a href="mailto:khush@oltaflock.ai?subject=Data%20Deletion%20Request%20-%20Lumnix" style={{ color: c.accent }}>khush@oltaflock.ai</a> with the subject line &quot;Data Deletion Request — Lumnix&quot; and include the email address associated with your account.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginTop: 28, marginBottom: 12 }}>Option 3: From Your Dashboard</h3>
        <p style={para}>
          If you have an active Lumnix account, you can request account and data deletion from <strong style={{ color: c.text }}>Settings → Account → Delete Account</strong>.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: c.text, marginTop: 48, marginBottom: 16 }}>What Gets Deleted</h2>
        <p style={para}>When we process your deletion request, we remove:</p>
        <ul style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.8, paddingLeft: 24, marginBottom: 16 }}>
          <li>Your account information (name, email, password hash)</li>
          <li>All connected integration data (Google Analytics, Search Console, Google Ads, Meta Ads)</li>
          <li>OAuth tokens and credentials</li>
          <li>Workspace data, reports, and settings</li>
          <li>Competitor tracking data and analysis</li>
          <li>AI-generated insights and recommendations</li>
          <li>Team member associations</li>
        </ul>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: c.text, marginTop: 48, marginBottom: 16 }}>What We Retain</h2>
        <p style={para}>
          After deletion, we may retain certain data as required by law (e.g., billing records for tax compliance) for up to 7 years. This retained data is minimal and cannot be used to identify you in our active systems. Aggregated, anonymized analytics data may also be retained.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: c.text, marginTop: 48, marginBottom: 16 }}>Timeline</h2>
        <div style={{
          padding: 20, borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={16} color={c.accent} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Confirmation within 48 hours</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>We&apos;ll email you confirming receipt of your request</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.warningSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={16} color={c.warning} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Data deleted within 30 days</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>All personal data and connected service data permanently removed</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.successSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={16} color={c.success} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Final confirmation</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>We&apos;ll notify you once deletion is complete</div>
            </div>
          </div>
        </div>

        <p style={{ ...para, marginTop: 32 }}>
          For questions about data deletion, contact us at <a href="mailto:khush@oltaflock.ai" style={{ color: c.accent }}>khush@oltaflock.ai</a>.
          See our full <a href="/privacy" style={{ color: c.accent }}>Privacy Policy</a> and <a href="/terms" style={{ color: c.accent }}>Terms of Service</a>.
        </p>
      </div>

      <footer style={{
        padding: '24px 40px', borderTop: `1px solid ${c.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: c.textMuted }}>&copy; 2026 Oltaflock AI. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/privacy" style={{ fontSize: 13, color: c.textMuted, textDecoration: 'none' }}>Privacy</a>
          <a href="/terms" style={{ fontSize: 13, color: c.textMuted, textDecoration: 'none' }}>Terms</a>
          <a href="/data-deletion" style={{ fontSize: 13, color: c.accent, textDecoration: 'none', fontWeight: 500 }}>Data Deletion</a>
        </div>
      </footer>
    </div>
  );
}

export default function DataDeletionPage() {
  return (
    <ThemeProvider>
      <DataDeletionInner />
    </ThemeProvider>
  );
}
