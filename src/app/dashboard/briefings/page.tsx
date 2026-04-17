'use client';
import { useState, useEffect } from 'react';
import { Mail, Calendar, Lightbulb, CheckCircle, AlertTriangle } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { apiFetch } from '@/lib/api-fetch';

export default function BriefingsPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const [briefings, setBriefings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?.id) return;
    apiFetch(`/api/briefings?workspace_id=${workspace.id}`)
      .then(r => r.json())
      .then(d => { setBriefings(d.briefings || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspace?.id]);

  return (
    <PageShell title="Daily" titleAccent="Briefings" description="AI-generated daily marketing summaries">
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 100, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : briefings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12, border: `1px dashed ${c.border}`, backgroundColor: c.bgCard }}>
          <Mail size={32} color={c.textMuted} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>No briefings yet</p>
          <p style={{ fontSize: 13, color: c.textMuted }}>Daily briefings are generated automatically every morning at 7 AM UTC.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {briefings.map(b => (
            <div key={b.id} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={14} color={c.accent} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{new Date(b.briefing_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
                {b.sent_email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: c.success }}>
                    <CheckCircle size={12} /> Emailed
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.7, marginBottom: 16 }}>{b.summary}</p>

              {b.changes && b.changes.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {b.changes.map((ch: any, i: number) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`, fontSize: 12, color: c.textSecondary }}>
                      {ch.metric}: <strong style={{ color: c.text }}>{ch.value}</strong>
                    </span>
                  ))}
                </div>
              )}

              {b.recommendations && b.recommendations.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Lightbulb size={13} color={c.warning} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>Recommendations</span>
                  </div>
                  {b.recommendations.map((r: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`, marginBottom: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: r.priority === 'high' ? c.danger : c.warning, marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 2 }}>{r.action}</p>
                        <p style={{ fontSize: 12, color: c.textMuted }}>{r.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
