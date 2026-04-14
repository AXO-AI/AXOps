import { useNavigate } from 'react-router-dom';
import { BarChart3, GitMerge, Shield, Rocket, Mic, Headphones, ArrowRight } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Release Tracking', desc: 'Monitor Jira tickets, story progress, and release health across all active sprints.' },
  { icon: GitMerge, title: 'Branch Management', desc: 'Create branches, review diffs, run SCA scans, and merge with full audit trails.' },
  { icon: Rocket, title: 'CI/CD Pipelines', desc: 'Deploy to any environment and monitor GitHub Actions build history in real time.' },
  { icon: Shield, title: 'Security Scanning', desc: 'Automated SCA vulnerability detection with severity classification and remediation guidance.' },
  { icon: Mic, title: 'Meeting Intelligence', desc: 'AI-powered transcript analysis that extracts action items, decisions, and key insights.' },
  { icon: Headphones, title: 'Support Operations', desc: 'Internal support ticket management with priority routing and SLA tracking.' },
];

const integrations = [
  { initial: 'G', name: 'GitHub', color: '#E8ECF4' },
  { initial: 'J', name: 'Jira', color: '#58A6FF' },
  { initial: 'S', name: 'Splunk', color: '#3FB950' },
  { initial: 'BD', name: 'Black Duck', color: '#8B93A6' },
  { initial: 'T', name: 'Teams', color: '#7C6FFF' },
  { initial: 'Ch', name: 'Cherwell', color: '#F85149' },
  { initial: 'AI', name: 'Copilot', color: '#D29922' },
];

const blogPosts = [
  { title: 'How we reduced deploy time by 80%', time: '3 min read' },
  { title: 'Zero to 700 repos: our CI/CD journey', time: '5 min read' },
  { title: 'AI-powered pipeline debugging', time: '4 min read' },
];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
};

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B0F1A' }}>
      {/* Gradient mesh background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,111,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(88,166,255,0.05) 0%, transparent 50%)',
      }} />

      {/* Nav */}
      <header className="relative flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C6FFF 0%, #5B4AE8 100%)' }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M16 6L9 18h5l-2 8L21 14h-5l2-8z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-base" style={{ color: '#E8ECF4' }}>AXOps</span>
        </div>
        <button
          onClick={() => nav('/app')}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105"
          style={{ background: 'rgba(124,111,255,0.15)', color: '#7C6FFF', border: '1px solid rgba(124,111,255,0.3)' }}
        >
          Open Dashboard <ArrowRight size={14} />
        </button>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8"
          style={{ ...glass }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3FB950' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Platform v1.0</span>
        </div>
        <h1 className="text-6xl font-bold mb-5 tracking-tight" style={{ color: '#E8ECF4' }}>
          AX<span style={{ color: '#7C6FFF' }}>Ops</span>
        </h1>
        <p className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Enterprise DevSecOps Command Center. Unified delivery, security, and operations management.
        </p>
        <button
          onClick={() => nav('/app')}
          className="px-10 py-3.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #7C6FFF 0%, #5B4AE8 100%)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(124,111,255,0.3), 0 0 60px rgba(124,111,255,0.1)',
          }}
        >
          Open Dashboard
        </button>
      </section>

      {/* Integrations */}
      <section className="relative max-w-3xl mx-auto px-6 pb-16">
        <p className="text-center text-[10px] font-semibold tracking-[0.2em] mb-8" style={{ color: 'rgba(255,255,255,0.2)' }}>
          INTEGRATED WITH
        </p>
        <div className="flex justify-center gap-8 flex-wrap">
          {integrations.map(intg => (
            <div key={intg.name} className="flex flex-col items-center gap-2" style={{ width: 64 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                style={{ ...glass, color: intg.color }}>
                {intg.initial}
              </div>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{intg.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6 transition-all hover:border-[rgba(255,255,255,0.12)]"
              style={glass}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'rgba(124,111,255,0.1)' }}>
                <f.icon size={18} style={{ color: '#7C6FFF', opacity: 0.8 }} />
              </div>
              <h3 className="text-sm font-medium mb-1.5" style={{ color: '#E8ECF4' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      <section className="relative max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-xs font-semibold mb-5 text-center tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>FROM THE ENGINEERING BLOG</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {blogPosts.map(post => (
            <div key={post.title} className="rounded-xl p-5 cursor-pointer transition-all hover:border-[rgba(255,255,255,0.12)]"
              style={glass}>
              <h4 className="text-sm font-medium mb-3" style={{ color: '#E8ECF4' }}>{post.title}</h4>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{post.time}</span>
                <span className="text-[11px] font-medium" style={{ color: '#7C6FFF' }}>Read more &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative text-center py-8 text-xs" style={{ color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        AXOps Platform v1.0
      </footer>

      {/* WhatsApp */}
      <a
        href="https://wa.me/919876543210"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed flex items-center justify-center rounded-full transition-transform hover:scale-110"
        style={{ bottom: 24, left: 24, width: 48, height: 48, background: '#25D366', zIndex: 50, boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}
        title="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.696-6.418-1.882l-.448-.292-2.644.887.887-2.644-.292-.448C1.696 16.567 1 14.37 1 12 1 5.935 5.935 1 12 1s11 4.935 11 11-4.935 11-11 11z"/>
        </svg>
      </a>
    </div>
  );
}
