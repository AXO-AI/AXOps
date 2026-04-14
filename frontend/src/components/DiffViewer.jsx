import { FileCode, Plus, Minus } from 'lucide-react';

export default function DiffViewer({ files = [] }) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
        No file changes to display
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file, fi) => (
        <div key={fi} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* File header */}
          <div
            className="flex items-center gap-2 px-3 py-2 text-sm"
            style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
          >
            <FileCode size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span className="font-mono flex-1" style={{ color: 'var(--text-primary)' }}>
              {file.filename || 'unknown'}
            </span>
            {file.additions > 0 && (
              <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--success)' }}>
                <Plus size={12} />
                {file.additions}
              </span>
            )}
            {file.deletions > 0 && (
              <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--danger)' }}>
                <Minus size={12} />
                {file.deletions}
              </span>
            )}
          </div>

          {/* Patch */}
          {file.patch && (
            <div className="overflow-x-auto font-mono text-xs" style={{ background: '#0D1117' }}>
              {file.patch.split('\n').map((line, li) => {
                let bg = 'transparent';
                let color = 'var(--text-primary)';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  bg = 'rgba(63,185,80,0.12)';
                  color = 'var(--success)';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                  bg = 'rgba(248,81,73,0.12)';
                  color = 'var(--danger)';
                } else if (line.startsWith('@@')) {
                  color = 'var(--accent)';
                }
                return (
                  <div key={li} className="flex" style={{ background: bg }}>
                    <span
                      className="select-none w-10 text-right pr-3 shrink-0 leading-5"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {li + 1}
                    </span>
                    <span className="px-2 leading-5 whitespace-pre" style={{ color }}>
                      {line}
                    </span>
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
