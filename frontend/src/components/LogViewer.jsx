import { useState } from 'react';
import { Search } from 'lucide-react';

const levelColors = { INFO: '#4B7BF5', WARN: '#D97706', ERROR: '#DC2626', DEBUG: '#9CA0AB', OK: '#0D9488' };

export default function LogViewer({ logs = [] }) {
  const [filter, setFilter] = useState('');
  const filtered = logs.filter(l => !filter || (l.message || '').toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '0.5px solid #DFE1E6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#FFFFFF', borderBottom: '0.5px solid #ECEEF2' }}>
        <Search size={12} style={{ color: '#9CA0AB' }} />
        <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: '#1E2028', flex: 1 }}
          placeholder="Filter logs..." value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 380, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, padding: 8, background: '#111318' }}>
        {filtered.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#3D4150' }}>No logs to display</div>}
        {filtered.map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '1px 0', lineHeight: '18px', borderLeft: log.level === 'ERROR' ? '2px solid #DC2626' : '2px solid transparent', paddingLeft: 4 }}>
            <span style={{ width: 28, textAlign: 'right', color: '#3D4150', flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>
            <span style={{ color: '#6C7281', flexShrink: 0 }}>{log.time || ''}</span>
            <span style={{ fontWeight: 600, width: 40, flexShrink: 0, color: levelColors[log.level] || '#6C7281' }}>{log.level || 'INFO'}</span>
            <span style={{ color: '#E8EAF0' }}>{log.message || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
