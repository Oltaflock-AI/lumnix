'use client';
import { useState, useEffect } from 'react';
import { Eye, Plus, RefreshCw, Trash2, X, Bell, Lightbulb, BarChart3, Zap, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useTheme } from '@/lib/theme';
import { useWorkspace } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useCompetitors } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

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

const TABS = ['Ads', 'AI Analysis', 'Ideas', 'Alerts'] as const;
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
  const [scrapeMsg, setScrapeMsg] = useState<Record<string, string>>({});

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

  const selectedCompetitor = competitors.find(c => c.id === selectedId);

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
    setScrapeMsg(prev => ({ ...prev, [competitorId]: '' }));
    try {
      const res = await fetch('/api/competitors/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, competitor_id: competitorId }),
      });
      const data = await res.json();
      if (data.needsToken) {
        setScrapeMsg(prev => ({ ...prev, [competitorId]: '⚠️ Meta token needed' }));
      } else if (data.error) {
        setScrapeMsg(prev => ({ ...prev, [competitorId]: `Error: ${data.error}` }));
      } else {
        setScrapeMsg(prev => ({ ...prev, [competitorId]: `✓ ${data.adsFound} ads (${data.newAds} new)` }));
        refetchCompetitors();
        if (competitorId === selectedId) {
          setLoadingAds(true);
          fetch(`/api/competitors/ads?competitor_id=${competitorId}&workspace_id=${workspaceId}`)
            .then(r => r.json())
            .then(d => { setAds(d.ads ?? []); setLoadingAds(false); })
            .catch(() => setLoadingAds(false));
        }
      }
    } catch { setScrapeMsg(prev => ({ ...prev, [competitorId]: 'Error scraping' })); }
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

  const card = { backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '16px' };
  const btn = (active?: boolean) => ({
    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid #7c3aed' : `1px solid ${c.border}`,
    background: active ? '#7c3aed22' : 'transparent',
    color: active ? '#a78bfa' : c.textSecondary,
  });

  return (
    <PageShell title="Competitor Ad Spy" description="Track what your competitors are running" icon={Eye} badge="AD LIBRARY">
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Competitors</span>
            <button onClick={() => { setShowForm(!showForm); setAddError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {showForm ? <X size={12} /> : <Plus size={12} />}
              {showForm ? 'Cancel' : 'Add'}
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div style={{ ...card, marginBottom: '12px', border: '1px solid #7c3aed' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: c.textSecondary, marginBottom: '4px' }}>Brand Name *</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Nike" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${c.border}`, backgroundColor: c.bgPage, color: c.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: c.textSecondary, marginBottom: '4px' }}>Search Term *</label>
                  <input value={formPage} onChange={e => setFormPage(e.target.value)} placeholder="e.g. Nike" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #7c3aed', backgroundColor: c.bgPage, color: c.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: c.textSecondary, marginBottom: '4px' }}>Domain (optional)</label>
                  <input value={formDomain} onChange={e => setFormDomain(e.target.value)} placeholder="nike.com" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${c.border}`, backgroundColor: c.bgPage, color: c.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {addError && <p style={{ fontSize: '12px', color: '#f87171', margin: 0 }}>{addError}</p>}
                <button onClick={handleAddCompetitor} disabled={adding || !formName.trim()} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: 'white', fontSize: '13px', fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}>
                  {adding ? 'Adding...' : 'Add Competitor'}
                </button>
              </div>
            </div>
          )}

          {/* Competitor list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingCompetitors ? (
              <p style={{ fontSize: '13px', color: c.textMuted, textAlign: 'center', padding: '20px 0' }}>Loading...</p>
            ) : competitors.length === 0 ? (
              <p style={{ fontSize: '13px', color: c.textMuted, textAlign: 'center', padding: '20px 0' }}>No competitors yet</p>
            ) : competitors.map(c => (
              <div key={c.id} onClick={() => selectCompetitor(c.id)}
                style={{ ...card, cursor: 'pointer', border: selectedId === c.id ? '1px solid #7c3aed' : `1px solid ${c.border}`, padding: '12px', background: selectedId === c.id ? c.bgCard : c.bgPage }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: c.text }}>{c.name}</p>
                    {c.domain && <p style={{ margin: '2px 0 0', fontSize: '11px', color: c.textMuted }}>{c.domain}</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '2px' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: c.textSecondary }}>{c.ad_count ?? 0} ads</span>
                    {c.spy_score > 0 && <span style={{ fontSize: '12px', color: '#7c3aed' }}>Score {c.spy_score}</span>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleScrape(c.id); }} disabled={scrapingId === c.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: scrapingId === c.id ? c.bgInput : '#7c3aed22', color: scrapingId === c.id ? c.textMuted : '#a78bfa', fontSize: '11px', fontWeight: 600, cursor: scrapingId === c.id ? 'not-allowed' : 'pointer' }}>
                    <RefreshCw size={10} style={{ animation: scrapingId === c.id ? 'spin 1s linear infinite' : 'none' }} />
                    {scrapingId === c.id ? 'Scraping...' : 'Scrape'}
                  </button>
                </div>
                {scrapeMsg[c.id] && <p style={{ margin: '6px 0 0', fontSize: '11px', color: scrapeMsg[c.id].startsWith('✓') ? '#4ade80' : '#f87171' }}>{scrapeMsg[c.id]}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedId ? (
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
              <Eye size={40} color="#27272a" />
              <p style={{ color: c.textMuted, fontSize: '15px', margin: 0 }}>Select a competitor to view their ads</p>
              <p style={{ color: c.border, fontSize: '13px', margin: 0 }}>Add a competitor on the left, then click Scrape to fetch their ads</p>
            </div>
          ) : (
            <div>
              {/* Competitor header */}
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: c.text }}>{selectedCompetitor?.name}</h2>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: c.textSecondary }}>{selectedCompetitor?.ad_count ?? 0} total ads</span>
                  {selectedCompetitor?.active_ads_count != null && <span style={{ fontSize: '13px', color: '#4ade80' }}>{selectedCompetitor.active_ads_count} active</span>}
                  {selectedCompetitor?.last_scraped_at && <span style={{ fontSize: '13px', color: c.textMuted }}>Last scraped {timeAgo(selectedCompetitor.last_scraped_at)}</span>}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${c.border}`, marginBottom: '20px' }}>
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: activeTab === tab ? c.text : c.textSecondary, borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent', position: 'relative' }}>
                    {tab}
                    {tab === 'Alerts' && unreadCount > 0 && (
                      <span style={{ marginLeft: '6px', background: '#7c3aed', color: 'white', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px' }}>{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ADS TAB */}
              {activeTab === 'Ads' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {(['all', 'active', 'paused'] as const).map(f => (
                      <button key={f} onClick={() => setAdsFilter(f)} style={btn(adsFilter === f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${ads.length})` : f === 'active' ? `(${ads.filter(a => a.is_active).length})` : `(${ads.filter(a => !a.is_active).length})`}
                      </button>
                    ))}
                  </div>
                  {loadingAds ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>Loading ads...</div>
                  ) : filteredAds.length === 0 ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px', color: c.textMuted }}>
                      <Eye size={32} color="#27272a" style={{ margin: '0 auto 12px' }} />
                      <p style={{ margin: 0 }}>No ads yet. Click Scrape on the left to fetch ads.</p>
                      {!process.env.NEXT_PUBLIC_META_TOKEN_SET && (
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#f59e0b' }}>⚠️ Meta Access Token not configured — add META_ACCESS_TOKEN to Vercel env vars</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {filteredAds.map(ad => (
                        <div key={ad.id} style={{ ...card, cursor: 'pointer' }} onClick={() => setExpandedAd(expandedAd === ad.id ? null : ad.id)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: ad.is_active ? '#052e16' : '#1c1917', color: ad.is_active ? '#4ade80' : '#78716c', fontWeight: 600 }}>
                              {ad.is_active ? '● ACTIVE' : '○ PAUSED'}
                            </span>
                            {expandedAd === ad.id ? <ChevronUp size={14} color="#52525b" /> : <ChevronDown size={14} color="#52525b" />}
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
                              <span key={p} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: c.bgTag, color: '#818cf8' }}>{p}</span>
                            ))}
                            {(ad.impressions_upper ?? 0) > 0 && (
                              <span style={{ fontSize: '11px', color: c.textMuted }}>{formatNum(ad.impressions_lower)}–{formatNum(ad.impressions_upper)} imp.</span>
                            )}
                            {ad.ad_delivery_start_time && (
                              <span style={{ fontSize: '11px', color: c.textMuted }}>Started {formatDate(ad.ad_delivery_start_time)}</span>
                            )}
                          </div>
                          {expandedAd === ad.id && ad.landing_url && (
                            <a href={ad.landing_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: '#7c3aed' }}>View Ad ↗</a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI ANALYSIS TAB */}
              {activeTab === 'AI Analysis' && (
                <div>
                  {loadingAnalysis ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: c.textMuted }}>Loading analysis...</div>
                  ) : !analysis ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                      <BarChart3 size={40} color="#27272a" style={{ margin: '0 auto 16px' }} />
                      <p style={{ margin: '0 0 8px', color: c.textSecondary, fontSize: '15px' }}>No analysis yet</p>
                      <p style={{ margin: '0 0 20px', color: c.textMuted, fontSize: '13px' }}>Run AI analysis to get hook patterns, messaging angles, and counter-strategies</p>
                      {analyseError && <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 12px' }}>{analyseError}</p>}
                      <button onClick={handleAnalyse} disabled={analysing} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: 600, cursor: analysing ? 'not-allowed' : 'pointer', opacity: analysing ? 0.7 : 1 }}>
                        {analysing ? '⟳ Analysing...' : '✦ Run AI Analysis'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: c.textMuted }}>Last analysed {timeAgo(analysis.created_at)} · {analysis.ads_analysed_count} ads</span>
                        <button onClick={handleAnalyse} disabled={analysing} style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          {analysing ? 'Analysing...' : 'Re-analyse'}
                        </button>
                      </div>

                      {/* Hook Patterns */}
                      {analysis.hook_patterns?.length > 0 && (
                        <div style={card}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: c.text }}>🎣 Hook Patterns</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {analysis.hook_patterns.map((h: any, i: number) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: c.bgTag, color: '#818cf8', flexShrink: 0 }}>{h.count}x</span>
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
                          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: c.text }}>📢 Messaging Angles</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {analysis.messaging_angles.map((a: any, i: number) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: a.strength === 'primary' ? '#052e16' : '#1c1917', color: a.strength === 'primary' ? '#4ade80' : '#78716c', flexShrink: 0 }}>{a.strength}</span>
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
                          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: c.text }}>💰 Offer Mechanics</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {analysis.offer_mechanics.map((o: any, i: number) => (
                              <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', background: c.bgCard, border: `1px solid ${c.border}` }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: c.text }}>{o.type}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: c.textSecondary }}>{o.frequency}x · {o.example}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Visual Style */}
                      {analysis.visual_style && (
                        <div style={card}>
                          <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: c.text }}>🎨 Visual Style</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: c.textSecondary, lineHeight: 1.6 }}>{analysis.visual_style}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* IDEAS TAB */}
              {activeTab === 'Ideas' && (
                <div>
                  {ideas.length === 0 ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                      <Lightbulb size={40} color="#27272a" style={{ margin: '0 auto 16px' }} />
                      <p style={{ margin: '0 0 8px', color: c.textSecondary, fontSize: '15px' }}>No ideas yet</p>
                      <p style={{ margin: '0 0 20px', color: c.textMuted, fontSize: '13px' }}>Run AI Analysis first to generate counter-strategy ad ideas</p>
                      <button onClick={() => setActiveTab('AI Analysis')} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                        Go to AI Analysis
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {STATUS_COLS.map(col => (
                        <div key={col}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', background: c.bgCard }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: c.textSecondary, textTransform: 'capitalize' }}>{col}</span>
                            <span style={{ fontSize: '11px', background: c.bgInput, color: c.textSecondary, padding: '1px 6px', borderRadius: '99px' }}>{ideas.filter(i => i.status === col).length}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {ideas.filter(i => i.status === col).map(idea => (
                              <div key={idea.id} style={{ ...card, padding: '12px' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: c.text, lineHeight: 1.4 }}>{idea.hook}</p>
                                {idea.body_copy && <p style={{ margin: '0 0 8px', fontSize: '12px', color: c.textSecondary, lineHeight: 1.5 }}>{idea.body_copy.slice(0, 100)}{idea.body_copy.length > 100 ? '...' : ''}</p>}
                                {idea.cta && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#7c3aed22', color: '#a78bfa', display: 'inline-block', marginBottom: '8px' }}>{idea.cta}</span>}
                                {idea.counter_angle && <p style={{ margin: '0 0 8px', fontSize: '11px', color: c.textMuted, fontStyle: 'italic' }}>{idea.counter_angle}</p>}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {STATUS_COLS.filter(s => s !== col).map(s => (
                                    <button key={s} onClick={() => handleIdeaStatus(idea.id, s)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${c.border}`, background: 'transparent', color: c.textMuted, cursor: 'pointer' }}>
                                      → {s}
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

              {/* ALERTS TAB */}
              {activeTab === 'Alerts' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: c.textSecondary }}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAlertsRead} style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {loadingAlerts ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: c.textMuted }}>Loading alerts...</div>
                  ) : alerts.length === 0 ? (
                    <div style={{ ...card, textAlign: 'center', padding: '60px', color: c.textMuted }}>
                      <Bell size={32} color="#27272a" style={{ margin: '0 auto 12px' }} />
                      <p style={{ margin: 0 }}>No changes detected yet. Scrape to start monitoring.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {alerts.map(alert => (
                        <div key={alert.id} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: '12px', opacity: alert.seen_at ? 0.6 : 1 }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: alert.change_type === 'new_ad' ? '#052e16' : '#1c1917' }}>
                            {alert.change_type === 'new_ad' ? <Zap size={14} color="#4ade80" /> : <Bell size={14} color="#f59e0b" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', color: c.text }}>{alert.description}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: c.textMuted }}>{timeAgo(alert.created_at)}</p>
                          </div>
                          {!alert.seen_at && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: '6px' }} />}
                        </div>
                      ))}
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
