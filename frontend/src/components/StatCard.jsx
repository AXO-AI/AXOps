export default function StatCard({ value, label, color, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{
        background: '#1C2333',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {Icon && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color || 'var(--accent)'}18` }}
        >
          <Icon size={18} style={{ color: color || 'var(--accent)' }} />
        </div>
      )}
      <div>
        <div className="text-2xl font-bold tracking-tight" style={{ color: '#F0F3F6' }}>
          {value ?? '--'}
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#9CA3B0' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
