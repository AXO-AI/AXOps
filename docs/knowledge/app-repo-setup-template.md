# App Repo Setup Template

## Checklist for New Application Repos
Use this checklist when setting up a new repo to work with ForgeOps.

1. Register the repo in forgeops-config.json (see how-to-register-a-repo.md).
2. Copy the matching workflow template to .github/workflows/ in the app repo.
3. Copy templates/CODEOWNERS.template to CODEOWNERS and update team names.
4. Create environment protection rules: Settings > Environments > add int, qa, stage, prod.
5. Add required reviewers for stage (2 reviewers) and prod (release engineer).
6. Enable branch protection on develop and main: require PR, require status checks.
7. Verify the first pipeline run passes on a test PR.

## File Structure Expected
```
app-repo/
  .github/
    workflows/
      ci-cd.yml          (copied from ForgeOps templates)
  CODEOWNERS
  src/
  tests/
```

## Validation
After setup, create a feature branch, push a small change, and open a PR to develop.
Confirm that lint, test, scan, and deploy-to-INT all run successfully.
