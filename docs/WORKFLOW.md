# ForgeOps Workflow

## Branch Strategy
| Branch    | Environment | Trigger            | Approval    |
|-----------|-------------|-------------------|-------------|
| feature/* | --          | push (CI only)    | none        |
| int       | INT         | PR merge to int   | 1 reviewer  |
| qa        | QA          | PR merge to qa    | tech lead   |
| stage     | STAGE       | PR merge to stage | 1 reviewer  |
| main      | PROD        | PR merge to main  | 2 reviewers |

## When Do Deployments Run?

| Event | Build + Scan | Deploy | Notify |
|-------|-------------|--------|--------|
| Push to feature/* or hotfix/* | Yes | No | No |
| PR merged to int | Yes | Yes (INT) | Yes (developer) |
| PR merged to qa | Yes | Yes (QA) | Yes (QA team + Teams) |
| PR merged to stage | Yes | Yes (STAGE) | Yes (UAT team + Teams) |
| PR merged to main | Yes | Yes (PROD, 2 approvals) | Yes (all + Splunk + Cherwell) |
| PR closed WITHOUT merge | No | No | No |
| Manual workflow_dispatch | Yes | Yes (selected) | Yes |

Deployments NEVER trigger on a plain push to int/qa/stage/main.
Deployments ONLY trigger when a Pull Request is merged to that branch.

## 10-Step Pipeline Flow
1. Developer creates feature branch, pushes code
2. CI runs: build, unit test, security scan
3. Developer creates PR to int -- Jira set to "Ready for Unit Testing"
4. PR merged to int -- deploy to INT -- email to developer
5. Unit testing complete -- PR created int to qa
6. PR merged to qa -- deploy to QA -- Jira "Ready for SIT" -- Teams notification
7. SIT complete -- PR created qa to stage
8. PR merged to stage -- deploy to STAGE -- Jira "Ready for UAT"
9. UAT complete -- PR created stage to main -- requires 2 approvals
10. PR merged to main -- deploy to PROD -- Jira "Deployed" -- all stakeholders notified

## Notifications
- Email: build failures, deployment success/failure, PR reviews needed
- Teams: production deployments, critical failures, weekly DORA report
- Splunk: all pipeline logs forwarded for audit
