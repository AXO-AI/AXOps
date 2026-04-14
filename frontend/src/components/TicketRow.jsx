import { Bug, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { displayKey, typeLabel, statusColor } from '../api';
import Badge from './Badge';

const typeIcons = { Defect: Bug, Story: BookOpen, Epic: Layers, Task: CheckSquare };

const priorityColors = {
  Highest: 'var(--danger)',
  High: '#F0883E',
  Medium: 'var(--warning)',
  Low: 'var(--info)',
  Lowest: 'var(--text-tertiary)',
};

export default function TicketRow({ issue, onClick }) {
  if (!issue) return null;
  const tl = typeLabel(issue);
  const TypeIcon = typeIcons[tl] || CheckSquare;
  const status = issue.fields?.status?.name || '';
  const priority = issue.fields?.priority?.name || '';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
      onClick={() => onClick?.(issue)}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <TypeIcon size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <span className="text-xs font-mono font-medium shrink-0" style={{ color: 'var(--accent)' }}>
        {displayKey(issue)}
      </span>
      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }}>
        {issue.fields?.summary || ''}
      </span>
      {status && <Badge text={status} color={statusColor(status)} />}
      {priority && (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: priorityColors[priority] || 'var(--text-tertiary)' }}
          title={priority}
        />
      )}
    </div>
  );
}
