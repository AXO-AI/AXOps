# How to Register a Repo

## Steps
1. Open forgeops-config.json in the ForgeOps repo.
2. Find the project your repo belongs to (or create a new project entry).
3. Add the repo name to the "repos" array for that project.
4. Commit and push to main.
5. The dashboard data workflow will pick up the new repo within 15 minutes.

## Choose Your Template
Copy the right workflow from templates/workflows/ to your repo as .github/workflows/ci.yml:

| Technology | Template File |
|-----------|--------------|
| Java (Spring Boot, Gradle) | templates/workflows/java-webapp.yml |
| JavaScript (React, Node) | templates/workflows/javascript-webapp.yml |
| UiPath RPA | templates/workflows/uipath-rpa.yml |
| System Integration (Java) | templates/workflows/system-integration.yml |
| Salesforce (Apex, LWC) | templates/workflows/salesforce.yml |
| Informatica (ETL) | templates/workflows/informatica.yml |

## After Registration
- Copy the template to your repo as .github/workflows/ci.yml
- Change APP_NAME at the top to your repo name
- Create branches: int, qa, stage (main already exists)
- Configure environment protection rules in repo Settings
- Add CODEOWNERS file (use templates/CODEOWNERS.template)
