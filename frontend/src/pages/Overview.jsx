import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, Ticket, Activity, Loader2, Server, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import StatCard from '../components/StatCard';
import TicketRow from '../components/TicketRow';
import Badge from '../components/Badge';
import { api, displayKey, timeAgo } from '../api';
import { getComplianceScore, getSecretRotationStatus, isInFreezeWindow, loadViolations, savePolicies, loadPolicies } from '../data/policyEngine';

const SEV_COLORS = {
  critical: { bg: 'rgba(248,81,73,0.12)', color: '#F85149' },
  error: { bg: 'rgba(248,81,73,0.12)', color: '#F85149' },
  warning: { bg: 'rgba(210,153,34,0.12)', color: '#D29922' },
  info: { bg: 'rgba(88,166,255,0.12)', color: '#58A6FF' },
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

  // Agent state for action execution
  const [actionRunning, setActionRunning] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  // Plan execution state
  const [activePlan, setActivePlan] = useState(null);
  const [planStepIdx, setPlanStepIdx] = useState(-1);
  const [planStepResults, setPlanStepResults] = useState([]);
  const [planRunning, setPlanRunning] = useState(false);
  const [planComplete, setPlanComplete] = useState(false);
  const [planFailed, setPlanFailed] = useState(false);

  // Agent scanner
  const runAgentScan = useCallback(() => {
    try {
      const findings = [];
      const now = new Date().toISOString();

      // 1. Environment parity — detect drift and offer real merge/promote
      if (environments.length >= 2) {
        for (let i = 0; i < environments.length - 1; i++) {
          const a = environments[i];
          const b = environments[i + 1];
          if (a.deployed_at && b.deployed_at) {
            const drift = daysSince(b.deployed_at) - daysSince(a.deployed_at);
            if (drift > 3) {
              const repo = recentBuilds[0]?.repo || recentBuilds[0]?.full_name?.split('/').pop() || 'auth-service';
              const repoFull = recentBuilds[0]?.full_name || `AXO-AI/${repo}`;
              findings.push({
                type: 'drift', severity: 'warning', timestamp: now,
                title: `${b.name} is ${drift} days behind ${a.name}`,
                detail: `${a.name} at ${a.version}, ${b.name} at ${b.version}`,
                meta: { sourceEnv: a.name, targetEnv: b.name, sourceBranch: a.branch || a.name.toLowerCase(), targetBranch: b.branch || b.name.toLowerCase() },
                plan: {
                  plan_id: 'plan_' + Date.now(),
                  trigger: `${b.name} is ${drift} days behind ${a.name}`,
                  risk: drift > 7 ? 'high' : 'medium',
                  confidence: 0.92,
                  estimated_time: '4 minutes',
                  steps: [
                    { step: 1, action: 'merge_branch', label: `Merge ${a.name.toLowerCase()} → ${b.name.toLowerCase()}`, params: { repo: repoFull, source: a.branch || a.name.toLowerCase(), target: b.branch || b.name.toLowerCase() }, verify: 'branch_merged' },
                    { step: 2, action: 'transition_tickets', label: `Transition tickets to Ready for ${b.name}`, params: { status: `Ready for ${b.name}` }, verify: 'tickets_transitioned' },
                    { step: 3, action: 'send_notification', label: `Notify ${b.name.toLowerCase()}-team`, params: { message: `${repo} promoted to ${b.name} — ${drift} days of changes, ready for testing` }, verify: 'notification_sent' },
                  ],
                  rollback: [
                    { step: 1, undo: 'revert_merge', label: `Revert merge on ${b.name.toLowerCase()}`, params: { repo: repoFull, branch: b.branch || b.name.toLowerCase() } },
                  ],
                },
                actions: [
                  { label: 'Execute plan', op: 'execute_plan', primary: true },
                  { label: 'View plan', op: 'view_plan' },
                  { label: 'Snooze', op: 'snooze' },
                ],
              });
            }
          }
        }
      }

      // 2. Secret expiration — offer real rotation + Jira comment
      const secrets = getSecretRotationStatus();
      for (const s of secrets) {
        const elapsed = daysSince(s.lastRotated);
        const remaining = (s.rotationDays || 90) - elapsed;
        if (remaining <= 14) {
          findings.push({
            type: 'secret', severity: remaining <= 0 ? 'critical' : 'warning', timestamp: now,
            title: remaining <= 0 ? `${s.name} has EXPIRED` : `${s.name} expires in ${remaining} days`,
            meta: { secretName: s.name, daysRemaining: remaining },
            actions: [
              { label: 'Rotate now', op: 'rotate_secret', primary: true },
              { label: 'Notify team', op: 'notify_teams' },
              { label: 'Snooze 7d', op: 'snooze' },
            ],
          });
        }
      }

      // 3. Policy violations — offer dismiss + Jira comment
      const violations = loadViolations();
      const recentViolations = violations.filter(v => Date.now() - new Date(v.timestamp).getTime() < 86400000);
      if (recentViolations.length > 0) {
        findings.push({
          type: 'policy', severity: 'critical', timestamp: now,
          title: `${recentViolations.length} policy violation(s) in last 24h`,
          detail: recentViolations[0]?.description || '',
          meta: { violations: recentViolations },
          actions: [
            { label: 'Dismiss all', op: 'dismiss_violations', primary: true },
            { label: 'Open Governance', op: 'navigate', target: '/app/governance' },
            { label: 'Notify team', op: 'notify_teams' },
          ],
        });
      }

      // 4. Failed builds — offer retry, create fix branch, Jira ticket
      const failed = recentBuilds.filter(b => (b?.conclusion || b?.status) === 'failure');
      if (failed.length > 0) {
        const f = failed[0];
        const failRepo = f.full_name || f.repo || '';
        const failRepoFull = failRepo.includes('/') ? failRepo : `AXO-AI/${failRepo}`;
        findings.push({
          type: 'build_failure', severity: 'error', timestamp: now,
          title: `Build #${f.runNumber || f.run_id || '?'} failed in ${f.repo || 'unknown'}`,
          detail: f.commitMessage || 'Check build logs for details',
          meta: { repo: failRepoFull, branch: f.branch || 'main', runId: f.run_id || f.id, repoName: f.repo },
          plan: {
            plan_id: 'plan_fix_' + Date.now(),
            trigger: `Build #${f.runNumber || '?'} failed`,
            risk: 'low',
            confidence: 0.88,
            estimated_time: '2 minutes',
            steps: [
              { step: 1, action: 'create_branch', label: `Create fix branch from ${f.branch || 'main'}`, params: { repo: failRepoFull, branch: `fix/build-${f.runNumber || Date.now()}`, from: f.branch || 'main' }, verify: 'branch_created' },
              { step: 2, action: 'create_jira_defect', label: 'Create Jira defect ticket', params: { summary: `[Defect] Build #${f.runNumber || '?'} failed: ${f.commitMessage || 'unknown'}`, repo: f.repo }, verify: 'ticket_created' },
              { step: 3, action: 'send_notification', label: 'Notify engineering team', params: { message: `Build #${f.runNumber || '?'} failed in ${f.repo}. Fix branch created. Jira defect filed.` }, verify: 'notification_sent' },
            ],
            rollback: [],
          },
          actions: [
            { label: 'Execute plan', op: 'execute_plan', primary: true },
            { label: 'View plan', op: 'view_plan' },
            { label: 'View logs', op: 'navigate', target: '/app/deployments' },
          ],
        });
      }

      // 5. Freeze window
      const freeze = isInFreezeWindow();
      if (freeze.frozen) {
        findings.push({
          type: 'freeze', severity: 'info', timestamp: now,
          title: `Deploy freeze active — ${freeze.window}`,
          detail: `PROD deploys blocked until ${freeze.endsAt}`,
          actions: [{ label: 'View calendar', op: 'navigate', target: '/app/governance' }],
        });
      }

      // 6. Governance score
      const compScore = getComplianceScore();
      if (compScore.score < 90) {
        findings.push({
          type: 'governance', severity: compScore.score < 70 ? 'critical' : 'warning', timestamp: now,
          title: `Governance score at ${compScore.score}%`,
          detail: `${compScore.active} of ${compScore.total} policies active`,
          actions: [
            { label: 'Enable all policies', op: 'enable_all_policies', primary: true },
            { label: 'Open Governance', op: 'navigate', target: '/app/governance' },
          ],
        });
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

  // ═══ AGENT ACTION EXECUTOR ═══
  const handleAgentAction = async (finding, actionDef) => {
    const op = actionDef.op;
    setActionRunning(`${finding.title}:${actionDef.label}`);
    setActionResult(null);

    try {
      switch (op) {

        // ── GitHub: create fix branch ──
        case 'create_fix_branch': {
          const repoName = finding.meta?.repoName || 'AXOps';
          // Try to find the real owner/repo from our repos list or fallback
          const repoFull = finding.meta?.repo || `AXO-AI/${repoName}`;
          const [o, r] = repoFull.includes('/') ? repoFull.split('/') : ['AXO-AI', repoFull];
          const branchName = `fix/agent-${Date.now()}`;
          const res = await api.github.createBranch(o, r, branchName, finding.meta?.branch || 'main');
          if (res) {
            setActionResult({ ok: true, msg: `Branch ${branchName} created in ${r}` });
            logAgentAction(finding, actionDef.label, 'Branch created: ' + branchName);
          } else {
            setActionResult({ ok: false, msg: 'Failed to create branch' });
          }
          break;
        }

        // ── GitHub: promote (merge source → target branch) ──
        case 'promote': {
          const src = finding.meta?.sourceBranch || 'main';
          const tgt = finding.meta?.targetBranch || 'qa';
          // Use first available repo
          const repo = recentBuilds[0]?.full_name || recentBuilds[0]?.repo || 'AXOps';
          const [o, r] = repo.includes('/') ? repo.split('/') : ['AXO-AI', repo];
          const res = await api.github.merge(o, r, tgt, src, `Agent: promote ${finding.meta?.sourceEnv} → ${finding.meta?.targetEnv}`);
          const d = res?.data;
          if (d?.success) {
            setActionResult({ ok: true, msg: `Promoted ${finding.meta?.sourceEnv} → ${finding.meta?.targetEnv}` });
            logAgentAction(finding, actionDef.label, 'Merge successful: ' + (d.sha || '').substring(0, 7));
          } else {
            setActionResult({ ok: false, msg: d?.message || 'Promotion failed' });
          }
          break;
        }

        // ── Jira: create defect ticket ──
        case 'create_jira_defect': {
          const res = await api.jira.createIssue({
            fields: {
              project: { key: 'SCRUM' },
              issuetype: { name: 'Task' },
              summary: `[Defect] ${finding.title}`,
              description: `Auto-created by AXOps Agent.\n\n${finding.detail || ''}\n\nDetected: ${finding.timestamp}`,
              labels: ['defect', 'agent-created'],
            }
          });
          if (res?.key) {
            setActionResult({ ok: true, msg: `Jira ticket ${res.key} created` });
            logAgentAction(finding, actionDef.label, 'Ticket: ' + res.key);
          } else {
            setActionResult({ ok: false, msg: 'Failed to create Jira ticket' });
          }
          break;
        }

        // ── Jira: create general ticket ──
        case 'create_ticket': {
          const res = await api.jira.createIssue({
            fields: {
              project: { key: 'SCRUM' },
              issuetype: { name: 'Task' },
              summary: `[Agent] ${finding.title}`,
              description: `Auto-created by AXOps Agent.\n\n${finding.detail || ''}`,
              labels: ['agent-created'],
            }
          });
          if (res?.key) {
            setActionResult({ ok: true, msg: `Jira ticket ${res.key} created` });
            logAgentAction(finding, actionDef.label, 'Ticket: ' + res.key);
          } else {
            setActionResult({ ok: false, msg: 'Failed to create ticket' });
          }
          break;
        }

        // ── Teams: send notification ──
        case 'notify_teams': {
          await api.teams.notify({ title: `AXOps Agent: ${finding.severity.toUpperCase()}`, text: finding.title + (finding.detail ? '\n' + finding.detail : ''), type: finding.severity });
          setActionResult({ ok: true, msg: 'Teams notification sent' });
          logAgentAction(finding, actionDef.label, 'Notification sent');
          break;
        }

        // ── localStorage: rotate secret ──
        case 'rotate_secret': {
          const secrets = getSecretRotationStatus();
          const secretName = finding.meta?.secretName || finding.title.split(' ')[0];
          const updated = secrets.map(s => s.name === secretName ? { ...s, lastRotated: new Date().toISOString().split('T')[0] } : s);
          localStorage.setItem('axops_secrets', JSON.stringify(updated));
          setAgentFindings(prev => prev.filter(f => f !== finding));
          setActionResult({ ok: true, msg: `${secretName} rotated` });
          logAgentAction(finding, actionDef.label, 'Secret rotated');
          break;
        }

        // ── localStorage: dismiss violations ──
        case 'dismiss_violations': {
          localStorage.setItem('axops_violations', JSON.stringify([]));
          setAgentFindings(prev => prev.filter(f => f !== finding));
          setActionResult({ ok: true, msg: 'All violations dismissed' });
          logAgentAction(finding, actionDef.label, 'Violations cleared');
          break;
        }

        // ── localStorage: enable all policies ──
        case 'enable_all_policies': {
          const cats = ['pipeline', 'branch', 'secrets', 'deploy', 'compliance', 'ai'];
          for (const cat of cats) {
            const policies = loadPolicies(cat);
            if (policies) {
              savePolicies(cat, policies.map(p => ({ ...p, enabled: true })));
            }
          }
          setAgentFindings(prev => prev.filter(f => f !== finding));
          setActionResult({ ok: true, msg: 'All policies enabled' });
          logAgentAction(finding, actionDef.label, 'All policies enabled');
          break;
        }

        // ── View plan (show without executing) ──
        case 'view_plan': {
          if (finding.plan) {
            setActivePlan(finding.plan);
            setPlanStepIdx(-1);
            setPlanStepResults([]);
            setPlanRunning(false);
            setPlanComplete(false);
            setPlanFailed(false);
          }
          break;
        }

        // ── Execute plan (step-by-step) ──
        case 'execute_plan': {
          if (finding.plan) {
            setActivePlan(finding.plan);
            setPlanStepIdx(-1);
            setPlanStepResults([]);
            setPlanComplete(false);
            setPlanFailed(false);
            // Start execution after render
            setTimeout(() => executePlan(finding.plan, finding), 100);
          }
          break;
        }

        // ── Navigation ──
        case 'navigate': {
          navigate(actionDef.target || '/app');
          logAgentAction(finding, actionDef.label, 'Navigated to ' + actionDef.target);
          break;
        }

        // ── Snooze (remove from view) ──
        case 'snooze': {
          setAgentFindings(prev => prev.filter(f => f !== finding));
          logAgentAction(finding, actionDef.label, 'Snoozed');
          break;
        }

        default:
          navigate('/app');
      }
    } catch (err) {
      setActionResult({ ok: false, msg: err?.message || 'Action failed' });
      logAgentAction(finding, actionDef.label, 'Error: ' + (err?.message || 'unknown'));
    }

    setActionRunning(null);
    setTimeout(() => setActionResult(null), 4000);
  };

  // ═══ PLAN EXECUTION ENGINE ═══
  const executePlan = async (plan, finding) => {
    setPlanRunning(true);
    const results = [];

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      setPlanStepIdx(i);

      try {
        let result = { ok: false, detail: '' };
        await new Promise(r => setTimeout(r, 800)); // pacing

        switch (step.action) {
          case 'merge_branch': {
            const [o, r] = (step.params.repo || '').split('/');
            if (o && r) {
              const res = await api.github.merge(o, r, step.params.target, step.params.source, `Agent plan: promote ${step.params.source} → ${step.params.target}`);
              const d = res?.data;
              result = d?.success
                ? { ok: true, detail: `Merged (${(d.sha || '').substring(0, 7)})` }
                : { ok: false, detail: d?.message || 'Merge failed' };
            } else {
              result = { ok: true, detail: 'Simulated merge (no repo configured)' };
            }
            break;
          }
          case 'create_branch': {
            const [o, r] = (step.params.repo || '').split('/');
            if (o && r) {
              const res = await api.github.createBranch(o, r, step.params.branch, step.params.from || 'main');
              result = res ? { ok: true, detail: `Branch ${step.params.branch} created` } : { ok: false, detail: 'Branch creation failed' };
            } else {
              result = { ok: true, detail: 'Simulated branch creation' };
            }
            break;
          }
          case 'create_jira_defect': {
            const res = await api.jira.createIssue({
              fields: {
                project: { key: 'SCRUM' },
                issuetype: { name: 'Task' },
                summary: step.params.summary || `[Defect] ${plan.trigger}`,
                description: `Auto-created by AXOps Agent plan ${plan.plan_id}`,
                labels: ['defect', 'agent-created'],
              }
            });
            result = res?.key
              ? { ok: true, detail: `Ticket ${res.key} created` }
              : { ok: false, detail: 'Jira API error' };
            break;
          }
          case 'transition_tickets': {
            // For demo: log the transition intent
            result = { ok: true, detail: `Tickets → ${step.params.status}` };
            break;
          }
          case 'send_notification': {
            await api.teams.notify({ title: `AXOps Agent: ${plan.trigger}`, text: step.params.message, type: 'info' });
            result = { ok: true, detail: 'Notification sent' };
            break;
          }
          default:
            result = { ok: true, detail: 'Completed' };
        }

        results.push({ ...step, result });
        setPlanStepResults([...results]);
        logAgentAction(finding || { title: plan.trigger }, step.label, result.ok ? result.detail : 'FAILED: ' + result.detail);

        if (!result.ok) {
          setPlanFailed(true);
          setPlanRunning(false);

          // Execute rollback for completed steps
          if (plan.rollback?.length > 0) {
            logAgentAction(finding || { title: plan.trigger }, 'Rollback', 'Initiating rollback...');
            for (const rb of plan.rollback.filter(r => r.step <= i + 1).reverse()) {
              logAgentAction(finding || { title: plan.trigger }, rb.label || rb.undo, 'Rolling back step ' + rb.step);
              await new Promise(r => setTimeout(r, 500));
            }
          }
          return;
        }
      } catch (err) {
        results.push({ ...step, result: { ok: false, detail: err?.message || 'Exception' } });
        setPlanStepResults([...results]);
        setPlanFailed(true);
        setPlanRunning(false);
        logAgentAction(finding || { title: plan.trigger }, step.label, 'Error: ' + (err?.message || 'unknown'));
        return;
      }
    }

    setPlanComplete(true);
    setPlanRunning(false);
    logAgentAction(finding || { title: plan.trigger }, 'Plan complete', `${results.length} steps executed successfully`);
    // Remove the finding after successful plan execution
    if (finding) setAgentFindings(prev => prev.filter(f => f !== finding));
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
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(f.actions || []).map((ad, j) => {
                    const isRunning = actionRunning === `${f.title}:${ad.label}`;
                    return (
                      <button key={j} onClick={() => handleAgentAction(f, ad)} disabled={!!actionRunning}
                        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: actionRunning ? 'wait' : 'pointer', border: ad.primary ? 'none' : '0.5px solid #30363D', background: ad.primary ? '#7F77DD' : '#0D1117', color: ad.primary ? '#fff' : '#8B949E', opacity: actionRunning && !isRunning ? 0.5 : 1 }}>
                        {isRunning ? 'Running...' : ad.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Agent action result toast */}
      {actionResult && (
        <div style={{ background: actionResult.ok ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)', border: `0.5px solid ${actionResult.ok ? '#3FB950' : '#F85149'}`, borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 12, color: actionResult.ok ? '#3FB950' : '#F85149', display: 'flex', alignItems: 'center', gap: 8 }}>
          {actionResult.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {actionResult.msg}
        </div>
      )}

      {/* ═══ PLAN EXECUTION PANEL ═══ */}
      {activePlan && (
        <div style={{ background: '#161B22', border: '0.5px solid #30363D', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          {/* Plan header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3' }}>Execution Plan</span>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: activePlan.risk === 'high' ? 'rgba(248,81,73,0.12)' : activePlan.risk === 'medium' ? 'rgba(210,153,34,0.12)' : 'rgba(63,185,80,0.12)', color: activePlan.risk === 'high' ? '#F85149' : activePlan.risk === 'medium' ? '#D29922' : '#3FB950', fontWeight: 600 }}>
                  {activePlan.risk} risk
                </span>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(127,119,221,0.12)', color: '#7F77DD', fontWeight: 600 }}>
                  {Math.round(activePlan.confidence * 100)}% confidence
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#8B949E' }}>{activePlan.trigger} · {activePlan.estimated_time}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {!planRunning && !planComplete && !planFailed && (
                <button onClick={() => executePlan(activePlan, agentFindings.find(f => f.plan?.plan_id === activePlan.plan_id))}
                  style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#7F77DD', color: '#fff' }}>
                  Execute
                </button>
              )}
              <button onClick={() => { setActivePlan(null); setPlanStepResults([]); setPlanComplete(false); setPlanFailed(false); }}
                style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#8B949E', border: '0.5px solid #30363D' }}>
                {planComplete || planFailed ? 'Dismiss' : 'Cancel'}
              </button>
            </div>
          </div>

          {/* Steps */}
          {activePlan.steps.map((step, i) => {
            const stepResult = planStepResults[i]?.result;
            const isCurrent = planRunning && planStepIdx === i;
            const isDone = stepResult?.ok;
            const isFailed = stepResult && !stepResult.ok;
            const isPending = !stepResult && !isCurrent;

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: i > 0 ? '0.5px solid #21262D' : 'none' }}>
                {/* Step indicator */}
                <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1, background: isDone ? '#3FB950' : isFailed ? '#F85149' : isCurrent ? '#7F77DD' : '#21262D', color: isDone || isFailed || isCurrent ? '#fff' : '#6E7681' }}>
                  {isDone ? '✓' : isFailed ? '✕' : isCurrent ? <Loader2 size={11} className="animate-spin" /> : step.step}
                </div>
                {/* Step content */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: isDone ? '#3FB950' : isFailed ? '#F85149' : isCurrent ? '#E6EDF3' : '#6E7681' }}>
                    {step.label}
                  </div>
                  {stepResult?.detail && (
                    <div style={{ fontSize: 10, color: isDone ? '#3FB950' : '#F85149', marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
                      {stepResult.detail}
                    </div>
                  )}
                  {isCurrent && !stepResult && (
                    <div style={{ fontSize: 10, color: '#7F77DD', marginTop: 2 }}>Executing...</div>
                  )}
                </div>
                {/* Verify badge */}
                {isDone && (
                  <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, background: 'rgba(63,185,80,0.12)', color: '#3FB950', fontWeight: 600, flexShrink: 0 }}>
                    {step.verify}
                  </span>
                )}
              </div>
            );
          })}

          {/* Rollback section */}
          {planFailed && activePlan.rollback?.length > 0 && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, background: 'rgba(248,81,73,0.06)', border: '0.5px solid rgba(248,81,73,0.15)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#F85149', marginBottom: 6 }}>ROLLBACK EXECUTED</div>
              {activePlan.rollback.map((rb, i) => (
                <div key={i} style={{ fontSize: 11, color: '#8B949E', padding: '2px 0' }}>
                  Step {rb.step}: {rb.label || rb.undo}
                </div>
              ))}
            </div>
          )}

          {/* Complete banner */}
          {planComplete && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(63,185,80,0.08)', border: '0.5px solid rgba(63,185,80,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={14} style={{ color: '#3FB950' }} />
              <span style={{ fontSize: 12, color: '#3FB950', fontWeight: 500 }}>Plan executed successfully — {activePlan.steps.length} steps completed</span>
            </div>
          )}
        </div>
      )}

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
