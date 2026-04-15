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

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ position: 'fixed', bottom: 16, right: 16, width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', background: '#4B7BF5', zIndex: 50 }}>
      <Bot size={16} color="white" />
    </button>
  );

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 360, display: 'flex', flexDirection: 'column', zIndex: 50, background: '#FFFFFF', borderLeft: '0.5px solid #DFE1E6' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '0.5px solid #ECEEF2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bot size={13} style={{ color: '#4B7BF5' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1E2028' }}>AI Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA0AB', padding: 2 }}><X size={14} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA0AB', fontSize: 11 }}><Bot size={20} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.3 }} />Ask me anything about DevSecOps</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '85%', padding: '7px 11px', borderRadius: 8, fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', background: m.role === 'user' ? '#4B7BF5' : '#F7F8FA', color: m.role === 'user' ? '#fff' : '#1E2028', border: m.role === 'user' ? 'none' : '0.5px solid #ECEEF2' }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ display: 'flex' }}><div style={{ padding: '7px 11px', borderRadius: 8, background: '#F7F8FA', border: '0.5px solid #ECEEF2' }}><Loader2 size={14} className="animate-spin" style={{ color: '#4B7BF5' }} /></div></div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: 10, borderTop: '0.5px solid #ECEEF2' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ flex: 1, padding: '7px 10px', borderRadius: 6, fontSize: 12, border: '0.5px solid #DFE1E6', outline: 'none', background: '#FFFFFF', color: '#1E2028' }}
            placeholder="Ask anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button onClick={send} disabled={loading || !input.trim()} style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: '#4B7BF5', opacity: loading || !input.trim() ? 0.4 : 1 }}>
            <Send size={12} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
