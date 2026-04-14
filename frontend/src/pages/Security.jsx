import { useState, useEffect } from 'react';
import { Loader2, Shield, AlertTriangle, AlertOctagon, Info, CheckCircle2, Play } from 'lucide-react';
import { api } from '../api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';

export default function Security() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [r, c] = await Promise.all([api.github.repos(), api.sca.config()]);
        setRepos(Array.isArray(r) ? r : r?.repos || []);
        setConfig(c);
      } catch {
        // silent
      }
    }
    load();
  }, []);

  const runScan = async () => {
    if (!selectedRepo) return;
    setScanning(true);
    setResults(null);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const res = await api.sca.scan(owner, repo, 'main', 'main');
      setResults(res);
    } catch {
      setResults({ error: true });
    }
    setScanning(false);
  };

  const findings = results?.vulnerabilities || results?.findings || [];
  const critical = findings.filter((f) => f.severity === 'CRITICAL').length;
  const high = findings.filter((f) => f.severity === 'HIGH').length;
  const medium = findings.filter((f) => f.severity === 'MEDIUM').length;
  const low = findings.filter((f) => f.severity === 'LOW' || (f.severity !== 'CRITICAL' && f.severity !== 'HIGH' && f.severity !== 'MEDIUM')).length;

  const scanners = config?.scanners || [
    { name: 'Dependency Check', status: 'active' },
    { name: 'License Compliance', status: 'active' },
    { name: 'Secret Detection', status: 'active' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Security</h1>

      {/* Stats */}
      {results && !results.error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard value={critical} label="Critical" icon={AlertOctagon} color="var(--danger)" />
          <StatCard value={high} label="High" icon={AlertTriangle} color="#F0883E" />
          <StatCard value={medium} label="Medium" icon={Info} color="var(--warning)" />
          <StatCard value={low} label="Low" icon={Shield} color="var(--info)" />
        </div>
      )}

      {/* Scan controls */}
      <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <select
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
          >
            <option value="">Select repository to scan...</option>
            {repos.map((r) => {
              const full = r.full_name || `${r.owner || ''}/${r.name || r}`;
              return <option key={full} value={full}>{full}</option>;
            })}
          </select>
          <button
            onClick={runScan}
            disabled={scanning || !selectedRepo}
            className="px-5 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-2 shrink-0"
            style={{ background: 'var(--accent)', color: 'white', opacity: scanning || !selectedRepo ? 0.5 : 1 }}
          >
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Run Scan
          </button>
        </div>
      </div>

      {/* Findings table */}
      {results && !results.error && (
        <div className="rounded-lg overflow-hidden mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: '1px solid var(--border)' }}>
            Findings ({findings.length})
          </div>
          {findings.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: 'var(--success)' }}>
              <CheckCircle2 size={16} /> No vulnerabilities detected
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Severity</th>
                  <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Finding</th>
                  <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Package</th>
                  <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Fix</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => {
                  const sevColor = f.severity === 'CRITICAL' ? 'var(--danger)' : f.severity === 'HIGH' ? '#F0883E' : f.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--info)';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-2"><Badge text={f.severity} color={sevColor} /></td>
                      <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{f.title || f.name || f.id || '--'}</td>
                      <td className="px-4 py-2 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{f.package || f.component || '--'}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{f.fix || f.recommendation || '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {results?.error && (
        <div className="rounded-lg p-4 mb-6 text-sm" style={{ background: 'rgba(248,81,73,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
          Scan failed. Please check repository access and try again.
        </div>
      )}

      {/* Scanner status */}
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Scanners</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scanners.map((s, i) => (
          <div key={i} className="rounded-lg p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Shield size={16} style={{ color: 'var(--accent)' }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
            </div>
            <span className="w-2 h-2 rounded-full" style={{ background: s.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
