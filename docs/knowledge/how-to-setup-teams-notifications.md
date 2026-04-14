# How to Setup Teams Notifications

## Secret Required
| Secret            | Description                    |
|-------------------|--------------------------------|
| TEAMS_WEBHOOK_URL | Incoming webhook URL from Teams |

## Create the Webhook
1. Open Microsoft Teams.
2. Go to the target channel > Manage channel > Connectors.
3. Add "Incoming Webhook".
4. Name it "ForgeOps" and copy the URL.
5. Add the URL as TEAMS_WEBHOOK_URL in GitHub Organization Secrets.

## What Gets Posted
- Production deployments (success and failure)
- Critical pipeline failures
- Self-healing alerts (when drift is detected)
- Weekly DORA metrics summary

## Message Format
Messages are sent as adaptive cards with:
- Repo name and branch
- Status (success/failure)
- Link to the Actions run
- Timestamp
