# ForgeOps Command Center
## Project Registry
forgeops-config.json defines all projects, repos, teams, and templates.
## Dashboard Data
generate-dashboard-data.yml runs every 15 minutes, fetches pipeline status for all registered repos, writes dashboard-data.json.
## Bulk Operations
dispatch-bulk-action.yml triggers workflows across all repos in a project. Create an issue titled "[FORGEOPS] deploy java-backend qa" to deploy all Java backend repos to QA.
