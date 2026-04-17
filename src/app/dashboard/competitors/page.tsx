'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Eye, Plus, RefreshCw, Trash2, X, Search, Loader2,
  Trophy, Clock, ExternalLink, Sparkles, ChevronRight,
} from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { Sparkline } from '@/components/Sparkline';
import { useTheme } from '@/lib/theme';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useCompetitors } from '@/lib/hooks';
import { apiFetch } from '@/lib/api-fetch';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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
type PlatformFilter = 'all' | 'google' | 'meta' | 'active' | 'paused';

/* ── Main Page ── */
export default function CompetitorsPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const workspaceId = workspace?.id;
  const { competitors, loading: loadingCompetitors, refetch: refetchCompetitors } = useCompetitors(workspaceId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Grid filter + search
  const [gridSearch, setGridSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');

  const selectedCompetitor = competitors.find((comp: any) => comp.id === selectedId);

  // Stats
  const totalCompetitors = competitors.length;
  const totalWinningAds = competitors.reduce((sum: number, comp: any) => sum + (comp.winning_ads_count || 0), 0);
  const totalAdsFound = competitors.reduce((sum: number, comp: any) => sum + (comp.total_ads_found || comp.ad_count || 0), 0);
  const totalBriefs = competitors.filter((comp: any) => comp.winning_ads_count > 0).length;

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
    apiFetch(`/api/competitors/ads?workspace_id=${workspaceId}&competitor_id=${compId}${filterParam}`)
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
    apiFetch(`/api/competitors/brief?workspace_id=${workspaceId}&competitor_id=${selectedId}`)
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
      const res = await apiFetch('/api/competitors/search', {
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
      const res = await apiFetch('/api/competitors/add', {
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

  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }
  async function confirmDelete() {
    const id = pendingDeleteId;
    if (!id) return;
    setPendingDeleteId(null);
    await apiFetch(`/api/competitors/${id}`, { method: 'DELETE' });
    if (selectedId === id) setSelectedId(null);
    refetchCompetitors();
  }

  async function handleRescrape(competitorId: string) {
    if (!workspaceId) return;
    setScrapingIds(prev => new Set(prev).add(competitorId));
    try {
      await apiFetch('/api/competitors/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_id: competitorId, workspace_id: workspaceId }),
      });
      refetchCompetitors();
      if (selectedId === competitorId) fetchAds(competitorId, adsFilter);
    } catch {}
    setScrapingIds(prev => { const s = new Set(prev); s.delete(competitorId); return s; });
  }

  async function handleRegenerate() {
    if (!selectedId || !workspaceId) return;
    setRegenerating(true);
    try {
      await apiFetch('/api/competitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_id: selectedId, workspace_id: workspaceId }),
      });
      const res = await apiFetch(`/api/competitors/brief?workspace_id=${workspaceId}&competitor_id=${selectedId}`);
      const data = await res.json();
      setBrief(data.brief);
    } catch {}
    setRegenerating(false);
  }

  const isCompScraping = (comp: any) =>
    comp.scrape_status === 'running' || comp.scrape_status === 'pending' || scrapingIds.has(comp.id);

  /* Filtering */
  const filteredCompetitors = competitors.filter((comp: any) => {
    if (gridSearch.trim()) {
      const q = gridSearch.toLowerCase();
      const name = (comp.name || '').toLowerCase();
      const url = (comp.facebook_page_url || '').toLowerCase();
      if (!name.includes(q) && !url.includes(q)) return false;
    }
    return true;
  });

  /* Recent ads across all competitors (derived from selected or all) */
  const recentAds = ads.slice(0, 8);

  const platformFilters: { k: PlatformFilter; label: string }[] = [
    { k: 'all', label: 'All Platforms' },
    { k: 'google', label: 'Google Ads' },
    { k: 'meta', label: 'Meta Ads' },
    { k: 'active', label: 'Active' },
    { k: 'paused', label: 'Paused' },
  ];

  /* ── RENDER ── */
  return (
    <PageShell
      title="Competitor Ad Spy"
      description="Track and analyze your competitors' advertising strategies across platforms"
      icon={Eye}
      badge="INTELLIGENCE"
    >
      {/* KPI STATS ROW */}
      <div className="lx-kpi-grid">
        <KpiCard label="Competitors Tracked" value={totalCompetitors} color="var(--primary)" />
        <KpiCard label="Active Ads Found" value={totalAdsFound} color="var(--secondary)" />
        <KpiCard label="Winning Ads" value={totalWinningAds} color="var(--success)" />
        <KpiCard label="AI Briefs" value={totalBriefs} color="var(--tertiary)" />
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="lx-spy-controls">
        <div className="lx-spy-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={gridSearch}
            onChange={e => setGridSearch(e.target.value)}
            placeholder="Search competitors or keywords..."
          />
        </div>

        <div className="lx-spy-pill-row">
          {platformFilters.map(p => (
            <button
              key={p.k}
              className={`lx-filter-pill${platformFilter === p.k ? ' active' : ''}`}
              onClick={() => setPlatformFilter(p.k)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          className="lx-btn-primary"
          onClick={() => { setShowAddModal(true); resetModal(); }}
          type="button"
        >
          <Plus size={16} /> Add Competitor
        </button>
      </div>

      {/* COMPETITOR CARDS GRID */}
      {loadingCompetitors ? (
        <div className="lx-spy-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="lx-spy-card" style={{ opacity: .5, minHeight: 280 }} />
          ))}
        </div>
      ) : filteredCompetitors.length === 0 ? (
        <div className="lx-card" style={{ marginBottom: 28 }}>
          <div className="lx-spy-empty">
            <div className="lx-spy-empty-icon">
              <Eye size={32} color="var(--primary)" />
            </div>
            <h3 className="lx-spy-empty-title">
              {competitors.length === 0 ? "Track your competitors' ads" : 'No matching competitors'}
            </h3>
            <p className="lx-spy-empty-desc">
              {competitors.length === 0
                ? "Discover what's working for them before you spend a rupee."
                : 'Try adjusting your search or filters.'}
            </p>
            {competitors.length === 0 && (
              <button
                className="lx-btn-primary"
                onClick={() => { setShowAddModal(true); resetModal(); }}
                type="button"
              >
                <Plus size={16} /> Add Your First Competitor
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="lx-spy-grid">
          {filteredCompetitors.map((comp: any) => (
            <CompetitorCard
              key={comp.id}
              comp={comp}
              isActive={comp.id === selectedId}
              isScraping={isCompScraping(comp)}
              onSelect={() => selectCompetitor(comp.id)}
              onRescrape={() => handleRescrape(comp.id)}
              onDelete={() => handleDelete(comp.id)}
            />
          ))}
        </div>
      )}

      {/* AD FEED + BRIEF TABS */}
      {selectedCompetitor && (
        <div className="lx-card" style={{ marginBottom: 28 }}>
          <div className="lx-spy-feed-head">
            <div className="lx-spy-feed-title">
              {selectedCompetitor.logo_url ? (
                <img src={selectedCompetitor.logo_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              ) : null}
              <span>{selectedCompetitor.name}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: c.textMuted }}>
                · {adsTotal} ads
                {selectedCompetitor.last_scraped_at && ` · Updated ${timeAgo(selectedCompetitor.last_scraped_at)}`}
              </span>
            </div>
            <div className="lx-spy-tab-group">
              <button
                type="button"
                className={`lx-spy-tab${activeTab === 'ads' ? ' active' : ''}`}
                onClick={() => setActiveTab('ads')}
              >
                <Trophy size={13} /> Winning Ads
              </button>
              <button
                type="button"
                className={`lx-spy-tab${activeTab === 'brief' ? ' active' : ''}`}
                onClick={() => setActiveTab('brief')}
              >
                <Sparkles size={13} /> AI Brief
              </button>
            </div>
          </div>

          {activeTab === 'ads' ? (
            <AdsTabContent
              c={c}
              ads={recentAds}
              allAds={ads}
              loading={loadingAds}
              filter={adsFilter}
              setFilter={setAdsFilter}
              total={adsTotal}
              isScraping={isCompScraping(selectedCompetitor)}
              onRefresh={() => fetchAds(selectedId!, adsFilter)}
              competitorName={selectedCompetitor.name}
            />
          ) : (
            <BriefTabContent
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
      )}

      {/* ── ADD COMPETITOR MODAL ── */}
      {showAddModal && (
        <div className="lx-spy-modal-overlay" onClick={() => { setShowAddModal(false); resetModal(); }}>
          <div className="lx-spy-modal" onClick={e => e.stopPropagation()}>
            {addStep === 'search' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3>Add Competitor</h3>
                  <button className="lx-spy-modal-close" onClick={() => { setShowAddModal(false); resetModal(); }} type="button" aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 16 }}>
                  Enter brand name, website, or Facebook URL
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={searchQuery}
                    onChange={e => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                      searchDebounceRef.current = setTimeout(() => {
                        if (value.trim()) handleSearch();
                      }, 300);
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder='e.g. "Mamaearth", "mamaearth.in", "facebook.com/mamaearth"'
                    autoFocus
                  />
                  <button
                    className="lx-btn-primary"
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    style={{ opacity: searching ? 0.7 : 1 }}
                    type="button"
                  >
                    {searching ? <Loader2 size={14} className="lx-spy-spin" /> : <Search size={14} />}
                    Search
                  </button>
                </div>
                {searchError && (
                  <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 8 }}>{searchError}</p>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3>Select the correct brand</h3>
                  <button className="lx-spy-modal-close" onClick={() => { setShowAddModal(false); resetModal(); }} type="button" aria-label="Close">
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {searchResults.map((result, i) => (
                    <div
                      key={result.page_id}
                      className={`lx-spy-modal-result${i === selectedResult ? ' selected' : ''}`}
                      onClick={() => setSelectedResult(i)}
                    >
                      <div className="lx-spy-modal-radio">
                        {i === selectedResult && <div className="lx-spy-modal-radio-dot" />}
                      </div>
                      {result.picture_url ? (
                        <img src={result.picture_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>
                          {result.page_name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: c.text }}>{result.page_name}</div>
                        <div style={{ fontSize: 12, color: c.textMuted }}>{result.page_url?.replace('https://', '')}</div>
                      </div>
                      <div style={{ fontSize: 12, color: c.textMuted, whiteSpace: 'nowrap' }}>
                        {result.ad_count > 0 ? `${result.ad_count.toLocaleString()} ads` : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setAddStep('search'); setSearchResults([]); setSearchError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}
                  type="button"
                >
                  Can't find it? Try a different name
                </button>

                {searchError && (
                  <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 8 }}>{searchError}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button
                    className="lx-filter-pill"
                    onClick={() => { setAddStep('search'); setSearchResults([]); }}
                    type="button"
                  >
                    Back
                  </button>
                  <button
                    className="lx-btn-primary"
                    onClick={handleAddCompetitor}
                    disabled={adding}
                    style={{ opacity: adding ? 0.7 : 1 }}
                    type="button"
                  >
                    {adding ? <Loader2 size={14} className="lx-spy-spin" /> : null}
                    Track This Brand
                    <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Remove competitor?"
        description={(() => {
          const comp = competitors.find((co: any) => co.id === pendingDeleteId);
          return `This will delete ${comp?.name || 'this competitor'} along with all scraped ads, briefs, and history. This action can't be undone.`;
        })()}
        confirmLabel="Remove competitor"
        cancelLabel="Keep"
        danger
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </PageShell>
  );
}

/* ═════ KPI CARD ═════ */
function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  const isEmpty = value === 0;
  return (
    <div className="lx-kpi-card">
      <div className="lx-kpi-top">
        <span className="lx-kpi-label">{label}</span>
      </div>
      <div className="lx-kpi-value" style={{ color: isEmpty ? 'var(--text-muted)' : 'var(--text)' }}>
        {isEmpty ? '—' : value.toLocaleString()}
      </div>
      <Sparkline
        data={[]}
        color={color}
        className="lx-sparkline"
        ariaLabel={`${label} trend`}
      />
    </div>
  );
}

/* ═════ COMPETITOR CARD ═════ */
function CompetitorCard({
  comp, isActive, isScraping, onSelect, onRescrape, onDelete,
}: {
  comp: any;
  isActive: boolean;
  isScraping: boolean;
  onSelect: () => void;
  onRescrape: () => void;
  onDelete: () => void;
}) {
  const barColor = isActive ? 'var(--primary)' : comp.winning_ads_count > 0 ? 'var(--success)' : 'var(--tertiary)';
  const winCount = comp.winning_ads_count || 0;
  const totalAds = comp.total_ads_found || comp.ad_count || 0;
  const topTier = comp.top_performer_count || 0;

  // Barcode-like mini chart heights derived from stable hash of id
  const bars = Array.from({ length: 7 }, (_, i) => {
    const seed = (comp.id?.charCodeAt(i % (comp.id?.length || 1)) || 0) + i * 7;
    return 10 + (seed % 26);
  });

  return (
    <div
      className={`lx-spy-card${isActive ? ' active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
    >
      <div className="lx-spy-card-head">
        <div className="lx-spy-avatar">
          {comp.logo_url ? (
            <img src={comp.logo_url} alt="" />
          ) : (
            (comp.name || '?')[0].toUpperCase()
          )}
        </div>
        <div className="lx-spy-brand">
          <h3>{comp.name}</h3>
          <div className="lx-spy-brand-url">
            {comp.facebook_page_url?.replace('https://', '').replace('www.', '') || 'facebook.com'}
          </div>
        </div>
        {comp.last_scraped_at && (
          <span className="lx-spy-scraped" title={`Last scraped ${timeAgo(comp.last_scraped_at)}`}>
            {timeAgo(comp.last_scraped_at)}
          </span>
        )}
      </div>

      <div className="lx-spy-badges">
        <span className="lx-spy-badge lx-spy-badge--meta">Meta Ads</span>
        {isScraping && (
          <span className="lx-spy-badge lx-spy-badge--scraping">
            <Loader2 size={10} className="lx-spy-spin" /> Scraping
          </span>
        )}
        {comp.scrape_status === 'error' && (
          <span className="lx-spy-badge lx-spy-badge--error">Error</span>
        )}
      </div>

      <svg className="lx-spy-mini-chart" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        {bars.map((h, i) => {
          const opacity = 0.6 + (i / bars.length) * 0.4;
          return (
            <rect
              key={i}
              x={i * 14}
              y={40 - h}
              width="12"
              height={h}
              fill={barColor}
              opacity={opacity}
            />
          );
        })}
      </svg>

      <div className="lx-spy-stats">
        <div className="lx-spy-stat">
          <div className="lx-spy-stat-label">Total Ads</div>
          <div className="lx-spy-stat-value">{totalAds}</div>
        </div>
        <div className="lx-spy-stat">
          <div className="lx-spy-stat-label">Winning</div>
          <div className="lx-spy-stat-value">{winCount}</div>
        </div>
        <div className="lx-spy-stat">
          <div className="lx-spy-stat-label">Top Tier</div>
          <div className="lx-spy-stat-value">{topTier}</div>
        </div>
      </div>

      <div className="lx-spy-card-actions">
        <button
          className="lx-spy-view-btn"
          onClick={e => { e.stopPropagation(); onSelect(); }}
          type="button"
        >
          {isActive ? 'Viewing Ads' : 'View Ads'}
        </button>
        <button
          className="lx-spy-icon-btn"
          onClick={e => { e.stopPropagation(); onRescrape(); }}
          disabled={isScraping}
          title="Re-scrape"
          type="button"
          aria-label="Re-scrape"
        >
          {isScraping ? <Loader2 size={14} className="lx-spy-spin" /> : <RefreshCw size={14} />}
        </button>
        <button
          className="lx-spy-icon-btn danger"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          title="Delete"
          type="button"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═════ ADS TAB ═════ */
function AdsTabContent({
  c, ads, allAds, loading, filter, setFilter, total, isScraping, onRefresh, competitorName,
}: {
  c: any;
  ads: any[];
  allAds: any[];
  loading: boolean;
  filter: AdsFilter;
  setFilter: (f: AdsFilter) => void;
  total: number;
  isScraping: boolean;
  onRefresh: () => void;
  competitorName: string;
}) {
  if (isScraping && allAds.length === 0) {
    return (
      <div className="lx-spy-empty">
        <Clock size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
        <h3 className="lx-spy-empty-title">Scraping ads...</h3>
        <p className="lx-spy-empty-desc">
          We're pulling ads for this competitor. Check back in a few minutes.
        </p>
        <button className="lx-btn-primary" onClick={onRefresh} type="button">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
    );
  }

  if (!loading && allAds.length === 0 && filter === 'all') {
    return (
      <div className="lx-spy-empty">
        <Trophy size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
        <h3 className="lx-spy-empty-title">No winning ads found yet</h3>
        <p className="lx-spy-empty-desc">
          None of this competitor's ads have been running for 90+ days. We'll keep checking as they run longer.
        </p>
      </div>
    );
  }

  const filters: { key: AdsFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'winning', label: 'Winning 90d+' },
    { key: 'top_performer', label: 'Top 180d+' },
  ];

  return (
    <>
      {/* Filter pills + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`lx-filter-pill${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
            type="button"
          >
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: c.textMuted }}>
          {total} ads · Sorted by longest running
        </span>
      </div>

      {loading ? (
        <div className="lx-spy-ads">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="lx-spy-ad" style={{ opacity: .5, height: 68 }} />
          ))}
        </div>
      ) : allAds.length === 0 ? (
        <div className="lx-spy-empty">
          <Trophy size={40} color={c.textMuted} style={{ marginBottom: 12 }} />
          <p className="lx-spy-empty-desc">No ads match this filter.</p>
        </div>
      ) : (
        <div className="lx-spy-ads">
          {allAds.map((ad: any) => (
            <AdRow key={ad.id} ad={ad} competitorName={competitorName} />
          ))}
        </div>
      )}
    </>
  );
}

/* ═════ AD ROW ═════ */
function AdRow({ ad, competitorName }: { ad: any; competitorName: string }) {
  const tier = ad.performance_tier === 'top_performer'
    ? { label: 'Top', className: 'lx-spy-status--top' }
    : ad.performance_tier === 'winning'
    ? { label: 'Winning', className: 'lx-spy-status--winning' }
    : ad.status === 'paused'
    ? { label: 'Paused', className: 'lx-spy-status--paused' }
    : { label: 'Active', className: 'lx-spy-status--active' };

  return (
    <div className="lx-spy-ad">
      <div className="lx-spy-ad-icon">
        {ad.image_url ? <img src={ad.image_url} alt="" /> : 'FB'}
      </div>
      <div className="lx-spy-ad-body">
        <div className="lx-spy-ad-head">
          {ad.headline || ad.ad_copy?.slice(0, 80) || 'Untitled ad'}
        </div>
        <div className="lx-spy-ad-meta">
          <span className="lx-spy-tag">{competitorName}</span>
          <span className="lx-spy-ad-sep" />
          <span>{ad.days_running ? `${ad.days_running}d running` : '—'}</span>
          {ad.ad_format && (
            <>
              <span className="lx-spy-ad-sep" />
              <span>{ad.ad_format}</span>
            </>
          )}
          {ad.call_to_action && (
            <>
              <span className="lx-spy-ad-sep" />
              <span>{ad.call_to_action.replace(/_/g, ' ')}</span>
            </>
          )}
        </div>
      </div>
      <span className={`lx-spy-status ${tier.className}`}>{tier.label}</span>
      {ad.ad_snapshot_url && (
        <a
          href={ad.ad_snapshot_url}
          target="_blank"
          rel="noopener noreferrer"
          className="lx-spy-ad-link"
        >
          View <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

/* ═════ BRIEF TAB ═════ */
function BriefTabContent({
  c, brief, loading, regenerating, onRegenerate, competitorName, winningCount,
}: {
  c: any;
  brief: any;
  loading: boolean;
  regenerating: boolean;
  onRegenerate: () => void;
  competitorName: string;
  winningCount: number;
}) {
  if (loading || regenerating) {
    return (
      <div className="lx-spy-empty">
        <Sparkles size={48} color="var(--primary)" style={{ marginBottom: 16 }} className="lx-spy-spin" />
        <h3 className="lx-spy-empty-title">
          {regenerating ? 'Regenerating brief...' : `Analyzing ${winningCount} winning ads...`}
        </h3>
        <p className="lx-spy-empty-desc">
          Claude is identifying patterns and building your creative brief.
        </p>
      </div>
    );
  }

  if (!brief) {
    if (winningCount === 0) {
      return (
        <div className="lx-spy-empty">
          <Trophy size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
          <h3 className="lx-spy-empty-title">No winning ads to analyze yet</h3>
          <p className="lx-spy-empty-desc">
            Once this competitor has ads running 90+ days, we'll generate an AI creative brief.
          </p>
        </div>
      );
    }
    return (
      <div className="lx-spy-empty">
        <Sparkles size={48} color={c.textMuted} style={{ marginBottom: 16 }} />
        <h3 className="lx-spy-empty-title">Brief not generated yet</h3>
        <p className="lx-spy-empty-desc">
          {winningCount} winning ads found. Generate an AI creative brief now.
        </p>
        <button className="lx-btn-primary" onClick={onRegenerate} type="button">
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="var(--primary)" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: "var(--font-display)" }}>
            AI Creative Brief
          </h3>
        </div>
        <button
          onClick={onRegenerate}
          className="lx-filter-pill"
          type="button"
        >
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Regenerate
        </button>
      </div>
      <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 16 }}>
        Based on {brief.ads_analyzed || 0} winning ads from {competitorName}
        {brief.generated_at && ` · Generated ${timeAgo(brief.generated_at)}`}
      </p>

      {brief.hook_patterns && (
        <>
          <div className="lx-spy-brief-heading">Hook Patterns</div>
          <div className="lx-spy-brief-body">{brief.hook_patterns}</div>
        </>
      )}
      {brief.pain_points && (
        <>
          <div className="lx-spy-brief-heading">Pain Points They Target</div>
          <div className="lx-spy-brief-body">{brief.pain_points}</div>
        </>
      )}
      {brief.offer_structures && (
        <>
          <div className="lx-spy-brief-heading">How They Frame Offers</div>
          <div className="lx-spy-brief-body">{brief.offer_structures}</div>
        </>
      )}
      {brief.visual_themes && (
        <>
          <div className="lx-spy-brief-heading">Visual & Creative Themes</div>
          <div className="lx-spy-brief-body">{brief.visual_themes}</div>
        </>
      )}

      {contentAngles.length > 0 && (
        <>
          <div style={{ borderTop: `1px solid ${c.border}`, margin: '28px 0 16px' }} />
          <div className="lx-spy-brief-heading" style={{ fontSize: 15 }}>
            {contentAngles.length} Content Angles to Test
          </div>
          <div>
            {contentAngles.map((angle: any, i: number) => (
              <div key={i} className="lx-spy-brief-angle">
                <div className="lx-spy-brief-angle-title">
                  {i + 1}. {angle.name}
                </div>
                <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {angle.details || angle.hook || angle.core_message || ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!brief.hook_patterns && !brief.pain_points && brief.raw_brief && (
        <div className="lx-spy-brief-body">{brief.raw_brief}</div>
      )}
    </div>
  );
}
