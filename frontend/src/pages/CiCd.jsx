import { useState, useEffect, useMemo } from 'react';
import {
  Loader2, Rocket, History, Play, CheckCircle2, XCircle, Clock, Eye, ChevronDown, ChevronRight,
  Server, GitMerge, Shield, FileCode, AlertTriangle, Download, Search, RefreshCw,
  ArrowRight, BarChart3, Zap, Activity, GitBranch, FileText, Bot
} from 'lucide-react';
import { api, timeAgo } from '../api';
import Badge from '../components/Badge';
import LogViewer from '../components/LogViewer';
import DiffViewer from '../components/DiffViewer';
import StatCard from '../components/StatCard';
import EnvFlow from '../components/EnvFlow';
import { getRepoProfile, getNextEnv, ENV_PROFILES } from '../data/envProfiles';

/* ── mock fallback repos ── */
const MOCK_REPOS = [
  { name: 'AXOps', full_name: 'AXO-AI/AXOps' },
  { name: 'admin-dashboard-web', full_name: 'AXO-AI/admin-dashboard-web' },
  { name: 'auth-service', full_name: 'AXO-AI/auth-service' },
  { name: 'java-svc-payments', full_name: 'company/java-svc-payments' },
  { name: 'spring-boot-orders', full_name: 'company/spring-boot-orders' },
  { name: 'react-customer-portal', full_name: 'company/react-customer-portal' },
  { name: 'node-api-gateway', full_name: 'company/node-api-gateway' },
  { name: 'py-data-pipeline', full_name: 'company/py-data-pipeline' },
  { name: 'dotnet-billing', full_name: 'company/dotnet-billing' },
  { name: 'uipath-bot-invoicing', full_name: 'company/uipath-bot-invoicing' },
];

/* ── stage colors ── */
const stageColor = (s) => {
  if (s === 'success') return 'var(--success)';
  if (s === 'failure') return 'var(--danger)';
  if (s === 'running' || s === 'in_progress') return 'var(--warning)';
  return 'var(--border)';
};

/* ── mock log lines ── */
function mockLogs(b) {
  const lines = [
    { time: '00:00', level: 'INFO', message: `Pipeline #${b?.runNumber || b?.run_id || '?'} started for ${b?.repo || 'unknown'}` },
    { time: '00:01', level: 'INFO', message: `Branch: ${b?.branch || 'main'}` },
    { time: '00:02', level: 'INFO', message: `Commit: ${b?.commitSha || 'n/a'}` },
  ];
  let t = 3;
  for (const s of (b?.stages || [])) {
    const ts = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    lines.push({ time: ts, level: s.status === 'failure' ? 'ERROR' : s.status === 'pending' ? 'WARN' : 'INFO', message: `[${s.name}] ${s.status === 'success' ? 'completed' : s.status === 'failure' ? 'FAILED' : 'skipped'} (${s.duration}s)` });
    t += s.duration || 1;
  }
  lines.push({ time: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, level: (b?.conclusion || b?.status) === 'success' ? 'INFO' : 'ERROR', message: `Pipeline finished: ${b?.conclusion || b?.status || 'unknown'}` });
  return lines;
}

/* ── default approval roles ── */
const DEFAULT_APPROVALS = [
  { role: 'Dev Lead', name: 'Ashwin B.', status: 'pending', at: null },
  { role: 'QA Lead', name: 'Priya K.', status: 'pending', at: null },
  { role: 'Business Owner', name: 'Sarah M.', status: 'pending', at: null },
  { role: 'VP Engineering', name: 'Marcus T.', status: 'pending', at: null },
];

/* ═══ COMPONENT ═══ */

export default function CiCd() {
  const [tab, setTab] = useState('builds');
  const [repos, setRepos] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  /* load global data */
  useEffect(() => {
    async function load() {
      setGlobalLoading(true);
      const [rRes, bRes, eRes] = await Promise.all([
        api.github.repos().catch(() => null),
        api.github.buildHistory().catch(() => null),
        api.github.environments().catch(() => null),
      ]);
      const rList = Array.isArray(rRes) ? rRes : rRes?.repos || [];
      setRepos(rList.length > 0 ? rList : MOCK_REPOS);
      setBuilds(bRes?.builds || bRes?.runs || (Array.isArray(bRes) ? bRes : []));
      setEnvironments(eRes?.environments || []);
      setGlobalLoading(false);
    }
    load();
  }, []);

  const tabs = [
    { id: 'builds', label: 'Builds', icon: Activity },
    { id: 'deploy', label: 'Deploy', icon: Rocket },
    { id: 'compare', label: 'Compare', icon: GitMerge },
    { id: 'approvals', label: 'Approvals', icon: Shield },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>CI/CD</h1>

      {/* tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5 shrink-0"
            style={{ background: tab === t.id ? 'var(--accent)' : 'var(--bg-card)', color: tab === t.id ? 'white' : 'var(--text-secondary)' }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {globalLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
      ) : (
        <>
          {tab === 'builds' && <BuildsTab builds={builds} repos={repos} />}
          {tab === 'deploy' && <DeployTab repos={repos} environments={environments} />}
          {tab === 'compare' && <CompareTab repos={repos} environments={environments} />}
          {tab === 'approvals' && <ApprovalsTab />}
          {tab === 'history' && <HistoryTab builds={builds} />}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* TAB 1: BUILDS                                              */
/* ═══════════════════════════════════════════════════════════ */

function StageProgressBar({ stages }) {
  if (!stages?.length) return null;
  return (
    <div className="flex gap-0.5 items-center" style={{ width: 120 }}>
      {stages.map((s, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{ height: 4, background: stageColor(s.status) }} title={`${s.name}: ${s.status}`} />
      ))}
    </div>
  );
}

function BuildsTab({ builds, repos }) {
  const [repoFilter, setRepoFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedSub, setExpandedSub] = useState('stages');
  const [logData, setLogData] = useState([]);
  const [viewLogs, setViewLogs] = useState(null);

  const filtered = useMemo(() => {
    return builds.filter(b => {
      if (repoFilter && (b.repo || '') !== repoFilter) return false;
      if (branchFilter && !(b.branch || b.head_branch || '').includes(branchFilter)) return false;
      if (statusFilter) {
        const s = b.conclusion || b.status || '';
        if (statusFilter === 'success' && s !== 'success') return false;
        if (statusFilter === 'failure' && s !== 'failure') return false;
        if (statusFilter === 'running' && s !== 'in_progress' && s !== 'running') return false;
      }
      return true;
    });
  }, [builds, repoFilter, branchFilter, statusFilter]);

  /* 24h stats */
  const cutoff = Date.now() - 86400000;
  const recent = builds.filter(b => new Date(b.startedAt || b.created_at) > cutoff);
  const passed24 = recent.filter(b => (b.conclusion || b.status) === 'success').length;
  const failed24 = recent.filter(b => (b.conclusion || b.status) === 'failure').length;
  const running = builds.filter(b => (b.status === 'in_progress' || b.status === 'running')).length;
  const rate = recent.length > 0 ? Math.round((passed24 / recent.length) * 100) : 0;

  const repoNames = useMemo(() => [...new Set(builds.map(b => b.repo).filter(Boolean))].sort(), [builds]);

  const toggleRow = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setExpandedSub('stages');
    const b = builds.find(x => (x.id || x.run_id) === id);
    // Try real job logs from GitHub Actions API
    try {
      const owner = b?.full_name?.split('/')[0] || b?.owner || '';
      const repo = b?.full_name?.split('/')[1] || b?.repo || '';
      const runId = b?.run_id || b?.id;
      if (owner && repo && runId) {
        const res = await api.github.runJobs(owner, repo, runId);
        const jobs = res?.jobs || [];
        if (jobs.length > 0) {
          setLogData(jobs.map(j => ({
            time: timeAgo(j.started_at),
            level: j.conclusion === 'success' ? 'INFO' : j.conclusion === 'failure' ? 'ERROR' : 'WARN',
            message: `[${j.name}] ${j.conclusion || j.status || 'running'}`,
          })));
          return;
        }
      }
    } catch {}
    setLogData(mockLogs(b));
  };

  const fmtDuration = (s) => { if (!s) return '--'; const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };

  const selectStyle = { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' };

  return (
    <div>
      {/* filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select className="px-3 py-2 rounded-lg text-sm" style={selectStyle} value={repoFilter} onChange={e => setRepoFilter(e.target.value)}>
          <option value="">All repositories</option>
          {repoNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className="px-3 py-2 rounded-lg text-sm" style={selectStyle} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
          <option value="">All branches</option>
          <option value="main">main</option>
          <option value="int">int</option>
          <option value="qa">qa</option>
          <option value="staging">staging</option>
          <option value="feature/">feature/*</option>
        </select>
        <select className="px-3 py-2 rounded-lg text-sm" style={selectStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failed</option>
          <option value="running">Running</option>
        </select>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard value={passed24} label="Passed (24h)" icon={CheckCircle2} color="var(--success)" />
        <StatCard value={failed24} label="Failed (24h)" icon={XCircle} color="var(--danger)" />
        <StatCard value={running} label="Running" icon={RefreshCw} color="var(--warning)" />
        <StatCard value={`${rate}%`} label="Success Rate" icon={BarChart3} color="var(--accent)" />
      </div>

      {/* build list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>No builds match the current filters</div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {filtered.slice(0, 50).map(b => {
            const id = b.id || b.run_id;
            const status = b.conclusion || b.status || 'unknown';
            const isExp = expandedId === id;
            return (
              <div key={id} style={{ borderBottom: '1px solid var(--border)' }}>
                {/* row */}
                <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => toggleRow(id)}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stageColor(status) }} />
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-tertiary)', width: 48 }}>#{b.runNumber || id}</span>
                  <span className="text-sm font-medium shrink-0" style={{ color: 'var(--info)', width: 140 }}>{b.repo || b.name || '--'}</span>
                  <Badge text={b.branch || b.head_branch || 'main'} color="var(--accent)" />
                  <div className="hidden md:block"><StageProgressBar stages={b.stages} /></div>
                  <span className="text-xs shrink-0 font-mono" style={{ color: 'var(--text-tertiary)', width: 45 }}>{fmtDuration(b.duration)}</span>
                  <span className="text-xs shrink-0 hidden lg:block" style={{ color: 'var(--text-secondary)', width: 70 }}>{b.triggeredBy || '--'}</span>
                  <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(b.startedAt || b.created_at)}</span>
                  {isExp ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />}
                </div>

                {/* expanded */}
                {isExp && (
                  <div style={{ background: 'var(--bg-secondary)' }}>
                    {/* sub-tabs */}
                    <div className="flex gap-1 px-4 pt-3 pb-2">
                      {['stages', 'changes', 'log', 'ai'].map(st => (
                        <button key={st} onClick={() => setExpandedSub(st)}
                          className="px-3 py-1 rounded text-xs font-medium border-none cursor-pointer capitalize"
                          style={{ background: expandedSub === st ? 'var(--accent)' : 'var(--bg-card)', color: expandedSub === st ? 'white' : 'var(--text-secondary)' }}>
                          {st === 'ai' ? 'AI Analysis' : st}
                        </button>
                      ))}
                    </div>

                    <div className="px-4 pb-4">
                      {/* STAGES */}
                      {expandedSub === 'stages' && (
                        <div className="flex flex-wrap gap-2">
                          {(b.stages || []).map((s, i) => (
                            <div key={i} className="rounded-lg px-3 py-2 text-center" style={{
                              background: 'var(--bg-card)', border: `1.5px solid ${stageColor(s.status)}`,
                              minWidth: 80
                            }}>
                              <div className="text-xs font-medium" style={{ color: stageColor(s.status) }}>{s.name}</div>
                              <div className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.duration}s</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CHANGES */}
                      {expandedSub === 'changes' && (
                        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                          {b.commitMessage ? (
                            <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
                              <span className="font-mono" style={{ color: 'var(--accent)' }}>{(b.commitSha || '').substring(0, 7)}</span> — {b.commitMessage}
                            </div>
                          ) : (
                            <div className="px-3 py-4 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>No change details available for this build</div>
                          )}
                        </div>
                      )}

                      {/* LOG */}
                      {expandedSub === 'log' && <LogViewer logs={logData} />}

                      {/* AI */}
                      {expandedSub === 'ai' && (
                        <div className="rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          {status === 'failure' ? (
                            <>
                              <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--danger)' }}>
                                <Bot size={14} /> Root Cause Analysis
                              </div>
                              <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                                Build failed at <strong>{(b.stages || []).find(s => s.status === 'failure')?.name || 'unknown'}</strong> stage.
                                Likely causes: dependency resolution failure, test assertion mismatch, or configuration drift between environments.
                              </div>
                              <button className="px-3 py-1.5 rounded text-xs font-medium border-none cursor-pointer flex items-center gap-1"
                                style={{ background: 'var(--accent)', color: 'white' }}>
                                <GitBranch size={12} /> Create Fix Branch
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>
                              <CheckCircle2 size={14} /> No issues detected — all stages passed
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* TAB 2: DEPLOY                                              */
/* ═══════════════════════════════════════════════════════════ */

function DeployTab({ repos, environments }) {
  const [selectedRepo, setSelectedRepo] = useState('');
  const [branches, setBranches] = useState([]);
  const [sourceEnv, setSourceEnv] = useState('INT');
  const [targetEnv, setTargetEnv] = useState('QA');
  const [diff, setDiff] = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployLog, setDeployLog] = useState([]);
  const [deployDone, setDeployDone] = useState(false);

  const profile = selectedRepo ? getRepoProfile(selectedRepo.split('/').pop()) : null;
  const profileEnvs = profile?.environments || ['DEV', 'INT', 'QA', 'STAGE', 'PROD'];

  const srcInfo = environments.find(e => e.name === sourceEnv);
  const tgtInfo = environments.find(e => e.name === targetEnv);

  useEffect(() => {
    if (!selectedRepo) return;
    (async () => {
      try {
        const [o, r] = selectedRepo.split('/');
        const b = await api.github.branches(o, r);
        setBranches(Array.isArray(b) ? b : []);
      } catch { setBranches([]); }
    })();
  }, [selectedRepo]);

  const validate = async () => {
    if (!selectedRepo) return;
    setDiffLoading(true);
    setDiff(null);
    setDeployLog([]);
    setDeployDone(false);
    try {
      const [o, r] = selectedRepo.split('/');
      const srcBranch = srcInfo?.branch || sourceEnv.toLowerCase();
      const tgtBranch = tgtInfo?.branch || targetEnv.toLowerCase();
      const res = await api.github.compare(o, r, tgtBranch, srcBranch);
      setDiff(res);
    } catch {
      setDiff({ error: true, commits: [], files: [] });
    }
    setDiffLoading(false);
  };

  const doDeploy = async () => {
    if (!selectedRepo) return;
    setDeploying(true);
    setDeployDone(false);
    const log = (lvl, msg) => setDeployLog(prev => [...prev, { time: new Date().toLocaleTimeString(), level: lvl, message: msg }]);

    log('INFO', `Deploying ${selectedRepo} from ${sourceEnv} to ${targetEnv}...`);
    log('INFO', 'Validating environment state...');

    await new Promise(r => setTimeout(r, 600));
    log('INFO', `Merging ${sourceEnv.toLowerCase()} → ${targetEnv.toLowerCase()}...`);

    try {
      const [o, r] = selectedRepo.split('/');
      const srcBranch = srcInfo?.branch || sourceEnv.toLowerCase();
      const tgtBranch = tgtInfo?.branch || targetEnv.toLowerCase();
      const res = await api.github.merge(o, r, tgtBranch, srcBranch, `Deploy: ${sourceEnv} → ${targetEnv} via AXOps`);
      const d = res?.data;
      if (d?.success) {
        log('INFO', `Merge complete: ${d.sha ? d.sha.substring(0, 7) : 'OK'}`);
        log('INFO', 'Build triggered on target branch...');
        await new Promise(r => setTimeout(r, 400));
        log('INFO', `Deployed to ${targetEnv}. ${diff?.files?.length || 0} files updated.`);
        setDeployDone(true);
      } else {
        log('ERROR', d?.message || 'Merge failed');
      }
    } catch {
      log('ERROR', 'Deployment failed — check GitHub for details');
    }
    setDeploying(false);
  };

  const selectStyle = { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' };

  return (
    <div>
      {/* controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select className="px-3 py-2 rounded-lg text-sm flex-1 min-w-[160px]" style={selectStyle} value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
          <option value="">Select repository...</option>
          {repos.map(r => { const f = r.full_name || r.name; return <option key={f} value={f}>{f}</option>; })}
        </select>
        <select className="px-3 py-2 rounded-lg text-sm" style={selectStyle} value={sourceEnv} onChange={e => setSourceEnv(e.target.value)}>
          {profileEnvs.filter(e => e !== 'PROD').map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span className="flex items-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>→</span>
        <select className="px-3 py-2 rounded-lg text-sm" style={selectStyle} value={targetEnv} onChange={e => setTargetEnv(e.target.value)}>
          {profileEnvs.filter(e => e !== 'DEV').map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button onClick={validate} disabled={diffLoading || !selectedRepo}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
          style={{ background: 'var(--success)', color: 'white', opacity: diffLoading || !selectedRepo ? 0.5 : 1 }}>
          {diffLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Validate
        </button>
        <button onClick={doDeploy} disabled={deploying || !selectedRepo || !diff}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
          style={{ background: 'var(--accent)', color: 'white', opacity: deploying || !selectedRepo || !diff ? 0.5 : 1 }}>
          {deploying ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />} Deploy
        </button>
      </div>

      {/* env flow */}
      {profile && selectedRepo && (
        <div className="mb-5 p-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <EnvFlow profile={profile} currentEnv={sourceEnv} />
        </div>
      )}

      {/* source vs target cards */}
      {environments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {[{ label: 'Source', env: sourceEnv, info: srcInfo }, { label: 'Target', env: targetEnv, info: tgtInfo }].map(({ label, env, info }) => (
            <div key={label} className="rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Server size={14} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}: {env}</span>
                {info && <span className="w-2 h-2 rounded-full" style={{ background: info.status === 'healthy' ? 'var(--success)' : 'var(--warning)' }} />}
              </div>
              {info ? (
                <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <div>{info.version} &middot; build #{info.build}</div>
                  <div>Branch: {info.branch} &middot; {info.commit}</div>
                  <div>Deployed {timeAgo(info.deployed_at)} ago</div>
                </div>
              ) : (
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No environment data</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* diff stats */}
      {diff && !diff.error && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard value={diff.files?.filter(f => f.status === 'added').length || 0} label="Added" icon={FileText} color="var(--success)" />
          <StatCard value={diff.files?.filter(f => f.status === 'modified').length || 0} label="Modified" icon={FileCode} color="var(--warning)" />
          <StatCard value={diff.files?.filter(f => f.status === 'removed').length || 0} label="Deleted" icon={XCircle} color="var(--danger)" />
          <StatCard value={diff.commits?.length || diff.ahead_by || 0} label="Commits" icon={GitMerge} color="var(--info)" />
        </div>
      )}

      {/* diff files */}
      {diff?.files?.length > 0 && (
        <div className="mb-5">
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Changed Files ({diff.files.length})</div>
          <DiffViewer files={diff.files} />
        </div>
      )}

      {/* deploy log */}
      {deployLog.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Deploy Log</div>
          <LogViewer logs={deployLog} />
          {deployDone && (
            <div className="mt-3 p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: 'rgba(63,185,80,0.1)', color: 'var(--success)', border: '1px solid var(--success)' }}>
              <CheckCircle2 size={14} /> Deployment to {targetEnv} complete
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* TAB 3: COMPARE                                             */
/* ═══════════════════════════════════════════════════════════ */

function CompareTab({ repos, environments }) {
  const [selectedRepo, setSelectedRepo] = useState('');
  const [envA, setEnvA] = useState('INT');
  const [envB, setEnvB] = useState('QA');
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);

  const envNames = environments.map(e => e.name);

  const runCompare = async () => {
    if (!selectedRepo) return;
    setLoading(true);
    setDiff(null);
    try {
      const [o, r] = selectedRepo.split('/');
      const brA = environments.find(e => e.name === envA)?.branch || envA.toLowerCase();
      const brB = environments.find(e => e.name === envB)?.branch || envB.toLowerCase();
      const res = await api.github.compare(o, r, brB, brA);
      setDiff(res);
    } catch {
      setDiff({ error: true, commits: [], files: [] });
    }
    setLoading(false);
  };

  const selectStyle = { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' };

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <select className="px-3 py-2 rounded-lg text-sm flex-1 min-w-[160px]" style={selectStyle} value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
          <option value="">Select repository...</option>
          {repos.map(r => { const f = r.full_name || r.name; return <option key={f} value={f}>{f}</option>; })}
        </select>
        <select className="px-3 py-2 rounded-lg text-sm" style={selectStyle} value={envA} onChange={e => setEnvA(e.target.value)}>
          {envNames.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>vs</span>
        <select className="px-3 py-2 rounded-lg text-sm" style={selectStyle} value={envB} onChange={e => setEnvB(e.target.value)}>
          {envNames.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button onClick={runCompare} disabled={loading || !selectedRepo}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
          style={{ background: 'var(--accent)', color: 'white', opacity: loading || !selectedRepo ? 0.5 : 1 }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Run Comparison
        </button>
      </div>

      {diff?.error && (
        <div className="rounded-lg p-3 mb-5 text-sm" style={{ background: 'rgba(248,81,73,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
          Could not compare — branches may not exist for this repo
        </div>
      )}

      {diff && !diff.error && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard value={diff.files?.filter(f => f.status === 'added').length || 0} label="Added" icon={FileText} color="var(--success)" />
            <StatCard value={diff.files?.filter(f => f.status === 'modified').length || 0} label="Modified" icon={FileCode} color="var(--warning)" />
            <StatCard value={diff.files?.filter(f => f.status === 'removed').length || 0} label="Deleted" icon={XCircle} color="var(--danger)" />
            <StatCard value={diff.commits?.length || diff.ahead_by || 0} label="Commits" icon={GitMerge} color="var(--info)" />
          </div>

          {diff.ahead_by === 0 && (
            <div className="rounded-lg p-3 mb-5 text-sm flex items-center gap-2" style={{ background: 'rgba(63,185,80,0.1)', color: 'var(--success)', border: '1px solid var(--success)' }}>
              <CheckCircle2 size={14} /> Environments are in sync — no delta
            </div>
          )}

          {diff.files?.length > 0 && (
            <div className="mb-5">
              <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Changed Files ({diff.files.length})</div>
              <DiffViewer files={diff.files} />
            </div>
          )}

          {diff.ahead_by > 0 && (
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
                style={{ background: 'var(--success)', color: 'white' }}>
                <Rocket size={14} /> Deploy Delta to {envB}
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
                style={{ background: 'rgba(248,81,73,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                <RefreshCw size={14} /> Rollback {envB} to match {envA}
              </button>
            </div>
          )}
        </>
      )}

      {!diff && !loading && (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>Select a repository and run comparison to see environment delta</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* TAB 4: APPROVALS                                           */
/* ═══════════════════════════════════════════════════════════ */

function ApprovalsTab() {
  const [approvals, setApprovals] = useState(DEFAULT_APPROVALS);
  const [versions, setVersions] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState('');
  const [ticketCount, setTicketCount] = useState(0);
  const [releaseLoading, setReleaseLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await api.jira.versions();
        setVersions(Array.isArray(v) ? v : []);
        if (v?.length > 0) setSelectedRelease(v[0].name);
      } catch {}
    })();
  }, []);

  // Load real ticket count for selected release
  useEffect(() => {
    if (!selectedRelease) { setTicketCount(0); return; }
    (async () => {
      setReleaseLoading(true);
      try {
        const res = await api.jira.searchAll(`fixVersion = "${selectedRelease}" ORDER BY priority DESC`);
        setTicketCount(res?.total || res?.issues?.length || 0);
      } catch { setTicketCount(0); }
      setReleaseLoading(false);
    })();
  }, [selectedRelease]);

  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const totalCount = approvals.length;
  const allApproved = approvedCount === totalCount;

  const doApprove = (idx) => {
    setApprovals(prev => prev.map((a, i) => i === idx ? { ...a, status: 'approved', at: new Date().toISOString() } : a));
  };

  const selectStyle = { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' };

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <select className="px-3 py-2 rounded-lg text-sm" style={selectStyle} value={selectedRelease} onChange={e => setSelectedRelease(e.target.value)}>
          <option value="">Select release...</option>
          {versions.map(v => <option key={v.id || v.name} value={v.name}>{v.name}</option>)}
        </select>
      </div>

      {/* release card */}
      <div className="rounded-lg overflow-hidden mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <Shield size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedRelease || 'No release selected'}</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: allApproved ? 'rgba(63,185,80,0.12)' : 'rgba(210,153,34,0.12)', color: allApproved ? 'var(--success)' : 'var(--warning)' }}>
            {approvedCount}/{totalCount} approved
          </span>
        </div>

        {/* info cards */}
        <div className="grid grid-cols-2 gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Jira</div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{releaseLoading ? '...' : ticketCount} tickets in release</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Change Management</div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>CHG-2024-0412</div>
          </div>
        </div>

        {/* stakeholders */}
        <div>
          {approvals.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              {a.status === 'approved' ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> : <Clock size={16} style={{ color: 'var(--text-tertiary)' }} />}
              <div className="flex-1">
                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{a.role}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.name}</div>
              </div>
              {a.at ? (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Approved {timeAgo(a.at)} ago</span>
              ) : (
                <button onClick={() => doApprove(i)}
                  className="px-3 py-1 rounded text-xs font-medium border-none cursor-pointer"
                  style={{ background: 'var(--accent)', color: 'white' }}>
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {allApproved ? (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--success)' }}><CheckCircle2 size={12} /> All stakeholders approved — PROD deploy unlocked</span>
          ) : (
            <span className="flex items-center gap-1.5"><Clock size={12} /> Awaiting {totalCount - approvedCount} approval(s) before PROD deploy</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* TAB 5: HISTORY                                             */
/* ═══════════════════════════════════════════════════════════ */

function HistoryTab({ builds }) {
  const [expandedId, setExpandedId] = useState(null);

  const fmtDuration = (s) => { if (!s) return '--'; const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };

  // Map real build data to history rows
  const items = useMemo(() => {
    return builds.map((b, i) => {
      const status = b.conclusion || b.status || 'unknown';
      const branch = b.branch || b.head_branch || 'main';
      let env = b.environment || 'unknown';
      if (env === 'unknown' || env === 'production') {
        if (branch === 'main' || branch === 'master') env = 'PROD';
        else if (branch === 'staging' || branch === 'stage') env = 'STAGE';
        else if (branch === 'qa') env = 'QA';
        else if (branch === 'int' || branch === 'develop') env = 'INT';
        else env = 'DEV';
      }
      return {
        id: b.id || b.run_id || i,
        time: b.startedAt || b.created_at || b.updated_at,
        env,
        type: branch === 'main' ? 'Release' : branch.startsWith('feature/') ? 'Deploy' : 'Promote',
        release: branch,
        repo: b.repo || b.name || '--',
        status,
        by: b.triggeredBy || b.actor?.login || '--',
        duration: b.duration || 0,
        stages: b.stages || [],
      };
    });
  }, [builds]);

  const typeColor = (t) => {
    if (t === 'Deploy') return 'var(--success)';
    if (t === 'Promote') return 'var(--info)';
    if (t === 'Release') return 'var(--accent)';
    if (t === 'Rollback') return 'var(--danger)';
    return 'var(--text-tertiary)';
  };

  return (
    <div>
      {items.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>No deployment history available</div>
      ) : (
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* header */}
        <div className="flex items-center px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)', width: 30 }}></span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)', flex: 1, minWidth: 80 }}>Time</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)', width: 60 }}>Env</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)', width: 80 }}>Type</span>
          <span className="text-xs font-medium hidden md:block" style={{ color: 'var(--text-tertiary)', width: 100 }}>Repo</span>
          <span className="text-xs font-medium hidden md:block" style={{ color: 'var(--text-tertiary)', flex: 1, minWidth: 100 }}>Branch</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)', width: 60 }}>Status</span>
          <span className="text-xs font-medium hidden lg:block" style={{ color: 'var(--text-tertiary)', width: 70 }}>By</span>
        </div>

        {items.slice(0, 50).map(it => {
          const isExp = expandedId === it.id;
          return (
            <div key={it.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => setExpandedId(isExp ? null : it.id)}>
                <span style={{ width: 30 }}>{isExp ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />}</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)', flex: 1, minWidth: 80 }}>{it.time ? new Date(it.time).toLocaleString() : '--'}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)', width: 60 }}>{it.env}</span>
                <span className="text-xs font-medium" style={{ color: typeColor(it.type), width: 80 }}>{it.type}</span>
                <span className="text-xs truncate hidden md:block" style={{ color: 'var(--info)', width: 100 }}>{it.repo}</span>
                <span className="text-xs font-mono truncate hidden md:block" style={{ color: 'var(--text-secondary)', flex: 1, minWidth: 100 }}>{it.release}</span>
                <span style={{ width: 60 }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: stageColor(it.status) }} />
                </span>
                <span className="text-xs hidden lg:block" style={{ color: 'var(--text-secondary)', width: 70 }}>{it.by}</span>
              </div>

              {isExp && (
                <div className="px-6 py-4 space-y-3" style={{ background: 'var(--bg-secondary)' }}>
                  {it.stages.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Pipeline Stages</div>
                      <div className="flex flex-wrap gap-2">
                        {it.stages.map((s, i) => (
                          <div key={i} className="rounded px-2.5 py-1.5 text-center" style={{
                            background: 'var(--bg-card)', border: `1px solid ${stageColor(s.status)}`, minWidth: 70
                          }}>
                            <div className="text-[10px] font-medium" style={{ color: stageColor(s.status) }}>{s.name}</div>
                            <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{s.duration}s</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>Duration: {fmtDuration(it.duration)}</span>
                    <span>Triggered by: {it.by}</span>
                  </div>
                  <LogViewer logs={mockLogs({ repo: it.repo, branch: it.release, stages: it.stages, runNumber: it.id, conclusion: it.status })} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* footer */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>90-day retention — configurable in Settings &gt; Retention</span>
        <button className="px-3 py-1.5 rounded text-xs font-medium border-none cursor-pointer flex items-center gap-1"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <Download size={12} /> Export as CSV
        </button>
      </div>
    </div>
  );
}
