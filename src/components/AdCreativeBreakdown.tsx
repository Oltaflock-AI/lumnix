'use client';
/**
 * AdCreativeBreakdown — full-screen drawer that turns a competitor ad's Claude
 * analysis (ad.ai_analysis jsonb) into a deep, visual, executable teardown:
 * sticky video player + scores, hook anatomy, content format & production,
 * beat-by-beat script, messaging, persuasion psychology, the offer,
 * why-it-works, strengths/weaknesses, and a copy-paste "build your own" playbook
 * with a fill-in-the-blank script template.
 *
 * Tolerant of older/partial analyses — every section renders only if present.
 */
import { useEffect, useState } from 'react';
import {
  X, Zap, Film, Clapperboard, Heart, Gift, CheckCircle2, AlertTriangle,
  Copy, Check, ExternalLink, Sparkles, Target, Users, MousePointerClick,
  Quote, Layers, Brain, Megaphone, ListChecks, ScrollText, Star,
} from 'lucide-react';

type Beat = { timestamp?: string; label?: string; spoken_or_text?: string; purpose?: string };
type Analysis = {
  one_liner?: string;
  summary?: string;
  scores?: Record<string, number | string>;
  hook?: { first_3s?: string; visual_hook?: string; verbal_hook?: string; text_overlay_hook?: string | null; type?: string; why_it_stops_scroll?: string; description?: string };
  content_format?: { format?: string; production_style?: string; talent?: string; shot_types?: string[]; pacing?: string; editing_tricks?: string[]; audio?: string; captions_style?: string | null; aspect_ratio?: string };
  script?: { framework?: string; reconstructed_script?: string; beats?: Beat[] };
  messaging?: { core_value_prop?: string; value_props?: string[]; claims?: string[]; objections_handled?: string[]; key_phrases?: string[] };
  psychology?: { pain_point?: string; desire?: string; emotional_triggers?: string[]; persuasion_principles?: string[]; awareness_level?: string; target_audience?: string };
  offer?: { what_is_offered?: string; pricing_or_discount?: string | null; urgency_or_scarcity?: string | null; risk_reversal?: string | null; cta_text?: string; cta_type?: string };
  why_it_works?: string[];
  strengths?: string[];
  weaknesses?: string[];
  replicable_playbook?: { steps?: string[]; script_template?: string };
  // legacy fields
  pain_point?: string; structure?: Beat[]; replicable_formula?: string; emotional_triggers?: string[];
};

const SCORE_LABELS: Record<string, string> = {
  hook_strength: 'Hook', scroll_stop_power: 'Scroll-stop', message_clarity: 'Clarity',
  emotional_pull: 'Emotion', cta_strength: 'CTA', overall: 'Overall',
};

const PHASE_COLOR: Record<string, string> = {
  hook: 'var(--primary)', problem: '#F59E0B', agitation: '#EF4444',
  solution: '#06B6D4', proof: '#8B5CF6', cta: '#10B981', close: '#10B981',
};
function beatColor(label?: string) {
  const k = (label || '').toLowerCase();
  for (const key of Object.keys(PHASE_COLOR)) if (k.includes(key)) return PHASE_COLOR[key];
  return 'var(--text-muted)';
}
function pretty(t?: string) {
  if (!t) return '';
  return t.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
function scoreColor(n: number) {
  if (n >= 8) return '#10B981';
  if (n >= 6) return 'var(--primary)';
  if (n >= 4) return '#F59E0B';
  return '#EF4444';
}

export function AdCreativeBreakdown({ ad, onClose }: { ad: any | null; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (ad) { window.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; }
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [ad, onClose]);

  if (!ad) return null;
  const a: Analysis | null = ad.ai_analysis || null;
  const analyzing = ad.ai_analyzed && !a;

  function copy(text: string | undefined, key: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1800); });
  }

  const beats = a?.script?.beats?.length ? a.script.beats : a?.structure;
  const triggers = a?.psychology?.emotional_triggers?.length ? a.psychology.emotional_triggers : a?.emotional_triggers;
  const painPoint = a?.psychology?.pain_point || a?.pain_point;
  const template = a?.replicable_playbook?.script_template;
  const steps = a?.replicable_playbook?.steps?.length ? a.replicable_playbook.steps : (a?.replicable_formula ? [a.replicable_formula] : []);
  const scores = a?.scores ? Object.entries(a.scores).filter(([k, v]) => SCORE_LABELS[k] && typeof v === 'number') as [string, number][] : [];

  return (
    <div className="lx-bd-overlay" onClick={onClose}>
      <div className="lx-bd-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ad creative breakdown">
        {/* Header */}
        <div className="lx-bd-header">
          <div className="lx-bd-header-main">
            <span className="lx-spy-tag">{ad.page_name || 'Competitor'}</span>
            <h2 className="lx-bd-title">{a?.one_liner || ad.headline || ad.ad_copy?.slice(0, 70) || 'Creative breakdown'}</h2>
            <div className="lx-bd-header-meta">
              {ad.days_running != null && (
                <span className={`lx-bd-chip ${ad.days_running >= 90 ? 'lx-bd-chip--champ' : ad.days_running >= 30 ? 'lx-bd-chip--win' : ''}`}>
                  {ad.days_running}d running{ad.days_running >= 90 ? ' · champion' : ad.days_running >= 30 ? ' · winning' : ''}
                </span>
              )}
              {a?.hook?.type && <span className="lx-bd-chip lx-bd-chip--accent"><Zap size={11} /> {pretty(a.hook.type)} hook</span>}
              {a?.content_format?.format && <span className="lx-bd-chip">{a.content_format.format.split(/[,(]/)[0].trim()}</span>}
              {a?.script?.framework && <span className="lx-bd-chip">{a.script.framework} framework</span>}
            </div>
          </div>
          <button className="lx-spy-modal-close" onClick={onClose} type="button" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="lx-bd-body">
          {!a ? (
            <div className="lx-bd-empty">
              <Sparkles size={28} />
              <p>{analyzing ? 'This ad is queued for AI analysis. Check back after the next sync.' : 'No AI breakdown yet for this ad. Winning ads are analyzed on each scrape.'}</p>
            </div>
          ) : (
            <div className="lx-bd-grid">
              {/* LEFT: sticky media + scores */}
              <aside className="lx-bd-aside">
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
                      Open on Meta Ad Library <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {scores.length > 0 && (
                  <div className="lx-bd-scores">
                    {scores.sort((x, y) => (x[0] === 'overall' ? -1 : y[0] === 'overall' ? 1 : 0)).map(([k, v]) => (
                      <div key={k} className={`lx-bd-score ${k === 'overall' ? 'lx-bd-score--overall' : ''}`}>
                        <div className="lx-bd-score-top">
                          <span className="lx-bd-score-label">{SCORE_LABELS[k]}</span>
                          <span className="lx-bd-score-num" style={{ color: scoreColor(v) }}>{v}<span className="lx-bd-score-max">/10</span></span>
                        </div>
                        <div className="lx-bd-score-bar"><span style={{ width: `${v * 10}%`, background: scoreColor(v) }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </aside>

              {/* RIGHT: the teardown */}
              <div className="lx-bd-main">
                {a.summary && <div className="lx-bd-summary">{a.summary}</div>}

                {/* HOOK ANATOMY */}
                {a.hook && (
                  <Section icon={<Zap size={15} />} title="Hook anatomy" accent>
                    <div className="lx-bd-hook-grid">
                      {a.hook.first_3s && <HookCell label="First 3 seconds" value={a.hook.first_3s} wide />}
                      {a.hook.visual_hook && <HookCell label="Visual hook" value={a.hook.visual_hook} />}
                      {a.hook.verbal_hook && <HookCell label="Verbal hook" value={a.hook.verbal_hook} quote />}
                      {a.hook.text_overlay_hook && <HookCell label="On-screen text" value={a.hook.text_overlay_hook} quote />}
                      {a.hook.why_it_stops_scroll && <HookCell label="Why it stops the scroll" value={a.hook.why_it_stops_scroll} wide highlight />}
                    </div>
                  </Section>
                )}

                {/* CONTENT FORMAT & PRODUCTION */}
                {a.content_format && (
                  <Section icon={<Film size={15} />} title="Content format & production">
                    <div className="lx-bd-facts">
                      {a.content_format.format && <Fact label="Format" value={a.content_format.format} />}
                      {a.content_format.production_style && <Fact label="Production" value={a.content_format.production_style} />}
                      {a.content_format.talent && <Fact label="Talent" value={a.content_format.talent} />}
                      {a.content_format.pacing && <Fact label="Pacing" value={a.content_format.pacing} />}
                      {a.content_format.audio && <Fact label="Audio" value={a.content_format.audio} />}
                      {a.content_format.aspect_ratio && <Fact label="Aspect ratio" value={a.content_format.aspect_ratio} />}
                    </div>
                    {(a.content_format.shot_types?.length || a.content_format.editing_tricks?.length) ? (
                      <div className="lx-bd-tagrows">
                        {a.content_format.shot_types?.length ? <TagRow label="Shots" items={a.content_format.shot_types} /> : null}
                        {a.content_format.editing_tricks?.length ? <TagRow label="Editing" items={a.content_format.editing_tricks} /> : null}
                      </div>
                    ) : null}
                  </Section>
                )}

                {/* SCRIPT — beat by beat */}
                {beats?.length ? (
                  <Section icon={<Clapperboard size={15} />} title="Script, beat by beat" extra={a.script?.framework ? <span className="lx-bd-pill">{a.script.framework}</span> : null}>
                    <div className="lx-bd-timeline">
                      {beats.map((b, i) => (
                        <div key={i} className="lx-bd-tl-row">
                          <div className="lx-bd-tl-marker">
                            <span className="lx-bd-tl-dot" style={{ background: beatColor(b.label) }} />
                            {i < beats.length - 1 && <span className="lx-bd-tl-line" />}
                          </div>
                          <div className="lx-bd-tl-content">
                            <div className="lx-bd-tl-head">
                              <span className="lx-bd-tl-phase" style={{ color: beatColor(b.label) }}>{(b.label || `Beat ${i + 1}`).toUpperCase()}</span>
                              {b.timestamp && <span className="lx-bd-tl-time">{b.timestamp}</span>}
                            </div>
                            {(b.spoken_or_text || (b as any).what_happens) && <p className="lx-bd-tl-text">{b.spoken_or_text || (b as any).what_happens}</p>}
                            {b.purpose && <p className="lx-bd-tl-purpose"><span>Why →</span> {b.purpose}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                ) : null}

                {/* MESSAGING */}
                {a.messaging && (a.messaging.value_props?.length || a.messaging.claims?.length || a.messaging.key_phrases?.length) ? (
                  <Section icon={<Megaphone size={15} />} title="Messaging & claims">
                    {a.messaging.core_value_prop && <div className="lx-bd-vprop"><Star size={13} /> {a.messaging.core_value_prop}</div>}
                    {a.messaging.value_props?.length ? <ChecklistBlock label="Value props" items={a.messaging.value_props} /> : null}
                    {a.messaging.claims?.length ? <ChecklistBlock label="Claims made" items={a.messaging.claims} /> : null}
                    {a.messaging.objections_handled?.length ? <ChecklistBlock label="Objections handled" items={a.messaging.objections_handled} /> : null}
                    {a.messaging.key_phrases?.length ? (
                      <div className="lx-bd-phrases">
                        {a.messaging.key_phrases.map((p, i) => <span key={i} className="lx-bd-phrase"><Quote size={11} /> {p}</span>)}
                      </div>
                    ) : null}
                  </Section>
                ) : null}

                {/* PSYCHOLOGY */}
                {a.psychology && (
                  <Section icon={<Brain size={15} />} title="Persuasion psychology">
                    <div className="lx-bd-facts">
                      {painPoint && <Fact label="Pain point" value={painPoint} icon={<Target size={14} />} />}
                      {a.psychology.desire && <Fact label="Desire" value={a.psychology.desire} icon={<Heart size={14} />} />}
                      {a.psychology.target_audience && <Fact label="Audience" value={a.psychology.target_audience} icon={<Users size={14} />} />}
                      {a.psychology.awareness_level && <Fact label="Awareness level" value={pretty(a.psychology.awareness_level)} icon={<Layers size={14} />} />}
                    </div>
                    {triggers?.length ? <TagRow label="Emotional triggers" items={triggers} accent /> : null}
                    {a.psychology.persuasion_principles?.length ? <TagRow label="Persuasion principles" items={a.psychology.persuasion_principles.map(pretty)} /> : null}
                  </Section>
                )}

                {/* OFFER */}
                {a.offer && (a.offer.what_is_offered || a.offer.cta_text) && (
                  <Section icon={<Gift size={15} />} title="The offer & CTA">
                    <div className="lx-bd-facts">
                      {a.offer.what_is_offered && <Fact label="Offer" value={a.offer.what_is_offered} />}
                      {a.offer.pricing_or_discount && <Fact label="Price / discount" value={a.offer.pricing_or_discount} />}
                      {a.offer.urgency_or_scarcity && <Fact label="Urgency" value={a.offer.urgency_or_scarcity} />}
                      {a.offer.risk_reversal && <Fact label="Risk reversal" value={a.offer.risk_reversal} />}
                      {a.offer.cta_text && <Fact label="CTA" value={a.offer.cta_text} icon={<MousePointerClick size={14} />} />}
                      {a.offer.cta_type && <Fact label="CTA type" value={a.offer.cta_type} />}
                    </div>
                  </Section>
                )}

                {/* WHY IT WORKS */}
                {a.why_it_works?.length ? (
                  <Section icon={<CheckCircle2 size={15} />} title="Why it works">
                    <ul className="lx-bd-why-list">
                      {a.why_it_works.map((w, i) => <li key={i}><CheckCircle2 size={15} className="lx-bd-why-check" /> <span>{w}</span></li>)}
                    </ul>
                  </Section>
                ) : null}

                {/* STRENGTHS / WEAKNESSES */}
                {(a.strengths?.length || a.weaknesses?.length) ? (
                  <div className="lx-bd-sw">
                    {a.strengths?.length ? (
                      <div className="lx-bd-sw-col lx-bd-sw-col--good">
                        <div className="lx-bd-sw-head"><CheckCircle2 size={14} /> Strengths</div>
                        <ul>{a.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    ) : null}
                    {a.weaknesses?.length ? (
                      <div className="lx-bd-sw-col lx-bd-sw-col--bad">
                        <div className="lx-bd-sw-head"><AlertTriangle size={14} /> Gaps you can beat</div>
                        <ul>{a.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* PLAYBOOK + SCRIPT TEMPLATE */}
                {(steps.length || template) ? (
                  <div className="lx-bd-formula">
                    <div className="lx-bd-formula-head">
                      <div className="lx-bd-formula-title"><Sparkles size={16} /> Build your own version</div>
                    </div>
                    <p className="lx-bd-formula-sub">Same mechanics, your product. Hand this to your creator.</p>

                    {steps.length ? (
                      <div className="lx-bd-playbook">
                        <div className="lx-bd-playbook-label"><ListChecks size={13} /> Shoot-this checklist</div>
                        <ol className="lx-bd-steps">{steps.map((s, i) => <li key={i}>{s.replace(/^\d+[.)]\s*/, '')}</li>)}</ol>
                      </div>
                    ) : null}

                    {template ? (
                      <div className="lx-bd-template">
                        <div className="lx-bd-template-head">
                          <span className="lx-bd-playbook-label"><ScrollText size={13} /> Fill-in-the-blank script</span>
                          <button className="lx-bd-copy-btn" onClick={() => copy(template, 'template')} type="button">
                            {copied === 'template' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy script</>}
                          </button>
                        </div>
                        <div className="lx-bd-template-body">{template}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children, accent, extra }: { icon: React.ReactNode; title: string; children: React.ReactNode; accent?: boolean; extra?: React.ReactNode }) {
  return (
    <div className={`lx-bd-section ${accent ? 'lx-bd-section--accent' : ''}`}>
      <div className="lx-bd-section-title">{icon} {title} {extra}</div>
      {children}
    </div>
  );
}
function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="lx-bd-fact">
      <div className="lx-bd-fact-label">{icon} {label}</div>
      <div className="lx-bd-fact-value">{value}</div>
    </div>
  );
}
function HookCell({ label, value, wide, quote, highlight }: { label: string; value: string; wide?: boolean; quote?: boolean; highlight?: boolean }) {
  return (
    <div className={`lx-bd-hookcell ${wide ? 'lx-bd-hookcell--wide' : ''} ${highlight ? 'lx-bd-hookcell--hl' : ''}`}>
      <div className="lx-bd-hookcell-label">{label}</div>
      <div className="lx-bd-hookcell-value">{quote ? `“${value}”` : value}</div>
    </div>
  );
}
function TagRow({ label, items, accent }: { label: string; items: string[]; accent?: boolean }) {
  return (
    <div className="lx-bd-tagrow">
      <span className="lx-bd-tagrow-label">{label}</span>
      <div className="lx-bd-tagrow-tags">
        {items.map((t, i) => <span key={i} className={`lx-bd-tag ${accent ? 'lx-bd-tag--accent' : ''}`}>{t}</span>)}
      </div>
    </div>
  );
}
function ChecklistBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="lx-bd-checkblock">
      <div className="lx-bd-checkblock-label">{label}</div>
      <ul>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  );
}
