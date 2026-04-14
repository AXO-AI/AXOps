import { useState, useEffect } from 'react';
import { Loader2, Mic, Sparkles, Clock, ListChecks, MessageSquare, Lightbulb, Trash2 } from 'lucide-react';
import { api } from '../api';

const STORAGE_KEY = 'axops_meeting_history';

export default function Meetings() {
  const [transcript, setTranscript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setHistory(saved);
    } catch {
      setHistory([]);
    }
  }, []);

  const analyze = async () => {
    if (!transcript.trim() || analyzing) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await api.ai.analyzeTranscript({ transcript: transcript.trim() });
      const analysis = res || { summary: 'Analysis unavailable', actionItems: [], decisions: [], insights: [] };
      setResult(analysis);

      const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        preview: transcript.trim().slice(0, 80),
        result: analysis,
      };
      const updated = [entry, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      setResult({ summary: 'Analysis failed. Please try again.', actionItems: [], decisions: [], insights: [] });
    }
    setAnalyzing(false);
  };

  const removeEntry = (id) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const renderResult = (r) => (
    <div className="space-y-4">
      {r.summary && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            <MessageSquare size={14} style={{ color: 'var(--accent)' }} /> Summary
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>
        </div>
      )}
      {r.actionItems?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            <ListChecks size={14} style={{ color: 'var(--success)' }} /> Action Items
          </div>
          <ul className="space-y-1.5 text-sm pl-0 list-none">
            {r.actionItems.map((a, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--success)' }} />
                {typeof a === 'string' ? a : a.description || a.text || JSON.stringify(a)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.decisions?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            <Lightbulb size={14} style={{ color: 'var(--warning)' }} /> Decisions
          </div>
          <ul className="space-y-1.5 text-sm pl-0 list-none">
            {r.decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--warning)' }} />
                {typeof d === 'string' ? d : d.description || d.text || JSON.stringify(d)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.insights?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles size={14} style={{ color: 'var(--info)' }} /> Insights
          </div>
          <ul className="space-y-1.5 text-sm pl-0 list-none">
            {r.insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--info)' }} />
                {typeof ins === 'string' ? ins : ins.description || ins.text || JSON.stringify(ins)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Insights</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div>
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-4 py-3 text-sm font-semibold flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <Mic size={14} style={{ color: 'var(--accent)' }} /> Transcript
            </div>
            <textarea
              className="w-full h-64 p-4 text-sm resize-none border-none outline-none"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              placeholder="Paste your meeting transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={analyze}
                disabled={analyzing || !transcript.trim()}
                className="px-5 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-2"
                style={{ background: 'var(--accent)', color: 'white', opacity: analyzing || !transcript.trim() ? 0.5 : 1 }}
              >
                {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Analyze with AI
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sparkles size={14} style={{ color: 'var(--accent)' }} /> Analysis Results
            </div>
            {!result ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Paste a transcript and click "Analyze with AI" to get started
              </div>
            ) : (
              renderResult(result)
            )}
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock size={14} style={{ color: 'var(--text-tertiary)' }} /> History
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="rounded-lg p-4 cursor-pointer transition-colors"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                onClick={() => setResult(h.result)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(h.date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeEntry(h.id); }}
                    className="bg-transparent border-none cursor-pointer p-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{h.preview}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
