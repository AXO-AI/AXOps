import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2, Bot } from 'lucide-react';
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
      const reply = res?.response || res?.content?.[0]?.text || res?.message || 'No response received.';
      setMessages((m) => [...m, { role: 'ai', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Failed to get AI response. Check that ANTHROPIC_API_KEY is set.' }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer border-none z-50 transition-transform hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #7C6FFF 0%, #5B4AE8 100%)', boxShadow: '0 4px 16px rgba(124,111,255,0.35)' }}
      >
        <Bot size={20} color="white" />
      </button>
    );
  }

  return (
    <div
      className="fixed top-0 right-0 h-screen flex flex-col z-50"
      style={{
        width: 400,
        background: 'rgba(11,15,26,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Bot size={16} style={{ color: '#7C6FFF' }} />
          <span className="font-semibold text-sm" style={{ color: '#E8ECF4' }}>AI Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>AXOps AI Assistant</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Ask me to create pipelines, review code, analyze builds, or anything DevOps</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: m.role === 'user' ? 'rgba(124,111,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: m.role === 'user' ? '#E8ECF4' : '#C8D1DC',
                border: m.role === 'user' ? '1px solid rgba(124,111,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: '#7C6FFF' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg text-sm border-none outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#E8ECF4', border: '1px solid rgba(255,255,255,0.08)' }}
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg flex items-center justify-center border-none cursor-pointer shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C6FFF, #5B4AE8)', opacity: loading || !input.trim() ? 0.4 : 1 }}
          >
            <Send size={14} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
