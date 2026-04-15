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

export default function Landing() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#111318', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#4B7BF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>AX</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EAF0' }}>AXOps</span>
        </div>
        <button onClick={() => nav('/app')} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: '#4B7BF5', color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}>
          Open Dashboard <ArrowRight size={12} />
        </button>
      </header>

      {/* Hero */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: '#3D4150', marginBottom: 16 }}>Autonomous eXecution Operations</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, color: '#E8EAF0', margin: '0 0 14px', lineHeight: 1 }}>
          AX<span style={{ color: '#4B7BF5' }}>Ops</span>
        </h1>
        <p style={{ fontSize: 14, color: '#6C7281', maxWidth: 380, lineHeight: 1.6, margin: '0 0 28px' }}>Enterprise DevSecOps command center. Unified delivery, security, and operations management.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => nav('/app')} style={{ padding: '9px 24px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#4B7BF5', color: '#fff' }}>Get Started</button>
          <button onClick={() => nav('/app')} style={{ padding: '9px 20px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#6C7281', border: '0.5px solid #252830' }}>View Demo</button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 36px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#1A1D24', border: '0.5px solid #1E2128', borderRadius: 8, overflow: 'hidden' }}>
          {[{ v: '463', l: 'Repositories' }, { v: '13', l: 'Modules' }, { v: '99.9%', l: 'Uptime' }, { v: '8', l: 'Integrations' }].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '14px 10px', borderRight: i < 3 ? '0.5px solid #1E2128' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#E8EAF0', letterSpacing: -0.5 }}>{s.v}</div>
              <div style={{ fontSize: 8, color: '#3D4150', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '0 20px 48px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#1A1D24', border: '0.5px solid #1E2128', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(75,123,245,0.08)', marginBottom: 8 }}>
                <f.icon size={13} style={{ color: '#4B7BF5' }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#E8EAF0', marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 10, color: '#6C7281', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '16px 0', fontSize: 8, color: '#252830', borderTop: '0.5px solid #1E2128' }}>AXOps v7.0 — Autonomous eXecution Operations</footer>

      {/* WhatsApp */}
      <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" style={{ position: 'fixed', bottom: 16, left: 16, width: 40, height: 40, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} title="Chat with us on WhatsApp">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.696-6.418-1.882l-.448-.292-2.644.887.887-2.644-.292-.448C1.696 16.567 1 14.37 1 12 1 5.935 5.935 1 12 1s11 4.935 11 11-4.935 11-11 11z"/></svg>
      </a>
    </div>
  );
}
