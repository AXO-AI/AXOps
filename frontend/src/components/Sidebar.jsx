import { NavLink } from 'react-router-dom';
import { BarChart3, Pencil, GitMerge, Rocket, Layers, Shield, ShieldCheck, Mic, Bell, Users, Headphones, Settings } from 'lucide-react';

const sections = [
  {
    label: 'DELIVERY',
    items: [
      { to: '/app', icon: BarChart3, text: 'Overview', end: true },
      { to: '/app/commit', icon: Pencil, text: 'Commit' },
      { to: '/app/merge', icon: GitMerge, text: 'Merge' },
      { to: '/app/cicd', icon: Rocket, text: 'CI/CD' },
      { to: '/app/pipelines', icon: Layers, text: 'Pipelines' },
    ],
  },
  {
    label: 'QUALITY',
    items: [
      { to: '/app/security', icon: Shield, text: 'Security' },
      { to: '/app/policies', icon: ShieldCheck, text: 'Policies' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { to: '/app/meetings', icon: Mic, text: 'Meetings' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/app/notifications', icon: Bell, text: 'Notifications' },
      { to: '/app/team', icon: Users, text: 'Team' },
      { to: '/app/support', icon: Headphones, text: 'Support' },
      { to: '/app/settings', icon: Settings, text: 'Settings' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col h-screen shrink-0"
      style={{
        width: 230,
        background: '#12161F',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C6FFF 0%, #5B4AE8 100%)' }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <path d="M16 6L9 18h5l-2 8L21 14h-5l2-8z" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-base tracking-tight" style={{ color: '#F0F3F6' }}>AXOps</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(124,111,255,0.15)', color: '#7C6FFF' }}>v1.0</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-1">
        {sections.map((sec) => (
          <div key={sec.label} className="mb-5">
            <div className="text-[10px] font-semibold tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {sec.label}
            </div>
            {sec.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] no-underline transition-all mb-0.5"
                style={({ isActive }) => ({
                  color: isActive ? '#F0F3F6' : '#7A8194',
                  background: isActive ? 'rgba(124,111,255,0.1)' : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                })}
              >
                <item.icon size={16} />
                {item.text}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex items-center gap-2 px-5 py-4 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#5C6370' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3FB950' }} />
        All systems operational
      </div>
    </aside>
  );
}
