import { useState } from 'react';
import { Search } from 'lucide-react';

const levelColors = {
  INFO: 'var(--info)',
  WARN: 'var(--warning)',
  ERROR: 'var(--danger)',
  DEBUG: 'var(--text-tertiary)',
};

export default function LogViewer({ logs = [] }) {
  const [filter, setFilter] = useState('');
  const filtered = logs.filter(
    (l) => !filter || (l.message || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#161B22', borderBottom: '1px solid var(--border)' }}>
        <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
        <input
          className="bg-transparent border-none outline-none text-sm flex-1"
          style={{ color: 'var(--text-primary)' }}
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Logs */}
      <div className="overflow-auto max-h-96 font-mono text-xs p-3" style={{ background: '#0D1117' }}>
        {filtered.length === 0 && (
          <div className="py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>No logs to display</div>
        )}
        {filtered.map((log, i) => (
          <div key={i} className="flex gap-3 py-0.5 leading-5">
            <span className="select-none w-8 text-right shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              {i + 1}
            </span>
            <span className="shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              {log.time || ''}
            </span>
            <span className="font-semibold shrink-0 w-12" style={{ color: levelColors[log.level] || 'var(--text-secondary)' }}>
              {log.level || 'INFO'}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>{log.message || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
