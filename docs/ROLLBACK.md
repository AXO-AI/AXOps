# Rollback Procedures

## Automatic Rollback
The deployment workflow includes a health check after each deploy. If the health check
fails, the workflow automatically triggers a rollback to the previous successful version.

### How it works
1. Deploy completes
2. Health check runs (HTTP 200 check or smoke test)
3. If health check fails 3 times, rollback is triggered
4. Previous artifact is redeployed
5. Jira ticket updated with rollback note
6. Email and Teams notification sent to release engineers

## Manual Rollback

### Option 1: Re-run previous deployment
1. Go to Actions tab in the app repo
2. Find the last successful deployment run
3. Click "Re-run all jobs"

### Option 2: Dispatch rollback workflow
1. Go to Actions > Rollback workflow
2. Click "Run workflow"
3. Select the environment (int/qa/stage/prod)
4. Enter the version tag to rollback to
5. Click "Run workflow"

### Option 3: Git revert
1. Revert the merge commit: `git revert -m 1 <merge-sha>`
2. Push to the appropriate branch
3. Pipeline will auto-deploy the reverted code

## Post-Rollback
- Update Jira ticket with rollback reason
- Create a bug report issue in ForgeOps
- Notify stakeholders via email
- Conduct root cause analysis within 24 hours
