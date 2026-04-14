# Environments

## Environment Matrix
| Env   | Branch    | Purpose              | Approval     | Jira Status            |
|-------|-----------|----------------------|--------------|------------------------|
| INT   | develop   | Integration testing  | 1 reviewer   | In INT                 |
| QA    | release/* | System integration   | tech lead    | Ready for SIT          |
| STAGE | main      | UAT acceptance       | 2 reviewers  | Ready for UAT          |
| PROD  | tag v*    | Production           | release eng  | Deployed               |

## Branch-to-Environment Mapping
- feature/* --> no deployment (CI only)
- develop --> INT (auto-deploy on merge)
- release/* --> QA (auto-deploy on merge)
- main --> STAGE (auto-deploy on merge)
- v*.*.* tag --> PROD (manual trigger, requires approval)

## Approval Rules
- INT: any 1 approved reviewer
- QA: tech lead must approve
- STAGE: 2 reviewers including tech lead
- PROD: release engineer dispatches, environment protection rule enforced

## Email Notification Groups
- developers: INT deploy results
- qa_team: QA deploy results, SIT status
- uat_team: STAGE deploy results, UAT status
- release_engineers: PROD deploy results
- all_stakeholders: PROD deploy results, weekly DORA report

## UiPath Exception
UiPath repos skip INT (no develop branch). Flow: qa --> stage --> prod.
