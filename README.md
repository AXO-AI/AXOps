# AXOps

**Enterprise DevSecOps Command Center**

Unified delivery, security, and operations management for engineering teams.

## Modules

| Module | Description |
|--------|-------------|
| **Overview** | Dashboard with repo count, tickets, pipeline health, policy compliance |
| **Commit** | Jira ticket browser, branch creation, file editor, commit & push |
| **Merge** | Branch comparison, cherry-pick mode, SCA scan, approval workflow |
| **CI/CD** | Builds, deploy, environment compare, approvals, deployment history |
| **Pipelines** | Visual pipeline builder, template library, YAML generator |
| **Security** | SCA vulnerability scanning with severity gating |
| **Policies** | 7-category policy engine with enforcement, secret rotation, freeze windows |
| **Meetings** | AI transcript analysis with action items and decisions |
| **Notifications** | Teams notification management |
| **Team** | Member management with role-based permissions |
| **Support** | Internal ticket management with priority routing |
| **Settings** | Integration config, environment profiles, SCA policy |

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Netlify Functions (serverless)
- **APIs:** GitHub REST API, Jira Cloud API v3, Anthropic Claude API
- **Auth:** GitHub App (15K req/hr) with PAT fallback

## Quick Start

```bash
npm install && cd frontend && npm install && cd ..
cd frontend && npm run dev
```

## Deploy to Netlify

1. Connect GitHub repo to Netlify
2. Build command: `npm install && cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Set environment variables from `.env.example`

## Environment Variables

See [.env.example](.env.example) for the full list.
