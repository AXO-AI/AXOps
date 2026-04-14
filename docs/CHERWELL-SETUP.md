# Cherwell ITSM Setup

## Overview
ForgeOps can integrate with Cherwell for change management. Production deployments
automatically create a change request in Cherwell and update it on completion.

## Prerequisites
- Cherwell instance with REST API enabled
- API client ID and key with permission to create and update change requests
- Change template configured in Cherwell for automated deployments

## Secrets Required
| Secret             | Value                          |
|--------------------|--------------------------------|
| CHERWELL_BASE_URL  | https://your-cherwell-instance |
| CHERWELL_API_KEY   | API key from Cherwell admin    |

## How It Works
1. Production deployment workflow starts
2. Workflow calls Cherwell API to create a change request (status: Scheduled)
3. Deployment runs
4. On success: workflow updates change request to Implemented
5. On failure: workflow updates change request to Failed, adds error details

## Configuration
Add the Cherwell secrets to GitHub Organization Secrets.
The reusable deployment workflow checks for CHERWELL_BASE_URL. If present,
it creates the change request automatically. If absent, this step is skipped.

## Testing
1. Set secrets with a Cherwell sandbox instance
2. Trigger a manual deployment to any environment
3. Verify the change request appears in Cherwell with correct details
