import { FileCode, Plus, Minus } from 'lucide-react';

export default function DiffViewer({ files = [] }) {
  if (files.length === 0) return <div style={{ background: '#FFFFFF', border: '0.5px solid #DFE1E6', borderRadius: 8, padding: 32, textAlign: 'center', color: '#9CA0AB', fontSize: 12 }}>No file changes to display</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {files.map((file, fi) => (
        <div key={fi} style={{ borderRadius: 8, overflow: 'hidden', border: '0.5px solid #DFE1E6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#FFFFFF', borderBottom: '0.5px solid #ECEEF2', fontSize: 12 }}>
            <FileCode size={13} style={{ color: '#9CA0AB' }} />
            <span style={{ fontFamily: 'ui-monospace, monospace', flex: 1, color: '#1E2028', fontSize: 11 }}>{file.filename || 'unknown'}</span>
            {file.additions > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#0D9488' }}><Plus size={10} />{file.additions}</span>}
            {file.deletions > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#DC2626' }}><Minus size={10} />{file.deletions}</span>}
          </div>
          {file.patch && (
            <div style={{ overflowX: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: 11, background: '#111318' }}>
              {file.patch.split('\n').map((line, li) => {
                let bg = 'transparent', color = '#E8EAF0';
                if (line.startsWith('+') && !line.startsWith('+++')) { bg = 'rgba(13,148,136,0.08)'; color = '#0D9488'; }
                else if (line.startsWith('-') && !line.startsWith('---')) { bg = 'rgba(220,38,38,0.08)'; color = '#DC2626'; }
                else if (line.startsWith('@@')) { color = '#4B7BF5'; }
                return <div key={li} style={{ display: 'flex', background: bg }}><span style={{ userSelect: 'none', width: 36, textAlign: 'right', paddingRight: 8, flexShrink: 0, lineHeight: '18px', color: '#3D4150' }}>{li + 1}</span><span style={{ padding: '0 8px', lineHeight: '18px', whiteSpace: 'pre', color }}>{line}</span></div>;
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
