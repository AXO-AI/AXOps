# Onboarding a New Developer

## Steps
1. Add the developer to the GitHub organization and the appropriate team.
2. Grant repository access to the repos listed in forgeops-config.json for their project.
3. Add their email to the appropriate email group in forgeops-config.json.
4. Have them clone the app repo and create a feature branch.
5. Walk through the PR process (see how-to-create-a-pr.md).
6. Show them the dashboard at the ForgeOps GitHub Pages URL.
7. Ensure they have Jira access and understand the status flow.

## Tools Needed
- GitHub account with org membership
- Jira account with project access
- IDE with recommended extensions (see .vscode/extensions.json)

## First Task
Create a small PR to verify the full pipeline runs: lint, test, scan, deploy to INT.
