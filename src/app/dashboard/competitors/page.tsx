'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Eye, Plus, RefreshCw, Trash2, X, Search, Loader2,
  Trophy, Clock, ExternalLink, Sparkles, Filter, ChevronRight,
} from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useTheme } from '@/lib/theme';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useCompetitors } from '@/lib/hooks';

/* ── Helpers ── */
function timeAgo(s: string | null): string {
  if (!s) return 'never';
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Tab = 'ads' | 'brief';
type AdsFilter = 'all' | 'winning' | 'top_performer';

/* ── Main Page ── */
export default function CompetitorsPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const workspaceId = workspace?.id;
  const { competitors, loading: loadingCompetitors, refetch: refetchCompetitors } = useCompetitors(workspaceId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('ads');

  // Add competitor modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedResult, setSelectedResult] = useState<number>(0);
  const [addStep, setAddStep] = useState<'search' | 'confirm'>('search');
  const [adding, setAdding] = useState(false);

  // Ads tab
  const [ads, setAds] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adsFilter, setAdsFilter] = useState<AdsFilter>('all');
  const [adsTotal, setAdsTotal] = useState(0);

  // Brief tab
  const [brief, setBrief] = useState<any>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Scraping state
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());

  const selectedCompetitor = competitors.find((comp: any) => comp.id === selectedId);

  // Stats
  const totalCompetitors = competitors.length;
  const totalWinningAds = competitors.reduce((sum: number, c: any) => sum + (c.winning_ads_count || 0), 0);
  const totalBriefs = competitors.filter((c: any) => c.winning_ads_count > 0).length;

  // Auto-select first competitor
  useEffect(() => {
    if (!selectedId && competitors.length > 0) {
      setSelectedId(competitors[0].id);
    }
  }, [competitors, selectedId]);

  // Fetch ads when competitor or filter changes
  const fetchAds = useCallback((compId: string, filter: AdsFilter) => {
    if (!workspaceId) return;
    setLoadingAds(true);
    const filterParam = filter === 'all' ? '' : `&filter=${filter}`;
    fetch(`/api/competitors/ads?workspace_id=${workspaceId}&competitor_id=${compId}${filterParam}`)
      .then(r => r.json())
      .then(d => { setAds(d.ads ?? []); setAdsTotal(d.total ?? 0); setLoadingAds(false); })
      .catch(() => setLoadingAds(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!selectedId || !workspaceId) return;
    fetchAds(selectedId, adsFilter);
  }, [selectedId, workspaceId, adsFilter, fetchAds]);

  // Fetch brief when tab changes
  useEffect(() => {
    if (!selectedId || !workspaceId || activeTab !== 'brief') return;
    setLoadingBrief(true);
    fetch(`/api/competitors/brief?workspace_id=${workspaceId}&competitor_id=${selectedId}`)
      .then(r => r.json())
      .then(d => { setBrief(d.brief); setLoadingBrief(false); })
      .catch(() => setLoadingBrief(false));
  }, [selectedId, workspaceId, activeTab]);

  function selectCompetitor(id: string) {
    setSelectedId(id);
    setActiveTab('ads');
    setAds([]);
    setBrief(null);
    setAdsFilter('all');
  }

  /* ── Search Brand ── */
  async function handleSearch() {
    if (!searchQuery.trim() || !workspaceId) return;
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const res = await fetch('/api/competitors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim(), workspace_id: workspaceId }),
      });
      const data = await res.json();
      if (data.error) {
        setSearchError(data.error);
      } else if (data.results?.length > 0) {
        setSearchResults(data.results);
        setSelectedResult(0);
        setAddStep('confirm');
      } else {
        setSearchError('No brands found. Try a different search term.');
      }
    } catch { setSearchError('Network error — try again.'); }
    setSearching(false);
  }

  /* ── Add Competitor ── */
  async function handleAddCompetitor() {
    if (!workspaceId || searchResults.length === 0) return;
    const result = searchResults[selectedResult];
    setAdding(true);
    try {
      const res = await fetch('/api/competitors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          facebook_page_id: result.page_id,
          facebook_page_name: result.page_name,
          facebook_page_url: result.page_url,
          logo_url: result.picture_url,
        }),
      });
      const data = await res.json();
      if (data.competitor) {
        setShowAddModal(false);
        resetModal();
        refetchCompetitors();
        setSelectedId(data.competitor.id);
        setScrapingIds(prev => new Set(prev).add(data.competitor.id));
        // Poll for scrape completion
        pollScrapeStatus(data.competitor.id);
      } else {
        setSearchError(data.error || 'Failed to add');
      }
    } catch { setSearchError('Network error'); }
    setAdding(false);
  }

  function pollScrapeStatus(competitorId: string) {
    const interval = setInterval(() => {
      refetchCompetitors();
    }, 5000);
    // Stop polling after 3 minutes
    setTimeout(() => {
      clearInterval(interval);
      setScrapingIds(prev => { const s = new Set(prev); s.delete(competitorId); return s; });
      refetchCompetitors();
    }, 180000);
  }

  function resetModal() {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setSelectedResult(0);
    setAddStep('search');
    setAdding(false);
  }

  /* ── Delete Competitor ── */
  async function handleDelete(id: string) {
    if (!confirm('Remove this competitor and all its data?')) return;
    await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
    if (selectedId === id) setSelectedId(null);
    refetchCompetitors();
  }

  /* ── Re-scrape ── */
  async function handleRescrape(competitorId: string) {
    if (!workspaceId) return;
    setScrapingIds(prev => new Set(prev).add(competitorId));
    try {
      await fetch('/api/competitors/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_id: competitorId, workspace_id: workspaceId }),
      });
      refetchCompetitors();
      if (selectedId === competitorId) fetchAds(competitorId, adsFilter);
    } catch {}
    setScrapingIds(prev => { const s = new Set(prev); s.delete(competitorId); return s; });
  }

  /* ── Regenerate Brief ── */
  async function handleRegenerate() {
    if (!selectedId || !workspaceId) return;
    setRegenerating(true);
    try {
      await fetch('/api/competitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_id: selectedId, workspace_id: workspaceId }),
      });
      // Refetch brief
      const res = await fetch(`/api/competitors/brief?workspace_id=${workspaceId}&competitor_id=${selectedId}`);
      const data = await res.json();
      setBrief(data.brief);
    } catch {}
    setRegenerating(false);
  }

  /* ── Styles ── */
  const FONT_HEADING = "'Plus Jakarta Sans', var(--font-display), sans-serif";
  const FONT_BODY = "'DM Sans', sans-serif";

  const cardStyle: React.CSSProperties = {
    background: c.bgCard,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
  };

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: '#7C3AED', color: '#fff',
    borderRadius: 8, border: 'none', fontFamily: FONT_BODY,
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
    transition: 'background 150ms, box-shadow 150ms',
  };

  const btnSecondary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: 'transparent', color: c.text,
    borderRadius: 8, border: `1px solid ${c.border}`, fontFamily: FONT_BODY,
    fontWeight: 500, fontSize: 13, cursor: 'pointer',
    transition: 'background 150ms',
  };

  const isCompScraping = (comp: any) =>
    comp.scrape_status === 'running' || comp.scrape_status === 'pending' || scrapingIds.has(comp.id);

  /* ── RENDER ── */
  return (
    <PageShell
      title="Competitor Ad Spy"
      description="Track what your competitors are running"
      icon={Eye}
      badge="AD LIBRARY"
    >
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Competitors', value: totalCompetitors },
          { label: 'Winning Ads', value: totalWinningAds },
          { label: 'AI Briefs', value: totalBriefs },
        ].map(stat => (
          <div key={stat.label} style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: c.textMuted, fontFamily: FONT_BODY, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.text, fontFamily: FONT_HEADING }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Layout: Left Panel + Right Panel */}
      <div style={{ display: 'flex', gap: 0, minHeight: 600, ...cardStyle, overflow: 'hidden' }}>

        {/* ── LEFT PANEL: Competitor List ── */}
        <div style={{
          width: 260, flexShrink: 0, borderRight: `1px solid ${c.border}`,
          padding: 16, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: c.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em' }}>
              Competitors
            </span>
            <button
              onClick={() => { setShowAddModal(true); resetModal(); }}
              style={{ ...btnPrimary, padding: '4px 12px', fontSize: 12, height: 32 }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loadingCompetitors ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: 56, borderRadius: 8, background: c.bgCardHover, opacity: 0.5 }} />
              ))
            ) : competitors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 8px', color: c.textMuted, fontSize: 13, fontFamily: FONT_BODY }}>
                No competitors yet. Click "+ Add" to start tracking.
              </div>
            ) : (
              competitors.map((comp: any) => {
                const isActive = comp.id === selectedId;
                const isScraping = isCompScraping(comp);
                return (
                  <div
                    key={comp.id}
                    onClick={() => selectCompetitor(comp.id)}
                    style={{
                      height: 56, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: isActive ? 'rgba(124, 58, 237, 0.10)' : 'transparent',
                      borderLeft: isActive ? '2px solid #7C3AED' : '2px solid transparent',
                      transition: 'background 100ms',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = c.bgCardHover; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Avatar */}
                    {comp.logo_url ? (
                      <img src={comp.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: c.accentSubtle,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 600, color: '#7C3AED', fontFamily: FONT_BODY,
                      }}>
                        {(comp.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: c.text, fontFamily: FONT_BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {comp.name}
                      </div>
                    </div>
                    {/* Status indicator */}
                    {isScraping ? (
                      <Loader2 size={14} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : comp.scrape_status === 'error' ? (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} title="Scrape error" />
                    ) : comp.winning_ads_count > 0 ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: '#7C3AED', background: 'rgba(124,58,237,0.1)',
                        padding: '2px 7px', borderRadius: 10, fontFamily: FONT_BODY,
                      }}>
                        {comp.winning_ads_count}
                      </span>
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.textMuted, opacity: 0.4 }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!selectedCompetitor ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textMuted, fontFamily: FONT_BODY, fontSize: 14 }}>
              {competitors.length === 0 ? 'Add a competitor to get started' : 'Select a competitor'}
            </div>
          ) : (
            <>
              {/* Competitor Header + Tabs */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {selectedCompetitor.logo_url ? (
                    <img src={selectedCompetitor.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                  ) : null}
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: c.text, fontFamily: FONT_HEADING }}>
                      {selectedCompetitor.name}
                    </div>
                    <div style={{ fontSize: 12, color: c.textMuted, fontFamily: FONT_BODY }}>
                      {selectedCompetitor.total_ads_found || selectedCompetitor.ad_count || 0} ads found
                      {selectedCompetitor.last_scraped_at && ` · Updated ${timeAgo(selectedCompetitor.last_scraped_at)}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleRescrape(selectedCompetitor.id)}
                    disabled={isCompScraping(selectedCompetitor)}
                    style={{ ...btnSecondary, opacity: isCompScraping(selectedCompetitor) ? 0.5 : 1 }}
                  >
                    {isCompScraping(selectedCompetitor) ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
                    Re-scrape
                  </button>
                  <button onClick={() => handleDelete(selectedCompetitor.id)} style={{ ...btnSecondary, color: c.danger }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${c.border}` }}>
                {([
                  { key: 'ads' as Tab, label: 'Winning Ads', icon: Trophy },
                  { key: 'brief' as Tab, label: 'AI Creative Brief', icon: Sparkles },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
                      fontFamily: FONT_BODY,
                      color: activeTab === tab.key ? '#7C3AED' : c.textMuted,
                      borderBottom: activeTab === tab.key ? '2px solid #7C3AED' : '2px solid transparent',
                      transition: 'color 100ms, border-color 100ms',
                    }}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                {activeTab === 'ads' ? (
                  <AdsTab
                    c={c}
                    ads={ads}
                    loading={loadingAds}
                    filter={adsFilter}
                    setFilter={setAdsFilter}
                    total={adsTotal}
                    isScraping={isCompScraping(selectedCompetitor)}
                    onRefresh={() => fetchAds(selectedId!, adsFilter)}
                  />
                ) : (
                  <BriefTab
                    c={c}
                    brief={brief}
                    loading={loadingBrief}
                    regenerating={regenerating}
                    onRegenerate={handleRegenerate}
                    competitorName={selectedCompetitor.name}
                    winningCount={selectedCompetitor.winning_ads_count || 0}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ADD COMPETITOR MODAL ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setShowAddModal(false); resetModal(); }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 480, maxHeight: '80vh', overflowY: 'auto',
              background: c.bgCard, borderRadius: 16, border: `1px solid ${c.border}`,
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)', padding: 24,
            }}
          >
            {addStep === 'search' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text, fontFamily: FONT_HEADING }}>Add Competitor</h3>
                  <button onClick={() => { setShowAddModal(false); resetModal(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}>
                    <X size={18} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: c.textMuted, fontFamily: FONT_BODY, marginBottom: 16 }}>
                  Enter brand name, website, or Facebook URL
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder='e.g. "Mamaearth", "mamaearth.in", "facebook.com/mamaearth"'
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 8,
                      border: `1px solid ${c.border}`, background: c.bgInput,
                      color: c.text, fontSize: 14, fontFamily: FONT_BODY, outline: 'none',
                    }}
                    autoFocus
                  />
                  <button onClick={handleSearch} disabled={searching || !searchQuery.trim()} style={{ ...btnPrimary, opacity: searching ? 0.7 : 1 }}>
                    {searching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                    Search
                  </button>
                </div>
                {searchError && (
                  <p style={{ fontSize: 13, color: c.danger, fontFamily: FONT_BODY, marginTop: 8 }}>{searchError}</p>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text, fontFamily: FONT_HEADING }}>Select the correct brand</h3>
                  <button onClick={() => { setShowAddModal(false); resetModal(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {searchResults.map((result, i) => (
                    <div
                      key={result.page_id}
                      onClick={() => setSelectedResult(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${i === selectedResult ? '#7C3AED' : c.border}`,
                        background: i === selectedResult ? 'rgba(124,58,237,0.06)' : 'transparent',
                        transition: 'border-color 100ms, background 100ms',
                      }}
                    >
                      {/* Radio */}
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${i === selectedResult ? '#7C3AED' : c.textMuted}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {i === selectedResult && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />}
                      </div>
                      {/* Picture */}
                      {result.picture_url ? (
                        <img src={result.picture_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#7C3AED' }}>
                          {result.page_name[0]?.toUpperCase()}
                        </div>
                      )}
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: c.text, fontFamily: FONT_BODY }}>{result.page_name}</div>
                        <div style={{ fontSize: 12, color: c.textMuted, fontFamily: FONT_BODY }}>{result.page_url?.replace('https://', '')}</div>
                      </div>
                      <div style={{ fontSize: 12, color: c.textMuted, fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>
                        {result.ad_count > 0 ? `${result.ad_count.toLocaleString()} ads` : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setAddStep('search'); setSearchResults([]); setSearchError(''); }}
                  style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 13, fontFamily: FONT_BODY, cursor: 'pointer', marginBottom: 16 }}
                >
                  Can't find it? Try a different name
                </button>

                {searchError && (
                  <p style={{ fontSize: 13, color: c.danger, fontFamily: FONT_BODY, marginBottom: 8 }}>{searchError}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => { setAddStep('search'); setSearchResults([]); }} style={btnSecondary}>Back</button>
                  <button onClick={handleAddCompetitor} disabled={adding} style={{ ...btnPrimary, opacity: adding ? 0.7 : 1 }}>
                    {adding ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    Track This Brand
                    <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );
}


/* ══════════════════════════════════════════════════════════════
   ADS TAB
   ══════════════════════════════════════════════════════════════ */
function AdsTab({ c, ads, loading, filter, setFilter, total, isScraping, onRefresh }: {
  c: any; ads: any[]; loading: boolean; filter: AdsFilter; setFilter: (f: AdsFilter) => void;
  total: number; isScraping: boolean; onRefresh: () => void;
}) {
  const FONT_BODY = "'DM Sans', sans-serif";
  const FONT_HEADING = "'Plus Jakarta Sans', var(--font-display), sans-serif";

  if (isScraping && ads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 32px' }}>
        <Clock size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: c.text, fontFamily: FONT_HEADING, marginBottom: 8 }}>Scraping ads...</h3>
        <p style={{ fontSize: 14, color: c.textMuted, fontFamily: FONT_BODY, marginBottom: 20 }}>
          We're pulling ads for this competitor. Check back in a few minutes.
        </p>
        <button onClick={onRefresh} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7C3AED', color: '#fff', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
    );
  }

  if (!loading && ads.length === 0 && filter === 'all') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 32px' }}>
        <Trophy size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: c.text, fontFamily: FONT_HEADING, marginBottom: 8 }}>No winning ads found yet</h3>
        <p style={{ fontSize: 14, color: c.textMuted, fontFamily: FONT_BODY, maxWidth: 400, margin: '0 auto' }}>
          None of this competitor's ads have been running for 90+ days. We'll keep checking as they run longer.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([
          { key: 'all' as AdsFilter, label: 'All' },
          { key: 'winning' as AdsFilter, label: 'Winning 90d+' },
          { key: 'top_performer' as AdsFilter, label: 'Top Performer 180d+' },
        ]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: FONT_BODY,
              background: filter === f.key ? '#7C3AED' : c.bgCardHover,
              color: filter === f.key ? '#fff' : c.textSecondary,
              transition: 'background 100ms, color 100ms',
            }}
          >
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: c.textMuted, fontFamily: FONT_BODY }}>
          {total} ads · Sorted by longest running
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: c.bgCardHover, borderRadius: 12, height: 320, opacity: 0.5 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {ads.map((ad: any) => (
            <AdCard key={ad.id} ad={ad} c={c} />
          ))}
        </div>
      )}
    </>
  );
}


/* ── Ad Card ── */
function AdCard({ ad, c }: { ad: any; c: any }) {
  const FONT_BODY = "'DM Sans', sans-serif";

  const tierBadge = ad.performance_tier === 'top_performer'
    ? { label: 'TOP PERFORMER', bg: '#7C3AED', icon: true }
    : ad.performance_tier === 'winning'
    ? { label: 'WINNING', bg: '#059669', icon: false }
    : null;

  return (
    <div style={{
      background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12,
      overflow: 'hidden', transition: 'box-shadow 150ms',
    }}>
      {/* Preview area */}
      <div style={{
        height: 160, background: c.bgCardHover, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ad.image_url ? (
          <img src={ad.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ color: c.textMuted, fontSize: 13, fontFamily: FONT_BODY }}>
            {ad.ad_format === 'video' ? 'Video Ad' : ad.ad_format === 'carousel' ? 'Carousel' : 'Image Ad'}
          </div>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {tierBadge && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, fontFamily: FONT_BODY,
              background: tierBadge.bg, color: '#fff',
              padding: '3px 8px', borderRadius: 6,
            }}>
              {tierBadge.icon && <Trophy size={10} />}
              {tierBadge.label}
            </span>
          )}
          <span style={{
            fontSize: 12, fontWeight: 500, fontFamily: FONT_BODY,
            color: '#fff', background: 'rgba(0,0,0,0.5)',
            padding: '2px 8px', borderRadius: 6,
          }}>
            {ad.days_running}d
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        {ad.headline && (
          <div style={{
            fontSize: 14, fontWeight: 600, color: c.text, fontFamily: FONT_BODY,
            marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {ad.headline}
          </div>
        )}
        {ad.ad_copy && (
          <div style={{
            fontSize: 13, color: c.textSecondary, fontFamily: FONT_BODY,
            lineHeight: 1.5, marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {ad.ad_copy}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {ad.ad_format && (
              <span style={{
                fontSize: 11, fontWeight: 500, fontFamily: FONT_BODY,
                color: '#7C3AED', background: 'rgba(124,58,237,0.1)',
                padding: '2px 8px', borderRadius: 6,
              }}>
                {ad.ad_format}
              </span>
            )}
            {ad.call_to_action && (
              <span style={{
                fontSize: 11, fontWeight: 500, fontFamily: FONT_BODY,
                color: c.textMuted, background: c.bgCardHover,
                padding: '2px 8px', borderRadius: 6,
              }}>
                {ad.call_to_action.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {ad.ad_snapshot_url && (
            <a
              href={ad.ad_snapshot_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 500, fontFamily: FONT_BODY,
                color: '#7C3AED', textDecoration: 'none',
              }}
            >
              View Ad <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════
   BRIEF TAB
   ══════════════════════════════════════════════════════════════ */
function BriefTab({ c, brief, loading, regenerating, onRegenerate, competitorName, winningCount }: {
  c: any; brief: any; loading: boolean; regenerating: boolean;
  onRegenerate: () => void; competitorName: string; winningCount: number;
}) {
  const FONT_BODY = "'DM Sans', sans-serif";
  const FONT_HEADING = "'Plus Jakarta Sans', var(--font-display), sans-serif";

  if (loading || regenerating) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 32px' }}>
        <Sparkles size={48} color="#7C3AED" style={{ marginBottom: 16, animation: 'spin 3s linear infinite' }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: c.text, fontFamily: FONT_HEADING, marginBottom: 8 }}>
          {regenerating ? 'Regenerating brief...' : `Analyzing ${winningCount} winning ads...`}
        </h3>
        <p style={{ fontSize: 14, color: c.textMuted, fontFamily: FONT_BODY }}>
          Claude is identifying patterns and building your creative brief.
        </p>
        <div style={{ width: 200, height: 4, background: c.bgCardHover, borderRadius: 4, margin: '20px auto', overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#7C3AED', borderRadius: 4,
            animation: 'progress 30s ease-out forwards', width: '5%',
          }} />
        </div>
        <style>{`@keyframes progress { to { width: 90%; } }`}</style>
      </div>
    );
  }

  if (!brief) {
    if (winningCount === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '64px 32px' }}>
          <Trophy size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: c.text, fontFamily: FONT_HEADING, marginBottom: 8 }}>No winning ads to analyze yet</h3>
          <p style={{ fontSize: 14, color: c.textMuted, fontFamily: FONT_BODY }}>
            Once this competitor has ads running 90+ days, we'll generate an AI creative brief.
          </p>
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'center', padding: '64px 32px' }}>
        <Sparkles size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: c.text, fontFamily: FONT_HEADING, marginBottom: 8 }}>Brief not generated yet</h3>
        <p style={{ fontSize: 14, color: c.textMuted, fontFamily: FONT_BODY, marginBottom: 20 }}>
          {winningCount} winning ads found. Generate an AI creative brief now.
        </p>
        <button onClick={onRegenerate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#7C3AED', color: '#fff', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, fontFamily: FONT_BODY, cursor: 'pointer' }}>
          <Sparkles size={14} /> Generate Brief
        </button>
      </div>
    );
  }

  // Parse content angles
  let contentAngles: any[] = [];
  try {
    if (Array.isArray(brief.content_angles)) contentAngles = brief.content_angles;
    else if (typeof brief.content_angles === 'string') contentAngles = JSON.parse(brief.content_angles);
  } catch {}

  const sectionHeadingStyle: React.CSSProperties = {
    fontFamily: FONT_HEADING, fontWeight: 600, fontSize: 13,
    color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 10, marginTop: 24,
  };

  const sectionTextStyle: React.CSSProperties = {
    fontFamily: FONT_BODY, fontSize: 14, color: c.textSecondary,
    lineHeight: 1.6, whiteSpace: 'pre-wrap',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="#7C3AED" />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text, fontFamily: FONT_HEADING }}>AI Creative Brief</h3>
        </div>
        <button onClick={onRegenerate} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', background: 'transparent', color: c.text,
          borderRadius: 8, border: `1px solid ${c.border}`, fontSize: 12,
          fontWeight: 500, fontFamily: FONT_BODY, cursor: 'pointer',
        }}>
          <RefreshCw size={12} /> Regenerate
        </button>
      </div>
      <p style={{ fontSize: 13, color: c.textMuted, fontFamily: FONT_BODY, marginBottom: 16 }}>
        Based on {brief.ads_analyzed || 0} winning ads from {competitorName}
        {brief.generated_at && ` · Generated ${timeAgo(brief.generated_at)}`}
      </p>

      {/* Sections */}
      {brief.hook_patterns && (
        <>
          <div style={sectionHeadingStyle}>Hook Patterns</div>
          <div style={sectionTextStyle}>{brief.hook_patterns}</div>
        </>
      )}
      {brief.pain_points && (
        <>
          <div style={sectionHeadingStyle}>Pain Points They Target</div>
          <div style={sectionTextStyle}>{brief.pain_points}</div>
        </>
      )}
      {brief.offer_structures && (
        <>
          <div style={sectionHeadingStyle}>How They Frame Offers</div>
          <div style={sectionTextStyle}>{brief.offer_structures}</div>
        </>
      )}
      {brief.visual_themes && (
        <>
          <div style={sectionHeadingStyle}>Visual & Creative Themes</div>
          <div style={sectionTextStyle}>{brief.visual_themes}</div>
        </>
      )}

      {/* Content Angles */}
      {contentAngles.length > 0 && (
        <>
          <div style={{ borderTop: `1px solid ${c.border}`, margin: '28px 0 8px' }} />
          <div style={{ ...sectionHeadingStyle, fontSize: 15, marginTop: 16, marginBottom: 16 }}>
            {contentAngles.length} Content Angles to Test
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contentAngles.map((angle: any, i: number) => (
              <div key={i} style={{
                background: c.bgCardHover, border: `1px solid ${c.border}`,
                borderRadius: 10, padding: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: FONT_HEADING, fontWeight: 600, fontSize: 15, color: c.text }}>
                    {i + 1}. {angle.name}
                  </span>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: c.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {angle.details || angle.hook || angle.core_message || ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fallback: raw brief if no parsed sections */}
      {!brief.hook_patterns && !brief.pain_points && brief.raw_brief && (
        <div style={sectionTextStyle}>{brief.raw_brief}</div>
      )}
    </div>
  );
}
