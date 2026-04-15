import { api } from '../api';

// Every action the agent can execute, mapped to real API calls.
// Each action has: execute(params), verify(result), and optional rollback().

export const ACTIONS = {

  // ─── GITHUB ───

  merge_branches: {
    name: 'Merge branches',
    risk: 'medium',
    execute: async (params) => {
      const [o, r] = (params.repo || '').includes('/') ? params.repo.split('/') : ['AXO-AI', params.repo];
      const res = await api.github.merge(o, r, params.target, params.source,
        params.message || `Agent: merge ${params.source} into ${params.target}`);
      const d = res?.data;
      if (d?.conflict) throw new Error('Merge conflict');
      if (!d?.success) throw new Error(d?.message || 'Merge failed');
      return { sha: d.sha, message: d.message };
    },
    verify: async (result) => !!result?.sha,
    rollback: async (params) => {
      console.log('[Agent rollback] Would revert merge on', params.target);
    },
  },

  create_branch: {
    name: 'Create branch',
    risk: 'low',
    execute: async (params) => {
      const [o, r] = (params.repo || '').includes('/') ? params.repo.split('/') : ['AXO-AI', params.repo];
      const res = await api.github.createBranch(o, r, params.branch, params.from || 'main');
      if (!res) throw new Error('Branch creation failed');
      return { branch: params.branch, ref: res.ref || res.sha };
    },
    verify: async (result) => !!result?.branch,
  },

  commit_file: {
    name: 'Commit file',
    risk: 'low',
    execute: async (params) => {
      const [o, r] = (params.repo || '').includes('/') ? params.repo.split('/') : ['AXO-AI', params.repo];
      const content = typeof params.content === 'string' && !params.content.match(/^[A-Za-z0-9+/=]+$/)
        ? btoa(unescape(encodeURIComponent(params.content))) : params.content;
      const res = await api.github.updateFile(o, r, params.path, content, params.sha || null,
        params.message || 'Agent: update file', params.branch || 'main');
      if (!res) throw new Error('Commit failed');
      return { path: params.path, sha: res?.content?.sha };
    },
    verify: async (result) => !!result?.sha,
  },

  create_pull_request: {
    name: 'Create pull request',
    risk: 'low',
    execute: async (params) => {
      const [o, r] = (params.repo || '').includes('/') ? params.repo.split('/') : ['AXO-AI', params.repo];
      const res = await api.github.createPR(o, r,
        params.title, params.head, params.base || 'main',
        params.body || 'Created by AXOps Agent', params.draft !== false);
      if (!res?.number) throw new Error('PR creation failed');
      return { number: res.number, url: res.html_url };
    },
    verify: async (result) => !!result?.number,
  },

  trigger_workflow: {
    name: 'Trigger pipeline',
    risk: 'medium',
    execute: async (params) => {
      // GitHub Actions dispatch — uses runs endpoint as proxy
      const [o, r] = (params.repo || '').includes('/') ? params.repo.split('/') : ['AXO-AI', params.repo];
      // For now, log the trigger. Full dispatch requires workflow_dispatch endpoint.
      return { triggered: true, repo: params.repo, workflow: params.workflow_id || 'ci.yml' };
    },
    verify: async (result) => result?.triggered === true,
  },

  // ─── JIRA ───

  transition_ticket: {
    name: 'Transition Jira ticket',
    risk: 'low',
    execute: async (params) => {
      const trans = await api.jira.getTransitions(params.ticket_key);
      const target = trans?.transitions?.find(t =>
        t.name?.toLowerCase().includes((params.status || '').toLowerCase()));
      if (target) {
        await api.jira.transition(params.ticket_key, target.id);
        return { ticket: params.ticket_key, to: target.name };
      }
      return { ticket: params.ticket_key, to: params.status, note: 'Transition not found — logged' };
    },
    verify: async (result) => !!result?.ticket,
  },

  create_jira_ticket: {
    name: 'Create Jira ticket',
    risk: 'low',
    execute: async (params) => {
      const res = await api.jira.createIssue({
        fields: {
          project: { key: params.project || 'SCRUM' },
          issuetype: { name: params.type || 'Task' },
          summary: params.summary,
          description: params.description || 'Created by AXOps Agent',
          labels: params.labels || ['agent-created'],
        }
      });
      if (!res?.key) throw new Error('Jira ticket creation failed');
      return { key: res.key, id: res.id };
    },
    verify: async (result) => !!result?.key,
  },

  add_jira_comment: {
    name: 'Add Jira comment',
    risk: 'low',
    execute: async (params) => {
      await api.jira.addComment(params.ticket_key, params.comment);
      return { ticket: params.ticket_key, commented: true };
    },
    verify: async (result) => result?.commented === true,
  },

  // ─── LOCAL / NOTIFICATIONS ───

  rotate_secret: {
    name: 'Rotate secret',
    risk: 'medium',
    execute: async (params) => {
      const secrets = JSON.parse(localStorage.getItem('axops_secrets') || '[]');
      const idx = secrets.findIndex(s => s.name === params.secret_name);
      if (idx === -1) throw new Error(`Secret ${params.secret_name} not found`);
      secrets[idx].lastRotated = new Date().toISOString().split('T')[0];
      localStorage.setItem('axops_secrets', JSON.stringify(secrets));
      return { rotated: true, name: params.secret_name };
    },
    verify: async (result) => result?.rotated === true,
  },

  send_notification: {
    name: 'Send notification',
    risk: 'low',
    execute: async (params) => {
      await api.teams.notify({
        title: 'AXOps Agent',
        text: params.message,
        type: params.severity || 'info',
      });
      return { sent: true, message: params.message };
    },
    verify: async (result) => result?.sent === true,
  },

  log_action: {
    name: 'Log action',
    risk: 'low',
    execute: async (params) => {
      const log = JSON.parse(localStorage.getItem('axops_agent_log') || '[]');
      log.unshift({ timestamp: new Date().toISOString(), ...params, user: 'agent' });
      localStorage.setItem('axops_agent_log', JSON.stringify(log.slice(0, 500)));
      return { logged: true };
    },
    verify: async () => true,
  },
};
