# How to Rollback

## Quick Rollback (Re-run)
1. Go to the Actions tab in the app repo.
2. Find the last successful deployment run for the target environment.
3. Click "Re-run all jobs" to redeploy the previous version.

## Dispatch Rollback
1. Go to Actions > Rollback workflow.
2. Click "Run workflow".
3. Select environment and enter the version tag to rollback to.
4. Click "Run workflow" and wait for completion.

## Git Revert
1. Run: `git revert -m 1 <merge-commit-sha>`
2. Push to the branch mapped to the target environment.
3. The pipeline deploys the reverted code automatically.

## After Rollback
- Update the Jira ticket with the rollback reason.
- File a bug report via the ForgeOps issue templates.
- Notify stakeholders and schedule a root cause analysis.
