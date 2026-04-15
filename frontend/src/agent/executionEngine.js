import { ACTIONS } from './actionRegistry';

// Execute a plan step-by-step with real API calls.
// onStepUpdate(stepNum, status, detail) is called for UI updates.
// cancelRef.current checked between steps for cancellation.

export async function executePlan(plan, onStepUpdate, cancelRef) {
  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < plan.steps.length; i++) {
    // Check cancellation
    if (cancelRef?.current) {
      await rollbackPlan(plan, results, i - 1, onStepUpdate);
      logPlanResult(plan, results, 'cancelled', Date.now() - startTime);
      return { success: false, failedAt: i + 1, reason: 'cancelled', results, duration: Date.now() - startTime };
    }

    const step = plan.steps[i];
    const actionDef = ACTIONS[step.actionKey];

    if (!actionDef) {
      onStepUpdate(step.step, 'failed', `Unknown action: ${step.actionKey}`);
      logPlanResult(plan, results, 'failed', Date.now() - startTime);
      return { success: false, failedAt: step.step, reason: `Unknown action: ${step.actionKey}`, results, duration: Date.now() - startTime };
    }

    onStepUpdate(step.step, 'running', null);

    try {
      await new Promise(r => setTimeout(r, 500)); // pacing

      const result = await actionDef.execute(step.params);

      let verified = true;
      if (actionDef.verify) {
        verified = await actionDef.verify(result);
      }

      if (!verified) {
        onStepUpdate(step.step, 'failed', 'Verification failed');
        await rollbackPlan(plan, results, i - 1, onStepUpdate);
        logPlanResult(plan, results, 'failed', Date.now() - startTime);
        return { success: false, failedAt: step.step, reason: 'verification_failed', results, duration: Date.now() - startTime };
      }

      results.push({ step: step.step, action: step.actionKey, status: 'success', result, timestamp: new Date().toISOString() });
      const detail = formatResult(result);
      onStepUpdate(step.step, 'success', detail);

    } catch (error) {
      onStepUpdate(step.step, 'failed', error.message);
      await rollbackPlan(plan, results, i - 1, onStepUpdate);
      logPlanResult(plan, results, 'failed', Date.now() - startTime);
      return { success: false, failedAt: step.step, reason: error.message, results, duration: Date.now() - startTime };
    }
  }

  logPlanResult(plan, results, 'success', Date.now() - startTime);
  return { success: true, results, duration: Date.now() - startTime };
}

async function rollbackPlan(plan, completedResults, fromIndex, onStepUpdate) {
  const rollbacks = plan.rollback || [];
  for (let i = fromIndex; i >= 0; i--) {
    const step = plan.steps[i];
    const actionDef = ACTIONS[step.actionKey];
    const rb = rollbacks.find(r => r.step === step.step);

    if (rb) {
      const rbAction = ACTIONS[rb.actionKey];
      if (rbAction) {
        try {
          onStepUpdate(step.step, 'rolling_back', null);
          await rbAction.execute(rb.params);
          onStepUpdate(step.step, 'rolled_back', null);
        } catch {
          onStepUpdate(step.step, 'rollback_failed', null);
        }
      }
    } else if (actionDef?.rollback) {
      try {
        onStepUpdate(step.step, 'rolling_back', null);
        await actionDef.rollback(step.params, completedResults[i]?.result);
        onStepUpdate(step.step, 'rolled_back', null);
      } catch {
        onStepUpdate(step.step, 'rollback_failed', null);
      }
    }
  }
}

function logPlanResult(plan, results, status, duration) {
  try {
    const log = JSON.parse(localStorage.getItem('axops_agent_log') || '[]');
    log.unshift({
      timestamp: new Date().toISOString(),
      plan_id: plan.id,
      trigger: plan.trigger,
      steps: plan.steps.length,
      completed: results.length,
      status,
      duration,
    });
    localStorage.setItem('axops_agent_log', JSON.stringify(log.slice(0, 500)));
  } catch {}
}

function formatResult(result) {
  if (result?.sha) return result.sha.substring(0, 7);
  if (result?.key) return result.key;
  if (result?.branch) return result.branch;
  if (result?.number) return `PR #${result.number}`;
  if (result?.name) return result.name;
  if (result?.ticket) return result.ticket;
  return '';
}

export function canAutoExecute(plan) {
  return plan.steps.every(step => {
    const actionDef = ACTIONS[step.actionKey];
    return actionDef?.risk === 'low';
  });
}
