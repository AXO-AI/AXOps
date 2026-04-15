// Generates execution plans from agent findings.
// Each plan is a sequence of steps using actions from actionRegistry.

export function generatePlan(finding) {
  const id = 'plan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  switch (finding.type) {

    case 'drift': {
      const src = finding.meta?.sourceEnv || 'INT';
      const tgt = finding.meta?.targetEnv || 'QA';
      const repo = finding.meta?.repo || 'AXOps';
      return {
        id, trigger: finding.title, risk: 'medium', confidence: 0.92,
        estimatedTime: '4 minutes',
        steps: [
          { step: 1, actionKey: 'merge_branches', label: `Merge ${src.toLowerCase()} → ${tgt.toLowerCase()}`, params: { repo, source: finding.meta?.sourceBranch || src.toLowerCase(), target: finding.meta?.targetBranch || tgt.toLowerCase() }, status: 'pending' },
          { step: 2, actionKey: 'trigger_workflow', label: `Deploy to ${tgt}`, params: { repo, workflow_id: 'ci.yml', branch: tgt.toLowerCase() }, status: 'pending' },
          { step: 3, actionKey: 'send_notification', label: `Notify ${tgt.toLowerCase()} team`, params: { message: `${repo} promoted from ${src} to ${tgt}. Ready for testing.` }, status: 'pending' },
        ],
        rollback: [
          { step: 1, actionKey: 'log_action', label: `Log rollback of ${tgt.toLowerCase()} merge`, params: { action_name: 'rollback_merge', detail: `Reverted merge on ${tgt.toLowerCase()}` } },
        ],
      };
    }

    case 'build_failure': {
      const repo = finding.meta?.repoName || finding.meta?.repo || 'AXOps';
      const repoFull = (finding.meta?.repo || '').includes('/') ? finding.meta.repo : `AXO-AI/${repo}`;
      const buildNum = finding.meta?.runId || finding.meta?.buildId || Date.now();
      return {
        id, trigger: finding.title, risk: 'low', confidence: 0.85,
        estimatedTime: '2 minutes',
        steps: [
          { step: 1, actionKey: 'create_branch', label: 'Create fix branch', params: { repo: repoFull, branch: `fix/build-${buildNum}`, from: finding.meta?.branch || 'main' }, status: 'pending' },
          { step: 2, actionKey: 'create_jira_ticket', label: 'Create defect ticket', params: { summary: `[Defect] Build #${buildNum} failed in ${repo}`, description: `AXOps Agent: ${finding.detail || finding.title}`, labels: ['defect', 'agent-created'] }, status: 'pending' },
          { step: 3, actionKey: 'send_notification', label: 'Notify engineering', params: { message: `Build failed in ${repo}. Fix branch and defect ticket created.` }, status: 'pending' },
        ],
        rollback: [],
      };
    }

    case 'secret': {
      const name = finding.meta?.secretName || 'UNKNOWN';
      return {
        id, trigger: finding.title, risk: finding.meta?.daysRemaining <= 0 ? 'high' : 'medium',
        confidence: 0.95, estimatedTime: '30 seconds',
        steps: [
          { step: 1, actionKey: 'rotate_secret', label: `Rotate ${name}`, params: { secret_name: name }, status: 'pending' },
          { step: 2, actionKey: 'send_notification', label: 'Notify team', params: { message: `Agent rotated ${name}. Verify affected services.` }, status: 'pending' },
        ],
        rollback: [],
      };
    }

    case 'policy': {
      return {
        id, trigger: finding.title, risk: 'medium', confidence: 0.80,
        estimatedTime: '20 seconds',
        steps: [
          { step: 1, actionKey: 'create_jira_ticket', label: 'Create compliance ticket', params: { summary: `Policy violation: ${finding.title}`, description: `AXOps Agent: ${finding.detail || ''}.\nResolve to maintain compliance.`, labels: ['compliance', 'agent-created'] }, status: 'pending' },
          { step: 2, actionKey: 'send_notification', label: 'Alert team lead', params: { message: `Policy violation: ${finding.title}. Compliance ticket created.` }, status: 'pending' },
        ],
        rollback: [],
      };
    }

    case 'governance': {
      return {
        id, trigger: finding.title, risk: 'low', confidence: 0.90,
        estimatedTime: '10 seconds',
        steps: [
          { step: 1, actionKey: 'send_notification', label: 'Alert governance team', params: { message: `Governance score dropped: ${finding.title}. Review disabled policies.` }, status: 'pending' },
          { step: 2, actionKey: 'log_action', label: 'Log governance alert', params: { action_name: 'governance_alert', detail: finding.title }, status: 'pending' },
        ],
        rollback: [],
      };
    }

    case 'freeze': {
      return null; // Informational only — no plan needed
    }

    default:
      return null;
  }
}
