export default function StatCard({ value, label, color, icon: Icon }) {
  return (
    <div
      className="rounded-lg p-5 flex items-center gap-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {Icon && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color || 'var(--accent)'}15` }}
        >
          <Icon size={20} style={{ color: color || 'var(--accent)' }} />
        </div>
      )}
      <div>
        <div className="text-2xl font-bold" style={{ color: color || 'var(--text-primary)' }}>
          {value ?? '--'}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
