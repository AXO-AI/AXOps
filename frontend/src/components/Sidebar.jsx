import { NavLink } from 'react-router-dom';

const sections = [
  {
    label: 'DELIVERY',
    items: [
      { to: '/app', text: 'Dashboard', dot: '#3FB950', end: true },
      { to: '/app/workbench', text: 'Workbench', dot: '#D29922' },
      { to: '/app/merge', text: 'Merge', dot: '#58A6FF' },
      { to: '/app/deployments', text: 'Deployments', dot: '#7F77DD' },
      { to: '/app/pipeline-studio', text: 'Pipeline Studio', dot: '#534AB7', badge: 'new' },
    ],
  },
  {
    label: 'QUALITY',
    items: [
      { to: '/app/security', text: 'Security', dot: '#F85149' },
      { to: '/app/governance', text: 'Governance', dot: '#D29922', badge: 'new' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { to: '/app/insights', text: 'Insights', dot: '#7F77DD' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/app/activity', text: 'Activity', dot: '#58A6FF' },
      { to: '/app/team', text: 'Team', dot: '#3FB950' },
      { to: '/app/support', text: 'Support', dot: '#8B949E' },
      { to: '/app/administration', text: 'Administration', dot: '#6E7681' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside style={{ width: 220, background: '#161B22', borderRight: '0.5px solid #30363D', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Logo bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '0.5px solid #21262D' }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #7F77DD 0%, #534AB7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: -0.5, flexShrink: 0 }}>AX</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#E6EDF3', letterSpacing: -0.3 }}>AXOps</span>
        <span style={{ marginLeft: 'auto', fontSize: 8, padding: '1px 5px', borderRadius: 3, background: '#21262D', color: '#6E7681', fontWeight: 600 }}>v7.0</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {sections.map(sec => (
          <div key={sec.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#484F58', padding: '0 10px', marginBottom: 4 }}>
              {sec.label}
            </div>
            {sec.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                  fontSize: 11, textDecoration: 'none', marginBottom: 1, transition: 'all 0.12s',
                  color: isActive ? '#E6EDF3' : '#8B949E',
                  background: isActive ? 'rgba(127,119,221,0.08)' : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                  borderLeft: isActive ? '2px solid #7F77DD' : '2px solid transparent',
                })}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                {item.text}
                {item.badge && (
                  <span style={{ marginLeft: 'auto', fontSize: 7, padding: '1px 4px', borderRadius: 3, background: 'rgba(127,119,221,0.15)', color: '#7F77DD', fontWeight: 600 }}>{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '0.5px solid #21262D', display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: '#484F58' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3FB950' }} />
        All systems operational
      </div>
    </aside>
  );
}
