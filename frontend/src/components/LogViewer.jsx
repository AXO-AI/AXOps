import { useState } from 'react';
import { Search } from 'lucide-react';

const levelColors = { INFO: '#58A6FF', WARN: '#D29922', ERROR: '#F85149', DEBUG: '#6E7681', OK: '#3FB950' };

export default function LogViewer({ logs = [] }) {
  const [filter, setFilter] = useState('');
  const filtered = logs.filter(l => !filter || (l.message || '').toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '0.5px solid #30363D' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#161B22', borderBottom: '0.5px solid #21262D' }}>
        <Search size={12} style={{ color: '#484F58' }} />
        <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: '#C9D1D9', flex: 1 }}
          placeholder="Filter logs..." value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 380, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 11, padding: 8, background: '#0D1117' }}>
        {filtered.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#484F58' }}>No logs to display</div>}
        {filtered.map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '1px 0', lineHeight: '18px', borderLeft: log.level === 'ERROR' ? '2px solid #F85149' : '2px solid transparent', paddingLeft: 4 }}>
            <span style={{ width: 28, textAlign: 'right', color: '#21262D', flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>
            <span style={{ color: '#484F58', flexShrink: 0 }}>{log.time || ''}</span>
            <span style={{ fontWeight: 600, width: 40, flexShrink: 0, color: levelColors[log.level] || '#8B949E' }}>{log.level || 'INFO'}</span>
            <span style={{ color: '#C9D1D9' }}>{log.message || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
