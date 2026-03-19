'use client';
import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, BarChart3, TrendingUp, Zap } from 'lucide-react';
import { PageShell } from '@/components/PageShell';

const suggestions = [
  { icon: TrendingUp, text: 'Why did my traffic drop last week?' },
  { icon: BarChart3, text: 'Which keywords should I target next?' },
  { icon: Zap, text: 'How can I improve my Google Ads ROAS?' },
  { icon: Sparkles, text: 'Generate a weekly performance summary' },
];

type Message = { role: 'user' | 'assistant'; content: string };

export default function AIPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        setLoading(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
      setLoading(false);
    }
  }

  return (
    <PageShell title="AI Assistant" description="Ask questions about your marketing data" icon={Brain} badge="POWERED BY CLAUDE">
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Area */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto', maxHeight: '520px' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Brain size={28} color="#a78bfa" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>Krato AI</h3>
              <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '400px', lineHeight: 1.6, marginBottom: '28px' }}>
                Ask me anything about your marketing performance. I can analyze trends, find opportunities, and generate reports.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '500px', width: '100%' }}>
                {suggestions.map(s => (
                  <button key={s.text} onClick={() => sendMessage(s.text)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #27272a', backgroundColor: '#1c1c1f', color: '#a1a1aa', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}>
                    <s.icon size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '12px 16px', borderRadius: '14px',
                    backgroundColor: msg.role === 'user' ? '#7c3aed' : '#27272a',
                    color: msg.role === 'user' ? 'white' : '#d4d4d8',
                    fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content || (msg.role === 'assistant' && <span style={{ opacity: 0.5 }}>●●●</span>)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '20px', letterSpacing: '2px' }}>●●●</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #27272a' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about your marketing data..."
              disabled={loading}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontSize: '14px', outline: 'none', opacity: loading ? 0.7 : 1 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{ padding: '12px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', opacity: !input.trim() ? 0.5 : 1 }}
            >
              <Send size={18} />
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#52525b', marginTop: '8px', textAlign: 'center' }}>Powered by Claude · Krato AI has access to your connected data</p>
        </div>
      </div>
    </PageShell>
  );
}
