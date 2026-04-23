'use client';

import { useState, useRef, useEffect, memo, type ReactElement } from 'react';
import { Brain, Send, TrendingUp, Zap, Search, Target, Copy, Check, Trash2, Database, Wifi, WifiOff, AlertTriangle, Lightbulb, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useIntegrations } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { apiFetch } from '@/lib/api-fetch';

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

// Mockup colors: WIN=success, OPPORTUNITY=warning, TIP=tertiary(purple), WARNING=danger
const INSIGHT_CONFIG: Record<InsightType, { color: string; label: string }> = {
  win:         { color: 'var(--success)',  label: 'Win' },
  warning:     { color: 'var(--danger)',   label: 'Warning' },
  opportunity: { color: 'var(--warning)',  label: 'Opportunity' },
  tip:         { color: 'var(--tertiary)', label: 'Tip' },
};

/* ─── Chat suggestions ─── */

const SUGGESTIONS = [
  { icon: Target,     text: 'Give me a full marketing overview across all channels', emojiBg: 'rgba(255,0,102,0.1)' },
  { icon: TrendingUp, text: 'Compare my organic vs paid performance this month',     emojiBg: 'rgba(0,212,170,0.1)' },
  { icon: Search,     text: 'What are my top 10 keywords by clicks?',                 emojiBg: 'rgba(123,97,255,0.1)' },
  { icon: Zap,        text: 'How are my Google Ads and Meta Ads campaigns performing?', emojiBg: 'rgba(255,138,0,0.1)' },
];

type Message = { role: 'user' | 'assistant'; content: string; timestamp?: Date };

/* ─── Markdown renderer ─── */

const MarkdownRenderer = memo(function MarkdownRenderer({ content }: { content: string }) {
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
});

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
      const res = await apiFetch(`/api/insights?workspace_id=${workspaceId}`);
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
      const res = await apiFetch('/api/insights/generate', {
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
      <div className="lx-grid-resp-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ background: 'var(--surface)', borderRadius: 12, padding: 18, border: '1px solid var(--border)', borderLeft: '4px solid var(--border)' }}>
            <div style={{ height: 12, width: '35%', background: 'var(--elevated)', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 16, width: '75%', background: 'var(--elevated)', borderRadius: 6, marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 12, width: '100%', background: 'var(--elevated)', borderRadius: 6, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 12, width: '60%', background: 'var(--elevated)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
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
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No insights yet</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6, marginBottom: 24 }}>
          Generate AI-powered insights from your marketing data. We&apos;ll analyze your traffic, keywords, and performance to find wins, warnings, and opportunities.
        </p>
        <button
          onClick={generateInsights}
          style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Sparkles size={16} /> Generate Insights
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Last Generated Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          {lastGenerated ? `Last generated: ${timeAgo(lastGenerated)}` : ''}
        </span>
        <button
          onClick={generateInsights}
          disabled={generating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: generating ? 'var(--text-muted)' : 'var(--text-sec)',
            fontSize: 12, fontWeight: 500,
            fontFamily: 'var(--font-body)',
            cursor: generating ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: generating ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!generating) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = generating ? 'var(--text-muted)' : 'var(--text-sec)'; }}
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : 'Refresh Insights'}
        </button>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <RefreshCw size={24} color="var(--primary)" className="animate-spin" />
            <p style={{ fontSize: 14, color: 'var(--text-sec)' }}>Analyzing your marketing data...</p>
          </div>
        </div>
      )}

      {/* Insights grid */}
      {!generating && (
        <div className="lx-grid-resp-2">
          {insights.map(insight => {
            const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.tip;
            const priorityLabel = insight.priority.toUpperCase();
            const isPriorityHigh = insight.priority === 'high';
            return (
              <div
                key={insight.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${config.color}`,
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.borderLeftColor = config.color; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.borderLeftColor = config.color; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    color: config.color,
                  }}>{config.label}</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 8px', borderRadius: 4,
                    fontSize: 10, fontWeight: 600,
                    background: 'var(--elevated)',
                    color: isPriorityHigh ? 'var(--danger)' : 'var(--text-muted)',
                  }}>
                    {priorityLabel}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14, fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 6, lineHeight: 1.3,
                }}>{insight.title}</h3>

                {/* Description */}
                <p style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  marginBottom: 12, lineHeight: 1.4,
                }}>{insight.description}</p>

                {/* Metric */}
                {(insight.metric || insight.change) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {insight.metric && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '4px 10px',
                        background: 'var(--elevated)',
                        borderRadius: 6,
                        fontSize: 11, color: 'var(--text)',
                        fontWeight: 500,
                      }}>{insight.metric}</span>
                    )}
                    {insight.change && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '4px 10px',
                        background: 'var(--elevated)',
                        borderRadius: 6,
                        fontSize: 11, fontWeight: 500,
                        color: insight.change.startsWith('+') ? 'var(--success)' : insight.change.startsWith('-') ? 'var(--danger)' : 'var(--text-muted)',
                      }}>{insight.change}</span>
                    )}
                  </div>
                )}

                {/* Action */}
                {insight.action && (
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginTop: 12,
                    fontSize: 12, fontWeight: 500,
                    color: 'var(--primary)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, textAlign: 'left',
                    transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <span>{insight.action}</span>
                    <ArrowRight size={13} />
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
      const response = await apiFetch('/api/chat', {
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
      let rafId: number | null = null;

      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
      setLoading(false);
      setStreaming(true);

      const flush = () => {
        rafId = null;
        const snapshot = content;
        setMessages(prev => {
          const updated = prev.slice();
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: snapshot };
          return updated;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        if (rafId === null) rafId = requestAnimationFrame(flush);
      }
      if (rafId !== null) cancelAnimationFrame(rafId);
      flush(); // final
      setStreaming(false);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
      setStreaming(false);
    }
  }

  const isIdle = !loading && !streaming;

  return (
    <PageShell title="AI" titleAccent="Assistant" description="AI-powered insights and chat for your marketing data" badge="Claude AI">
      {/* Tab bar */}
      <div className="lx-tabs" style={{ marginBottom: 20 }}>
        <button
          className={`lx-tab${activeTab === 'insights' ? ' active' : ''}`}
          onClick={() => setActiveTab('insights')}
          type="button"
        >
          <Sparkles size={16} />
          Insights
        </button>
        <button
          className={`lx-tab${activeTab === 'chat' ? ' active' : ''}`}
          onClick={() => setActiveTab('chat')}
          type="button"
        >
          <Brain size={16} />
          Chat
        </button>
      </div>

      {/* Insights tab */}
      {activeTab === 'insights' && (
        <>
          {/* Data sources bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 10, background: 'var(--elevated)', border: '1px solid var(--border)', marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)' }}>AI has access to:</span>
            {hasData ? connectedSources.map(s => {
              const key = s.toLowerCase();
              const pill = key.includes('meta')
                ? { label: 'Meta Ads', color: '#0891B2' }
                : key.includes('ga4') || key.includes('analytics')
                ? { label: 'GA4', color: 'var(--warning)' }
                : key.includes('gsc') || key.includes('search')
                ? { label: 'GSC', color: 'var(--success)' }
                : key.includes('google_ads') || key.includes('google ads')
                ? { label: 'Google Ads', color: 'var(--success)' }
                : { label: s.replace('_', ' ').toUpperCase(), color: 'var(--primary)' };
              return (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: pill.color, flexShrink: 0 }} />
                  {pill.label}
                </span>
              );
            }) : (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No data connected yet — connect integrations in Settings</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--secondary)', marginLeft: 'auto' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--secondary)', animation: 'pulse 2s infinite' }} />
              Live data context
            </span>
          </div>

          <InsightsTab workspaceId={workspace?.id} />
        </>
      )}

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 300px)', minHeight: 520, overflow: 'hidden' }}>
          {/* Chat area */}
          <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', flex: 1 }}>
                {/* Lumi avatar */}
                <div style={{ width: 120, height: 120, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/lumi-avatar.svg" alt="Lumi" width={120} height={120} style={{ display: 'block' }} />
                </div>

                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 24, letterSpacing: '-0.02em' }}>
                  What can I help you with?
                </h2>

                {/* Suggested Prompts Grid */}
                <div className="lx-grid-resp-2" style={{ gap: 12, maxWidth: 600, width: '100%', marginBottom: 8 }}>
                  {SUGGESTIONS.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.text}
                        onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                        type="button"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: 16,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          fontFamily: 'var(--font-body)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: s.emojiBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={16} color="var(--primary)" />
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>{s.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
                    {msg.role === 'assistant' && (
                      <img src="/lumi-avatar.svg" alt="Lumi" width={32} height={32} style={{ borderRadius: '50%', flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div style={{ maxWidth: msg.role === 'user' ? '70%' : '75%' }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.role === 'user' ? 'var(--primary)' : 'var(--elevated)',
                      }}>
                        {msg.role === 'user' ? (
                          <p style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-body)' }}>{msg.content}</p>
                        ) : msg.content ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : (
                          <span style={{ color: c.textSecondary, fontSize: 14 }}>&#9679;&#9679;&#9679;</span>
                        )}
                        {msg.role === 'assistant' && streaming && i === messages.length - 1 && msg.content && (
                          <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--primary)', marginLeft: 2, verticalAlign: 'middle' }} />
                        )}
                      </div>
                      {msg.role === 'assistant' && msg.content && !streaming && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, paddingLeft: 4 }}>
                          <CopyButton text={msg.content} />
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                            {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <img src="/lumi-avatar.svg" alt="Lumi" width={32} height={32} style={{ borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--elevated)', color: 'var(--text)', fontSize: 13 }} className="animate-pulse">
                      Lumi is thinking...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {error && (
            <div style={{ margin: '0 24px', padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--danger)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            {messages.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button
                  onClick={() => { setMessages([]); try { localStorage.removeItem('lumnix-chat-history'); } catch {} }}
                  type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 size={11} /> Clear chat
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask anything about your marketing data..."
                disabled={!isIdle}
                style={{
                  flex: 1, minHeight: 40,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--elevated)',
                  color: 'var(--text)',
                  fontSize: 13, fontFamily: 'var(--font-body)',
                  opacity: !isIdle ? 0.7 : 1,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!isIdle || !input.trim()}
                type="button"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: 'none',
                  background: (!isIdle || !input.trim()) ? 'var(--border)' : 'var(--primary)',
                  color: 'white',
                  cursor: (!isIdle || !input.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (isIdle && input.trim()) e.currentTarget.style.background = 'var(--primary-hover)'; }}
                onMouseLeave={e => { if (isIdle && input.trim()) e.currentTarget.style.background = 'var(--primary)'; }}
              >
                <Send size={18} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center', fontFamily: 'var(--font-body)' }}>
              Powered by Claude AI · Context: {connectedSources.length} data source{connectedSources.length !== 1 ? 's' : ''} connected
            </p>
            {!hasData && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)' }}>
                <WifiOff size={11} /> No integrations connected
              </p>
            )}
            {hasData && (
              <p style={{ fontSize: 11, color: 'var(--secondary)', marginTop: 4, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)' }}>
                <Wifi size={11} /> <Database size={11} /> Live data context active
              </p>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
