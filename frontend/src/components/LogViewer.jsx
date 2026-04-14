import { useState } from 'react';
import { Search } from 'lucide-react';

const levelColors = {
  INFO: '#58A6FF',
  WARN: '#D29922',
  ERROR: '#F85149',
  DEBUG: '#5C6370',
  OK: '#3FB950',
};

export default function LogViewer({ logs = [] }) {
  const [filter, setFilter] = useState('');
  const filtered = logs.filter(
    (l) => !filter || (l.message || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#1C2333', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Search size={14} style={{ color: '#5C6370' }} />
        <input
          className="bg-transparent border-none outline-none text-sm flex-1"
          style={{ color: '#F0F3F6' }}
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="overflow-auto max-h-96 font-mono text-xs p-3" style={{ background: '#0A0E17' }}>
        {filtered.length === 0 && (
          <div className="py-4 text-center" style={{ color: '#5C6370' }}>No logs to display</div>
        )}
        {filtered.map((log, i) => (
          <div key={i} className="flex gap-3 py-0.5 leading-5"
            style={{ borderLeft: log.level === 'ERROR' ? '2px solid #F85149' : '2px solid transparent', paddingLeft: 4 }}>
            <span className="select-none w-8 text-right shrink-0" style={{ color: '#3D4455' }}>{i + 1}</span>
            <span className="shrink-0" style={{ color: '#5C6370' }}>{log.time || ''}</span>
            <span className="font-semibold shrink-0 w-12" style={{ color: levelColors[log.level] || '#9CA3B0' }}>{log.level || 'INFO'}</span>
            <span style={{ color: '#D0D7E0' }}>{log.message || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
