# How to Configure Jira Integration

## Secrets Required
| Secret          | Description               |
|-----------------|---------------------------|
| JIRA_BASE_URL   | e.g. https://yourorg.atlassian.net |
| JIRA_USER_EMAIL | API user email            |
| JIRA_API_TOKEN  | Generated from Atlassian account settings |

## Jira Status Flow
The pipeline updates Jira ticket status at each stage:
- CI pass --> "Ready for Unit Testing"
- Deploy to INT --> "In INT"
- Deploy to QA --> "Ready for SIT"
- Deploy to STAGE --> "Ready for UAT"
- Deploy to PROD --> "Deployed"

## How Ticket Key is Detected
The workflow extracts the Jira ticket key from the PR title (e.g., PROJ-123).
Ensure every PR title starts with the ticket key.

## Custom Status Names
If your Jira project uses different status names, update the status mapping
in the reusable workflow files (reusable-jira-update.yml).
