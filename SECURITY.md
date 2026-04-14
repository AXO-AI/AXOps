# Security Policy
## Reporting
Use the Security Vulnerability issue template. Do NOT post details publicly.
## Practices
- Secrets stored in GitHub Organization Secrets (encrypted at rest)
- No secrets logged or written to artifacts
- Dependabot auto-updates GitHub Actions dependencies
- Self-healing workflow validates integrity every 6 hours
- Dashboard uses read-only GitHub API (no auth tokens stored server-side)
