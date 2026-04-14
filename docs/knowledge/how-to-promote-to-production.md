# How to Promote to Production

## Prerequisites
- Code has passed through INT, QA, and STAGE environments.
- Jira ticket status is "Ready for UAT" and UAT has signed off.
- All required reviewers have approved the PR to main.

## Steps
1. Ensure the code is merged to main and deployed to STAGE.
2. Confirm UAT sign-off (Jira status updated by UAT team).
3. Release engineer creates a version tag: `git tag v1.2.3 && git push origin v1.2.3`
4. Go to Actions > Deploy to Production workflow.
5. Click "Run workflow" and select the tag.
6. Approve the environment protection gate when prompted.
7. Monitor the deployment in the Actions tab and dashboard.
8. Jira ticket is automatically updated to "Deployed".

## Post-Deploy
- Verify the application in production.
- Email notification is sent to all stakeholders automatically.
- Teams notification is posted to the releases channel.
