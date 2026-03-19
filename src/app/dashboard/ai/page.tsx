'use client';
import { useState, useRef, useEffect } from 'react';
import { Brain, Send, BarChart3, TrendingUp, Zap, Search, Target } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspace } from '@/lib/hooks';

const suggestions = [
  { icon: TrendingUp, text: 'Why did my traffic change this week?' },
  { icon: Search, text: 'What are my top performing keywords?' },
  { icon: Target, text: 'Which competitor is running the most ads?' },
  { icon: Zap, text: 'How can I improve my Google Ads ROAS?' },
  { icon: BarChart3, text: 'What pages have the highest bounce rate?' },
];

type Message = { role: 'user' | 'assistant'; content: string };

function renderContent(text: string) {
  // Replace **bold** with <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AIPage() {
  const { workspace } = useWorkspace();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading || streaming) return;
    setError(null);
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          workspace_id: workspace?.id,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        setError(errText || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setLoading(false);
      setStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      }
      setStreaming(false);
    } catch (e: any) {
      setError('Connection error. Please try again.');
      setLoading(false);
      setStreaming(false);
    }
  }

  const isIdle = !loading && !streaming;

  return (
    <PageShell title="AI Assistant" description="Ask questions about your marketing data" icon={Brain} badge="POWERED BY CLAUDE">
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        {/* Chat area */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 ? (
            /* Empty state */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Brain size={28} color="#a78bfa" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f4f4f5', marginBottom: '8px' }}>Ask Krato AI</h3>
              <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '420px', lineHeight: 1.6, marginBottom: '32px' }}>
                Your data-aware marketing assistant. Ask me about traffic trends, keyword opportunities, competitor activity, and more.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxWidth: '540px', width: '100%' }}>
                {suggestions.map(s => (
                  <button
                    key={s.text}
                    onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 14px', borderRadius: '10px',
                      border: '1px solid #27272a', backgroundColor: '#1c1c1f',
                      color: '#a1a1aa', fontSize: '13px', cursor: 'pointer',
                      textAlign: 'left', transition: 'border-color 0.15s',
                    }}
                  >
                    <s.icon size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '10px' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Brain size={14} color="#a78bfa" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    backgroundColor: msg.role === 'user' ? '#7c3aed' : '#27272a',
                    color: msg.role === 'user' ? 'white' : '#d4d4d8',
                    fontSize: '14px', lineHeight: 1.65, whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content
                      ? renderContent(msg.content)
                      : msg.role === 'assistant'
                        ? <span style={{ opacity: 0.4 }}>●●●</span>
                        : null
                    }
                    {/* Streaming cursor */}
                    {msg.role === 'assistant' && streaming && i === messages.length - 1 && msg.content && (
                      <span style={{ display: 'inline-block', width: '2px', height: '14px', backgroundColor: '#a78bfa', marginLeft: '2px', verticalAlign: 'middle', animation: 'pulse 1s ease infinite' }} />
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={14} color="#a78bfa" />
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', backgroundColor: '#27272a', color: '#71717a', fontSize: '13px' }}>
                    Krato AI is thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '0 24px', padding: '10px 16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #27272a' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask anything about your marketing..."
              disabled={!isIdle}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '10px',
                border: '1px solid #3f3f46', backgroundColor: '#27272a',
                color: 'white', fontSize: '14px', outline: 'none',
                opacity: !isIdle ? 0.7 : 1,
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!isIdle || !input.trim()}
              style={{
                padding: '12px 16px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: 'white', cursor: (!isIdle || !input.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                opacity: (!isIdle || !input.trim()) ? 0.5 : 1,
              }}
            >
              <Send size={18} />
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#52525b', marginTop: '8px', textAlign: 'center' }}>
            Powered by Claude · Krato AI has access to your connected marketing data
          </p>
        </div>
      </div>
    </PageShell>
  );
}
