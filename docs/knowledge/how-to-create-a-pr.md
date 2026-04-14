# How to Create a PR

## Steps
1. Create a feature branch from develop: `git checkout -b feature/PROJ-123-description`
2. Make your changes and commit with the Jira ticket in the message.
3. Push the branch: `git push origin feature/PROJ-123-description`
4. Open a PR in GitHub targeting the develop branch.
5. Fill in the PR template (description, Jira ticket, type of change, checklist).
6. Assign reviewers. At least 1 reviewer is required for INT.
7. Wait for CI checks to pass (lint, test, scan).
8. Address review comments and push fixes.
9. Once approved, merge the PR. This triggers deployment to INT.

## PR Title Format
Include the Jira ticket key: `PROJ-123: Add user validation endpoint`

## Tips
- Keep PRs small and focused on a single change.
- Link the Jira ticket in the description for traceability.
