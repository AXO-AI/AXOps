# Migration to Self-Hosted Runners

## When to Migrate
- GitHub-hosted runner minutes exceed budget
- Builds require access to internal network resources
- Compliance requires builds to run on-premises
- Build times exceed 30 minutes and need faster hardware

## Prerequisites
- Linux VM or container with Docker installed
- Network access to GitHub, artifact registries, and deploy targets
- GitHub Actions runner agent installed

## Steps

### 1. Install the runner
Follow GitHub docs: Settings > Actions > Runners > New self-hosted runner.

### 2. Update workflow files
Replace `runs-on: ubuntu-latest` with `runs-on: self-hosted` in all workflows:
```bash
sed -i 's/runs-on: ubuntu-latest/runs-on: self-hosted/g' .github/workflows/*.yml
```

### 3. Update reusable workflows
```bash
sed -i 's/runs-on: ubuntu-latest/runs-on: self-hosted/g' .github/workflows/reusable-*.yml
```

### 4. Add runner labels (optional)
Use labels to route jobs to specific runners:
```yaml
runs-on: [self-hosted, linux, x64]
```

### 5. Test
Run a pipeline end-to-end on the self-hosted runner before switching all repos.

## Rollback
Revert the sed commands to switch back to `ubuntu-latest`.
