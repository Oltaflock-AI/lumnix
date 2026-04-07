'use client';
import { useState, useEffect } from 'react';
import { Rocket, Plus, Loader2, CheckCircle, AlertCircle, Pause, Play, Trash2, X } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useIntegrations } from '@/lib/hooks';
import { useTheme } from '@/lib/theme';

type Campaign = {
  id: string; platform: string; name: string; objective: string;
  status: string; budget_amount: number; currency: string;
  ad_copy: string; keywords: string[]; launched_at: string; created_at: string;
  error_message: string; platform_campaign_id: string;
};

const OBJECTIVES = [
  { id: 'OUTCOME_TRAFFIC', label: 'Traffic', platform: 'meta_ads' },
  { id: 'OUTCOME_ENGAGEMENT', label: 'Engagement', platform: 'meta_ads' },
  { id: 'OUTCOME_LEADS', label: 'Leads', platform: 'meta_ads' },
  { id: 'OUTCOME_SALES', label: 'Sales', platform: 'meta_ads' },
  { id: 'SEARCH', label: 'Search', platform: 'google_ads' },
  { id: 'DISPLAY', label: 'Display', platform: 'google_ads' },
];

function StatusBadge({ status }: { status: string }) {
  const { c } = useTheme();
  const colors: Record<string, { color: string; bg: string }> = {
    draft: { color: c.textMuted, bg: c.bgCardHover },
    pending: { color: c.warning, bg: 'rgba(245,158,11,0.08)' },
    active: { color: c.success, bg: 'rgba(16,185,129,0.08)' },
    paused: { color: c.warning, bg: 'rgba(245,158,11,0.08)' },
    error: { color: c.danger, bg: 'rgba(239,68,68,0.08)' },
    completed: { color: c.textSecondary, bg: c.bgCardHover },
  };
  const s = colors[status] || colors.draft;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, color: s.color, backgroundColor: s.bg }}>{status}</span>;
}

export default function CampaignsPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const workspaceId = workspace?.id;
  const { integrations } = useIntegrations(workspaceId);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);

  // Create form state
  const [platform, setPlatform] = useState<'meta_ads' | 'google_ads'>('meta_ads');
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('OUTCOME_TRAFFIC');
  const [budget, setBudget] = useState('10');
  const [adCopy, setAdCopy] = useState('');
  const [keywords, setKeywords] = useState('');
  const [creating, setCreating] = useState(false);

  const hasMetaAds = integrations.some(i => i.provider === 'meta_ads' && i.status === 'connected');
  const hasGoogleAds = integrations.some(i => i.provider === 'google_ads' && i.status === 'connected');

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/campaigns?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId]);

  async function createCampaign() {
    if (!workspaceId || !name.trim()) return;
    setCreating(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId, platform, name: name.trim(), objective,
        budget_amount: parseFloat(budget) || 10, ad_copy: adCopy,
        keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
      }),
    });
    const d = await res.json();
    if (d.campaign) {
      setCampaigns(prev => [d.campaign, ...prev]);
      setShowCreate(false);
      setName(''); setAdCopy(''); setKeywords('');
    }
    setCreating(false);
  }

  async function launchCampaign(campaignId: string) {
    setLaunching(campaignId);
    const res = await fetch('/api/campaigns/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaignId }),
    });
    const d = await res.json();
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: d.success ? 'active' : 'error', error_message: d.error || null, platform_campaign_id: d.platform_campaign_id || c.platform_campaign_id, launched_at: d.success ? new Date().toISOString() : c.launched_at } : c));
    setLaunching(null);
  }

  async function deleteCampaign(id: string) {
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' as const };

  return (
    <PageShell title="Campaign Launcher" description="Create and launch ad campaigns directly from Lumnix" icon={Rocket}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: c.textMuted }}>
          {hasMetaAds && <span style={{ marginRight: 12 }}>Meta Ads: <span style={{ color: c.success }}>connected</span></span>}
          {hasGoogleAds && <span>Google Ads: <span style={{ color: c.success }}>connected</span></span>}
          {!hasMetaAds && !hasGoogleAds && <span style={{ color: c.warning }}>Connect Meta Ads or Google Ads in Settings to launch campaigns</span>}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!hasMetaAds && !hasGoogleAds}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: 'none', backgroundColor: c.accent, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!hasMetaAds && !hasGoogleAds) ? 0.5 : 1 }}
        >
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Create campaign form */}
      {showCreate && (
        <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: c.text }}>Create Campaign</h3>
            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}><X size={16} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Platform</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {hasMetaAds && <button onClick={() => { setPlatform('meta_ads'); setObjective('OUTCOME_TRAFFIC'); }} style={{ ...inputStyle, textAlign: 'center' as const, fontWeight: platform === 'meta_ads' ? 600 : 400, borderColor: platform === 'meta_ads' ? c.accent : c.border, color: platform === 'meta_ads' ? c.accent : c.textSecondary, cursor: 'pointer' }}>Meta Ads</button>}
                {hasGoogleAds && <button onClick={() => { setPlatform('google_ads'); setObjective('SEARCH'); }} style={{ ...inputStyle, textAlign: 'center' as const, fontWeight: platform === 'google_ads' ? 600 : 400, borderColor: platform === 'google_ads' ? c.accent : c.border, color: platform === 'google_ads' ? c.accent : c.textSecondary, cursor: 'pointer' }}>Google Ads</button>}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Campaign Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring Sale 2026" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Objective</label>
              <select value={objective} onChange={e => setObjective(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {OBJECTIVES.filter(o => o.platform === platform).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Daily Budget (USD)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} min="1" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Ad Copy</label>
            <textarea value={adCopy} onChange={e => setAdCopy(e.target.value)} placeholder="Write your ad copy here..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {platform === 'google_ads' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Keywords (comma-separated)</label>
              <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="running shoes, best sneakers, athletic wear" style={inputStyle} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createCampaign} disabled={creating || !name.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: c.accent, color: 'white', fontSize: 13, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}>
              {creating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
              {creating ? 'Creating...' : 'Create Draft'}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textSecondary, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 80, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12, border: `1px dashed ${c.border}`, backgroundColor: c.bgCard }}>
          <Rocket size={32} color={c.textMuted} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>No campaigns yet</p>
          <p style={{ fontSize: 13, color: c.textMuted }}>Create your first campaign and launch it directly to Meta or Google Ads.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {campaigns.map(camp => (
            <div key={camp.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{camp.name}</span>
                  <StatusBadge status={camp.status} />
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: c.bgCardHover, color: c.textMuted }}>{camp.platform === 'meta_ads' ? 'Meta' : 'Google'}</span>
                </div>
                <div style={{ fontSize: 12, color: c.textMuted }}>
                  ${camp.budget_amount}/day · {camp.objective || 'No objective'}
                  {camp.launched_at && ` · Launched ${new Date(camp.launched_at).toLocaleDateString()}`}
                </div>
                {camp.error_message && <p style={{ fontSize: 12, color: c.danger, marginTop: 4 }}>{camp.error_message}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {camp.status === 'draft' && (
                  <button
                    onClick={() => launchCampaign(camp.id)}
                    disabled={launching === camp.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: c.success, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: launching === camp.id ? 0.7 : 1 }}
                  >
                    {launching === camp.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Rocket size={13} />}
                    Launch
                  </button>
                )}
                {camp.status === 'error' && (
                  <button onClick={() => launchCampaign(camp.id)} disabled={launching === camp.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textSecondary, fontSize: 12, cursor: 'pointer' }}>
                    Retry
                  </button>
                )}
                <button onClick={() => deleteCampaign(camp.id)} style={{ padding: '8px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textMuted, cursor: 'pointer' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
