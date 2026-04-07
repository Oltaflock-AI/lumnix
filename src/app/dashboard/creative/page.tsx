'use client';
import { useState, useEffect } from 'react';
import { Palette, Plus, FolderOpen, Search, Sparkles, Trash2, Image, Copy, Check, FileText, Video, Lightbulb, ChevronDown, X, Loader2 } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';

type Board = { id: string; name: string; description: string; color: string; creative_saves: any };
type Save = { id: string; title: string; image_url: string; ad_copy: string; cta: string; advertiser_name: string; platform: string; tags: string[]; source_type: string; created_at: string };

const FRAMEWORKS = [
  { id: 'AIDA', label: 'AIDA', desc: 'Attention → Interest → Desire → Action' },
  { id: 'PAS', label: 'PAS', desc: 'Problem → Agitate → Solution' },
  { id: 'hook_body_cta', label: 'Hook-Body-CTA', desc: 'Pattern interrupt → Value → CTA' },
  { id: 'BAB', label: 'Before-After-Bridge', desc: 'Pain → Dream → Product' },
];

export default function CreativeStudioPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const workspaceId = workspace?.id;

  // State
  const [tab, setTab] = useState<'boards' | 'generate'>('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [saves, setSaves] = useState<Save[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  // Generate state
  const [genType, setGenType] = useState<'ad_copy' | 'video_script' | 'creative_brief'>('ad_copy');
  const [genFramework, setGenFramework] = useState('AIDA');
  const [genContext, setGenContext] = useState('');
  const [genAudience, setGenAudience] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [copied, setCopied] = useState<number | null>(null);

  // Fetch boards
  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/creative/boards?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(d => { setBoards(d.boards || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId]);

  // Fetch saves
  useEffect(() => {
    if (!workspaceId) return;
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (selectedBoard) params.set('board_id', selectedBoard);
    if (search) params.set('search', search);
    fetch(`/api/creative/saves?${params}`)
      .then(r => r.json())
      .then(d => setSaves(d.saves || []))
      .catch(() => {});
  }, [workspaceId, selectedBoard, search]);

  async function createBoard() {
    if (!workspaceId || !newBoardName.trim()) return;
    const res = await fetch('/api/creative/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, name: newBoardName.trim() }),
    });
    const d = await res.json();
    if (d.board) { setBoards(prev => [d.board, ...prev]); setNewBoardName(''); setShowNewBoard(false); }
  }

  async function deleteBoard(id: string) {
    await fetch(`/api/creative/boards?id=${id}`, { method: 'DELETE' });
    setBoards(prev => prev.filter(b => b.id !== id));
    if (selectedBoard === id) setSelectedBoard(null);
  }

  async function deleteSave(id: string) {
    await fetch(`/api/creative/saves?id=${id}`, { method: 'DELETE' });
    setSaves(prev => prev.filter(s => s.id !== id));
  }

  async function handleGenerate() {
    if (!workspaceId) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch('/api/creative/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          type: genType,
          framework: genType === 'ad_copy' ? genFramework : undefined,
          brand_context: genContext || undefined,
          target_audience: genAudience || undefined,
        }),
      });
      const d = await res.json();
      setGenResult(d.creative || d.error || null);
    } catch { setGenResult('Generation failed'); }
    setGenerating(false);
  }

  function copyToClipboard(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  }

  const GEN_TYPES = [
    { id: 'ad_copy', label: 'Ad Copy', icon: FileText, desc: '5 ad copy variations' },
    { id: 'video_script', label: 'Video Script', icon: Video, desc: '3 short-form scripts' },
    { id: 'creative_brief', label: 'Creative Brief', icon: Lightbulb, desc: 'Weekly brief from data' },
  ] as const;

  return (
    <PageShell title="Creative Studio" description="Swipe files, AI ad copy, video scripts, and creative briefs" icon={Palette}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'boards' as const, label: 'Swipe File', icon: FolderOpen },
          { id: 'generate' as const, label: 'AI Generate', icon: Sparkles },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              border: 'none', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer',
              backgroundColor: tab === t.id ? c.accent : 'transparent',
              color: tab === t.id ? 'white' : c.textSecondary,
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── BOARDS TAB ─── */}
      {tab === 'boards' && (
        <div>
          {/* Board selector + search */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
              <button
                onClick={() => setSelectedBoard(null)}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: `1px solid ${!selectedBoard ? c.accent : c.border}`,
                  backgroundColor: !selectedBoard ? c.accentSubtle : c.bgCard, color: !selectedBoard ? c.accent : c.textSecondary,
                  fontSize: 13, fontWeight: !selectedBoard ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                All Saves
              </button>
              {boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBoard(b.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: `1px solid ${selectedBoard === b.id ? c.accent : c.border}`,
                    backgroundColor: selectedBoard === b.id ? c.accentSubtle : c.bgCard,
                    color: selectedBoard === b.id ? c.accent : c.textSecondary,
                    fontSize: 13, fontWeight: selectedBoard === b.id ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {b.name}
                </button>
              ))}
              <button
                onClick={() => setShowNewBoard(true)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `1px dashed ${c.border}`, backgroundColor: 'transparent', color: c.textMuted, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={14} /> Board
              </button>
            </div>
            <div style={{ position: 'relative', minWidth: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ads, copy, brands..."
                style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>

          {/* New board modal */}
          {showNewBoard && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: 16, borderRadius: 10, backgroundColor: c.bgCard, border: `1px solid ${c.border}` }}>
              <input
                value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
                placeholder="Board name..."
                autoFocus
                onKeyDown={e => e.key === 'Enter' && createBoard()}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.bgPage, color: c.text, fontSize: 13, outline: 'none' }}
              />
              <button onClick={createBoard} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: c.accent, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Create</button>
              <button onClick={() => setShowNewBoard(false)} style={{ padding: '8px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textMuted, cursor: 'pointer' }}><X size={14} /></button>
            </div>
          )}

          {/* Saves grid */}
          {saves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12, border: `1px dashed ${c.border}`, backgroundColor: c.bgCard }}>
              <Image size={32} color={c.textMuted} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>No saved creatives yet</p>
              <p style={{ fontSize: 13, color: c.textMuted }}>Save ads from the Competitor Ad Spy, or generate new ones with AI.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {saves.map(save => (
                <div key={save.id} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = c.borderStrong)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                >
                  {save.image_url && (
                    <div style={{ width: '100%', height: 160, backgroundColor: c.bgPage, overflow: 'hidden' }}>
                      <img src={save.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    {save.advertiser_name && <p style={{ fontSize: 11, fontWeight: 600, color: c.accent, marginBottom: 4 }}>{save.advertiser_name}</p>}
                    {save.title && <p style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 6 }}>{save.title}</p>}
                    {save.ad_copy && <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{save.ad_copy}</p>}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {(save.tags || []).slice(0, 4).map(tag => (
                        <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: c.accentSubtle, color: c.accent, fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: c.textMuted }}>{save.platform || save.source_type}</span>
                      <button onClick={() => deleteSave(save.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Board management */}
          {boards.length > 0 && (
            <div style={{ marginTop: 24, padding: 20, borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 12 }}>Your Boards</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {boards.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, backgroundColor: c.bgPage, border: `1px solid ${c.border}` }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: b.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: c.text }}>{b.name}</span>
                    <span style={{ fontSize: 12, color: c.textMuted }}>{b.creative_saves?.[0]?.count || 0} saves</span>
                    <button onClick={() => deleteBoard(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── GENERATE TAB ─── */}
      {tab === 'generate' && (
        <div>
          {/* Type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {GEN_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => { setGenType(t.id); setGenResult(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
                  border: `1px solid ${genType === t.id ? c.accent : c.border}`,
                  backgroundColor: genType === t.id ? c.accentSubtle : c.bgCard,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <t.icon size={18} color={genType === t.id ? c.accent : c.textMuted} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: genType === t.id ? c.accent : c.text }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: c.textMuted }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Input form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Brand Context</label>
              <textarea
                value={genContext}
                onChange={e => setGenContext(e.target.value)}
                placeholder="Describe your brand, product, or service..."
                rows={3}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Target Audience</label>
              <textarea
                value={genAudience}
                onChange={e => setGenAudience(e.target.value)}
                placeholder="Who are you targeting? Demographics, interests, pain points..."
                rows={3}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Framework selector (for ad copy only) */}
          {genType === 'ad_copy' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 8 }}>Framework</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FRAMEWORKS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setGenFramework(f.id)}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      border: `1px solid ${genFramework === f.id ? c.accent : c.border}`,
                      backgroundColor: genFramework === f.id ? c.accentSubtle : c.bgCard,
                      color: genFramework === f.id ? c.accent : c.textSecondary,
                      fontSize: 12, fontWeight: genFramework === f.id ? 600 : 400, cursor: 'pointer',
                    }}
                    title={f.desc}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10,
              border: 'none', backgroundColor: c.accent, color: 'white', fontSize: 14, fontWeight: 600,
              cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, marginBottom: 24,
            }}
          >
            {generating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
            {generating ? 'Generating...' : `Generate ${GEN_TYPES.find(t => t.id === genType)?.label}`}
          </button>

          {/* Results */}
          {genResult && (
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 16 }}>
                <Sparkles size={16} color={c.accent} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Generated {GEN_TYPES.find(t => t.id === genType)?.label}
              </h3>

              {typeof genResult === 'string' ? (
                <p style={{ fontSize: 14, color: c.danger }}>{genResult}</p>
              ) : Array.isArray(genResult) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {genResult.map((item: any, i: number) => (
                    <div key={i} style={{ padding: 16, borderRadius: 10, backgroundColor: c.bgPage, border: `1px solid ${c.border}`, position: 'relative' }}>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(item, null, 2), i)}
                        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4 }}
                        title="Copy"
                      >
                        {copied === i ? <Check size={14} color={c.success} /> : <Copy size={14} />}
                      </button>

                      {/* Ad copy result */}
                      {item.headline && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 600, color: c.accent, marginBottom: 4 }}>
                            {item.hook_type && <span style={{ padding: '2px 6px', borderRadius: 4, backgroundColor: c.accentSubtle, marginRight: 6 }}>{item.hook_type}</span>}
                            Variation {i + 1}
                          </div>
                          <h4 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 6 }}>{item.headline}</h4>
                          <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6, marginBottom: 8 }}>{item.primary_text}</p>
                          {item.cta && <span style={{ fontSize: 12, fontWeight: 600, color: c.accent }}>CTA: {item.cta}</span>}
                        </>
                      )}

                      {/* Video script result */}
                      {item.hook && !item.headline && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{item.title || `Script ${i + 1}`}</h4>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: c.warningSubtle, color: c.warning, fontWeight: 600 }}>{item.estimated_length || '30s'} · {item.format || 'UGC'}</span>
                          </div>
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: c.success }}>HOOK:</span>
                            <p style={{ fontSize: 13, color: c.text, marginTop: 2 }}>{item.hook}</p>
                          </div>
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: c.accent }}>BODY:</span>
                            <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6, marginTop: 2, whiteSpace: 'pre-wrap' }}>{typeof item.body === 'string' ? item.body : JSON.stringify(item.body, null, 2)}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: c.warning }}>CTA:</span>
                            <p style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>{item.cta}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Creative brief result */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {genResult.objective && (
                    <div><h4 style={{ fontSize: 13, fontWeight: 600, color: c.accent, marginBottom: 4 }}>Objective</h4><p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6 }}>{genResult.objective}</p></div>
                  )}
                  {genResult.key_message && (
                    <div><h4 style={{ fontSize: 13, fontWeight: 600, color: c.accent, marginBottom: 4 }}>Key Message</h4><p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6 }}>{genResult.key_message}</p></div>
                  )}
                  {genResult.content_ideas && Array.isArray(genResult.content_ideas) && (
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: c.accent, marginBottom: 8 }}>Content Ideas</h4>
                      {genResult.content_ideas.map((idea: any, i: number) => (
                        <div key={i} style={{ padding: 12, borderRadius: 8, backgroundColor: c.bgPage, border: `1px solid ${c.border}`, marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 4 }}>{idea.title}</div>
                          <p style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.5 }}>{idea.description}</p>
                          {idea.platform && <span style={{ fontSize: 11, color: c.textMuted, marginTop: 4, display: 'inline-block' }}>{idea.platform} · {idea.format}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {genResult.messaging_angles && Array.isArray(genResult.messaging_angles) && (
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: c.accent, marginBottom: 8 }}>Messaging Angles</h4>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {genResult.messaging_angles.map((angle: any, i: number) => (
                          <span key={i} style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: c.bgPage, border: `1px solid ${c.border}`, fontSize: 12, color: c.textSecondary }}>
                            {typeof angle === 'string' ? angle : angle.angle || angle.title || JSON.stringify(angle)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {genResult.visual_direction && (
                    <div><h4 style={{ fontSize: 13, fontWeight: 600, color: c.accent, marginBottom: 4 }}>Visual Direction</h4><p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6 }}>{typeof genResult.visual_direction === 'string' ? genResult.visual_direction : JSON.stringify(genResult.visual_direction)}</p></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
