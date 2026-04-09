'use client';
import { useState, useEffect } from 'react';
import { Eye, Plus, RefreshCw, Trash2, X, Bell, Lightbulb, BarChart3, Zap, ChevronDown, ChevronUp, CheckCircle, Search, Loader2, Globe, TrendingUp, Target } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useTheme } from '@/lib/theme';
import { useWorkspace } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useCompetitors } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

const MONO = 'var(--font-mono), ui-monospace, SFMono-Regular, monospace';

function timeAgo(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatNum(n: number | null | undefined): string {
  if (!n) return '?';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TABS = ['Ads', 'Trends', 'AI Analysis', 'Ideas', 'Alerts', 'Keyword Gap'] as const;
type Tab = typeof TABS[number];

const STATUS_COLS = ['idea', 'review', 'approved', 'production'] as const;

export default function CompetitorsPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const workspaceId = workspace?.id;
  const { competitors, loading: loadingCompetitors, refetch: refetchCompetitors } = useCompetitors(workspaceId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Ads');

  // Add competitor form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPage, setFormPage] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Scrape state
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState<Record<string, { text: string; needsToken?: boolean; needsToS?: boolean }>>({});

  // Dismissable info card
  const [infoDismissed, setInfoDismissed] = useState(() => {
    try { return localStorage.getItem('lumnix-adspy-info-dismissed') === '1'; } catch { return false; }
  });

  // Ads tab
  const [ads, setAds] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adsFilter, setAdsFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [expandedAd, setExpandedAd] = useState<string | null>(null);

  // Analysis tab
  const [analysis, setAnalysis] = useState<any>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState('');

  // Alerts tab
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Trends tab
  const [trends, setTrends] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Keyword Gap tab
  const [keywordGaps, setKeywordGaps] = useState<any[]>([]);
  const [loadingGaps, setLoadingGaps] = useState(false);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  const [gapError, setGapError] = useState('');

  const selectedCompetitor = competitors.find(comp => comp.id === selectedId);

  // Fetch ads when competitor changes
  useEffect(() => {
    if (!selectedId || !workspaceId) return;
    setLoadingAds(true);
    fetch(`/api/competitors/ads?competitor_id=${selectedId}&workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(d => { setAds(d.ads ?? []); setLoadingAds(false); })
      .catch(() => setLoadingAds(false));
  }, [selectedId, workspaceId]);

  // Fetch analysis when tab changes
  useEffect(() => {
    if (!selectedId || activeTab !== 'AI Analysis') return;
    setLoadingAnalysis(true);
    fetch(`/api/competitors/analysis?competitor_id=${selectedId}`)
      .then(r => r.json())
      .then(d => { setAnalysis(d.analysis); setIdeas(d.ideas ?? []); setLoadingAnalysis(false); })
      .catch(() => setLoadingAnalysis(false));
  }, [selectedId, activeTab]);

  // Fetch ideas when tab changes
  useEffect(() => {
    if (!selectedId || activeTab !== 'Ideas') return;
    if (ideas.length > 0) return; // already loaded
    fetch(`/api/competitors/analysis?competitor_id=${selectedId}`)
      .then(r => r.json())
      .then(d => { setAnalysis(d.analysis); setIdeas(d.ideas ?? []); });
  }, [selectedId, activeTab]);

  // Fetch trends
  useEffect(() => {
    if (!selectedId || !workspaceId || activeTab !== 'Trends') return;
    setLoadingTrends(true);
    fetch(`/api/competitors/trends?workspace_id=${workspaceId}&competitor_id=${selectedId}&days=30`)
      .then(r => r.json())
      .then(d => { setTrends(d.trends || []); setLoadingTrends(false); })
      .catch(() => setLoadingTrends(false));
  }, [selectedId, workspaceId, activeTab]);

  // Fetch keyword gaps
  useEffect(() => {
    if (!selectedId || !workspaceId || activeTab !== 'Keyword Gap') return;
    setLoadingGaps(true);
    fetch(`/api/competitors/keyword-gap?workspace_id=${workspaceId}&competitor_id=${selectedId}`)
      .then(r => r.json())
      .then(d => { setKeywordGaps(d.gaps || []); setLoadingGaps(false); })
      .catch(() => setLoadingGaps(false));
  }, [selectedId, workspaceId, activeTab]);

  // Fetch alerts
  useEffect(() => {
    if (!selectedId || activeTab !== 'Alerts') return;
    setLoadingAlerts(true);
    fetch(`/api/competitors/alerts?competitor_id=${selectedId}`)
      .then(r => r.json())
      .then(d => {
        const a = d.alerts ?? [];
        setAlerts(a);
        setUnreadCount(a.filter((x: any) => !x.seen_at).length);
        setLoadingAlerts(false);
      })
      .catch(() => setLoadingAlerts(false));
  }, [selectedId, activeTab]);

  function selectCompetitor(id: string) {
    setSelectedId(id);
    setActiveTab('Ads');
    setAds([]);
    setAnalysis(null);
    setIdeas([]);
    setAlerts([]);
    setUnreadCount(0);
    setKeywordGaps([]);
    setGapError('');
  }

  async function handleAddCompetitor() {
    if (!formName.trim() || !workspaceId) return;
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/competitors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, name: formName.trim(), facebook_page_name: formPage.trim() || formName.trim(), domain: formDomain.trim() || null }),
      });
      const data = await res.json();
      if (data.competitor) {
        setFormName(''); setFormPage(''); setFormDomain('');
        setShowForm(false);
        refetchCompetitors();
      } else {
        setAddError(data.error || 'Failed to add competitor');
      }
    } catch { setAddError('Network error'); }
    setAdding(false);
  }

  async function handleScrape(competitorId: string) {
    if (!workspaceId) return;
    setScrapingId(competitorId);
    setScrapeMsg(prev => ({ ...prev, [competitorId]: { text: '' } }));
    try {
      const res = await fetch('/api/competitors/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, competitor_id: competitorId }),
      });
      const data = await res.json();
      if (data.needsToken) {
        setScrapeMsg(prev => ({ ...prev, [competitorId]: { text: 'Meta token needed', needsToken: true } }));
      } else if (data.needsToS) {
        setScrapeMsg(prev => ({ ...prev, [competitorId]: { text: data.error, needsToS: true } }));
      } else if (data.error) {
        setScrapeMsg(prev => ({ ...prev, [competitorId]: { text: `Error: ${data.error}` } }));
      } else if (data.adsFound === 0 && !data.error) {
        setScrapeMsg(prev => ({ ...prev, [competitorId]: { text: 'No ads found. Try a different Facebook page name, or this brand may not be running Meta ads.' } }));
      } else {
        setScrapeMsg(prev => ({ ...prev, [competitorId]: { text: `${data.adsFound} ads (${data.newAds} new)` } }));
        refetchCompetitors();
        if (competitorId === selectedId) {
          setLoadingAds(true);
          fetch(`/api/competitors/ads?competitor_id=${competitorId}&workspace_id=${workspaceId}`)
            .then(r => r.json())
            .then(d => { setAds(d.ads ?? []); setLoadingAds(false); })
            .catch(() => setLoadingAds(false));
        }
      }
    } catch { setScrapeMsg(prev => ({ ...prev, [competitorId]: { text: 'Error scraping' } })); }
    setScrapingId(null);
  }

  async function handleDelete(competitorId: string) {
    if (!workspaceId || !confirm('Delete this competitor?')) return;
    await fetch(`/api/competitors/${competitorId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    if (selectedId === competitorId) setSelectedId(null);
    refetchCompetitors();
  }

  async function handleAnalyse() {
    if (!selectedId) return;
    setAnalysing(true);
    setAnalyseError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/competitors/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ competitor_id: selectedId }),
      });
      const data = await res.json();
      if (data.error) { setAnalyseError(data.error); }
      else { setAnalysis(data.analysis); setIdeas(data.ideas ?? []); }
    } catch { setAnalyseError('Analysis failed'); }
    setAnalysing(false);
  }

  async function handleMarkAlertsRead() {
    if (!selectedId) return;
    await fetch('/api/competitors/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitor_id: selectedId }),
    });
    setAlerts(prev => prev.map(a => ({ ...a, seen_at: a.seen_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  async function handleIdeaStatus(ideaId: string, status: string) {
    await fetch(`/api/ad-ideas/${ideaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status } : i));
  }

  const filteredAds = ads.filter(ad => {
    if (adsFilter === 'active') return ad.is_active;
    if (adsFilter === 'paused') return !ad.is_active;
    return true;
  });

  // Computed stats
  const totalKeywordsAnalyzed = keywordGaps.length;
  const totalGapsFound = keywordGaps.filter((g: any) => g.difficulty === 'low' || g.difficulty === 'medium').length;

  // ── Shared Styles ──────────────────────────────────────────
  const card: React.CSSProperties = { backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '16px' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: '13px', boxSizing: 'border-box' as const };
  const primaryBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: '8px', border: 'none', background: c.accent, color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
  const ghostBtn: React.CSSProperties = { padding: '6px 14px', borderRadius: '8px', border: `1px solid ${c.borderStrong}`, background: 'transparent', color: c.textSecondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' };

  const filterBtn = (active?: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    border: active ? `1px solid ${c.accent}` : `1px solid ${c.border}`,
    background: active ? c.accentSubtle : 'transparent',
    color: active ? c.accent : c.textSecondary,
  });

  return (
    <PageShell title="Competitor Ad Spy" description="Track what your competitors are running" icon={Eye} badge="AD LIBRARY">

      {/* ── HERO STAT BAR ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Competitors Tracked', value: competitors.length, icon: Globe, color: c.accent },
          { label: 'Keywords Analyzed', value: totalKeywordsAnalyzed, icon: TrendingUp, color: c.warning },
          { label: 'Gaps Found', value: totalGapsFound, icon: Target, color: c.success },
        ].map(stat => (
          <div key={stat.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c.accentSubtle, border: `1px solid ${c.border}` }}>
              <stat.icon size={18} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: c.text, fontFamily: MONO, lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: c.textMuted, marginTop: '2px', letterSpacing: '0.02em' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── INFO BANNER ──────────────────────────────────── */}
      {!infoDismissed && (
        <div style={{ marginBottom: '20px', padding: '16px 20px', borderRadius: '12px', backgroundColor: c.accentSubtle, border: `1px solid ${c.border}`, position: 'relative' }}>
          <button onClick={() => { setInfoDismissed(true); try { localStorage.setItem('lumnix-adspy-info-dismissed', '1'); } catch {} }} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '2px' }}>
            <X size={14} />
          </button>
          <div style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '6px' }}>Competitor Ad Spy</div>
          <p style={{ margin: '0 0 6px', fontSize: '13px', color: c.textSecondary, lineHeight: 1.5 }}>
            Pulls ads from the Meta Ad Library to show you what competitors are running.
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: c.textMuted, lineHeight: 1.5 }}>
            Requirements: META_ACCESS_TOKEN env var + <a href="https://www.facebook.com/ads/library/api/" target="_blank" rel="noopener noreferrer" style={{ color: c.accent, textDecoration: 'underline' }}>Meta Ad Library ToS</a> accepted
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* ── LEFT SIDEBAR ──────────────────────────────────── */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Competitors</span>
            <button onClick={() => { setShowForm(!showForm); setAddError(''); }} style={{ ...primaryBtn, padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {showForm ? <X size={12} /> : <Plus size={12} />}
              {showForm ? 'Cancel' : 'Add'}
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div style={{ ...card, marginBottom: '12px', border: `1px solid ${c.accent}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: c.textSecondary, marginBottom: '4px' }}>Brand Name *</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Nike" style={inputStyle} onFocus={e => e.target.style.borderColor = c.accent} onBlur={e => e.target.style.borderColor = c.border} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: c.textSecondary, marginBottom: '4px' }}>Facebook Page Name *</label>
                  <input value={formPage} onChange={e => setFormPage(e.target.value)} placeholder="Exact name as on Facebook (e.g. Nike)" style={{ ...inputStyle, borderColor: c.accent }} onFocus={e => e.target.style.borderColor = c.accent} onBlur={e => e.target.style.borderColor = c.accent} />
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: c.textMuted }}>Used to find the brand in Meta Ad Library</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: c.textSecondary, marginBottom: '4px' }}>Domain (optional)</label>
                  <input value={formDomain} onChange={e => setFormDomain(e.target.value)} placeholder="nike.com" style={inputStyle} onFocus={e => e.target.style.borderColor = c.accent} onBlur={e => e.target.style.borderColor = c.border} />
                </div>
                {addError && <p style={{ fontSize: '12px', color: c.danger, margin: 0 }}>{addError}</p>}
                <button onClick={handleAddCompetitor} disabled={adding || !formName.trim()} style={{ ...primaryBtn, opacity: adding ? 0.7 : 1, cursor: adding ? 'not-allowed' : 'pointer' }}>
                  {adding ? 'Adding...' : 'Add Competitor'}
                </button>
              </div>
            </div>
          )}

          {/* Competitor cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingCompetitors ? (
              <p style={{ fontSize: '13px', color: c.textMuted, textAlign: 'center', padding: '20px 0' }}>Loading...</p>
            ) : competitors.length === 0 ? (
              <p style={{ fontSize: '13px', color: c.textMuted, textAlign: 'center', padding: '20px 0' }}>No competitors yet</p>
            ) : competitors.map(comp => (
              <div key={comp.id} onClick={() => selectCompetitor(comp.id)}
                style={{
                  backgroundColor: selectedId === comp.id ? c.surfaceElevated : c.bgCard,
                  border: selectedId === comp.id ? `1px solid ${c.accent}` : `1px solid ${c.border}`,
                  borderRadius: '12px', padding: '14px', cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: c.text }}>{comp.name}</p>
                    {comp.domain && <p style={{ margin: '2px 0 0', fontSize: '11px', color: c.textMuted }}>{comp.domain}</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(comp.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '2px' }}>
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Last analyzed + gap count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: c.textSecondary, fontFamily: MONO }}>{comp.ad_count ?? 0} ads</span>
                  {comp.spy_score > 0 && <span style={{ fontSize: '12px', color: c.accent, fontFamily: MONO }}>Score {comp.spy_score}</span>}
                  {comp.last_scraped_at && <span style={{ fontSize: '11px', color: c.textMuted }}>Scraped {timeAgo(comp.last_scraped_at)}</span>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={e => { e.stopPropagation(); handleScrape(comp.id); }} disabled={scrapingId === comp.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '8px',
                      border: `1px solid ${c.borderStrong}`,
                      background: scrapingId === comp.id ? c.surfaceElevated : 'transparent',
                      color: scrapingId === comp.id ? c.textMuted : c.textSecondary,
                      fontSize: '11px', fontWeight: 600, cursor: scrapingId === comp.id ? 'not-allowed' : 'pointer',
                    }}>
                    <RefreshCw size={10} style={{ animation: scrapingId === comp.id ? 'spin 1s linear infinite' : 'none' }} />
                    {scrapingId === comp.id ? 'Scraping...' : 'Scrape'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); selectCompetitor(comp.id); setActiveTab('Keyword Gap'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '8px',
                      border: 'none', background: c.accentSubtle, color: c.accent,
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    }}>
                    <Search size={10} /> Analyze
                  </button>
                </div>

                {scrapeMsg[comp.id]?.text && (
                  scrapeMsg[comp.id].needsToken ? (
                    <div style={{ margin: '10px 0 0', padding: '10px 12px', borderRadius: '8px', backgroundColor: c.warningSubtle, border: `1px solid ${c.border}`, fontSize: '12px', color: c.warning, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>Meta Access Token Required</div>
                      <div style={{ color: c.textSecondary }}>To use Competitor Ad Spy, you need a Meta access token configured.</div>
                      <ol style={{ margin: '6px 0 0', paddingLeft: '16px', color: c.textMuted }}>
                        <li>Go to developers.facebook.com &rarr; your app &rarr; Tools &rarr; Graph API Explorer</li>
                        <li>Generate a long-lived user token with ads_read permission</li>
                        <li>Add it as META_ACCESS_TOKEN in your Vercel environment variables</li>
                      </ol>
                    </div>
                  ) : scrapeMsg[comp.id].needsToS ? (
                    <div style={{ margin: '10px 0 0', padding: '10px 12px', borderRadius: '8px', backgroundColor: c.warningSubtle, border: `1px solid ${c.border}`, fontSize: '12px', color: c.warning, lineHeight: 1.5 }}>
                      Please accept the Meta Ad Library Terms of Service: <a href="https://www.facebook.com/ads/library/api/" target="_blank" rel="noopener noreferrer" style={{ color: c.accent, textDecoration: 'underline' }}>facebook.com/ads/library/api/</a>
                    </div>
                  ) : (
                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: scrapeMsg[comp.id].text.includes('ads (') ? c.success : c.danger }}>{scrapeMsg[comp.id].text}</p>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedId ? (
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
              <Eye size={40} color={c.textMuted} />
              <p style={{ color: c.textSecondary, fontSize: '15px', margin: 0 }}>Select a competitor to view their ads</p>
              <p style={{ color: c.textMuted, fontSize: '13px', margin: 0 }}>Add a competitor on the left, then click Scrape to fetch their ads</p>
            </div>
          ) : (
            <div>
              {/* Competitor header */}
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: c.text }}>{selectedCompetitor?.name}</h2>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: c.textSecondary }}>{selectedCompetitor?.ad_count ?? 0} total ads</span>
                  {selectedCompetitor?.active_ads_count != null && <span style={{ fontSize: '13px', color: c.success }}>{selectedCompetitor.active_ads_count} active</span>}
                  {selectedCompetitor?.last_scraped_at && <span style={{ fontSize: '13px', color: c.textMuted }}>Last scraped {timeAgo(selectedCompetitor.last_scraped_at)}</span>}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${c.border}`, marginBottom: '20px' }}>
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                      fontSize: '14px', fontWeight: 500,
                      color: activeTab === tab ? c.text : c.textSecondary,
                      borderBottom: activeTab === tab ? `2px solid ${c.accent}` : '2px solid transparent',
                      position: 'relative',
                    }}>
                    {tab}
                    {tab === 'Alerts' && unreadCount > 0 && (
                      <span style={{ marginLeft: '6px', background: c.accent, color: '#FFFFFF', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px' }}>{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── ADS TAB ──────────────────────────────────── */}
              {activeTab === 'Ads' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {(['all', 'active', 'paused'] as const).map(f => (
                      <button key={f} onClick={() => setAdsFilter(f)} style={filterBtn(adsFilter === f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${ads.length})` : f === 'active' ? `(${ads.filter(a => a.is_active).length})` : `(${ads.filter(a => !a.is_active).length})`}
                      </button>
                    ))}
                  </div>
                  {loadingAds ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>Loading ads...</div>
                  ) : filteredAds.length === 0 ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px', color: c.textMuted }}>
                      <Eye size={32} color={c.textMuted} style={{ margin: '0 auto 12px' }} />
                      <p style={{ margin: 0 }}>No ads yet. Click Scrape on the left to fetch ads.</p>
                      {!process.env.NEXT_PUBLIC_META_TOKEN_SET && (
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: c.warning }}>Meta Access Token not configured — add META_ACCESS_TOKEN to Vercel env vars</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {filteredAds.map(ad => (
                        <div key={ad.id} style={{ ...card, cursor: 'pointer' }} onClick={() => setExpandedAd(expandedAd === ad.id ? null : ad.id)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{
                              fontSize: '11px', padding: '3px 10px', borderRadius: '99px', fontWeight: 600,
                              background: ad.is_active ? c.successSubtle : 'rgba(136,136,136,0.1)',
                              color: ad.is_active ? c.success : c.textMuted,
                              border: `1px solid ${ad.is_active ? c.successBorder : c.border}`,
                            }}>
                              {ad.is_active ? 'ACTIVE' : 'PAUSED'}
                            </span>
                            {expandedAd === ad.id ? <ChevronUp size={14} color={c.textMuted} /> : <ChevronDown size={14} color={c.textMuted} />}
                          </div>
                          {ad.ad_creative_link_title && (
                            <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: c.text, lineHeight: 1.4 }}>{ad.ad_creative_link_title}</p>
                          )}
                          {ad.ad_creative_body && (
                            <p style={{ margin: '0 0 8px', fontSize: '13px', color: c.textSecondary, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: expandedAd === ad.id ? undefined : 2, WebkitBoxOrient: 'vertical', overflow: expandedAd === ad.id ? 'visible' : 'hidden' }}>
                              {ad.ad_creative_body}
                            </p>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                            {(ad.platforms ?? []).map((p: string) => (
                              <span key={p} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: c.accentSubtle, color: c.accent, border: `1px solid ${c.border}` }}>{p}</span>
                            ))}
                            {(ad.impressions_upper ?? 0) > 0 && (
                              <span style={{ fontSize: '11px', color: c.textMuted, fontFamily: MONO }}>{formatNum(ad.impressions_lower)}–{formatNum(ad.impressions_upper)} imp.</span>
                            )}
                            {ad.ad_delivery_start_time && (
                              <span style={{ fontSize: '11px', color: c.textMuted }}>Started {formatDate(ad.ad_delivery_start_time)}</span>
                            )}
                          </div>
                          {expandedAd === ad.id && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              {ad.landing_url && (
                                <a href={ad.landing_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: c.accent, textDecoration: 'none' }}>View Ad &#8599;</a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!workspace?.id) return;
                                  fetch('/api/creative/saves', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      workspace_id: workspace.id,
                                      source_type: 'meta_ad_library',
                                      source_id: ad.id,
                                      title: ad.ad_creative_link_title || '',
                                      ad_copy: ad.ad_creative_body || '',
                                      advertiser_name: ad.page_name || selectedCompetitor?.name || '',
                                      platform: (ad.platforms || [])[0] || 'facebook',
                                      started_running: ad.ad_delivery_start_time || null,
                                      landing_page_url: ad.landing_url || '',
                                      tags: (ad.platforms || []),
                                    }),
                                  }).then(r => r.json()).then(d => {
                                    if (d.save) alert('Saved to Creative Studio!');
                                  });
                                }}
                                style={{ fontSize: 12, color: c.accent, background: 'none', border: `1px solid ${c.accent}30`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 500 }}
                              >
                                Save to swipe file
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TRENDS TAB ──────────────────────────── */}
              {activeTab === 'Trends' && (
                <div>
                  {loadingTrends ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>Loading trend data...</div>
                  ) : trends.length === 0 ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                      <TrendingUp size={40} color={c.textMuted} style={{ margin: '0 auto 16px' }} />
                      <p style={{ margin: '0 0 8px', color: c.textSecondary, fontSize: '15px' }}>No trend data yet</p>
                      <p style={{ margin: 0, color: c.textMuted, fontSize: '13px' }}>
                        The spy agent collects daily snapshots automatically. Scrape ads first, then trends will appear within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Trend Summary Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                        {(() => {
                          const latest = trends[trends.length - 1];
                          const prev = trends.length > 1 ? trends[trends.length - 2] : null;
                          const adChange = prev ? latest.active_ads - prev.active_ads : 0;
                          return [
                            { label: 'Active Ads', value: latest.active_ads, change: adChange },
                            { label: 'Total Ads', value: latest.total_ads },
                            { label: 'Est. Spend', value: `₹${(latest.estimated_spend_lower || 0).toLocaleString()} - ₹${(latest.estimated_spend_upper || 0).toLocaleString()}` },
                            { label: 'New Today', value: latest.new_ads_today || 0 },
                          ].map((s, i) => (
                            <div key={i} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 10, padding: 16 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{ fontSize: 22, fontWeight: 600, color: c.text, fontFamily: 'var(--font-mono)' }}>{s.value}</span>
                                {'change' in s && s.change !== 0 && (
                                  <span style={{ fontSize: 11, fontWeight: 600, color: (s.change as number) > 0 ? '#22c55e' : '#ef4444' }}>
                                    {(s.change as number) > 0 ? '+' : ''}{s.change}
                                  </span>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Trend Table */}
                      <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 80px 80px 80px 1fr', gap: '8px', padding: '10px 16px', borderBottom: `1px solid ${c.border}`, backgroundColor: c.surfaceElevated }}>
                          {['Date', 'Active', 'Total', 'New', 'Paused', 'Est. Spend'].map(h => (
                            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase' }}>{h}</span>
                          ))}
                        </div>
                        {[...trends].reverse().slice(0, 30).map((t: any, i: number) => (
                          <div key={t.id || i} style={{ display: 'grid', gridTemplateColumns: '120px 80px 80px 80px 80px 1fr', gap: '8px', padding: '10px 16px', borderBottom: `1px solid ${c.border}`, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: c.text }}>{new Date(t.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span style={{ fontSize: 13, color: c.text, fontFamily: 'var(--font-mono)' }}>{t.active_ads}</span>
                            <span style={{ fontSize: 13, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{t.total_ads}</span>
                            <span style={{ fontSize: 13, color: t.new_ads_today > 0 ? '#22c55e' : c.textMuted, fontFamily: 'var(--font-mono)' }}>{t.new_ads_today > 0 ? `+${t.new_ads_today}` : '0'}</span>
                            <span style={{ fontSize: 13, color: t.paused_today > 0 ? '#ef4444' : c.textMuted, fontFamily: 'var(--font-mono)' }}>{t.paused_today || '0'}</span>
                            <span style={{ fontSize: 12, color: c.textSecondary }}>${(t.estimated_spend_lower || 0).toLocaleString()} - ${(t.estimated_spend_upper || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Platform Breakdown */}
                      {trends.length > 0 && trends[trends.length - 1].top_platforms?.length > 0 && (
                        <div style={{ marginTop: 16, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 12 }}>Platform Breakdown</h4>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {trends[trends.length - 1].top_platforms.map((p: any) => (
                              <span key={p.platform} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, backgroundColor: c.accentSubtle, color: c.accent, fontWeight: 600 }}>
                                {p.platform}: {p.count} ads
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── AI ANALYSIS TAB ──────────────────────────── */}
              {activeTab === 'AI Analysis' && (
                <div>
                  {loadingAnalysis ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>Loading analysis...</div>
                  ) : !analysis ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                      <BarChart3 size={40} color={c.textMuted} style={{ margin: '0 auto 16px' }} />
                      <p style={{ margin: '0 0 8px', color: c.textSecondary, fontSize: '15px' }}>No analysis yet</p>
                      <p style={{ margin: '0 0 20px', color: c.textMuted, fontSize: '13px' }}>Run AI analysis to get hook patterns, messaging angles, and counter-strategies</p>
                      {analyseError && <p style={{ color: c.danger, fontSize: '13px', margin: '0 0 12px' }}>{analyseError}</p>}
                      <button onClick={handleAnalyse} disabled={analysing} style={{ ...primaryBtn, padding: '10px 24px', borderRadius: '10px', fontSize: '14px', opacity: analysing ? 0.7 : 1, cursor: analysing ? 'not-allowed' : 'pointer' }}>
                        {analysing ? 'Analysing...' : 'Run AI Analysis'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: c.textMuted }}>Last analysed {timeAgo(analysis.created_at)} · {analysis.ads_analysed_count} ads</span>
                        <button onClick={handleAnalyse} disabled={analysing} style={ghostBtn}>
                          {analysing ? 'Analysing...' : 'Re-analyse'}
                        </button>
                      </div>

                      {/* Hook Patterns */}
                      {analysis.hook_patterns?.length > 0 && (
                        <div style={card}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: c.text }}>Hook Patterns</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {analysis.hook_patterns.map((h: any, i: number) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: c.accentSubtle, color: c.accent, border: `1px solid ${c.border}`, flexShrink: 0, fontFamily: MONO }}>{h.count}x</span>
                                <div>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: c.text }}>{h.pattern}</p>
                                  {h.example && <p style={{ margin: '2px 0 0', fontSize: '12px', color: c.textSecondary, fontStyle: 'italic' }}>"{h.example}"</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Messaging Angles */}
                      {analysis.messaging_angles?.length > 0 && (
                        <div style={card}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: c.text }}>Messaging Angles</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {analysis.messaging_angles.map((a: any, i: number) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{
                                  fontSize: '11px', padding: '2px 8px', borderRadius: '99px', flexShrink: 0,
                                  background: a.strength === 'primary' ? c.successSubtle : 'rgba(136,136,136,0.08)',
                                  color: a.strength === 'primary' ? c.success : c.textMuted,
                                  border: `1px solid ${a.strength === 'primary' ? c.successBorder : c.border}`,
                                }}>{a.strength}</span>
                                <div>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: c.text }}>{a.angle}</p>
                                  {a.description && <p style={{ margin: '2px 0 0', fontSize: '12px', color: c.textSecondary }}>{a.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Offer Mechanics */}
                      {analysis.offer_mechanics?.length > 0 && (
                        <div style={card}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: c.text }}>Offer Mechanics</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {analysis.offer_mechanics.map((o: any, i: number) => (
                              <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', background: c.bgCard, border: `1px solid ${c.border}` }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: c.text }}>{o.type}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: c.textSecondary, fontFamily: MONO }}>{o.frequency}x · {o.example}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Visual Style */}
                      {analysis.visual_style && (
                        <div style={card}>
                          <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: c.text }}>Visual Style</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: c.textSecondary, lineHeight: 1.6 }}>{analysis.visual_style}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── IDEAS TAB ──────────────────────────────────── */}
              {activeTab === 'Ideas' && (
                <div>
                  {ideas.length === 0 ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                      <Lightbulb size={40} color={c.textMuted} style={{ margin: '0 auto 16px' }} />
                      <p style={{ margin: '0 0 8px', color: c.textSecondary, fontSize: '15px' }}>No ideas yet</p>
                      <p style={{ margin: '0 0 20px', color: c.textMuted, fontSize: '13px' }}>Run AI Analysis first to generate counter-strategy ad ideas</p>
                      <button onClick={() => setActiveTab('AI Analysis')} style={{ ...primaryBtn, padding: '10px 24px', borderRadius: '10px', fontSize: '14px' }}>
                        Go to AI Analysis
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {STATUS_COLS.map(col => (
                        <div key={col}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', background: c.bgCard, border: `1px solid ${c.border}` }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: c.textSecondary, textTransform: 'capitalize' }}>{col}</span>
                            <span style={{ fontSize: '11px', background: c.surfaceElevated, color: c.textSecondary, padding: '1px 6px', borderRadius: '99px', fontFamily: MONO }}>{ideas.filter(i => i.status === col).length}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {ideas.filter(i => i.status === col).map(idea => (
                              <div key={idea.id} style={{ ...card, padding: '12px' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: c.text, lineHeight: 1.4 }}>{idea.hook}</p>
                                {idea.body_copy && <p style={{ margin: '0 0 8px', fontSize: '12px', color: c.textSecondary, lineHeight: 1.5 }}>{idea.body_copy.slice(0, 100)}{idea.body_copy.length > 100 ? '...' : ''}</p>}
                                {idea.cta && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: c.accentSubtle, color: c.accent, display: 'inline-block', marginBottom: '8px', border: `1px solid ${c.border}` }}>{idea.cta}</span>}
                                {idea.counter_angle && <p style={{ margin: '0 0 8px', fontSize: '11px', color: c.textMuted, fontStyle: 'italic' }}>{idea.counter_angle}</p>}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {STATUS_COLS.filter(s => s !== col).map(s => (
                                    <button key={s} onClick={() => handleIdeaStatus(idea.id, s)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${c.border}`, background: 'transparent', color: c.textMuted, cursor: 'pointer' }}>
                                      &rarr; {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ALERTS TAB ──────────────────────────────────── */}
              {activeTab === 'Alerts' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: c.textSecondary }}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAlertsRead} style={ghostBtn}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {loadingAlerts ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: c.textMuted }}>Loading alerts...</div>
                  ) : alerts.length === 0 ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px', color: c.textMuted }}>
                      <Bell size={32} color={c.textMuted} style={{ margin: '0 auto 12px' }} />
                      <p style={{ margin: 0 }}>No changes detected yet. Scrape to start monitoring.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {alerts.map(alert => (
                        <div key={alert.id} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: '12px', opacity: alert.seen_at ? 0.6 : 1 }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            background: alert.change_type === 'new_ad' ? c.successSubtle : c.warningSubtle,
                            border: `1px solid ${alert.change_type === 'new_ad' ? c.successBorder : c.warningBorder}`,
                          }}>
                            {alert.change_type === 'new_ad' ? <Zap size={14} color={c.success} /> : <Bell size={14} color={c.warning} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', color: c.text }}>{alert.description}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: c.textMuted }}>{timeAgo(alert.created_at)}</p>
                          </div>
                          {!alert.seen_at && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.accent, flexShrink: 0, marginTop: '6px' }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── KEYWORD GAP TAB ──────────────────────────── */}
              {activeTab === 'Keyword Gap' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: c.textSecondary }}>
                        Keywords your competitor likely targets that you don't rank for.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!workspaceId || !selectedId) return;
                        setAnalyzingGaps(true);
                        setGapError('');
                        try {
                          const res = await fetch('/api/competitors/keyword-gap', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ workspace_id: workspaceId, competitor_id: selectedId }),
                          });
                          const data = await res.json();
                          if (data.error) {
                            setGapError(data.error);
                          } else {
                            setKeywordGaps(data.gaps || []);
                          }
                        } catch {
                          setGapError('Analysis failed');
                        }
                        setAnalyzingGaps(false);
                      }}
                      disabled={analyzingGaps}
                      style={{
                        ...primaryBtn,
                        display: 'flex', alignItems: 'center', gap: '8px',
                        opacity: analyzingGaps ? 0.7 : 1, cursor: analyzingGaps ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {analyzingGaps ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                      {analyzingGaps ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </div>

                  {gapError && (
                    <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: '8px', backgroundColor: c.dangerSubtle, border: `1px solid ${c.border}`, color: c.danger, fontSize: 13 }}>
                      {gapError}
                    </div>
                  )}

                  {loadingGaps ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>Loading keyword gaps...</div>
                  ) : keywordGaps.length === 0 ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                      <Search size={40} color={c.textMuted} style={{ margin: '0 auto 16px' }} />
                      <p style={{ margin: '0 0 8px', color: c.textSecondary, fontSize: '15px' }}>No keyword gaps found</p>
                      <p style={{ margin: 0, color: c.textMuted, fontSize: '13px' }}>
                        {selectedCompetitor?.domain
                          ? 'Click "Analyze" to scrape competitor pages and find keyword opportunities'
                          : 'Add a domain to this competitor first, then click Analyze'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 100px 2fr', gap: '12px', padding: '12px 16px', borderBottom: `1px solid ${c.border}`, backgroundColor: c.surfaceElevated }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keyword</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Competitor Page</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Difficulty</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Action</span>
                      </div>
                      {/* Table rows */}
                      {keywordGaps.map((gap: any, i: number) => {
                        const isEasy = gap.difficulty === 'low';
                        const isMedium = gap.difficulty === 'medium';
                        const diffColor = isEasy ? c.success : isMedium ? c.warning : c.danger;
                        const diffBg = isEasy ? c.successSubtle : isMedium ? c.warningSubtle : c.dangerSubtle;
                        const diffBorder = isEasy ? c.successBorder : isMedium ? c.warningBorder : c.dangerBorder;
                        const diffLabel = isEasy ? 'Easy' : isMedium ? 'Medium' : 'Hard';
                        return (
                          <div key={gap.id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 100px 2fr', gap: '12px', padding: '12px 16px', borderBottom: i < keywordGaps.length - 1 ? `1px solid ${c.border}` : 'none', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{gap.keyword}</span>
                            <span style={{ fontSize: 12, color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {gap.competitor_url ? (
                                <a href={gap.competitor_url} target="_blank" rel="noopener noreferrer" style={{ color: c.accent, textDecoration: 'none' }}>
                                  {gap.competitor_url.replace(/^https?:\/\//, '').slice(0, 40)}
                                </a>
                              ) : '—'}
                            </span>
                            <span style={{
                              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6,
                              backgroundColor: diffBg, color: diffColor, border: `1px solid ${diffBorder}`,
                              textAlign: 'center', width: 'fit-content',
                            }}>
                              {diffLabel}
                            </span>
                            <span style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.5 }}>{gap.recommended_action || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );
}
