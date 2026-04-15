const DEFAULT_AUTONOMY = {
  enabled: true,
  mode: 'autonomous', // 'off' | 'supervised' | 'autonomous'
  riskThresholds: { auto: 'low', suggest: 'medium', block: 'high' },
  actionOverrides: {
    rotate_secret: 'auto',
    send_notification: 'auto',
    log_action: 'auto',
    add_jira_comment: 'auto',
    create_jira_ticket: 'auto',
    create_branch: 'auto',
    create_pull_request: 'auto',
    trigger_workflow: 'suggest',
    merge_branches: 'suggest',
    commit_file: 'suggest',
    transition_ticket: 'suggest',
  },
  environmentRules: {
    int: { maxAutoRisk: 'medium' },
    qa: { maxAutoRisk: 'low' },
    stage: { maxAutoRisk: 'block' },
    prod: { maxAutoRisk: 'block' },
  },
  quietHours: { enabled: false, start: '22:00', end: '06:00' },
  rateLimits: { maxAutoExecutionsPerHour: 10, maxActionsPerDay: 100, cooldownAfterFailure: 300 },
};

export function loadAutonomyConfig() {
  try { const s = localStorage.getItem('axops_autonomy_config'); return s ? { ...DEFAULT_AUTONOMY, ...JSON.parse(s) } : DEFAULT_AUTONOMY; }
  catch { return DEFAULT_AUTONOMY; }
}

export function saveAutonomyConfig(config) {
  localStorage.setItem('axops_autonomy_config', JSON.stringify(config));
}

export function shouldAutoExecute(plan) {
  const config = loadAutonomyConfig();
  if (!config.enabled || config.mode === 'off') return 'off';
  if (config.mode === 'supervised') return 'suggest';

  // Quiet hours
  if (config.quietHours.enabled) {
    const h = new Date().getHours();
    const s = parseInt(config.quietHours.start);
    const e = parseInt(config.quietHours.end);
    if (s > e ? (h >= s || h < e) : (h >= s && h < e)) return 'suggest';
  }

  // Rate limits
  const log = JSON.parse(localStorage.getItem('axops_agent_log') || '[]');
  const hourAgo = Date.now() - 3600000;
  const dayAgo = Date.now() - 86400000;
  if (log.filter(l => new Date(l.timestamp).getTime() > hourAgo && l.autoExecuted).length >= config.rateLimits.maxAutoExecutionsPerHour) return 'suggest';
  if (log.filter(l => new Date(l.timestamp).getTime() > dayAgo).length >= config.rateLimits.maxActionsPerDay) return 'suggest';

  // Cooldown after failure
  const lastFail = log.find(l => l.status === 'failed');
  if (lastFail && Date.now() - new Date(lastFail.timestamp).getTime() < config.rateLimits.cooldownAfterFailure * 1000) return 'suggest';

  // Plan risk
  const risk = plan.risk || 'medium';
  if (risk === 'low') return 'auto';
  if (risk === 'high' || risk === 'critical') return 'block';
  return 'suggest';
}

export { DEFAULT_AUTONOMY };
