import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await api.ai.chat(text, { page: window.location.pathname });
      setMessages((m) => [...m, { role: 'ai', text: res?.response || res?.message || 'No response received.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Failed to get AI response.' }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-none z-50"
        style={{ background: 'var(--accent)' }}
      >
        <MessageSquare size={20} color="white" />
      </button>
    );
  }

  return (
    <div
      className="fixed top-0 right-0 h-screen flex flex-col z-50"
      style={{ width: 400, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: 'var(--text-tertiary)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
            <div className="text-sm">Ask me anything about your project</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed"
              style={{
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                color: m.role === 'user' ? 'white' : 'var(--text-primary)',
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg text-sm border-none outline-none"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg flex items-center justify-center border-none cursor-pointer shrink-0"
            style={{ background: 'var(--accent)', opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
