'use client';
import { useState, useRef, useEffect, type ReactElement } from 'react';
import { Brain, Send, BarChart3, TrendingUp, Zap, Search, Target, Copy, Check, Trash2, Database, Wifi, WifiOff } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspace, useIntegrations } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';

const SUGGESTIONS = [
  { icon: TrendingUp, text: 'How is my traffic trending this month?', category: 'Analytics' },
  { icon: Search, text: 'What are my top 10 keywords by clicks?', category: 'SEO' },
  { icon: BarChart3, text: 'Which pages have the highest bounce rate?', category: 'Analytics' },
  { icon: Target, text: 'What\'s my best traffic source?', category: 'Analytics' },
  { icon: Zap, text: 'Give me 3 quick wins to improve my SEO', category: 'Strategy' },
  { icon: Brain, text: 'Summarise my marketing performance this month', category: 'Overview' },
];

type Message = { role: 'user' | 'assistant'; content: string; timestamp?: Date };

// Parse markdown into JSX — uses CSS vars so it inherits theme
function MarkdownRenderer({ content }: { content: string }) {
  const { c } = useTheme();
  const lines = content.split('\n');
  const elements: ReactElement[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: '12px 0 4px' }}>{line.slice(4)}</h3>);
    }
    // H2
    else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: c.text, margin: '14px 0 6px', borderBottom: `1px solid ${c.border}`, paddingBottom: 4 }}>{line.slice(3)}</h2>);
    }
    // Bullet list
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: ReactElement[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(
          <li key={i} style={{ color: c.textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 3 }}>
            {formatInline(lines[i].slice(2), c)}
          </li>
        );
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: 20, margin: '6px 0' }}>{listItems}</ul>);
      continue;
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const listItems: ReactElement[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(
          <li key={i} style={{ color: c.textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 3 }}>
            {formatInline(lines[i].replace(/^\d+\.\s/, ''), c)}
          </li>
        );
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ paddingLeft: 20, margin: '6px 0' }}>{listItems}</ol>);
      continue;
    }
    // Code block
    else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={{ backgroundColor: c.bgPage, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#a78bfa', overflowX: 'auto', margin: '8px 0', fontFamily: 'monospace' }}>
          {codeLines.join('\n')}
        </pre>
      );
    }
    // Horizontal rule
    else if (line === '---' || line === '***') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: `1px solid ${c.border}`, margin: '10px 0' }} />);
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
    }
    // Regular paragraph
    else {
      elements.push(<p key={i} style={{ color: c.textSecondary, fontSize: 14, lineHeight: 1.65, margin: '2px 0' }}>{formatInline(line, c)}</p>);
    }
    i++;
  }

  return <div>{elements}</div>;
}

function formatInline(text: string, c: any): ReactElement {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: c.text, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{ backgroundColor: c.bgTag, color: '#a78bfa', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { c } = useTheme();
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
      title="Copy"
    >
      {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
    </button>
  );
}

export default function AIPage() {
  const { workspace } = useWorkspaceCtx();
  const { integrations } = useIntegrations(workspace?.id);
  const { c } = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('lumnix-chat-history');
      if (!saved) return [];
      // Rehydrate timestamp strings back to Date objects
      return JSON.parse(saved).map((m: Message) => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
      }));
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages to localStorage
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
    <PageShell title="AI Assistant" description="Ask questions about your marketing data in plain English" icon={Brain} badge="GPT-4o-mini">
      {/* Data context bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 16px', borderRadius: 10, backgroundColor: c.bgCard, border: `1px solid ${c.border}` }}>
        {hasData ? <Wifi size={14} color="#22c55e" /> : <WifiOff size={14} color={c.textMuted} />}
        <span style={{ fontSize: 12, color: c.textSecondary }}>
          {hasData
            ? `AI has access to: ${connectedSources.map(s => s.replace('_', ' ').toUpperCase()).join(' · ')}`
            : 'No data connected yet — connect integrations in Settings for data-aware answers'
          }
        </span>
        <Database size={12} color={c.textMuted} style={{ marginLeft: 'auto' }} />
        <span style={{ fontSize: 11, color: c.textMuted }}>Live data context</span>
      </div>

      <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 16, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 260px)', minHeight: 500 }}>
        {/* Chat area */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Brain size={28} color="#a78bfa" />
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
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, border: `1px solid ${c.border}`, backgroundColor: c.bgCardHover, color: c.textSecondary, fontSize: 13, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}
                  >
                    <s.icon size={15} color="#7c3aed" style={{ flexShrink: 0, marginTop: 1 }} />
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
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Brain size={14} color="#a78bfa" />
                    </div>
                  )}
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      backgroundColor: msg.role === 'user' ? '#7c3aed' : c.bgCard,
                    }}>
                      {msg.role === 'user' ? (
                        <p style={{ color: 'white', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                      ) : msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <span style={{ color: c.textSecondary, fontSize: 14 }}>●●●</span>
                      )}
                      {msg.role === 'assistant' && streaming && i === messages.length - 1 && msg.content && (
                        <span style={{ display: 'inline-block', width: 2, height: 14, backgroundColor: '#a78bfa', marginLeft: 2, verticalAlign: 'middle' }} />
                      )}
                    </div>
                    {/* Actions below assistant messages */}
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
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={14} color="#a78bfa" />
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', backgroundColor: c.bgCard, color: c.textSecondary, fontSize: 13 }}>
                    Analysing your data...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {error && (
          <div style={{ margin: '0 24px', padding: '10px 16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.border}` }}>
          {messages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                onClick={() => { setMessages([]); try { localStorage.removeItem('lumnix-chat-history'); } catch {} }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textMuted, fontSize: 12, cursor: 'pointer' }}
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
              style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: `1px solid ${c.border}`, backgroundColor: c.bgInput, color: c.text, fontSize: 14, outline: 'none', opacity: !isIdle ? 0.7 : 1, fontFamily: 'var(--font-body)' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!isIdle || !input.trim()}
              style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', cursor: (!isIdle || !input.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: (!isIdle || !input.trim()) ? 0.5 : 1 }}
            >
              <Send size={18} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: c.textMuted, marginTop: 8, textAlign: 'center' }}>
            Powered by GPT-4o-mini · Context: {connectedSources.length} data source{connectedSources.length !== 1 ? 's' : ''} connected
          </p>
        </div>
      </div>
    </PageShell>
  );
}
