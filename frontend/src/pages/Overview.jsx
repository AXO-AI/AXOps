import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, Ticket, Activity, Loader2, Server, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import StatCard from '../components/StatCard';
import TicketRow from '../components/TicketRow';
import Badge from '../components/Badge';
import { api, displayKey, timeAgo } from '../api';
import { getComplianceScore, getSecretRotationStatus, isInFreezeWindow, loadViolations } from '../data/policyEngine';

const SEV_COLORS = {
  critical: { bg: 'rgba(248,81,73,0.12)', color: '#F85149' },
  error: { bg: 'rgba(248,81,73,0.12)', color: '#F85149' },
  warning: { bg: 'rgba(210,153,34,0.12)', color: '#D29922' },
  info: { bg: 'rgba(88,166,255,0.12)', color: '#58A6FF' },
};

function daysSince(d) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }

export default function Overview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [repoCount, setRepoCount] = useState(null);
  const [ticketCount, setTicketCount] = useState(null);
  const [pipelineHealth, setPipelineHealth] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [recentBuilds, setRecentBuilds] = useState([]);
  const [environments, setEnvironments] = useState([]);

  // Agent state
  const [agentFindings, setAgentFindings] = useState([]);
  const [lastScan, setLastScan] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [discovery, jira, builds, envData] = await Promise.all([
          api.discovery.quick(),
          api.jira.search('status != Done ORDER BY updated DESC', 'summary,status,priority,issuetype,labels,assignee', 10),
          api.github.buildHistory(),
          api.github.environments(),
        ]);
        setRepoCount(discovery?.total ?? discovery?.repos?.length ?? discovery?.repoCount ?? 0);
        setTicketCount(jira?.total ?? jira?.issues?.length ?? 0);
        setTickets(jira?.issues || []);
        setEnvironments(envData?.environments || []);

        const buildList = builds?.builds || builds?.runs || (Array.isArray(builds) ? builds : []);
        setRecentBuilds(buildList.slice(0, 10));

        if (buildList.length > 0) {
          const recent = buildList.slice(0, 20);
          const passed = recent.filter((b) => (b?.conclusion || b?.status) === 'success').length;
          setPipelineHealth(recent.length > 0 ? Math.round((passed / recent.length) * 100) : 0);
        } else {
          setPipelineHealth(builds?.healthPercent ?? 0);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // Agent scanner
  const runAgentScan = useCallback(() => {
    try {
      const findings = [];

      // 1. Environment parity
      if (environments.length >= 2) {
        for (let i = 0; i < environments.length - 1; i++) {
          const a = environments[i];
          const b = environments[i + 1];
          if (a.deployed_at && b.deployed_at) {
            const drift = daysSince(b.deployed_at) - daysSince(a.deployed_at);
            if (drift > 3) {
              findings.push({ type: 'drift', severity: 'warning', title: `${b.name} is ${drift} days behind ${a.name}`, detail: `${a.name} at ${a.version}, ${b.name} at ${b.version}`, actions: [`Promote to ${b.name}`, 'View commits'], timestamp: new Date().toISOString() });
            }
          }
        }
      }

      // 2. Secret expiration
      const secrets = getSecretRotationStatus();
      for (const s of secrets) {
        const elapsed = daysSince(s.lastRotated);
        const remaining = (s.rotationDays || 90) - elapsed;
        if (remaining <= 14) {
          findings.push({ type: 'secret', severity: remaining <= 0 ? 'critical' : 'warning', title: remaining <= 0 ? `${s.name} has EXPIRED` : `${s.name} expires in ${remaining} days`, actions: ['Rotate now', 'Snooze'], timestamp: new Date().toISOString() });
        }
      }

      // 3. Policy violations (last 24h)
      const violations = loadViolations();
      const recent = violations.filter(v => Date.now() - new Date(v.timestamp).getTime() < 86400000);
      if (recent.length > 0) {
        findings.push({ type: 'policy', severity: 'critical', title: `${recent.length} policy violation(s) in last 24 hours`, detail: recent[0]?.description || '', actions: ['View violations', 'Open Governance'], timestamp: new Date().toISOString() });
      }

      // 4. Failed builds
      const failed = recentBuilds.filter(b => (b?.conclusion || b?.status) === 'failure');
      if (failed.length > 0) {
        const f = failed[0];
        findings.push({ type: 'build_failure', severity: 'error', title: `Build #${f.runNumber || f.run_id || '?'} failed in ${f.repo || 'unknown'}`, detail: f.commitMessage || 'Check build logs for details', actions: ['View logs', 'Retry build'], timestamp: new Date().toISOString() });
      }

      // 5. Freeze window
      const freeze = isInFreezeWindow();
      if (freeze.frozen) {
        findings.push({ type: 'freeze', severity: 'info', title: `Deploy freeze active — ${freeze.window}`, detail: `PROD deploys blocked until ${freeze.endsAt}`, actions: ['View calendar'], timestamp: new Date().toISOString() });
      }

      // 6. Governance score
      const score = getComplianceScore();
      if (score.score < 90) {
        findings.push({ type: 'governance', severity: score.score < 70 ? 'critical' : 'warning', title: `Governance score at ${score.score}%`, detail: `${score.active} of ${score.total} policies active`, actions: ['Open Governance'], timestamp: new Date().toISOString() });
      }

      setAgentFindings(findings);
      setLastScan(new Date());
    } catch (err) {
      console.error('Agent scan failed:', err);
    }
  }, [environments, recentBuilds]);

  useEffect(() => {
    if (!loading) {
      runAgentScan();
      const interval = setInterval(runAgentScan, 60000);
      return () => clearInterval(interval);
    }
  }, [loading, runAgentScan]);

  const handleAgentAction = (finding, action) => {
    if (action === 'Rotate now') {
      const secrets = getSecretRotationStatus();
      const updated = secrets.map(s => s.name === finding.title.split(' ')[0] ? { ...s, lastRotated: new Date().toISOString().split('T')[0] } : s);
      localStorage.setItem('axops_secrets', JSON.stringify(updated));
      setAgentFindings(prev => prev.filter(f => f !== finding));
    } else if (action === 'Open Governance' || action === 'View violations') {
      navigate('/app/governance');
    } else if (action === 'View calendar') {
      navigate('/app/governance');
    } else if (action === 'View logs' || action === 'Retry build') {
      navigate('/app/deployments');
    } else if (action.startsWith('Promote to')) {
      navigate('/app/deployments');
    } else if (action === 'Snooze') {
      setAgentFindings(prev => prev.filter(f => f !== finding));
    } else if (action === 'View commits') {
      navigate('/app/workbench');
    }
    // Log action
    const log = JSON.parse(localStorage.getItem('axops_agent_log') || '[]');
    log.unshift({ timestamp: new Date().toISOString(), finding: finding.title, action, user: 'ashwin' });
    localStorage.setItem('axops_agent_log', JSON.stringify(log.slice(0, 100)));
  };

  const statusIcon = (s) => {
    if (s === 'success') return <CheckCircle2 size={14} style={{ color: '#3FB950' }} />;
    if (s === 'failure') return <XCircle size={14} style={{ color: '#F85149' }} />;
    return <Clock size={14} style={{ color: '#D29922' }} />;
  };

  const envStatusColor = (s) => {
    if (s === 'healthy') return '#3FB950';
    if (s === 'degraded') return '#D29922';
    return '#F85149';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin" style={{ color: '#7F77DD' }} />
      </div>
    );
  }

  const hasCritical = agentFindings.some(f => f.severity === 'critical' || f.severity === 'error');

  return (
    <div>
      <h1 style={{ fontSize: 15, fontWeight: 600, color: '#E6EDF3', marginBottom: 20 }}>Dashboard</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        <StatCard value={repoCount} label="Repositories" icon={FolderGit2} color="#7F77DD" />
        <StatCard value={ticketCount} label="Open Tickets" icon={Ticket} color="#58A6FF" />
        <StatCard value={pipelineHealth != null ? `${pipelineHealth}%` : '--'} label="Pipeline Health" icon={Activity} color="#3FB950" />
        <StatCard value={`${getComplianceScore().score}%`} label="Governance" icon={ShieldCheck} color="#D29922" />
      </div>

      {/* ═══ AGENT SUGGESTIONS ═══ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasCritical ? '#F85149' : '#3FB950', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#E6EDF3' }}>Agent</span>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(127,119,221,0.12)', color: '#7F77DD', fontWeight: 600 }}>AI</span>
          <span style={{ fontSize: 10, color: '#6E7681', marginLeft: 'auto' }}>
            {agentFindings.length} finding{agentFindings.length !== 1 ? 's' : ''} · scanned {lastScan ? timeAgo(lastScan) + ' ago' : 'never'}
          </span>
        </div>

        {agentFindings.length === 0 ? (
          <div style={{ background: '#161B22', border: '0.5px solid #30363D', borderLeft: '3px solid #3FB950', borderRadius: '0 8px 8px 0', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} style={{ color: '#3FB950' }} />
            <span style={{ fontSize: 12, color: '#3FB950' }}>All systems healthy. No issues detected.</span>
          </div>
        ) : (
          agentFindings.map((f, i) => {
            const sev = SEV_COLORS[f.severity] || SEV_COLORS.info;
            return (
              <div key={i} style={{ background: '#161B22', border: '0.5px solid #30363D', borderLeft: `3px solid ${sev.color}`, borderRadius: '0 8px 8px 0', padding: '12px 14px', marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: sev.bg, color: sev.color, fontWeight: 600 }}>{f.severity.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: '#6E7681' }}>{timeAgo(f.timestamp)}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#E6EDF3', marginBottom: 4 }}>{f.title}</div>
                {f.detail && <div style={{ fontSize: 11, color: '#8B949E', marginBottom: 8 }}>{f.detail}</div>}
                <div style={{ display: 'flex', gap: 6 }}>
                  {(f.actions || []).map((action, j) => (
                    <button key={j} onClick={() => handleAgentAction(f, action)}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: j === 0 ? 'none' : '0.5px solid #30363D', background: j === 0 ? '#7F77DD' : '#0D1117', color: j === 0 ? '#fff' : '#8B949E' }}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Environment Status */}
      {environments.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#484F58', marginBottom: 6 }}>Environment Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {environments.map((e) => (
              <div key={e.name} style={{ background: '#161B22', border: '0.5px solid #30363D', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#E6EDF3' }}>{e.name}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: envStatusColor(e.status) }} />
                </div>
                <div style={{ fontSize: 10, color: '#8B949E' }}>{e.version} · build #{e.build}</div>
                <div style={{ fontSize: 10, color: '#6E7681', marginTop: 2 }}>{timeAgo(e.deployed_at)} ago</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Pipeline Activity */}
      {recentBuilds.length > 0 && (
        <div style={{ background: '#161B22', border: '0.5px solid #30363D', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '10px 14px', fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#484F58', borderBottom: '0.5px solid #21262D' }}>
            Recent Pipeline Activity
          </div>
          {recentBuilds.map((b, i) => (
            <div key={b?.id || b?.run_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '0.5px solid #21262D', fontSize: 11 }}>
              {statusIcon(b?.conclusion || b?.status)}
              <span style={{ color: '#E6EDF3', minWidth: 100 }}>{b?.repo || b?.name || 'Build'}</span>
              <Badge text={b?.branch || b?.head_branch || 'main'} color="#58A6FF" />
              <span style={{ color: '#6E7681', marginLeft: 'auto', fontSize: 10 }}>
                {b?.environment && <span style={{ marginRight: 8 }}>{b.environment}</span>}
                {timeAgo(b?.startedAt || b?.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Tickets */}
      <div style={{ background: '#161B22', border: '0.5px solid #30363D', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#484F58', borderBottom: '0.5px solid #21262D' }}>
          Recent Activity
        </div>
        {tickets.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: '#484F58' }}>No recent tickets found</div>
        ) : (
          tickets.map((t) => <TicketRow key={t.key} issue={t} />)
        )}
      </div>
    </div>
  );
}
