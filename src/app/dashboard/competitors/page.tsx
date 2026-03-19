'use client';
import { useState } from 'react';
import { Eye, Plus, ExternalLink, RefreshCw, Trash2, X, Copy, Check } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspace } from '@/lib/hooks';
import { useCompetitors, useCompetitorAds } from '@/lib/hooks';

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

const TONE_COLORS: Record<string, string> = {
  professional: '#3b82f6',
  casual: '#10b981',
  urgent: '#f59e0b',
  emotional: '#ec4899',
};

export default function CompetitorsPage() {
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const { competitors, loading: loadingCompetitors, refetch: refetchCompetitors } = useCompetitors(workspaceId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { ads, loading: loadingAds, refetch: refetchAds } = useCompetitorAds(workspaceId, selectedId);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPage, setFormPage] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState<Record<string, string>>({});
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [copiedInsight, setCopiedInsight] = useState<string | null>(null);

  const selectedCompetitor = competitors.find(c => c.id === selectedId);

  async function handleAddCompetitor() {
    if (!formName.trim() || !workspaceId) return;
    setAdding(true);
    setAddError('');
    try {
      const addRes = await fetch('/api/competitors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, name: formName.trim(), facebook_page_name: formPage.trim() || undefined, domain: formDomain.trim() || undefined }),
      });
      const addData = await addRes.json();
      if (!addRes.ok) { setAddError(addData.error || 'Failed to add'); setAdding(false); return; }

      const newId = addData.competitor.id;
      refetchCompetitors();
      setSelectedId(newId);
      setShowForm(false);
      setFormName(''); setFormPage(''); setFormDomain('');

      // Auto-scrape
      setScrapingId(newId);
      const scrapeRes = await fetch('/api/competitors/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, competitor_id: newId }),
      });
      const scrapeData = await scrapeRes.json();
      setScrapeMsg(prev => ({ ...prev, [newId]: scrapeData.adsFound > 0 ? `Found ${scrapeData.adsFound} ads` : 'No ads found (check page name)' }));
      setScrapingId(null);
      refetchCompetitors();
      refetchAds();
    } catch {
      setAddError('Network error');
    }
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
      setScrapeMsg(prev => ({ ...prev, [competitorId]: data.adsFound > 0 ? `Found ${data.adsFound} ads` : 'No new ads' }));
      refetchCompetitors();
      if (competitorId === selectedId) refetchAds();
    } catch {
      setScrapeMsg(prev => ({ ...prev, [competitorId]: 'Error scraping' }));
    }
    setScrapingId(null);
  }

  async function handleDelete(competitorId: string) {
    if (!workspaceId || !confirm('Delete this competitor and all their ads?')) return;
    await fetch('/api/competitors/add', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: competitorId }),
    }).catch(() => {});
    if (selectedId === competitorId) setSelectedId(null);
    refetchCompetitors();
  }

  function copyInsight(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedInsight(key);
      setTimeout(() => setCopiedInsight(null), 2000);
    });
  }

  // AI Insights derived from ads
  const angleCounts: Record<string, number> = {};
  const toneCounts: Record<string, number> = {};
  let totalRunDays = 0;
  let runDaysCount = 0;
  for (const ad of ads) {
    if (ad.ai_angle) angleCounts[ad.ai_angle] = (angleCounts[ad.ai_angle] || 0) + 1;
    if (ad.ai_tone) toneCounts[ad.ai_tone] = (toneCounts[ad.ai_tone] || 0) + 1;
    if (ad.ad_delivery_start_time) {
      const start = new Date(ad.ad_delivery_start_time);
      const end = ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : new Date();
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) { totalRunDays += diff; runDaysCount++; }
    }
  }
  const topAngle = Object.entries(angleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topTone = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const avgRunDays = runDaysCount > 0 ? Math.round(totalRunDays / runDaysCount) : null;

  return (
    <PageShell title="Competitor Ad Spy" description="Track what your competitors are running" icon={Eye} badge="AD LIBRARY">
      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={() => { setShowForm(!showForm); setAddError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : '+ Add Competitor'}
        </button>
      </div>

      {/* Add Competitor form */}
      {showForm && (
        <div style={{ backgroundColor: '#18181b', border: '1px solid #7c3aed', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '16px' }}>Add a Competitor</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Brand Name *</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Nike"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#f4f4f5', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Facebook Page Name</label>
              <input
                value={formPage}
                onChange={e => setFormPage(e.target.value)}
                placeholder="e.g. Nike"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#f4f4f5', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Website Domain (optional)</label>
              <input
                value={formDomain}
                onChange={e => setFormDomain(e.target.value)}
                placeholder="e.g. nike.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#f4f4f5', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          {addError && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{addError}</p>}
          <button
            onClick={handleAddCompetitor}
            disabled={adding || !formName.trim()}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: adding || !formName.trim() ? '#27272a' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: adding || !formName.trim() ? 'not-allowed' : 'pointer' }}
          >
            {adding ? (scrapingId ? 'Scraping ads...' : 'Adding...') : 'Add & Scrape Ads'}
          </button>
        </div>
      )}

      {/* Main layout: sidebar + content */}
      <div style={{ display: 'grid', gridTemplateColumns: competitors.length > 0 ? '240px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* Competitors sidebar */}
        {competitors.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Competitors</div>
            {competitors.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{ padding: '12px 14px', borderRadius: '10px', border: `1px solid ${selectedId === c.id ? '#7c3aed' : '#27272a'}`, backgroundColor: selectedId === c.id ? 'rgba(124,58,237,0.1)' : '#18181b', cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>{c.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', backgroundColor: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>{c.ad_count}</span>
                </div>
                {c.domain && <div style={{ fontSize: '11px', color: '#52525b', marginTop: '3px' }}>{c.domain}</div>}
                {scrapeMsg[c.id] && <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>{scrapeMsg[c.id]}</div>}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleScrape(c.id)}
                    disabled={scrapingId === c.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#a1a1aa', fontSize: '11px', cursor: scrapingId === c.id ? 'not-allowed' : 'pointer' }}
                  >
                    <RefreshCw size={11} style={{ animation: scrapingId === c.id ? 'spin 1s linear infinite' : 'none' }} />
                    {scrapingId === c.id ? 'Scraping...' : 'Scrape'}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#71717a', fontSize: '11px', cursor: 'pointer' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Right content: ads + insights */}
        <div>
          {/* Empty: no competitors */}
          {competitors.length === 0 && !loadingCompetitors && (
            <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px' }}>
              <Eye size={40} color="#3f3f46" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f4f4f5', marginBottom: '8px' }}>Start spying on competitor ads</h3>
              <p style={{ fontSize: '14px', color: '#71717a', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px' }}>Add your first competitor to pull their active ads from the Meta Ad Library and analyze with AI.</p>
              <button
                onClick={() => setShowForm(true)}
                style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Your First Competitor
              </button>
            </div>
          )}

          {/* No competitor selected */}
          {competitors.length > 0 && !selectedId && (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px' }}>
              <p style={{ fontSize: '14px', color: '#71717a' }}>Select a competitor to view their ads</p>
            </div>
          )}

          {/* Competitor selected: show ads */}
          {selectedId && selectedCompetitor && (
            <>
              {/* Ads header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>{selectedCompetitor.name} — Ads</h2>
                  <p style={{ fontSize: '13px', color: '#71717a', margin: '4px 0 0' }}>{ads.length} ads tracked</p>
                </div>
              </div>

              {/* Loading skeleton */}
              {loadingAds && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '18px', height: '180px' }}>
                      <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#27272a', marginBottom: '10px', width: '60%' }} />
                      <div style={{ height: '10px', borderRadius: '6px', backgroundColor: '#27272a', marginBottom: '8px' }} />
                      <div style={{ height: '10px', borderRadius: '6px', backgroundColor: '#27272a', marginBottom: '8px', width: '80%' }} />
                      <div style={{ height: '10px', borderRadius: '6px', backgroundColor: '#27272a', width: '50%' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty: competitor has no ads */}
              {!loadingAds && ads.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px' }}>
                  <p style={{ fontSize: '14px', color: '#71717a', marginBottom: '12px' }}>No ads found yet.</p>
                  <p style={{ fontSize: '13px', color: '#52525b' }}>Click "Scrape" in the sidebar to pull their latest ads from Meta Ad Library.</p>
                </div>
              )}

              {/* Ads grid */}
              {!loadingAds && ads.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                  {ads.map((ad: any) => {
                    const isExpanded = expandedAd === ad.id;
                    const copy = ad.ad_creative_body || '';
                    const truncated = copy.length > 160 && !isExpanded ? copy.slice(0, 160) + '…' : copy;
                    return (
                      <div key={ad.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Platform badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {(ad.platforms || []).map((p: string) => (
                            <span key={p} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa', textTransform: 'capitalize' }}>{p.replace('_', ' ')}</span>
                          ))}
                          {ad.is_active && <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '8px', backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>Active</span>}
                        </div>

                        {/* Ad copy */}
                        {copy ? (
                          <p
                            onClick={() => setExpandedAd(isExpanded ? null : ad.id)}
                            style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6, margin: 0, cursor: copy.length > 160 ? 'pointer' : 'default' }}
                          >
                            {truncated}
                            {copy.length > 160 && <span style={{ color: '#7c3aed', fontSize: '12px' }}> {isExpanded ? ' show less' : ' show more'}</span>}
                          </p>
                        ) : (
                          <p style={{ fontSize: '13px', color: '#3f3f46', fontStyle: 'italic', margin: 0 }}>No ad copy available</p>
                        )}

                        {/* AI summary */}
                        {ad.ai_summary && (
                          <p style={{ fontSize: '12px', color: '#71717a', fontStyle: 'italic', margin: 0, borderLeft: '2px solid #27272a', paddingLeft: '10px' }}>{ad.ai_summary}</p>
                        )}

                        {/* AI tags */}
                        {(ad.ai_angle || ad.ai_tone) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {ad.ai_angle && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', backgroundColor: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>✦ {ad.ai_angle}</span>}
                            {ad.ai_tone && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', backgroundColor: `${TONE_COLORS[ad.ai_tone] || '#71717a'}20`, color: TONE_COLORS[ad.ai_tone] || '#71717a' }}>{ad.ai_tone}</span>}
                          </div>
                        )}

                        {/* Stats row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#52525b', borderTop: '1px solid #27272a', paddingTop: '10px' }}>
                          <span>Since {formatDate(ad.ad_delivery_start_time)}</span>
                          {(ad.impressions_lower_bound || ad.impressions_upper_bound) && (
                            <span>{formatNum(ad.impressions_lower_bound)}–{formatNum(ad.impressions_upper_bound)} impr.</span>
                          )}
                        </div>
                        {(ad.spend_lower_bound || ad.spend_upper_bound) && (
                          <div style={{ fontSize: '11px', color: '#52525b' }}>
                            Spend: {ad.currency}{formatNum(ad.spend_lower_bound)}–{ad.currency}{formatNum(ad.spend_upper_bound)}
                          </div>
                        )}

                        {/* View Original */}
                        {ad.snapshot_url && (
                          <a
                            href={ad.snapshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#7c3aed', textDecoration: 'none' }}
                          >
                            View Original <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AI Insights panel */}
              {!loadingAds && ads.length > 0 && (
                <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f4f4f5', marginBottom: '4px' }}>AI Insights</h3>
                  <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '20px' }}>
                    {selectedCompetitor.name} is running <strong style={{ color: '#f4f4f5' }}>{ads.filter((a: any) => a.is_active).length} active ads</strong> ({ads.length} total tracked).
                    {topAngle && <> Most common angle: <strong style={{ color: '#f4f4f5' }}>{topAngle}</strong>.</>}
                    {topTone && <> Dominant tone: <strong style={{ color: '#f4f4f5', textTransform: 'capitalize' }}>{topTone}</strong>.</>}
                    {avgRunDays !== null && <> Avg. run time: <strong style={{ color: '#f4f4f5' }}>{avgRunDays} days</strong>.</>}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {topAngle && (
                      <div style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>Top Angle</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', marginBottom: '10px' }}>{topAngle}</div>
                        <button
                          onClick={() => copyInsight(`Write an ad using this angle: "${topAngle}". Tone: ${topTone || 'professional'}. Make the opening hook attention-grabbing.`, 'angle')}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {copiedInsight === 'angle' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedInsight === 'angle' ? 'Copied!' : 'Steal This Angle'}
                        </button>
                      </div>
                    )}
                    {topTone && (
                      <div style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>Dominant Tone</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: TONE_COLORS[topTone] || '#f4f4f5', marginBottom: '10px', textTransform: 'capitalize' }}>{topTone}</div>
                        <button
                          onClick={() => copyInsight(`Write an ad with a ${topTone} tone${topAngle ? ` about: ${topAngle}` : ''}. Keep it concise and compelling.`, 'tone')}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {copiedInsight === 'tone' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedInsight === 'tone' ? 'Copied!' : 'Steal This Tone'}
                        </button>
                      </div>
                    )}
                    {avgRunDays !== null && (
                      <div style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>Avg. Ad Run Time</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', marginBottom: '10px' }}>{avgRunDays} days</div>
                        <div style={{ fontSize: '12px', color: '#52525b' }}>Use this to time your own campaigns</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
