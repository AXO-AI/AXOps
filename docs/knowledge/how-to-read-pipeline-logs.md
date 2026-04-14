# How to Read Pipeline Logs

## Where to Find Logs
1. Go to the app repo on GitHub.
2. Click the Actions tab.
3. Select the workflow run you want to inspect.
4. Click on the job name to expand it.
5. Click on individual steps to see their output.

## Key Steps to Check
- Checkout: confirms the correct branch and commit
- Build: compilation output and errors
- Test: unit test results and coverage
- Security Scan: SAST findings
- Deploy: deployment commands and target environment
- Notify: email/Teams delivery status

## Common Patterns
- Red X on a step: that step failed. Expand it to see the error.
- Yellow warning: non-fatal issue, review recommended.
- Skipped steps: conditional logic prevented execution (e.g., deploy skipped on feature branch).

## Splunk
If Splunk is configured, all pipeline logs are forwarded automatically.
Search in Splunk by repo name, workflow name, or run ID.
