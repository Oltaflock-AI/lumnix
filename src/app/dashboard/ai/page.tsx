'use client';
import { useState, useRef, useEffect, type ReactElement } from 'react';
import { Brain, Send, BarChart3, TrendingUp, Zap, Search, Target, Copy, Check, Trash2, Database, Wifi, WifiOff, AlertTriangle, Lightbulb, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspace, useIntegrations } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';

/* ─── Insight types & colors ─── */

type InsightType = 'win' | 'warning' | 'opportunity' | 'tip';
interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  metric?: string | null;
  change?: string | null;
  action?: string | null;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}

const INSIGHT_CONFIG: Record<InsightType, { color: string; bg: string; icon: any; label: string }> = {
  win:         { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  icon: TrendingUp,    label: 'Win' },
  warning:     { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  icon: AlertTriangle,  label: 'Warning' },
  opportunity: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: Lightbulb,      label: 'Opportunity' },
  tip:         { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', icon: Zap,            label: 'Tip' },
};

/* ─── Chat suggestions ─── */

const SUGGESTIONS = [
  { icon: Sparkles, text: 'Give me a full marketing overview across all channels', category: 'Cross-Channel' },
  { icon: TrendingUp, text: 'Compare my organic vs paid performance this month', category: 'Cross-Channel' },
  { icon: Search, text: 'What are my top 10 keywords by clicks?', category: 'SEO' },
  { icon: Target, text: 'How are my Google Ads and Meta Ads campaigns performing?', category: 'Paid' },
  { icon: Zap, text: 'Give me 3 quick wins to improve my SEO', category: 'Strategy' },
  { icon: Brain, text: 'What should I focus on this week?', category: 'Strategy' },
];

type Message = { role: 'user' | 'assistant'; content: string; timestamp?: Date };

/* ─── Markdown renderer ─── */

function MarkdownRenderer({ content }: { content: string }) {
  const { c } = useTheme();
  const lines = content.split('\n');
  const elements: ReactElement[] = [];
  let i = 0;

  function formatInlineThemed(text: string): ReactElement {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: c.text, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
          if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ backgroundColor: c.accentSubtle, color: c.accent, padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)' }}>{part.slice(1, -1)}</code>;
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: '12px 0 4px' }}>{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: c.text, margin: '14px 0 6px', borderBottom: `1px solid ${c.border}`, paddingBottom: 4 }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: ReactElement[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(<li key={i} style={{ color: c.textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 3 }}>{formatInlineThemed(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: 20, margin: '6px 0' }}>{listItems}</ul>);
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const listItems: ReactElement[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(<li key={i} style={{ color: c.textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 3 }}>{formatInlineThemed(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ paddingLeft: 20, margin: '6px 0' }}>{listItems}</ol>);
      continue;
    } else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={i} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: c.accent, overflowX: 'auto', margin: '8px 0', fontFamily: 'var(--font-mono)' }}>
          {codeLines.join('\n')}
        </pre>
      );
    } else if (line === '---' || line === '***') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: `1px solid ${c.border}`, margin: '10px 0' }} />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
    } else {
      elements.push(<p key={i} style={{ color: c.textSecondary, fontSize: 14, lineHeight: 1.65, margin: '2px 0' }}>{formatInlineThemed(line)}</p>);
    }
    i++;
  }
  return <div>{elements}</div>;
}

function CopyButton({ text }: { text: string }) {
  const { c } = useTheme();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
      title="Copy"
    >
      {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
    </button>
  );
}

/* ─── Insights Tab ─── */

function InsightsTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { c } = useTheme();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function fetchInsights() {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/insights?workspace_id=${workspaceId}`);
      const data = await res.json();
      setInsights(data.insights || []);
      setLastGenerated(data.last_generated || null);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function generateInsights() {
    if (!workspaceId) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
        setLastGenerated(new Date().toISOString());
      }
    } catch {} finally {
      setGenerating(false);
    }
  }

  useEffect(() => { fetchInsights(); }, [workspaceId]);

  function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ backgroundColor: c.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${c.border}` }}>
            <div style={{ height: 14, width: '40%', backgroundColor: c.surfaceElevated, borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 18, width: '80%', backgroundColor: c.surfaceElevated, borderRadius: 6, marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 12, width: '100%', backgroundColor: c.surfaceElevated, borderRadius: 6, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 12, width: '60%', backgroundColor: c.surfaceElevated, borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (insights.length === 0 && !generating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Sparkles size={28} color={c.accent} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 8 }}>No insights yet</h3>
        <p style={{ fontSize: 14, color: c.textSecondary, maxWidth: 400, lineHeight: 1.6, marginBottom: 24 }}>
          Generate AI-powered insights from your marketing data. We'll analyze your traffic, keywords, and performance to find wins, warnings, and opportunities.
        </p>
        <button
          onClick={generateInsights}
          style={{ padding: '12px 24px', borderRadius: 10, border: 'none', backgroundColor: c.accent, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Sparkles size={16} /> Generate Insights
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: c.textMuted }}>
          {lastGenerated ? `Last generated: ${timeAgo(lastGenerated)}` : ''}
        </span>
        <button
          onClick={generateInsights}
          disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: `1px solid ${c.borderStrong}`, backgroundColor: c.bgCard, color: generating ? c.textMuted : c.text, fontSize: 13, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}
          onMouseEnter={e => { if (!generating) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCard; }}
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : 'Refresh Insights'}
        </button>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <RefreshCw size={24} color={c.accent} className="animate-spin" />
            <p style={{ fontSize: 14, color: c.textSecondary }}>Analyzing your marketing data...</p>
          </div>
        </div>
      )}

      {/* Insights grid */}
      {!generating && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {insights.map(insight => {
            const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.tip;
            const Icon = config.icon;
            return (
              <div key={insight.id} style={{ backgroundColor: c.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${c.border}`, borderLeft: `3px solid ${config.color}` }}>
                {/* Type badge + priority */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={13} color={config.color} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: config.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{config.label}</span>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, backgroundColor: insight.priority === 'high' ? 'rgba(239,68,68,0.08)' : insight.priority === 'medium' ? 'rgba(245,158,11,0.08)' : 'rgba(124,58,237,0.08)', color: insight.priority === 'high' ? '#EF4444' : insight.priority === 'medium' ? '#F59E0B' : c.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                    {insight.priority}
                  </span>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 6, lineHeight: 1.3 }}>{insight.title}</h4>

                {/* Description */}
                <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{insight.description}</p>

                {/* Metric + Change badges */}
                {(insight.metric || insight.change) && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {insight.metric && (
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, backgroundColor: c.accentSubtle, color: c.text, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {insight.metric}
                      </span>
                    )}
                    {insight.change && (
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, backgroundColor: insight.change.startsWith('+') ? 'rgba(16,185,129,0.08)' : insight.change.startsWith('-') ? 'rgba(239,68,68,0.08)' : c.accentSubtle, color: insight.change.startsWith('+') ? '#10B981' : insight.change.startsWith('-') ? '#EF4444' : c.textMuted, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {insight.change}
                      </span>
                    )}
                  </div>
                )}

                {/* Action button */}
                {insight.action && (
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    <ArrowRight size={12} /> {insight.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function AIPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const { integrations } = useIntegrations(workspace?.id);
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('lumnix-chat-history');
      if (!saved) return [];
      return JSON.parse(saved).map((m: Message) => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : undefined }));
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem('lumnix-chat-history', JSON.stringify(messages.slice(-50))); } catch {}
    }
  }, [messages]);

  const connectedSources = integrations.filter(i => i.status === 'connected').map(i => i.provider);
  const hasData = connectedSources.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading || streaming) return;
    setError(null);
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), workspace_id: workspace?.id }),
      });

      if (!response.ok) {
        setError((await response.text()) || 'Something went wrong.');
        setLoading(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let content = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
      setLoading(false);
      setStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content };
          return updated;
        });
      }
      setStreaming(false);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
      setStreaming(false);
    }
  }

  const isIdle = !loading && !streaming;

  return (
    <PageShell title="AI Assistant" description="AI-powered insights and chat for your marketing data" icon={Brain} badge="GPT-4o-mini">
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: `1px solid ${c.border}` }}>
        {(['insights', 'chat'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? c.accent : c.textMuted,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${c.accent}` : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: -1,
            }}
          >
            {tab === 'insights' ? <Sparkles size={15} /> : <Brain size={15} />}
            {tab === 'insights' ? 'Insights' : 'Chat'}
          </button>
        ))}
      </div>

      {/* Insights tab */}
      {activeTab === 'insights' && <InsightsTab workspaceId={workspace?.id} />}

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <>
          {/* Data context bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 16px', borderRadius: 10, backgroundColor: c.bgCard, border: `1px solid ${c.border}` }}>
            {hasData ? <Wifi size={14} color="#10B981" /> : <WifiOff size={14} color={c.textMuted} />}
            <span style={{ fontSize: 12, color: c.textSecondary }}>
              {hasData
                ? `AI has access to: ${connectedSources.map(s => s.replace('_', ' ').toUpperCase()).join(' · ')}`
                : 'No data connected yet — connect integrations in Settings for data-aware answers'}
            </span>
            <Database size={12} color={c.textMuted} style={{ marginLeft: 'auto' }} />
            <span style={{ fontSize: 11, color: c.textMuted }}>Live data context</span>
          </div>

          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 16, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 320px)', minHeight: 500 }}>
            {/* Chat area */}
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Brain size={28} color={c.accent} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 8 }}>Ask Lumnix AI</h3>
                  <p style={{ fontSize: 14, color: c.textSecondary, maxWidth: 420, lineHeight: 1.6, marginBottom: 32 }}>
                    Your data-aware marketing assistant. Powered by GPT-4o-mini with full context of your connected marketing data.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 560, width: '100%' }}>
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s.text}
                        onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textSecondary, fontSize: 13, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
                      >
                        <s.icon size={15} color={c.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 2 }}>{s.category}</div>
                          {s.text}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
                      {msg.role === 'assistant' && (
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <Brain size={14} color={c.accent} />
                        </div>
                      )}
                      <div style={{ maxWidth: '78%' }}>
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          backgroundColor: msg.role === 'user' ? c.accent : c.surfaceElevated,
                        }}>
                          {msg.role === 'user' ? (
                            <p style={{ color: 'white', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                          ) : msg.content ? (
                            <MarkdownRenderer content={msg.content} />
                          ) : (
                            <span style={{ color: c.textSecondary, fontSize: 14 }}>&#9679;&#9679;&#9679;</span>
                          )}
                          {msg.role === 'assistant' && streaming && i === messages.length - 1 && msg.content && (
                            <span style={{ display: 'inline-block', width: 2, height: 14, backgroundColor: c.accent, marginLeft: 2, verticalAlign: 'middle' }} />
                          )}
                        </div>
                        {msg.role === 'assistant' && msg.content && !streaming && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, paddingLeft: 4 }}>
                            <CopyButton text={msg.content} />
                            <span style={{ fontSize: 11, color: c.textMuted, alignSelf: 'center' }}>
                              {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Brain size={14} color={c.accent} />
                      </div>
                      <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', backgroundColor: c.surfaceElevated, color: c.textSecondary, fontSize: 13 }}>
                        Analysing your data...
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {error && (
              <div style={{ margin: '0 24px', padding: '10px 16px', backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, borderRadius: 8, color: c.danger, fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Input bar */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.border}` }}>
              {messages.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button
                    onClick={() => { setMessages([]); try { localStorage.removeItem('lumnix-chat-history'); } catch {} }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: `1px solid ${c.borderStrong}`, backgroundColor: 'transparent', color: c.textMuted, fontSize: 12, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={11} /> Clear chat
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Ask anything about your marketing data..."
                  disabled={!isIdle}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: 14, outline: 'none', opacity: !isIdle ? 0.7 : 1, fontFamily: 'var(--font-body)' }}
                  onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = c.accent}
                  onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = c.border}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!isIdle || !input.trim()}
                  style={{ padding: '12px 16px', borderRadius: 10, border: 'none', backgroundColor: c.accent, color: 'white', cursor: (!isIdle || !input.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: (!isIdle || !input.trim()) ? 0.5 : 1 }}
                >
                  <Send size={18} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: c.textMuted, marginTop: 8, textAlign: 'center' }}>
                Powered by GPT-4o-mini · Context: {connectedSources.length} data source{connectedSources.length !== 1 ? 's' : ''} connected
              </p>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
