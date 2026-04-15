import { NavLink } from 'react-router-dom';

const sections = [
  { label: 'DELIVERY', items: [
    { to: '/app', text: 'Dashboard', dot: '#0D9488', end: true },
    { to: '/app/workbench', text: 'Workbench', dot: '#D97706' },
    { to: '/app/merge', text: 'Merge', dot: '#4B7BF5' },
    { to: '/app/deployments', text: 'Deployments', dot: '#8BA3E9' },
    { to: '/app/pipeline-studio', text: 'Pipeline Studio', dot: '#4B7BF5', badge: 'new' },
  ]},
  { label: 'QUALITY', items: [
    { to: '/app/security', text: 'Security', dot: '#DC2626' },
    { to: '/app/governance', text: 'Governance', dot: '#D97706', badge: 'new' },
  ]},
  { label: 'INTELLIGENCE', items: [
    { to: '/app/insights', text: 'Insights', dot: '#8BA3E9' },
  ]},
  { label: 'OPERATIONS', items: [
    { to: '/app/activity', text: 'Activity', dot: '#4B7BF5' },
    { to: '/app/team', text: 'Team', dot: '#0D9488' },
    { to: '/app/support', text: 'Support', dot: '#6C7281' },
    { to: '/app/administration', text: 'Administration', dot: '#6C7281' },
  ]},
];

export default function Sidebar() {
  let agentMode = 'autonomous';
  try { agentMode = JSON.parse(localStorage.getItem('axops_autonomy_config') || '{}').mode || 'autonomous'; } catch {}

  return (
    <aside style={{ width: 200, background: '#111318', borderRight: '0.5px solid #1E2128', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 14px', borderBottom: '0.5px solid #1E2128' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: '#4B7BF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>AX</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EAF0', letterSpacing: -0.3 }}>AXOps</span>
        <span style={{ marginLeft: 'auto', fontSize: 7, padding: '2px 5px', borderRadius: 4, background: '#1A1D24', color: '#6C7281', fontWeight: 600 }}>v7.0</span>
      </div>

      {/* Agent box */}
      <div style={{ margin: '6px 14px 8px', padding: '6px 8px', background: '#1A1D24', border: '0.5px solid #252830', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4B7BF5', animation: agentMode !== 'off' ? 'pulse 2s infinite' : 'none', flexShrink: 0 }} />
        <span style={{ fontSize: 9, color: '#8BA3E9' }}>Agent: {agentMode}</span>
        <span style={{ marginLeft: 'auto', fontSize: 8, color: '#3D4150' }}>47 today</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
        {sections.map(sec => (
          <div key={sec.label}>
            <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#3D4150', padding: '8px 14px 3px' }}>{sec.label}</div>
            {sec.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 7, padding: '5px 14px', fontSize: 10, textDecoration: 'none', transition: 'all 0.1s',
                  color: isActive ? '#E8EAF0' : '#6C7281',
                  background: isActive ? 'rgba(75,123,245,0.06)' : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                  borderLeft: isActive ? '2px solid #4B7BF5' : '2px solid transparent',
                })}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                {item.text}
                {item.badge && <span style={{ marginLeft: 'auto', fontSize: 6, padding: '1px 4px', borderRadius: 3, background: 'rgba(75,123,245,0.12)', color: '#8BA3E9', fontWeight: 600 }}>{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '0.5px solid #1E2128', display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, color: '#3D4150' }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#0D9488' }} />
        All systems operational
      </div>
    </aside>
  );
}
