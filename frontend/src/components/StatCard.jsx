export default function StatCard({ value, label, color, icon: Icon, delta, deltaColor }) {
  return (
    <div style={{ background: '#161B22', border: '0.5px solid #30363D', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color || '#7F77DD'}15`, flexShrink: 0 }}>
            <Icon size={15} style={{ color: color || '#7F77DD' }} />
          </div>
        )}
        <div>
          <div style={{ fontSize: 10, color: '#6E7681', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, color: color || '#E6EDF3', lineHeight: 1 }}>{value ?? '--'}</div>
          {delta && <div style={{ fontSize: 9, marginTop: 3, color: deltaColor || '#3FB950' }}>{delta}</div>}
        </div>
      </div>
    </div>
  );
}
