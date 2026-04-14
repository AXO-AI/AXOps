# Setup Guide

## Step 1: Fork or clone ForgeOps
```
git clone https://github.com/askboppana/ForgeOps.git
```

## Step 2: Configure GitHub Organization Secrets
Go to Settings > Secrets and variables > Actions and add:

| Secret              | Purpose                        | Required |
|---------------------|--------------------------------|----------|
| SMTP_SERVER         | Email relay host               | Yes      |
| SMTP_PORT           | Email relay port (587)         | Yes      |
| SMTP_USERNAME       | Email sender account           | Yes      |
| SMTP_PASSWORD       | Email sender password          | Yes      |
| TEAMS_WEBHOOK_URL   | MS Teams incoming webhook      | Yes      |
| JIRA_BASE_URL       | Jira instance URL              | Yes      |
| JIRA_USER_EMAIL     | Jira API user email            | Yes      |
| JIRA_API_TOKEN      | Jira API token                 | Yes      |
| SONAR_TOKEN         | SonarQube access token         | Optional |
| SONAR_HOST_URL      | SonarQube server URL           | Optional |
| SPLUNK_HEC_URL      | Splunk HTTP Event Collector    | Optional |
| SPLUNK_HEC_TOKEN    | Splunk HEC token               | Optional |
| CHERWELL_BASE_URL   | Cherwell ITSM instance URL     | Optional |
| CHERWELL_API_KEY    | Cherwell API key               | Optional |

## Step 3: Register projects in forgeops-config.json
Add your projects, repos, teams, and environments to the config file.

## Step 4: Configure environment protection rules
In each app repo, go to Settings > Environments and create: int, qa, stage, prod.
Add required reviewers for stage and prod.

## Step 5: Enable workflows
Push ForgeOps to your org. Workflows activate automatically on first push.
Verify the self-healing workflow runs on schedule (every 6 hours).
