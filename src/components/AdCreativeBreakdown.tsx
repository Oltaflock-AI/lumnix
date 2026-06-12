'use client';
/**
 * AdCreativeBreakdown — full-screen drawer that turns a competitor ad's Claude
 * analysis (ad.ai_analysis jsonb) into a visual, executable creative teardown:
 * the hook, a scene-by-scene timeline, why it works, and a copy-paste
 * "build your own version" formula a brand can hand to a creator.
 *
 * Pure presentational. Renders nothing if the ad has no ai_analysis yet.
 */
import { useEffect, useState } from 'react';
import {
  X, Zap, Target, Gift, Heart, Film, MousePointerClick, Users,
  CheckCircle2, Clapperboard, Copy, Check, ExternalLink, PlayCircle, Sparkles,
} from 'lucide-react';

type Phase = { phase?: string; timestamp?: string; what_happens?: string };
type Analysis = {
  hook?: { description?: string; type?: string; why_it_stops_scroll?: string };
  pain_point?: string;
  offer_structure?: string;
  emotional_triggers?: string[];
  structure?: Phase[];
  visual_style?: string;
  cta_type?: string;
  target_audience?: string;
  why_it_works?: string[];
  replicable_formula?: string;
  summary?: string;
};

const PHASE_COLOR: Record<string, string> = {
  hook: 'var(--primary)',
  problem: '#F59E0B',
  agitation: '#EF4444',
  solution: 'var(--accent-secondary, #00D4AA)',
  proof: '#8B5CF6',
  cta: 'var(--success, #10B981)',
};

function phaseColor(p?: string) {
  return PHASE_COLOR[(p || '').toLowerCase()] || 'var(--text-muted)';
}

function prettyHookType(t?: string) {
  if (!t) return 'Hook';
  return t.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export function AdCreativeBreakdown({
  ad,
  onClose,
}: {
  ad: any | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (ad) {
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [ad, onClose]);

  if (!ad) return null;

  const a: Analysis | null = ad.ai_analysis || null;
  const analyzing = ad.ai_analyzed && !a; // analyzed flag set but payload missing (pre-migration row)

  function copyFormula() {
    if (!a?.replicable_formula) return;
    navigator.clipboard.writeText(a.replicable_formula).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="lx-bd-overlay" onClick={onClose}>
      <div className="lx-bd-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ad creative breakdown">
        {/* Header */}
        <div className="lx-bd-header">
          <div className="lx-bd-header-main">
            <span className="lx-spy-tag">{ad.page_name || 'Competitor'}</span>
            <h2 className="lx-bd-title">{ad.headline || ad.ad_copy?.slice(0, 70) || 'Creative breakdown'}</h2>
            <div className="lx-bd-header-meta">
              {ad.days_running != null && (
                <span className={`lx-bd-chip ${ad.days_running >= 90 ? 'lx-bd-chip--champ' : ad.days_running >= 30 ? 'lx-bd-chip--win' : ''}`}>
                  <PlayCircle size={12} /> {ad.days_running}d running
                  {ad.days_running >= 90 ? ' · champion' : ad.days_running >= 30 ? ' · winning' : ''}
                </span>
              )}
              {ad.ad_format && <span className="lx-bd-chip">{ad.ad_format}</span>}
              {ad.call_to_action && <span className="lx-bd-chip">{ad.call_to_action.replace(/_/g, ' ')}</span>}
            </div>
          </div>
          <button className="lx-spy-modal-close" onClick={onClose} type="button" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="lx-bd-body">
          {!a ? (
            <div className="lx-bd-empty">
              <Sparkles size={28} />
              <p>{analyzing ? 'This ad is queued for AI analysis. Check back after the next sync.' : 'No AI breakdown yet for this ad. It will be analyzed on the next scrape of winning ads.'}</p>
            </div>
          ) : (
            <>
              {/* Two-column: media + hook */}
              <div className="lx-bd-top">
                <div className="lx-bd-media">
                  {ad.video_url ? (
                    <video src={ad.video_url} poster={ad.image_url || undefined} controls playsInline className="lx-bd-video" />
                  ) : ad.image_url ? (
                    <img src={ad.image_url} alt="" className="lx-bd-video" />
                  ) : (
                    <div className="lx-bd-media-empty"><Film size={28} /></div>
                  )}
                  {ad.ad_snapshot_url && (
                    <a href={ad.ad_snapshot_url} target="_blank" rel="noopener noreferrer" className="lx-bd-media-link">
                      View on Meta Ad Library <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className="lx-bd-hook">
                  <div className="lx-bd-hook-badge"><Zap size={13} /> {prettyHookType(a.hook?.type)} hook</div>
                  <p className="lx-bd-hook-desc">{a.hook?.description}</p>
                  {a.hook?.why_it_stops_scroll && (
                    <div className="lx-bd-hook-why">
                      <span className="lx-bd-hook-why-label">Why it stops the scroll</span>
                      {a.hook.why_it_stops_scroll}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary verdict */}
              {a.summary && <div className="lx-bd-summary">{a.summary}</div>}

              {/* Quick facts grid */}
              <div className="lx-bd-facts">
                {a.pain_point && <Fact icon={<Target size={15} />} label="Pain point" value={a.pain_point} />}
                {a.offer_structure && <Fact icon={<Gift size={15} />} label="Offer" value={a.offer_structure} />}
                {a.target_audience && <Fact icon={<Users size={15} />} label="Audience" value={a.target_audience} />}
                {a.visual_style && <Fact icon={<Film size={15} />} label="Visual style" value={a.visual_style} />}
                {a.cta_type && <Fact icon={<MousePointerClick size={15} />} label="CTA approach" value={a.cta_type} />}
              </div>

              {/* Emotional triggers */}
              {a.emotional_triggers?.length ? (
                <Section icon={<Heart size={15} />} title="Emotional triggers">
                  <div className="lx-bd-triggers">
                    {a.emotional_triggers.map((t, i) => (
                      <span key={i} className="lx-bd-trigger">{t}</span>
                    ))}
                  </div>
                </Section>
              ) : null}

              {/* Scene-by-scene timeline */}
              {a.structure?.length ? (
                <Section icon={<Clapperboard size={15} />} title="Scene-by-scene structure">
                  <div className="lx-bd-timeline">
                    {a.structure.map((s, i) => (
                      <div key={i} className="lx-bd-tl-row">
                        <div className="lx-bd-tl-marker">
                          <span className="lx-bd-tl-dot" style={{ background: phaseColor(s.phase) }} />
                          {i < (a.structure!.length - 1) && <span className="lx-bd-tl-line" />}
                        </div>
                        <div className="lx-bd-tl-content">
                          <div className="lx-bd-tl-head">
                            <span className="lx-bd-tl-phase" style={{ color: phaseColor(s.phase) }}>{(s.phase || '').toUpperCase()}</span>
                            {s.timestamp && <span className="lx-bd-tl-time">{s.timestamp}</span>}
                          </div>
                          <p className="lx-bd-tl-text">{s.what_happens}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {/* Why it works */}
              {a.why_it_works?.length ? (
                <Section icon={<CheckCircle2 size={15} />} title="Why it works">
                  <ul className="lx-bd-why-list">
                    {a.why_it_works.map((w, i) => (
                      <li key={i}><CheckCircle2 size={15} className="lx-bd-why-check" /> <span>{w}</span></li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {/* Replicable formula — the executable payoff */}
              {a.replicable_formula && (
                <div className="lx-bd-formula">
                  <div className="lx-bd-formula-head">
                    <div className="lx-bd-formula-title"><Sparkles size={16} /> Build your own version</div>
                    <button className="lx-bd-copy-btn" onClick={copyFormula} type="button">
                      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy formula</>}
                    </button>
                  </div>
                  <p className="lx-bd-formula-sub">Hand this template to your creator — same mechanics, your product.</p>
                  <div className="lx-bd-formula-body">{a.replicable_formula}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="lx-bd-fact">
      <div className="lx-bd-fact-label">{icon} {label}</div>
      <div className="lx-bd-fact-value">{value}</div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="lx-bd-section">
      <div className="lx-bd-section-title">{icon} {title}</div>
      {children}
    </div>
  );
}
