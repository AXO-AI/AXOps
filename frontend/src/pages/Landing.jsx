import { useNavigate } from 'react-router-dom';
import { BarChart3, GitMerge, Shield, Rocket, Mic, Headphones, ArrowRight } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Release Tracking', desc: 'Monitor Jira tickets, story progress, and release health across all active sprints.' },
  { icon: GitMerge, title: 'Branch Management', desc: 'Create branches, review diffs, run SCA scans, and merge with full audit trails.' },
  { icon: Rocket, title: 'CI/CD Pipelines', desc: 'Deploy to any environment and monitor GitHub Actions build history in real time.' },
  { icon: Shield, title: 'Security Scanning', desc: 'Automated SCA vulnerability detection with severity classification and remediation.' },
  { icon: Mic, title: 'Meeting Intelligence', desc: 'AI-powered transcript analysis that extracts action items, decisions, and key insights.' },
  { icon: Headphones, title: 'Support Operations', desc: 'Internal support ticket management with priority routing and SLA tracking.' },
];

const integrations = [
  { name: 'GitHub' }, { name: 'Jira' }, { name: 'Splunk' },
  { name: 'Black Duck' }, { name: 'Teams' }, { name: 'Cherwell' }, { name: 'Claude AI' },
];

export default function Landing() {
  const nav = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#0F1117', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #7F77DD, #534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>AX</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#E6EDF3' }}>AXOps</span>
        </div>
        <button onClick={() => nav('/app')}
          style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: '#7F77DD', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
          Open Dashboard <ArrowRight size={13} />
        </button>
      </header>

      {/* Hero */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#484F58', marginBottom: 20 }}>
          Autonomous eXecution Operations
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2, color: '#E6EDF3', margin: '0 0 16px', lineHeight: 1 }}>
          AX<span style={{ color: '#7F77DD' }}>Ops</span>
        </h1>
        <p style={{ fontSize: 15, color: '#8B949E', maxWidth: 420, lineHeight: 1.6, margin: '0 0 32px' }}>
          Enterprise DevSecOps command center. Unified delivery, security, and operations management.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => nav('/app')}
            style={{ padding: '10px 28px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#7F77DD', color: '#fff' }}>
            Get Started
          </button>
          <button onClick={() => nav('/app')}
            style={{ padding: '10px 24px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#8B949E', border: '0.5px solid #30363D' }}>
            View Demo
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 48px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#161B22', border: '0.5px solid #30363D', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { value: '463', label: 'Repositories' },
            { value: '13', label: 'Modules' },
            { value: '99.9%', label: 'Uptime' },
            { value: '8', label: 'Integrations' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px 12px', borderRight: i < 3 ? '0.5px solid #21262D' : 'none' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#E6EDF3', letterSpacing: -0.5 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#6E7681', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 48px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#484F58', marginBottom: 16 }}>Integrated with</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {integrations.map(i => (
            <span key={i.name} style={{ padding: '4px 12px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: '#161B22', color: '#6E7681', border: '0.5px solid #21262D' }}>
              {i.name}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 64px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#161B22', border: '0.5px solid #30363D', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(127,119,221,0.08)', marginBottom: 10 }}>
                <f.icon size={14} style={{ color: '#7F77DD' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#E6EDF3', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: '#6E7681', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '20px 0', fontSize: 9, color: '#21262D', borderTop: '0.5px solid #21262D' }}>
        AXOps v7.0 — Autonomous eXecution Operations
      </footer>

      {/* WhatsApp */}
      <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer"
        style={{ position: 'fixed', bottom: 20, left: 20, width: 42, height: 42, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
        title="Chat with us on WhatsApp">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.696-6.418-1.882l-.448-.292-2.644.887.887-2.644-.292-.448C1.696 16.567 1 14.37 1 12 1 5.935 5.935 1 12 1s11 4.935 11 11-4.935 11-11 11z"/>
        </svg>
      </a>
    </div>
  );
}
