export default function StatCard({ value, label, color, icon: Icon, delta, deltaColor }) {
  return (
    <div style={{ background: '#FFFFFF', border: '0.5px solid #DFE1E6', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && (
          <div style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color || '#4B7BF5'}12`, flexShrink: 0 }}>
            <Icon size={14} style={{ color: color || '#4B7BF5' }} />
          </div>
        )}
        <div>
          <div style={{ fontSize: 9, color: '#9CA0AB', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, color: '#1E2028', lineHeight: 1 }}>{value ?? '--'}</div>
          {delta && <div style={{ fontSize: 9, marginTop: 2, color: deltaColor || '#0D9488' }}>{delta}</div>}
        </div>
      </div>
    </div>
  );
}
