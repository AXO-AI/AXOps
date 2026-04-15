import { Bug, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { displayKey, typeLabel, statusColor } from '../api';
import Badge from './Badge';

const typeIcons = { Defect: Bug, Story: BookOpen, Epic: Layers, Task: CheckSquare };
const priorityColors = { Highest: '#DC2626', High: '#D97706', Medium: '#D97706', Low: '#4B7BF5', Lowest: '#9CA0AB' };

export default function TicketRow({ issue, onClick }) {
  if (!issue) return null;
  const tl = typeLabel(issue);
  const TypeIcon = typeIcons[tl] || CheckSquare;
  const status = issue.fields?.status?.name || '';
  const priority = issue.fields?.priority?.name || '';

  return (
    <div onClick={() => onClick?.(issue)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '0.5px solid #ECEEF2', cursor: onClick ? 'pointer' : 'default', fontSize: 11 }}>
      <TypeIcon size={14} style={{ color: '#9CA0AB', flexShrink: 0 }} />
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 600, color: '#4B7BF5', flexShrink: 0 }}>{displayKey(issue)}</span>
      <span style={{ flex: 1, color: '#1E2028', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.fields?.summary || ''}</span>
      {status && <Badge text={status} color={statusColor(status)} />}
      {priority && <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[priority] || '#9CA0AB', flexShrink: 0 }} title={priority} />}
    </div>
  );
}
