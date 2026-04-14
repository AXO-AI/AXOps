import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Plus, X, ChevronUp, ChevronDown, Copy, Download, GitBranch, Check, Settings, Play, Eye, Trash2, MoreVertical, Zap } from 'lucide-react';
import { api } from '../api';

/* ═══ STAGE PALETTE ═══ */
const STAGE_PALETTE = [
  { id: 'checkout', name: 'Checkout', icon: 'C', color: '#3FB950', action: 'actions/checkout@v4', category: 'source' },
  { id: 'setup-node', name: 'Setup Node.js', icon: 'N', color: '#3FB950', action: 'actions/setup-node@v4', category: 'setup' },
  { id: 'setup-java', name: 'Setup Java', icon: 'J', color: '#3FB950', action: 'actions/setup-java@v4', category: 'setup' },
  { id: 'setup-python', name: 'Setup Python', icon: 'P', color: '#3FB950', action: 'actions/setup-python@v5', category: 'setup' },
  { id: 'setup-dotnet', name: 'Setup .NET', icon: 'D', color: '#3FB950', action: 'actions/setup-dotnet@v4', category: 'setup' },
  { id: 'cache', name: 'Cache', icon: '$', color: '#D29922', action: 'actions/cache@v4', category: 'optimize' },
  { id: 'install', name: 'Install deps', icon: 'I', color: '#58A6FF', run: 'npm ci', category: 'build' },
  { id: 'build', name: 'Build', icon: 'B', color: '#58A6FF', run: 'npm run build', category: 'build' },
  { id: 'unit-test', name: 'Unit test', icon: 'T', color: '#D29922', run: 'npm test', category: 'test' },
  { id: 'integration-test', name: 'Integration test', icon: 'IT', color: '#D29922', run: 'npm run test:integration', category: 'test' },
  { id: 'lint', name: 'Lint', icon: 'L', color: '#D29922', run: 'npm run lint', category: 'test' },
  { id: 'sast', name: 'SAST scan', icon: 'SA', color: '#F85149', run: 'echo "Run SAST"', category: 'security' },
  { id: 'sca', name: 'SCA scan', icon: 'SC', color: '#F85149', uses: './.github/workflows/_security-scan.yml', category: 'security' },
  { id: 'secret-scan', name: 'Secret scan', icon: 'SS', color: '#F85149', uses: './.github/workflows/_validate-secrets.yml', category: 'security' },
  { id: 'docker-build', name: 'Docker build', icon: 'Dk', color: '#58A6FF', run: 'docker build -t $IMAGE_NAME .', category: 'build' },
  { id: 'docker-push', name: 'Docker push', icon: 'Dp', color: '#58A6FF', run: 'docker push $IMAGE_NAME', category: 'build' },
  { id: 'deploy', name: 'Deploy', icon: 'Dy', color: '#7F77DD', uses: './.github/workflows/_deploy.yml', category: 'deploy' },
  { id: 'notify', name: 'Notify Teams', icon: 'Nt', color: '#7F77DD', uses: './.github/workflows/_notify.yml', category: 'deploy' },
  { id: 'rollback', name: 'Rollback', icon: 'R', color: '#F85149', uses: './.github/workflows/_rollback.yml', category: 'deploy' },
  { id: 'artifact-upload', name: 'Upload artifact', icon: 'A', color: '#3FB950', action: 'actions/upload-artifact@v4', category: 'optimize' },
  { id: 'approval', name: 'Approval gate', icon: 'AG', color: '#D29922', run: 'echo "Approval gate"', category: 'deploy' },
  { id: 'custom', name: 'Custom step', icon: '+', color: '#8B949E', run: '# your command here', category: 'custom' },
];

/* ═══ TEMPLATES ═══ */
const PIPELINE_TEMPLATES = {
  'nodejs': {
    name: 'Node.js / React', color: '#3FB950',
    description: 'npm install, build, test, SCA, deploy',
    stages: [
      { id: 'checkout', name: 'Checkout', action: 'actions/checkout@v4' },
      { id: 'setup-node', name: 'Setup Node.js', action: 'actions/setup-node@v4', with: { 'node-version': '20' } },
      { id: 'cache', name: 'Cache node_modules', action: 'actions/cache@v4', with: { path: 'node_modules', key: "${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}" } },
      { id: 'install', name: 'Install dependencies', run: 'npm ci' },
      { id: 'build', name: 'Build', run: 'npm run build' },
      { id: 'test', name: 'Unit test', run: 'npm test -- --coverage' },
      { id: 'sca', name: 'SCA scan', uses: './.github/workflows/_security-scan.yml' },
      { id: 'deploy', name: 'Deploy', uses: './.github/workflows/_deploy.yml', with: { environment: 'int' } },
    ]
  },
  'java-maven': {
    name: 'Java / Maven', color: '#D29922',
    description: 'mvn compile, test, package, SCA, deploy',
    stages: [
      { id: 'checkout', name: 'Checkout', action: 'actions/checkout@v4' },
      { id: 'setup-java', name: 'Setup Java', action: 'actions/setup-java@v4', with: { 'java-version': '17', distribution: 'temurin' } },
      { id: 'cache', name: 'Cache Maven', action: 'actions/cache@v4', with: { path: '~/.m2/repository', key: "${{ runner.os }}-maven-${{ hashFiles('pom.xml') }}" } },
      { id: 'build', name: 'Compile', run: 'mvn compile -B' },
      { id: 'test', name: 'Unit test', run: 'mvn test -B' },
      { id: 'package', name: 'Package', run: 'mvn package -DskipTests -B' },
      { id: 'sca', name: 'SCA scan', uses: './.github/workflows/_security-scan.yml' },
      { id: 'deploy', name: 'Deploy', uses: './.github/workflows/_deploy.yml', with: { environment: 'int' } },
      { id: 'notify', name: 'Notify', uses: './.github/workflows/_notify.yml' },
    ]
  },
  'python': {
    name: 'Python', color: '#3FB950',
    description: 'pip install, lint, pytest, SCA, deploy',
    stages: [
      { id: 'checkout', name: 'Checkout', action: 'actions/checkout@v4' },
      { id: 'setup-python', name: 'Setup Python', action: 'actions/setup-python@v5', with: { 'python-version': '3.12' } },
      { id: 'install', name: 'Install', run: 'pip install -r requirements.txt' },
      { id: 'lint', name: 'Lint', run: 'flake8 . --count --show-source' },
      { id: 'test', name: 'Test', run: 'pytest --cov' },
      { id: 'sca', name: 'SCA scan', uses: './.github/workflows/_security-scan.yml' },
      { id: 'deploy', name: 'Deploy', uses: './.github/workflows/_deploy.yml' },
    ]
  },
  'dotnet': {
    name: '.NET / C#', color: '#7F77DD',
    description: 'dotnet restore, build, test, SCA, deploy',
    stages: [
      { id: 'checkout', name: 'Checkout', action: 'actions/checkout@v4' },
      { id: 'setup-dotnet', name: 'Setup .NET', action: 'actions/setup-dotnet@v4', with: { 'dotnet-version': '8.0.x' } },
      { id: 'restore', name: 'Restore', run: 'dotnet restore' },
      { id: 'build', name: 'Build', run: 'dotnet build --no-restore' },
      { id: 'test', name: 'Test', run: 'dotnet test --no-build' },
      { id: 'sca', name: 'SCA scan', uses: './.github/workflows/_security-scan.yml' },
      { id: 'deploy', name: 'Deploy', uses: './.github/workflows/_deploy.yml' },
    ]
  },
  'salesforce': {
    name: 'Salesforce SFDX', color: '#58A6FF',
    description: 'auth, validate, deploy, Apex test, scan',
    stages: [
      { id: 'checkout', name: 'Checkout', action: 'actions/checkout@v4' },
      { id: 'auth', name: 'SFDX Auth', run: 'sfdx auth:jwt:grant --clientid $SF_CLIENT_ID --jwtkeyfile server.key --username $SF_USERNAME' },
      { id: 'validate', name: 'Validate', run: 'sfdx force:source:deploy --checkonly --sourcepath force-app' },
      { id: 'deploy', name: 'Deploy', run: 'sfdx force:source:deploy --sourcepath force-app' },
      { id: 'test', name: 'Apex tests', run: 'sfdx force:apex:test:run --resultformat human' },
      { id: 'sca', name: 'SCA scan', uses: './.github/workflows/_security-scan.yml' },
    ]
  },
  'uipath': {
    name: 'UiPath RPA', color: '#D85A30',
    description: 'pack, analyze, test, deploy to Orchestrator',
    stages: [
      { id: 'checkout', name: 'Checkout', action: 'actions/checkout@v4' },
      { id: 'setup', name: 'Setup UiPath CLI', run: 'npm install -g @uipath/cli' },
      { id: 'pack', name: 'Pack project', run: 'uipcli package pack project.json -o output/' },
      { id: 'analyze', name: 'Analyze', run: 'uipcli package analyze project.json' },
      { id: 'deploy', name: 'Deploy to Orchestrator', run: 'uipcli package deploy output/*.nupkg $ORCH_URL -t $ORCH_TENANT' },
    ]
  },
  'informatica': {
    name: 'Informatica ETL', color: '#BA7517',
    description: 'export, validate, import mappings',
    stages: [
      { id: 'checkout', name: 'Checkout', action: 'actions/checkout@v4' },
      { id: 'export', name: 'Export mappings', run: 'infacmd isp exportObjects -DomainName $INFA_DOMAIN' },
      { id: 'validate', name: 'Validate', run: 'infacmd dis validateObject -DomainName $INFA_DOMAIN' },
      { id: 'import', name: 'Import to target', run: 'infacmd isp importObjects -DomainName $INFA_TARGET_DOMAIN' },
    ]
  },
  'docker': {
    name: 'Docker container', color: '#58A6FF',
    description: 'build image, scan, push registry, deploy',
    stages: [
      { id: 'checkout', name: 'Checkout', action: 'actions/checkout@v4' },
      { id: 'login', name: 'Docker login', run: 'echo $DOCKER_TOKEN | docker login -u $DOCKER_USER --password-stdin' },
      { id: 'build', name: 'Docker build', run: 'docker build -t $REGISTRY/$IMAGE:${{ github.sha }} .' },
      { id: 'scan', name: 'Image scan', run: 'docker scout cves $REGISTRY/$IMAGE:${{ github.sha }}' },
      { id: 'push', name: 'Docker push', run: 'docker push $REGISTRY/$IMAGE:${{ github.sha }}' },
      { id: 'deploy', name: 'Deploy', uses: './.github/workflows/_deploy.yml' },
    ]
  },
};

/* ═══ YAML GENERATOR ═══ */
function generateYAML(config, stages) {
  let y = `name: ${config.name || 'CI/CD'}\n\non:\n`;
  if (config.trigger === 'push') y += `  push:\n    branches: [${config.branch || 'main'}]\n`;
  else if (config.trigger === 'pr') y += `  pull_request:\n    branches: [${config.branch || 'main'}]\n`;
  else if (config.trigger === 'schedule') y += `  schedule:\n    - cron: '${config.cron || '0 0 * * *'}'\n`;
  else y += `  workflow_dispatch:\n`;
  y += `\njobs:\n  build:\n    runs-on: ${config.runner || 'ubuntu-latest'}\n    steps:\n`;
  stages.forEach(s => {
    y += `      - name: ${s.name}\n`;
    if (s.action) {
      y += `        uses: ${s.action}\n`;
    } else if (s.uses) {
      y += `        uses: ${s.uses}\n`;
    } else if (s.run) {
      const lines = s.run.split('\n');
      if (lines.length === 1) y += `        run: ${s.run}\n`;
      else { y += `        run: |\n`; lines.forEach(l => { y += `          ${l}\n`; }); }
    }
    if (s.with && Object.keys(s.with).length) {
      y += `        with:\n`;
      Object.entries(s.with).forEach(([k, v]) => { y += `          ${k}: ${v}\n`; });
    }
    if (s.condition) y += `        if: ${s.condition}\n`;
  });
  return y;
}

/* ═══ SIMPLE YAML PARSER ═══ */
function parseYAML(text) {
  const config = { name: 'CI/CD', trigger: 'push', branch: 'main', runner: 'ubuntu-latest' };
  const stages = [];
  const nameMatch = text.match(/^name:\s*(.+)/m);
  if (nameMatch) config.name = nameMatch[1].trim();
  if (text.includes('pull_request:')) config.trigger = 'pr';
  else if (text.includes('schedule:')) config.trigger = 'schedule';
  else if (text.includes('workflow_dispatch')) config.trigger = 'manual';
  const runnerMatch = text.match(/runs-on:\s*(.+)/);
  if (runnerMatch) config.runner = runnerMatch[1].trim();

  const stepBlocks = text.split(/^\s{6}- name:/m).slice(1);
  for (const block of stepBlocks) {
    const lines = ('- name:' + block).split('\n');
    const stage = { id: 'custom-' + stages.length, name: '', run: '', action: '', uses: '', with: {}, condition: '' };
    const nm = lines[0].match(/name:\s*(.+)/);
    if (nm) stage.name = nm[1].trim();
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i].trimStart();
      if (l.startsWith('uses:')) stage[l.includes('./') ? 'uses' : 'action'] = l.replace('uses:', '').trim();
      else if (l.startsWith('run:') && !l.includes('|')) stage.run = l.replace('run:', '').trim();
      else if (l.startsWith('run: |')) {
        let cmd = '';
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].match(/^\s{8}\S/)) { cmd += (cmd ? '\n' : '') + lines[j].trim(); } else break;
        }
        stage.run = cmd;
      }
      else if (l.startsWith('if:')) stage.condition = l.replace('if:', '').trim();
    }
    const palette = STAGE_PALETTE.find(p => p.action === stage.action || p.uses === stage.uses || p.name === stage.name);
    if (palette) { stage.id = palette.id; stage.icon = palette.icon; stage.color = palette.color; stage.category = palette.category; }
    stages.push(stage);
  }
  return { config, stages };
}

/* ═══ MOCK REPOS FALLBACK ═══ */
const MOCK_REPOS = [
  { name: 'AXOps', full_name: 'askboppana/AXOps' },
  { name: 'admin-dashboard-web', full_name: 'askboppana/admin-dashboard-web' },
  { name: 'auth-service', full_name: 'askboppana/auth-service' },
];

/* ═══════════════════════════════════════════════ */
/* MAIN COMPONENT                                  */
/* ═══════════════════════════════════════════════ */

export default function Pipelines() {
  const [tab, setTab] = useState('create');
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.github.repos();
        const list = Array.isArray(r) ? r : r?.repos || [];
        setRepos(list.length > 0 ? list : MOCK_REPOS);
      } catch { setRepos(MOCK_REPOS); }
    })();
  }, []);

  const tabs = [
    { id: 'create', label: 'Create new' },
    { id: 'edit', label: 'Edit existing' },
    { id: 'templates', label: 'Templates' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Pipelines</h1>
      <div className="flex gap-1 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer"
            style={{ background: tab === t.id ? 'var(--accent)' : 'var(--bg-card)', color: tab === t.id ? 'white' : 'var(--text-secondary)' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'create' && <CreateTab repos={repos} />}
      {tab === 'edit' && <EditTab repos={repos} />}
      {tab === 'templates' && <TemplatesTab onUse={(stages) => { setTab('create'); /* template stages passed via ref below */ }} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/* TAB 1: CREATE NEW                               */
/* ═══════════════════════════════════════════════ */

function CreateTab({ repos, initialStages }) {
  const [config, setConfig] = useState({ name: 'ci-build-test-deploy', trigger: 'push', branch: 'main', runner: 'ubuntu-latest', cron: '0 0 * * *' });
  const [stages, setStages] = useState(initialStages || []);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const yaml = useMemo(() => generateYAML(config, stages), [config, stages]);

  const addStage = (palette) => {
    const s = { ...palette, with: palette.with ? { ...palette.with } : {}, condition: '' };
    setStages(prev => [...prev, s]);
  };

  const removeStage = (i) => { setStages(prev => prev.filter((_, idx) => idx !== i)); if (selectedIdx === i) setSelectedIdx(-1); };
  const moveUp = (i) => { if (i === 0) return; setStages(prev => { const n = [...prev]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; }); };
  const moveDown = (i) => { if (i >= stages.length - 1) return; setStages(prev => { const n = [...prev]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; }); };
  const duplicateStage = (i) => { setStages(prev => { const n = [...prev]; n.splice(i + 1, 0, { ...prev[i], with: { ...(prev[i].with || {}) } }); return n; }); };

  const updateStage = (i, field, value) => {
    setStages(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const copyYaml = () => { navigator.clipboard?.writeText(yaml); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const downloadYaml = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${config.name || 'pipeline'}.yml`;
    a.click();
  };

  const saveDraftPR = async () => {
    if (!selectedRepo) return;
    setSaving(true); setSaveResult(null);
    try {
      const [o, r] = selectedRepo.split('/');
      const branchName = `pipeline/${config.name || 'update'}`;
      await api.github.createBranch(o, r, branchName, 'main');
      const content = btoa(unescape(encodeURIComponent(yaml)));
      await api.github.updateFile(o, r, `.github/workflows/${config.name || 'ci'}.yml`, content, null, `feat: add pipeline ${config.name}`, branchName);
      const pr = await api.github.createPR(o, r, `Add pipeline: ${config.name}`, branchName, 'main', 'Pipeline created via AXOps Pipeline Builder.', true);
      setSaveResult({ success: true, msg: `Draft PR created${pr?.number ? ' #' + pr.number : ''}` });
    } catch {
      setSaveResult({ success: false, msg: 'Failed to create PR' });
    }
    setSaving(false);
  };

  const commitDirect = async () => {
    if (!selectedRepo) return;
    setSaving(true); setSaveResult(null);
    try {
      const [o, r] = selectedRepo.split('/');
      const content = btoa(unescape(encodeURIComponent(yaml)));
      await api.github.updateFile(o, r, `.github/workflows/${config.name || 'ci'}.yml`, content, null, `feat: add pipeline ${config.name}`, config.branch || 'main');
      setSaveResult({ success: true, msg: 'Committed to ' + (config.branch || 'main') });
    } catch {
      setSaveResult({ success: false, msg: 'Commit failed' });
    }
    setSaving(false);
  };

  const sel = selectedIdx >= 0 && selectedIdx < stages.length ? stages[selectedIdx] : null;
  const selectStyle = { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* LEFT PANEL */}
      <div className="space-y-4">
        {/* Settings */}
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Pipeline settings</div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Name</label>
              <input className="w-full px-3 py-1.5 rounded text-sm outline-none" style={selectStyle}
                value={config.name} onChange={e => setConfig(p => ({ ...p, name: e.target.value.replace(/\s+/g, '-').toLowerCase() }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Repository</label>
              <select className="w-full px-3 py-1.5 rounded text-sm" style={selectStyle}
                value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
                <option value="">Select...</option>
                {repos.map(r => { const f = r.full_name || r.name; return <option key={f} value={f}>{f}</option>; })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Trigger</label>
              <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {['push', 'pr', 'schedule', 'manual'].map(t => (
                  <button key={t} onClick={() => setConfig(p => ({ ...p, trigger: t }))}
                    className="flex-1 py-1 text-xs border-none cursor-pointer capitalize"
                    style={{ background: config.trigger === t ? 'var(--accent)' : 'var(--bg-secondary)', color: config.trigger === t ? 'white' : 'var(--text-tertiary)' }}>
                    {t === 'pr' ? 'PR' : t}
                  </button>
                ))}
              </div>
              {config.trigger === 'schedule' && (
                <input className="w-full px-3 py-1.5 rounded text-xs mt-2 outline-none font-mono" style={selectStyle}
                  value={config.cron} onChange={e => setConfig(p => ({ ...p, cron: e.target.value }))} placeholder="0 0 * * *" />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Branch</label>
              <select className="w-full px-3 py-1.5 rounded text-sm" style={selectStyle}
                value={config.branch} onChange={e => setConfig(p => ({ ...p, branch: e.target.value }))}>
                {['main', 'develop', 'int', 'qa', 'staging'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Runner</label>
              <select className="w-full px-3 py-1.5 rounded text-sm" style={selectStyle}
                value={config.runner} onChange={e => setConfig(p => ({ ...p, runner: e.target.value }))}>
                {['ubuntu-latest', 'windows-latest', 'macos-latest', 'self-hosted'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Stage palette */}
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Add stages</div>
          <div className="grid grid-cols-2 gap-1.5">
            {STAGE_PALETTE.map(p => (
              <button key={p.id} onClick={() => addStage(p)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs border-none cursor-pointer text-left"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: p.color + '22', color: p.color }}>{p.icon}</span>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="space-y-4">
        {/* Pipeline stages */}
        <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 text-sm font-semibold flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <span>Pipeline stages ({stages.length})</span>
          </div>
          {stages.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Click stages from the palette to build your pipeline
            </div>
          ) : (
            <div>
              {stages.map((s, i) => {
                const palette = STAGE_PALETTE.find(p => p.id === s.id) || {};
                const color = s.color || palette.color || '#8B949E';
                const isSel = selectedIdx === i;
                return (
                  <div key={i}>
                    {i > 0 && <div className="flex justify-center"><div style={{ width: 2, height: 16, background: 'var(--border)' }} /></div>}
                    <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                      style={{ background: isSel ? 'rgba(127,119,221,0.05)' : 'transparent', borderLeft: isSel ? '2px solid var(--accent)' : '2px solid transparent', borderBottom: '1px solid var(--border)' }}
                      onClick={() => setSelectedIdx(isSel ? -1 : i)}>
                      <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: color + '22', color }}>{s.icon || palette.icon || (i + 1)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                        <div className="text-xs font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>{s.action || s.uses || s.run || ''}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: color + '18', color }}>{s.category || palette.category || 'step'}</span>
                      <div className="flex gap-0.5 shrink-0">
                        <button onClick={e => { e.stopPropagation(); moveUp(i); }} className="p-0.5 border-none bg-transparent cursor-pointer" style={{ color: 'var(--text-tertiary)' }}><ChevronUp size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); moveDown(i); }} className="p-0.5 border-none bg-transparent cursor-pointer" style={{ color: 'var(--text-tertiary)' }}><ChevronDown size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); duplicateStage(i); }} className="p-0.5 border-none bg-transparent cursor-pointer" style={{ color: 'var(--text-tertiary)' }}><Copy size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); removeStage(i); }} className="p-0.5 border-none bg-transparent cursor-pointer" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                      </div>
                    </div>

                    {/* Inline config */}
                    {isSel && (
                      <div className="px-6 py-3 space-y-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Name</label>
                          <input className="w-full px-2 py-1 rounded text-sm outline-none" style={selectStyle}
                            value={s.name} onChange={e => updateStage(i, 'name', e.target.value)} />
                        </div>
                        {(s.action || (!s.uses && !s.run)) && (
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Action</label>
                            <input className="w-full px-2 py-1 rounded text-xs font-mono outline-none" style={selectStyle}
                              value={s.action || ''} onChange={e => updateStage(i, 'action', e.target.value)} />
                          </div>
                        )}
                        {s.uses && (
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Reusable workflow</label>
                            <input className="w-full px-2 py-1 rounded text-xs font-mono outline-none" style={selectStyle}
                              value={s.uses} onChange={e => updateStage(i, 'uses', e.target.value)} />
                          </div>
                        )}
                        {s.run !== undefined && !s.action && !s.uses && (
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Command</label>
                            <textarea className="w-full px-2 py-1 rounded text-xs font-mono outline-none resize-none" rows={3} style={selectStyle}
                              value={s.run} onChange={e => updateStage(i, 'run', e.target.value)} />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Condition (if)</label>
                          <input className="w-full px-2 py-1 rounded text-xs font-mono outline-none" style={selectStyle}
                            value={s.condition || ''} onChange={e => updateStage(i, 'condition', e.target.value)} placeholder="github.ref == 'refs/heads/main'" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* YAML preview */}
        {stages.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-4 py-3 text-sm font-semibold flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <span>YAML preview</span>
              <div className="flex gap-2">
                <button onClick={copyYaml} className="text-xs border-none bg-transparent cursor-pointer flex items-center gap-1" style={{ color: copied ? 'var(--success)' : 'var(--accent)' }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={downloadYaml} className="text-xs border-none bg-transparent cursor-pointer flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
            <div className="overflow-x-auto font-mono text-xs leading-5 p-4" style={{ background: '#0D1117', color: '#E6EDF3', maxHeight: 400, overflowY: 'auto' }}>
              {yaml.split('\n').map((line, i) => {
                let color = '#E6EDF3';
                if (line.match(/^\s*#/)) color = '#8B949E';
                else if (line.match(/^[a-z]/i) || line.match(/^\s+[a-z_-]+:/i)) {
                  const parts = line.split(':');
                  return (
                    <div key={i}>
                      <span style={{ color: '#D2A8FF' }}>{parts[0]}:</span>
                      <span style={{ color: '#A5D6FF' }}>{parts.slice(1).join(':')}</span>
                    </div>
                  );
                }
                return <div key={i} style={{ color }}>{line || '\u00A0'}</div>;
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {stages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <button onClick={saveDraftPR} disabled={saving || !selectedRepo}
              className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
              style={{ background: 'var(--accent)', color: 'white', opacity: saving || !selectedRepo ? 0.5 : 1 }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />} Save as draft PR
            </button>
            <button onClick={commitDirect} disabled={saving || !selectedRepo}
              className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
              style={{ background: 'var(--success)', color: 'white', opacity: saving || !selectedRepo ? 0.5 : 1 }}>
              <Check size={14} /> Commit to repo
            </button>
            <button onClick={copyYaml} className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              <Copy size={14} /> Copy YAML
            </button>
            <button onClick={downloadYaml} className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              <Download size={14} /> Download .yml
            </button>
          </div>
        )}

        {saveResult && (
          <div className="rounded-lg p-3 text-sm" style={{
            background: saveResult.success ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
            color: saveResult.success ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${saveResult.success ? 'var(--success)' : 'var(--danger)'}`,
          }}>{saveResult.msg}</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/* TAB 2: EDIT EXISTING                            */
/* ═══════════════════════════════════════════════ */

function EditTab({ repos }) {
  const [selectedRepo, setSelectedRepo] = useState('');
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [editConfig, setEditConfig] = useState(null);
  const [editStages, setEditStages] = useState([]);
  const [fileSha, setFileSha] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const loadWorkflows = async () => {
    if (!selectedRepo) return;
    setLoading(true); setWorkflows([]); setEditingFile(null);
    try {
      const [o, r] = selectedRepo.split('/');
      const res = await api.github.tree(o, r, 'main');
      const tree = res?.tree || [];
      const wfs = tree.filter(n => n.path?.startsWith('.github/workflows/') && n.path.endsWith('.yml') && n.type === 'blob');
      setWorkflows(wfs);
    } catch { setWorkflows([]); }
    setLoading(false);
  };

  const loadFile = async (node) => {
    try {
      const [o, r] = selectedRepo.split('/');
      const res = await api.github.blob(o, r, node.sha);
      const content = res?.decoded_content || '';
      setEditingFile(node.path);
      setFileSha(res?.sha || node.sha || '');
      const parsed = parseYAML(content);
      setEditConfig(parsed.config);
      setEditStages(parsed.stages);
      analyzeSuggestions(parsed.stages);
    } catch {
      setEditingFile(null);
    }
  };

  const analyzeSuggestions = (stages) => {
    const ids = stages.map(s => s.id);
    const sugs = [];
    if (!ids.includes('cache')) sugs.push({ id: 'cache', msg: 'Add actions/cache to reduce build time', palette: STAGE_PALETTE.find(p => p.id === 'cache') });
    if (!ids.includes('sca') && !ids.includes('secret-scan')) sugs.push({ id: 'sca', msg: 'Add SCA scan before deploy for security', palette: STAGE_PALETTE.find(p => p.id === 'sca') });
    if (!ids.includes('notify')) sugs.push({ id: 'notify', msg: 'Add Teams notification on failure', palette: STAGE_PALETTE.find(p => p.id === 'notify') });
    if (!ids.includes('artifact-upload')) sugs.push({ id: 'artifact-upload', msg: 'Add artifact upload for build outputs', palette: STAGE_PALETTE.find(p => p.id === 'artifact-upload') });
    setSuggestions(sugs);
  };

  const addSuggestion = (sug) => {
    if (!sug.palette) return;
    setEditStages(prev => [...prev, { ...sug.palette, with: {}, condition: '' }]);
    setSuggestions(prev => prev.filter(s => s.id !== sug.id));
  };

  const yaml = useMemo(() => editConfig ? generateYAML(editConfig, editStages) : '', [editConfig, editStages]);

  const saveEdit = async () => {
    if (!selectedRepo || !editingFile) return;
    setSaving(true); setSaveResult(null);
    try {
      const [o, r] = selectedRepo.split('/');
      const branchName = `pipeline/update-${Date.now()}`;
      await api.github.createBranch(o, r, branchName, 'main');
      const content = btoa(unescape(encodeURIComponent(yaml)));
      await api.github.updateFile(o, r, editingFile, content, null, `chore: update ${editingFile.split('/').pop()} via AXOps`, branchName);
      const pr = await api.github.createPR(o, r, `Update pipeline: ${editingFile.split('/').pop()}`, branchName, 'main', 'Pipeline updated via AXOps Pipeline Builder.', true);
      setSaveResult({ success: true, msg: `Draft PR created${pr?.number ? ' #' + pr.number : ''}` });
    } catch {
      setSaveResult({ success: false, msg: 'Failed to save' });
    }
    setSaving(false);
  };

  const selectStyle = { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' };

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <select className="px-3 py-2 rounded-lg text-sm flex-1" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          value={selectedRepo} onChange={e => { setSelectedRepo(e.target.value); setEditingFile(null); }}>
          <option value="">Select repository...</option>
          {repos.map(r => { const f = r.full_name || r.name; return <option key={f} value={f}>{f}</option>; })}
        </select>
        <button onClick={loadWorkflows} disabled={loading || !selectedRepo}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
          style={{ background: 'var(--accent)', color: 'white', opacity: loading || !selectedRepo ? 0.5 : 1 }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Load pipelines
        </button>
      </div>

      {/* Workflow list */}
      {workflows.length > 0 && !editingFile && (
        <div className="rounded-lg overflow-hidden mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            Workflows ({workflows.length})
          </div>
          {workflows.map((w, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-secondary)]"
              style={{ borderBottom: '1px solid var(--border)' }} onClick={() => loadFile(w)}>
              <Zap size={14} style={{ color: 'var(--accent)' }} />
              <span className="font-mono text-sm" style={{ color: 'var(--info)' }}>{w.path.split('/').pop()}</span>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>{w.path}</span>
            </div>
          ))}
        </div>
      )}

      {workflows.length === 0 && !loading && selectedRepo && (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No workflows found. Click "Create new" to build one.</div>
      )}

      {/* Editor */}
      {editingFile && editConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Visual editor */}
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Visual editor — {editingFile.split('/').pop()}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--warning)' }}>Enhancement suggestions</div>
                {suggestions.map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-1">
                    <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{s.msg}</span>
                    <button onClick={() => addSuggestion(s)} className="px-2 py-0.5 rounded text-[10px] font-medium border-none cursor-pointer"
                      style={{ background: 'var(--accent)', color: 'white' }}>Add</button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {editStages.map((s, i) => {
                const palette = STAGE_PALETTE.find(p => p.id === s.id) || {};
                const color = s.color || palette.color || '#8B949E';
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: color + '22', color }}>{s.icon || palette.icon || (i + 1)}</span>
                    <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--success)' }}>present</span>
                    <button onClick={() => { setEditStages(prev => prev.filter((_, idx) => idx !== i)); }}
                      className="p-0.5 border-none bg-transparent cursor-pointer" style={{ color: 'var(--text-tertiary)' }}><X size={12} /></button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={saveEdit} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
                style={{ background: 'var(--accent)', color: 'white', opacity: saving ? 0.5 : 1 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />} Push as draft PR
              </button>
            </div>
            {saveResult && (
              <div className="mt-3 rounded-lg p-3 text-sm" style={{
                background: saveResult.success ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                color: saveResult.success ? 'var(--success)' : 'var(--danger)',
              }}>{saveResult.msg}</div>
            )}
          </div>

          {/* YAML preview */}
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>YAML preview</div>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="font-mono text-xs leading-5 p-4" style={{ background: '#0D1117', color: '#E6EDF3', maxHeight: 500, overflowY: 'auto' }}>
                {yaml.split('\n').map((line, i) => {
                  if (line.match(/^\s*#/)) return <div key={i} style={{ color: '#8B949E' }}>{line}</div>;
                  const parts = line.split(':');
                  if (parts.length > 1 && line.match(/[a-z_-]+:/i)) {
                    return <div key={i}><span style={{ color: '#D2A8FF' }}>{parts[0]}:</span><span style={{ color: '#A5D6FF' }}>{parts.slice(1).join(':')}</span></div>;
                  }
                  return <div key={i}>{line || '\u00A0'}</div>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/* TAB 3: TEMPLATES                                */
/* ═══════════════════════════════════════════════ */

function TemplatesTab({ onUse }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(PIPELINE_TEMPLATES).map(([key, t]) => (
          <div key={key} className="rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{t.description}</p>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {t.stages.slice(0, 6).map((s, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
                  {s.name}
                </span>
              ))}
              {t.stages.length > 6 && <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>+{t.stages.length - 6} more</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.stages.length} stages</span>
              <button onClick={() => onUse(t.stages)}
                className="px-3 py-1 rounded text-xs font-medium border-none cursor-pointer"
                style={{ background: 'var(--accent)', color: 'white' }}>
                Use template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reusable workflows reference */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          AXOps reusable workflows
        </div>
        {[
          { file: '_deploy.yml', desc: 'Multi-environment deployment with SSH, health checks, and Jira transitions' },
          { file: '_security-scan.yml', desc: 'SCA vulnerability scanning with severity-based gating' },
          { file: '_notify.yml', desc: 'Teams/Slack notification on build events' },
          { file: '_rollback.yml', desc: 'Automated rollback on failed health checks' },
          { file: '_validate-secrets.yml', desc: 'Gitleaks secret detection and SBOM generation' },
        ].map((w, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <Zap size={14} style={{ color: 'var(--accent)' }} />
            <span className="font-mono text-sm" style={{ color: 'var(--info)' }}>{w.file}</span>
            <span className="text-xs flex-1" style={{ color: 'var(--text-tertiary)' }}>{w.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
