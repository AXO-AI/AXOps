import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, Ticket, Activity, Loader2, Server, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import StatCard from '../components/StatCard';
import TicketRow from '../components/TicketRow';
import Badge from '../components/Badge';
import { api, displayKey, timeAgo } from '../api';
import { getComplianceScore, getSecretRotationStatus, isInFreezeWindow, loadViolations } from '../data/policyEngine';
import { generatePlan } from '../agent/planGenerator';
import { executePlan as runPlanEngine, autoExecutePlan } from '../agent/executionEngine';
import { shouldAutoExecute, loadAutonomyConfig } from '../agent/autonomyConfig';

const SEV_COLORS = {
  critical: { bg: 'rgba(220,38,38,0.12)', color: '#DC2626' },
  error: { bg: 'rgba(220,38,38,0.12)', color: '#DC2626' },
  warning: { bg: 'rgba(217,119,6,0.12)', color: '#D97706' },
  info: { bg: 'rgba(75,123,245,0.12)', color: '#4B7BF5' },
};

function daysSince(d) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }

function logAgentAction(finding, action, result) {
  const log = JSON.parse(localStorage.getItem('axops_agent_log') || '[]');
  log.unshift({ timestamp: new Date().toISOString(), finding: finding.title, action, result, user: 'ashwin' });
  localStorage.setItem('axops_agent_log', JSON.stringify(log.slice(0, 100)));
}

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

  // Agent plans generated from findings
  const [plans, setPlans] = useState([]);
  const [executingPlanId, setExecutingPlanId] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const cancelRef = useRef(false);

  // Agent scanner — detects issues, generates plans
  const runAgentScan = useCallback(() => {
    try {
      const findings = [];
      const now = new Date().toISOString();

      // 1. Environment parity
      if (environments.length >= 2) {
        for (let i = 0; i < environments.length - 1; i++) {
          const a = environments[i]; const b = environments[i + 1];
          if (a.deployed_at && b.deployed_at) {
            const drift = daysSince(b.deployed_at) - daysSince(a.deployed_at);
            if (drift > 3) {
              findings.push({ type: 'drift', severity: 'warning', timestamp: now, title: `${b.name} is ${drift} days behind ${a.name}`, detail: `${a.name} at ${a.version}, ${b.name} at ${b.version}`, meta: { sourceEnv: a.name, targetEnv: b.name, sourceBranch: a.branch || a.name.toLowerCase(), targetBranch: b.branch || b.name.toLowerCase(), repo: recentBuilds[0]?.full_name || `AXO-AI/${recentBuilds[0]?.repo || 'AXOps'}` } });
            }
          }
        }
      }
      // 2. Secret expiration
      for (const s of getSecretRotationStatus()) {
        const remaining = (s.rotationDays || 90) - daysSince(s.lastRotated);
        if (remaining <= 14) findings.push({ type: 'secret', severity: remaining <= 0 ? 'critical' : 'warning', timestamp: now, title: remaining <= 0 ? `${s.name} has EXPIRED` : `${s.name} expires in ${remaining} days`, meta: { secretName: s.name, daysRemaining: remaining } });
      }
      // 3. Policy violations
      const viol = loadViolations().filter(v => Date.now() - new Date(v.timestamp).getTime() < 86400000);
      if (viol.length > 0) findings.push({ type: 'policy', severity: 'critical', timestamp: now, title: `${viol.length} policy violation(s) in last 24h`, detail: viol[0]?.description || '' });
      // 4. Failed builds
      const failed = recentBuilds.filter(b => (b?.conclusion || b?.status) === 'failure');
      if (failed.length > 0) { const f = failed[0]; findings.push({ type: 'build_failure', severity: 'error', timestamp: now, title: `Build #${f.runNumber || f.run_id || '?'} failed in ${f.repo || 'unknown'}`, detail: f.commitMessage || '', meta: { repo: (f.full_name || f.repo || '').includes('/') ? f.full_name || f.repo : `AXO-AI/${f.repo || 'AXOps'}`, branch: f.branch || 'main', runId: f.run_id || f.id, repoName: f.repo } }); }
      // 5. Freeze
      const freeze = isInFreezeWindow();
      if (freeze.frozen) findings.push({ type: 'freeze', severity: 'info', timestamp: now, title: `Deploy freeze active — ${freeze.window}`, detail: `PROD deploys blocked until ${freeze.endsAt}` });
      // 6. Governance
      const gs = getComplianceScore();
      if (gs.score < 90) findings.push({ type: 'governance', severity: gs.score < 70 ? 'critical' : 'warning', timestamp: now, title: `Governance score at ${gs.score}%`, detail: `${gs.active} of ${gs.total} policies active` });

      setAgentFindings(findings);
      setLastScan(new Date());
    } catch (err) { console.error('Agent scan failed:', err); }
  }, [environments, recentBuilds]);

  useEffect(() => {
    if (!loading) { runAgentScan(); const iv = setInterval(runAgentScan, 60000); return () => clearInterval(iv); }
  }, [loading, runAgentScan]);

  // Completed plans state
  const [completedPlans, setCompletedPlans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axops_completed_plans') || '[]'); } catch { return []; }
  });

  // Generate plans from findings and classify by autonomy
  useEffect(() => {
    const generated = agentFindings.map(f => {
      const p = generatePlan(f);
      if (!p) return null;
      const decision = shouldAutoExecute(p);
      return { ...p, finding: f, autoMode: decision };
    }).filter(Boolean);

    setPlans(generated);

    // Auto-execute low-risk plans
    generated.filter(p => p.autoMode === 'auto').forEach(plan => {
      // Skip if already executing or already completed
      if (executingPlanId) return;
      autoExecutePlan(plan,
        (stepNum, status, detail) => {
          setPlans(prev => prev.map(p => p.id !== plan.id ? p : { ...p, steps: p.steps.map(s => s.step === stepNum ? { ...s, status, detail } : s) }));
        },
        (result) => {
          const completed = { ...plan, result, completedAt: new Date().toISOString(), autoExecuted: true };
          setCompletedPlans(prev => { const next = [completed, ...prev].slice(0, 20); localStorage.setItem('axops_completed_plans', JSON.stringify(next)); return next; });
          setTimeout(() => { setPlans(prev => prev.filter(p => p.id !== plan.id)); setAgentFindings(prev => prev.filter(f => f !== plan.finding)); }, 4000);
        }
      );
    });
  }, [agentFindings]);

  // Execute a plan using the engine
  const handleExecutePlan = async (plan) => {
    cancelRef.current = false;
    setExecutingPlanId(plan.id);
    const onStepUpdate = (stepNum, status, detail) => {
      setPlans(prev => prev.map(p => p.id !== plan.id ? p : { ...p, steps: p.steps.map(s => s.step === stepNum ? { ...s, status, detail } : s) }));
    };
    const result = await runPlanEngine(plan, onStepUpdate, cancelRef);
    if (result.success) {
      setActionResult({ ok: true, msg: `Plan completed — ${result.results.length} steps in ${Math.round(result.duration / 1000)}s` });
      setTimeout(() => { setPlans(prev => prev.filter(p => p.id !== plan.id)); setAgentFindings(prev => prev.filter(f => f !== plan.finding)); }, 3000);
    } else {
      setActionResult({ ok: false, msg: `Failed at step ${result.failedAt}: ${result.reason}` });
    }
    setExecutingPlanId(null);
    setTimeout(() => setActionResult(null), 5000);
  };

  const cancelPlan = () => { cancelRef.current = true; };
  const dismissPlan = (id) => { setPlans(prev => prev.filter(p => p.id !== id)); };

  const statusIcon = (s) => {
    if (s === 'success') return <CheckCircle2 size={14} style={{ color: '#0D9488' }} />;
    if (s === 'failure') return <XCircle size={14} style={{ color: '#DC2626' }} />;
    return <Clock size={14} style={{ color: '#D97706' }} />;
  };

  const envStatusColor = (s) => {
    if (s === 'healthy') return '#0D9488';
    if (s === 'degraded') return '#D97706';
    return '#DC2626';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin" style={{ color: '#4B7BF5' }} />
      </div>
    );
  }

  const hasCritical = agentFindings.some(f => f.severity === 'critical' || f.severity === 'error');
  const riskColor = (r) => r === 'high' ? '#DC2626' : r === 'medium' ? '#D97706' : '#4B7BF5';
  const riskBg = (r) => r === 'high' ? 'rgba(220,38,38,0.12)' : r === 'medium' ? 'rgba(217,119,6,0.12)' : 'rgba(75,123,245,0.12)';
  const stepColor = (s) => ({ success: '#0D9488', running: '#4B7BF5', failed: '#DC2626', rolling_back: '#D97706', rolled_back: '#9CA0AB' }[s] || '#9CA0AB');
  const stepBg = (s) => ({ success: 'rgba(13,148,136,0.15)', running: 'rgba(75,123,245,0.15)', failed: 'rgba(220,38,38,0.15)', rolling_back: 'rgba(217,119,6,0.15)' }[s] || 'rgba(110,118,129,0.08)');
  const agentLog = JSON.parse(localStorage.getItem('axops_agent_log') || '[]');

  return (
    <div>
      <h1 style={{ fontSize: 15, fontWeight: 600, color: '#1E2028', marginBottom: 20 }}>Dashboard</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        <StatCard value={repoCount} label="Repositories" icon={FolderGit2} color="#4B7BF5" />
        <StatCard value={ticketCount} label="Open Tickets" icon={Ticket} color="#4B7BF5" />
        <StatCard value={pipelineHealth != null ? `${pipelineHealth}%` : '--'} label="Pipeline Health" icon={Activity} color="#0D9488" />
        <StatCard value={`${getComplianceScore().score}%`} label="Governance" icon={ShieldCheck} color="#D97706" />
      </div>

      {/* ═══ AGENT SUGGESTIONS ═══ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasCritical ? '#DC2626' : '#0D9488', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1E2028' }}>Agent</span>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(75,123,245,0.12)', color: '#4B7BF5', fontWeight: 600 }}>AI</span>
          <span style={{ fontSize: 10, color: '#CDD0D7', marginLeft: 'auto' }}>
            {agentFindings.length} finding{agentFindings.length !== 1 ? 's' : ''} · scanned {lastScan ? timeAgo(lastScan) + ' ago' : 'never'}
          </span>
        </div>

        {plans.length === 0 && agentFindings.length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '0.5px solid #DFE1E6', borderLeft: '3px solid #0D9488', borderRadius: '0 8px 8px 0', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} style={{ color: '#0D9488' }} />
            <span style={{ fontSize: 12, color: '#0D9488' }}>All systems healthy. No issues detected.</span>
          </div>
        ) : (
          plans.map(plan => {
            const isExec = executingPlanId === plan.id;
            const currentStepObj = isExec ? plan.steps.find(s => s.status === 'running') : null;
            const isDone = plan.steps.every(s => s.status === 'success');
            const isFailed = plan.steps.some(s => s.status === 'failed');

            return (
              <div key={plan.id} style={{ background: '#FFFFFF', border: isExec ? '0.5px solid #7F77DD' : '0.5px solid #DFE1E6', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                  {isExec && plan.autoMode === 'auto' ? (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(75,123,245,0.15)', color: '#4B7BF5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Loader2 size={9} className="animate-spin" /> AUTO-EXECUTING</span>
                  ) : isExec ? (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(75,123,245,0.15)', color: '#4B7BF5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Loader2 size={9} className="animate-spin" /> EXECUTING</span>
                  ) : isDone ? (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(13,148,136,0.12)', color: '#0D9488', fontWeight: 700 }}>COMPLETED</span>
                  ) : plan.autoMode === 'block' ? (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(220,38,38,0.12)', color: '#DC2626', fontWeight: 700 }}>REQUIRES APPROVAL</span>
                  ) : plan.autoMode === 'auto' ? (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(75,123,245,0.12)', color: '#4B7BF5', fontWeight: 700 }}>AUTO</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: riskBg(plan.risk), color: riskColor(plan.risk), fontWeight: 700 }}>{plan.risk.toUpperCase()} RISK</span>
                      <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(75,123,245,0.12)', color: '#4B7BF5', fontWeight: 600 }}>{plan.steps.length} steps</span>
                    </div>
                  )}
                  <span style={{ fontSize: 10, color: '#9CA0AB' }}>{isExec ? (plan.autoMode === 'auto' ? 'autonomous' : 'just now') : `${Math.round(plan.confidence * 100)}%`}</span>
                </div>
                <div style={{ padding: '0 14px 10px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E2028', marginBottom: 3 }}>{plan.trigger}</div>
                  {!isExec && plan.finding?.detail && <div style={{ fontSize: 11, color: '#9CA0AB' }}>{plan.finding.detail}</div>}
                </div>
                <div style={{ margin: '0 14px 10px', border: '0.5px solid #ECEEF2', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, color: '#9CA0AB', letterSpacing: 0.5, background: '#F7F8FA', borderBottom: '0.5px solid #ECEEF2' }}>EXECUTION PLAN</div>
                  {plan.steps.map((step, si) => (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderBottom: si < plan.steps.length - 1 ? '0.5px solid #ECEEF2' : 'none', background: step.status === 'running' ? 'rgba(75,123,245,0.04)' : 'transparent' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, flexShrink: 0, background: stepBg(step.status), color: stepColor(step.status) }}>
                        {step.status === 'success' ? '✓' : step.status === 'running' ? '●' : step.status === 'failed' ? '✕' : step.step}
                      </span>
                      <span style={{ flex: 1, fontSize: 11, color: step.status === 'pending' ? '#9CA0AB' : '#1E2028' }}>{step.label}</span>
                      <span style={{ fontSize: 10, color: stepColor(step.status), display: 'flex', alignItems: 'center', gap: 3 }}>
                        {step.status === 'running' && <Loader2 size={9} className="animate-spin" />}
                        {step.detail || (step.status !== 'pending' ? step.status : '')}
                      </span>
                    </div>
                  ))}
                </div>
                {isExec && currentStepObj && <div style={{ padding: '0 14px 10px', fontSize: 11, color: '#4B7BF5' }}>Step {currentStepObj.step}/{plan.steps.length} — {currentStepObj.label.toLowerCase()}...</div>}
                {!isExec && !isDone && !isFailed && <div style={{ padding: '0 14px 10px', display: 'flex', gap: 16, fontSize: 10, color: '#CDD0D7' }}><span>Est: {plan.estimatedTime}</span><span>Rollback: {plan.rollback?.length > 0 ? 'automatic on failure' : 'none'}</span></div>}
                {isDone && <div style={{ margin: '0 14px 10px', padding: '8px 12px', borderRadius: 6, background: 'rgba(13,148,136,0.08)', border: '0.5px solid rgba(13,148,136,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={13} style={{ color: '#0D9488' }} /><span style={{ fontSize: 11, color: '#0D9488', fontWeight: 500 }}>Plan executed — {plan.steps.length} steps completed</span></div>}
                <div style={{ display: 'flex', gap: 6, padding: '0 14px 12px', alignItems: 'center' }}>
                  {isExec && <button onClick={cancelPlan} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '0.5px solid rgba(220,38,38,0.3)' }}>Cancel &amp; rollback</button>}
                  {plan.autoMode === 'auto' && !isExec && !isDone && !isFailed && <span style={{ fontSize: 10, color: '#4B7BF5' }}>Agent is handling this autonomously</span>}
                  {plan.autoMode === 'suggest' && !isExec && !isDone && !isFailed && <><button onClick={() => handleExecutePlan(plan)} disabled={!!executingPlanId} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#4B7BF5', color: '#fff', opacity: executingPlanId ? 0.5 : 1 }}>Approve &amp; execute</button><button onClick={() => dismissPlan(plan.id)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#9CA0AB', border: '0.5px solid #DFE1E6' }}>Dismiss</button></>}
                  {plan.autoMode === 'block' && !isExec && !isDone && !isFailed && <><button onClick={() => handleExecutePlan(plan)} disabled={!!executingPlanId} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#DC2626', color: '#fff', opacity: executingPlanId ? 0.5 : 1 }}>Approve &amp; execute</button><button onClick={() => dismissPlan(plan.id)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#9CA0AB', border: '0.5px solid #DFE1E6' }}>Dismiss</button></>}
                  {(isDone || isFailed) && !isExec && <button onClick={() => dismissPlan(plan.id)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#9CA0AB', border: '0.5px solid #DFE1E6' }}>Dismiss</button>}
                </div>
              </div>
            );
          })
        )}

        {/* Completed plans feed */}
        {completedPlans.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9CA0AB', marginBottom: 6 }}>Recently completed</div>
            {completedPlans.slice(0, 5).map((cp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '0.5px solid #ECEEF2', fontSize: 10 }}>
                <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: cp.result?.success ? 'rgba(13,148,136,0.12)' : 'rgba(220,38,38,0.12)', color: cp.result?.success ? '#0D9488' : '#DC2626' }}>{cp.result?.success ? 'DONE' : 'FAIL'}</span>
                {cp.autoExecuted && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(75,123,245,0.12)', color: '#4B7BF5' }}>AUTO</span>}
                <span style={{ flex: 1, color: '#6C7281' }}>{cp.trigger}</span>
                <span style={{ color: '#CDD0D7' }}>{cp.steps?.length} steps{cp.result?.duration ? ` · ${Math.round(cp.result.duration / 1000)}s` : ''}</span>
                <span style={{ color: '#CDD0D7' }}>{timeAgo(cp.completedAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Agent execution log */}
        {agentLog.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9CA0AB', marginBottom: 6 }}>Agent log</div>
            {agentLog.slice(0, 6).map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '0.5px solid #ECEEF2', fontSize: 10 }}>
                <span style={{ color: '#CDD0D7', minWidth: 55 }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: entry.status === 'success' ? 'rgba(13,148,136,0.12)' : entry.status === 'failed' ? 'rgba(220,38,38,0.12)' : 'rgba(75,123,245,0.12)', color: entry.status === 'success' ? '#0D9488' : entry.status === 'failed' ? '#DC2626' : '#4B7BF5' }}>{entry.status || 'log'}</span>
                {entry.autoExecuted && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(75,123,245,0.08)', color: '#4B7BF5' }}>auto</span>}
                <span style={{ flex: 1, color: '#6C7281' }}>{entry.trigger || entry.action_name || ''}</span>
                {entry.steps && <span style={{ color: '#CDD0D7' }}>{entry.steps} steps{entry.duration ? ` · ${Math.round(entry.duration / 1000)}s` : ''}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent action result toast */}
      {actionResult && (
        <div style={{ background: actionResult.ok ? 'rgba(13,148,136,0.1)' : 'rgba(220,38,38,0.1)', border: `0.5px solid ${actionResult.ok ? '#0D9488' : '#DC2626'}`, borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 12, color: actionResult.ok ? '#0D9488' : '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          {actionResult.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {actionResult.msg}
        </div>
      )}

      {/* Environment Status */}
      {environments.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9CA0AB', marginBottom: 6 }}>Environment Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {environments.map((e) => (
              <div key={e.name} style={{ background: '#FFFFFF', border: '0.5px solid #DFE1E6', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1E2028' }}>{e.name}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: envStatusColor(e.status) }} />
                </div>
                <div style={{ fontSize: 10, color: '#9CA0AB' }}>{e.version} · build #{e.build}</div>
                <div style={{ fontSize: 10, color: '#CDD0D7', marginTop: 2 }}>{timeAgo(e.deployed_at)} ago</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Pipeline Activity */}
      {recentBuilds.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '0.5px solid #DFE1E6', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '10px 14px', fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9CA0AB', borderBottom: '0.5px solid #ECEEF2' }}>
            Recent Pipeline Activity
          </div>
          {recentBuilds.map((b, i) => (
            <div key={b?.id || b?.run_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '0.5px solid #ECEEF2', fontSize: 11 }}>
              {statusIcon(b?.conclusion || b?.status)}
              <span style={{ color: '#1E2028', minWidth: 100 }}>{b?.repo || b?.name || 'Build'}</span>
              <Badge text={b?.branch || b?.head_branch || 'main'} color="#4B7BF5" />
              <span style={{ color: '#CDD0D7', marginLeft: 'auto', fontSize: 10 }}>
                {b?.environment && <span style={{ marginRight: 8 }}>{b.environment}</span>}
                {timeAgo(b?.startedAt || b?.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Tickets */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #DFE1E6', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9CA0AB', borderBottom: '0.5px solid #ECEEF2' }}>
          Recent Activity
        </div>
        {tickets.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: '#9CA0AB' }}>No recent tickets found</div>
        ) : (
          tickets.map((t) => <TicketRow key={t.key} issue={t} />)
        )}
      </div>
    </div>
  );
}
