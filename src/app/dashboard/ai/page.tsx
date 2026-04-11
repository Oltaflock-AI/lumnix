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
  win:         { color: '#059669', bg: 'rgba(5,150,105,0.08)',  icon: TrendingUp,    label: 'Win' },
  warning:     { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',  icon: AlertTriangle,  label: 'Warning' },
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
      elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: '12px 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: '14px 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: ReactElement[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(<li key={i} style={{ color: c.text, fontSize: 14, lineHeight: 1.6, marginBottom: 3 }}>{formatInlineThemed(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: 16, margin: '6px 0' }}>{listItems}</ul>);
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const listItems: ReactElement[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(<li key={i} style={{ color: c.text, fontSize: 14, lineHeight: 1.6, marginBottom: 3 }}>{formatInlineThemed(lines[i].replace(/^\d+\.\s/, ''))}</li>);
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
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
    } else {
      elements.push(<p key={i} style={{ color: c.text, fontSize: 14, lineHeight: 1.6, margin: '2px 0' }}>{formatInlineThemed(line)}</p>);
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
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 400, color: c.textMuted }}>
          {lastGenerated ? `Last generated: ${timeAgo(lastGenerated)}` : ''}
        </span>
        <button
          onClick={generateInsights}
          disabled={generating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            border: `1px solid ${c.border}`,
            background: 'transparent',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 500,
            color: generating ? c.textMuted : c.text,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!generating) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
        >
          <RefreshCw size={13} style={{ transition: 'transform 0.6s ease', transform: generating ? 'rotate(360deg)' : 'rotate(0deg)' }} className={generating ? 'animate-spin' : ''} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, alignItems: 'stretch' }}>
          {insights.map(insight => {
            const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.tip;
            const prioBg = insight.priority === 'high' ? 'rgba(220,38,38,0.1)' : insight.priority === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(124,58,237,0.08)';
            const prioColor = insight.priority === 'high' ? '#DC2626' : insight.priority === 'medium' ? '#F59E0B' : c.textMuted;
            return (
              <div key={insight.id} style={{
                backgroundColor: c.bgCard,
                borderRadius: 12,
                padding: 20,
                border: `1px solid ${c.border}`,
                borderLeft: `3px solid ${config.color}`,
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Type label + priority */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: config.color,
                  }}>{config.label}</span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                    padding: '2px 8px', borderRadius: 4,
                    background: prioBg, color: prioColor,
                  }}>
                    {insight.priority}
                  </span>
                </div>

                {/* Title */}
                <h4 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 15, fontWeight: 600, color: c.text,
                  marginTop: 0, marginBottom: 6, lineHeight: 1.3,
                }}>{insight.title}</h4>

                {/* Description */}
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, fontWeight: 400, color: c.textSecondary,
                  lineHeight: 1.6, margin: '0 0 12px',
                }}>{insight.description}</p>

                {/* Metric + Change badges */}
                {(insight.metric || insight.change) && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {insight.metric && (
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 6,
                        background: c.bgCardHover, color: c.text,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {insight.metric}
                      </span>
                    )}
                    {insight.change && (
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 6,
                        background: insight.change.startsWith('+') ? 'rgba(5,150,105,0.1)' : insight.change.startsWith('-') ? 'rgba(220,38,38,0.1)' : c.bgCardHover,
                        color: insight.change.startsWith('+') ? '#059669' : insight.change.startsWith('-') ? '#DC2626' : c.textMuted,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {insight.change}
                      </span>
                    )}
                  </div>
                )}

                {/* Action link */}
                {insight.action && (
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13, fontWeight: 400, color: '#7C3AED',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, marginTop: 'auto', paddingTop: 10,
                  }}>
                    {insight.action} <ArrowRight size={13} />
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
    <PageShell title="AI Assistant" description="AI-powered insights and chat for your marketing data" icon={Brain} badge="Claude AI">
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

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 320px)', minHeight: 500, overflow: 'hidden' }}>
            {/* Chat area */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Brain size={28} color={c.accent} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>What can I help you with?</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxWidth: 560, width: '100%' }}>
                    {SUGGESTIONS.slice(0, 4).map(s => (
                      <button
                        key={s.text}
                        onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                        style={{
                          padding: '12px 16px', borderRadius: 10,
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                          fontSize: 13, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4,
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'border-color 150ms, background 150ms, color 150ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        {s.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
                      {msg.role === 'assistant' && (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontWeight: 700, fontSize: 13, color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          L
                        </div>
                      )}
                      <div style={{ maxWidth: msg.role === 'user' ? '70%' : '75%' }}>
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: msg.role === 'user' ? '#7C3AED' : 'var(--bg-card-secondary)',
                        }}>
                          {msg.role === 'user' ? (
                            <p style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 1.5, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{msg.content}</p>
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
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: 13, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                        L
                      </div>
                      <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', backgroundColor: 'var(--bg-card-secondary)', color: 'var(--text-primary)', fontSize: 13 }} className="animate-pulse">
                        Lumi is thinking...
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
            <div style={{ padding: 16, borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
              {messages.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button
                    onClick={() => { setMessages([]); try { localStorage.removeItem('lumnix-chat-history'); } catch {} }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-default)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-card-secondary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={11} /> Clear chat
                  </button>
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Ask anything about your marketing data..."
                  disabled={!isIdle}
                  style={{
                    width: '100%', minHeight: 44,
                    padding: '10px 50px 10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-page)',
                    color: 'var(--text-primary)',
                    fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                    opacity: !isIdle ? 0.7 : 1,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!isIdle || !input.trim()}
                  style={{
                    position: 'absolute', right: 10, bottom: 6,
                    width: 32, height: 32, borderRadius: 8,
                    border: 'none',
                    backgroundColor: (!isIdle || !input.trim()) ? 'var(--border-default)' : '#7C3AED',
                    color: 'white',
                    cursor: (!isIdle || !input.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => { if (isIdle && input.trim()) e.currentTarget.style.backgroundColor = '#6D28D9'; }}
                  onMouseLeave={e => { if (isIdle && input.trim()) e.currentTarget.style.backgroundColor = '#7C3AED'; }}
                >
                  <Send size={16} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
                Powered by Claude AI · Context: {connectedSources.length} data source{connectedSources.length !== 1 ? 's' : ''} connected
              </p>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
