# How to Read Security Results

## Where to Find Results
- GitHub Actions run log: expand the "Security Scan" step.
- SonarQube dashboard (if configured): linked in the PR check status.
- GitHub Security tab: Dependabot alerts and code scanning alerts.

## SAST Scan Output
The CI pipeline runs static analysis on every push. Results are categorized:
- Critical: must fix before merge (blocks PR)
- High: should fix before merge
- Medium: fix within current sprint
- Low: fix when convenient

## What to Do
1. Click the failed check on the PR to see the scan report.
2. Review each finding. Some may be false positives.
3. Fix real issues in your feature branch and push.
4. If a finding is a false positive, add a suppression comment in code and note it in the PR.

## Dependency Vulnerabilities
Dependabot creates PRs automatically for vulnerable dependencies.
Review and merge these PRs promptly, especially for critical severity.
