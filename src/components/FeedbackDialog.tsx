'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { apiFetch } from '@/lib/api-fetch';

type Props = {
  open: boolean;
  onClose: () => void;
  workspaceId?: string;
  workspaceName?: string;
  userEmail?: string;
};

export function FeedbackDialog({ open, onClose, workspaceId, workspaceName, userEmail }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const ref = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessage(''); setSubmitted(false); setError(null);
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function submit() {
    if (!message.trim()) { setError('Tell us what you think before sending.'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await apiFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), workspace_id: workspaceId, workspace_name: workspaceName }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
      setTimeout(onClose, 1400);
    } catch {
      setError('Could not send. Try the email fallback below.');
    }
    setSubmitting(false);
  }

  const mailtoFallback = (() => {
    const subject = encodeURIComponent(`Lumnix Feedback — ${workspaceName || ''}`);
    const body = encodeURIComponent(`Workspace: ${workspaceName || ''}\nUser: ${userEmail || ''}\n\n${message}`);
    return `mailto:admin@oltaflock.ai?subject=${subject}&body=${body}`;
  })();

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 440, padding: 24, borderRadius: 16, background: isDark ? '#1E293B' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', boxShadow: '0 24px 48px rgba(0,0,0,0.3)', fontFamily: "'DM Sans', sans-serif" }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgb(var(--accent-rgb) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={18} color="var(--accent)" />
          </div>
          <h3 id="feedback-title" style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Send feedback</h3>
        </div>
        <p style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>
          What's working? What's broken? What's missing? We read every message.
        </p>

        {submitted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#16A34A', fontSize: 14, fontWeight: 500 }}>
            <Check size={16} /> Thanks — we got it.
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your feedback…"
              rows={5}
              autoFocus
              disabled={submitting}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', background: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
            {error && (
              <div role="alert" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <a href={mailtoFallback} style={{ fontSize: 12, color: isDark ? '#6B7280' : '#6B7280', textDecoration: 'underline' }}>Email instead</a>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', background: 'transparent', color: isDark ? '#CBD5E1' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={submit}
                  disabled={submitting || !message.trim()}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: submitting || !message.trim() ? 0.6 : 1 }}
                >{submitting ? 'Sending…' : 'Send'}</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
