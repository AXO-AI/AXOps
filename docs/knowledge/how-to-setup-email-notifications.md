# How to Setup Email Notifications

## Secrets Required
| Secret        | Example           |
|---------------|-------------------|
| SMTP_SERVER   | smtp.office365.com |
| SMTP_PORT     | 587               |
| SMTP_USERNAME | noreply@yourorg.com |
| SMTP_PASSWORD | (app password)    |

## Email Groups
Define recipient lists in forgeops-config.json under "email_groups":
- developers: receive INT build/deploy results
- qa_team: receive QA deploy results
- uat_team: receive STAGE deploy results
- release_engineers: receive PROD deploy results
- all_stakeholders: receive PROD results and weekly DORA report

## What Gets Emailed
- Build failures (immediate)
- Deployment success/failure (immediate)
- PR review requests (immediate)
- Weekly DORA metrics summary (Monday morning)

## Testing
Trigger a manual workflow run and check the email step logs for delivery status.
