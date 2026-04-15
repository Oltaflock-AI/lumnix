'use client';
import { useState, useEffect } from 'react';
import { Zap, Check, X, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { apiFetch } from '@/lib/api-fetch';

type Action = {
  id: string; action_type: string; title: string; description: string;
  reason: string; status: string; priority: string; created_at: string;
  approved_at: string; executed_at: string;
};

const PRIORITY_COLORS: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#22c55e' };

export default function ActionsPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'suggested' | 'approved' | 'executed' | 'rejected'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace?.id) return;
    setLoading(true);
    apiFetch(`/api/agent/actions?workspace_id=${workspace.id}`)
      .then(r => r.json())
      .then(d => { setActions(d.actions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspace?.id]);

  async function updateStatus(actionId: string, status: 'approved' | 'rejected') {
    setUpdating(actionId);
    const res = await apiFetch('/api/agent/actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: actionId, status }),
    });
    const d = await res.json();
    if (d.action) {
      setActions(prev => prev.map(a => a.id === actionId ? d.action : a));
    }
    setUpdating(null);
  }

  const filtered = filter === 'all' ? actions : actions.filter(a => a.status === filter);
  const suggested = actions.filter(a => a.status === 'suggested').length;

  return (
    <PageShell title="Action Queue" description="AI-suggested actions — review, approve, or reject" icon={Zap}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'suggested', 'approved', 'executed', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${filter === f ? c.accent : c.border}`,
              backgroundColor: filter === f ? c.accentSubtle : 'transparent',
              color: filter === f ? c.accent : c.textSecondary,
              fontWeight: filter === f ? 600 : 400,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'suggested' && suggested > 0 && (
              <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 99, backgroundColor: c.danger, color: 'white', fontSize: 10, fontWeight: 700 }}>{suggested}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 90, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12, border: `1px dashed ${c.border}`, backgroundColor: c.bgCard }}>
          <Zap size={32} color={c.textMuted} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>
            {filter === 'all' ? 'No actions yet' : `No ${filter} actions`}
          </p>
          <p style={{ fontSize: 13, color: c.textMuted }}>Lumi will suggest actions based on your marketing data — like pausing underperforming ads or scaling winners.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(action => (
            <div key={action.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 20, borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PRIORITY_COLORS[action.priority] || c.textMuted, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{action.title}</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                    backgroundColor: action.status === 'suggested' ? c.warningSubtle : action.status === 'approved' ? c.successSubtle : action.status === 'rejected' ? c.dangerSubtle : c.bgCardHover,
                    color: action.status === 'suggested' ? c.warning : action.status === 'approved' ? c.success : action.status === 'rejected' ? c.danger : c.textMuted,
                  }}>
                    {action.status}
                  </span>
                </div>
                {action.reason && <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5, marginBottom: 4 }}>{action.reason}</p>}
                <span style={{ fontSize: 11, color: c.textMuted }}>{new Date(action.created_at).toLocaleDateString()}</span>
              </div>
              {action.status === 'suggested' && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => updateStatus(action.id, 'approved')}
                    disabled={updating === action.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: c.success, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {updating === action.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />} Approve
                  </button>
                  <button
                    onClick={() => updateStatus(action.id, 'rejected')}
                    disabled={updating === action.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textSecondary, fontSize: 12, cursor: 'pointer' }}
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
