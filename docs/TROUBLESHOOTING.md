# Troubleshooting

## 1. Pipeline fails with "secret not found"
Fix: Add the missing secret in GitHub Settings > Secrets. Check docs/SETUP.md for the full list.

## 2. Email notifications not sending
Fix: Verify SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD secrets. Test with a manual workflow dispatch. Check firewall rules allow outbound port 587.

## 3. Teams webhook returns 400
Fix: Regenerate the webhook URL in Teams channel settings. Update TEAMS_WEBHOOK_URL secret.

## 4. Jira status not updating
Fix: Verify JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN. Ensure the API user has write access to the Jira project. Check that the PR title contains the Jira ticket key (e.g., PROJ-123).

## 5. SonarQube quality gate fails
Fix: Review the SonarQube dashboard for the specific repo. Common causes: code coverage below threshold, duplicated code, security hotspots. Fix issues and re-push.

## 6. Dashboard shows stale data
Fix: Check if generate-dashboard-data.yml workflow is running on schedule. Manually trigger it from Actions tab. Verify GITHUB_TOKEN has read access to all registered repos.

## 7. Self-healing workflow reports drift
Fix: Review the workflow run log to see which checks failed. Common causes: deleted branch protection rules, removed secrets, disabled workflows. Re-apply the expected configuration.

## 8. Deployment stuck in "waiting for approval"
Fix: An environment protection rule requires manual approval. Ask the designated approver to go to the Actions run and click Approve.

## 9. Bulk action dispatch does not trigger
Fix: Verify the issue title format matches exactly: [FORGEOPS] <action> <project> <environment>. Check that dispatch-bulk-action.yml is enabled in the Actions tab.

## 10. Build fails with "runner not found"
Fix: If using self-hosted runners, ensure the runner agent is online. If using GitHub-hosted, check for GitHub status incidents at githubstatus.com. See docs/MIGRATION-TO-SELF-HOSTED.md for runner setup.
