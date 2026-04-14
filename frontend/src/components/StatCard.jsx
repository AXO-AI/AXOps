export default function StatCard({ value, label, color, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4 transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {Icon && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color || 'var(--accent)'}15` }}
        >
          <Icon size={18} style={{ color: color || 'var(--accent)', opacity: 0.9 }} />
        </div>
      )}
      <div>
        <div className="text-2xl font-bold tracking-tight" style={{ color: '#E8ECF4' }}>
          {value ?? '--'}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
