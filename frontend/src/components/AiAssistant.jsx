import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, Bot } from 'lucide-react';
import { api } from '../api';

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await api.ai.chat(text, { page: window.location.pathname });
      setMessages(m => [...m, { role: 'ai', text: res?.response || res?.content?.[0]?.text || 'No response.' }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Failed to get AI response.' }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 20, right: 20, width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', background: '#7F77DD', zIndex: 50 }}>
        <Bot size={18} color="white" />
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 380, display: 'flex', flexDirection: 'column', zIndex: 50, background: '#161B22', borderLeft: '0.5px solid #30363D' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid #21262D' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={14} style={{ color: '#7F77DD' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#E6EDF3' }}>AI Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#484F58', padding: 2 }}><X size={14} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#484F58', fontSize: 11 }}>
            <Bot size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
            Ask me anything about DevSecOps
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? '#7F77DD' : '#1C2128',
              color: m.role === 'user' ? '#fff' : '#C9D1D9',
              border: m.role === 'user' ? 'none' : '0.5px solid #30363D',
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#1C2128', border: '0.5px solid #30363D' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#7F77DD' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: 12, borderTop: '0.5px solid #21262D' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12, border: '0.5px solid #30363D', outline: 'none', background: '#0D1117', color: '#E6EDF3' }}
            placeholder="Ask anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ width: 34, height: 34, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: '#7F77DD', opacity: loading || !input.trim() ? 0.4 : 1 }}>
            <Send size={13} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
