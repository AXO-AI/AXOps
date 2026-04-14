import { FileCode, Plus, Minus } from 'lucide-react';

export default function DiffViewer({ files = [] }) {
  if (files.length === 0) {
    return (
      <div style={{ background: '#161B22', border: '0.5px solid #30363D', borderRadius: 8, padding: 32, textAlign: 'center', color: '#484F58', fontSize: 12 }}>
        No file changes to display
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {files.map((file, fi) => (
        <div key={fi} style={{ borderRadius: 8, overflow: 'hidden', border: '0.5px solid #30363D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#161B22', borderBottom: '0.5px solid #21262D', fontSize: 12 }}>
            <FileCode size={13} style={{ color: '#6E7681' }} />
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', flex: 1, color: '#C9D1D9', fontSize: 11 }}>{file.filename || 'unknown'}</span>
            {file.additions > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#3FB950' }}><Plus size={10} />{file.additions}</span>
            )}
            {file.deletions > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#F85149' }}><Minus size={10} />{file.deletions}</span>
            )}
          </div>
          {file.patch && (
            <div style={{ overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, background: '#0D1117' }}>
              {file.patch.split('\n').map((line, li) => {
                let bg = 'transparent';
                let color = '#C9D1D9';
                if (line.startsWith('+') && !line.startsWith('+++')) { bg = 'rgba(63,185,80,0.1)'; color = '#3FB950'; }
                else if (line.startsWith('-') && !line.startsWith('---')) { bg = 'rgba(248,81,73,0.1)'; color = '#F85149'; }
                else if (line.startsWith('@@')) { color = '#7F77DD'; }
                return (
                  <div key={li} style={{ display: 'flex', background: bg }}>
                    <span style={{ userSelect: 'none', width: 36, textAlign: 'right', paddingRight: 8, flexShrink: 0, lineHeight: '18px', color: '#21262D' }}>{li + 1}</span>
                    <span style={{ padding: '0 8px', lineHeight: '18px', whiteSpace: 'pre', color }}>{line}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
