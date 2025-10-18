# CI/CD and Deployment (GitHub Actions + Ansible + Yandex Cloud)

This repository includes two GitHub Actions workflows:

- .github/workflows/ci.yml — CI pipeline that installs dependencies, lints, type-checks the backend, builds the frontend, and runs a minimal smoke test using ts-node (ephemeral, not committed).
- .github/workflows/deploy.yml — Deploy pipeline driven by Ansible that connects over SSH to your Yandex Cloud VM and deploys the app (backend runs in a Docker container; frontend is synced to Nginx web root).

## Prerequisites

- A Yandex Cloud VM accessible via public IP over SSH.
- Ubuntu/Debian host (playbook uses apt).
- GitHub repository secrets configured:
  - YC_HOST — target VM IP or hostname.
  - YC_SSH_USER — SSH username (e.g., ubuntu).
  - YC_SSH_KEY — private key for SSH (PEM content).
  - Optional:
    - REDIS_URL — e.g., redis://localhost:6379 (or your managed Redis).
    - DATABASE_URL — e.g., postgres://trade:trade@localhost:5432/trade

## CI Pipeline

Triggers on pushes/PRs to main/master.
Steps:
- npm ci
- npm run lint (root)
- npm run build (backend type-check)
- npm run build --workspace packages/frontend (frontend bundle)
- Ephemeral smoke test via ts-node

Artifacts:
- frontend-build: packages/frontend/build/
- openapi: packages/backend/openapi.json (if present)

## Deploy Pipeline

Triggers: manual (workflow_dispatch) or push to main touching relevant files.

High-level flow:
1) Build in CI runner (Node 20).
2) Setup Python and Ansible.
3) Create inventory dynamically from GitHub secrets.
4) Render extra vars file.
5) Run deploy/site.yml against the host group `trade`.

### Playbook actions
- Ensures Docker is installed and running.
- Creates backend workdir (/opt/trade by default), writes .env with provided variables.
- Runs backend container using node:20-slim image with `npm ci && npm run start --workspace packages/backend` (adjust as needed if you move to Docker images).
- Ensures Nginx is installed and configured to serve the frontend build at /var/www/trade and proxy /api/ to backend.

### Customization
- Variables in deploy/extra_vars.yml created in the workflow control ports, paths, and env.
- To use Postgres instead of SQLite, set DATABASE_URL in GitHub Secrets and ensure your backend supports it.

### Running Deploy
- Manual: Actions -> Deploy -> Run workflow -> choose environment.
- Automatic: push to main with changes in packages/**, Dockerfile, deploy/**.

### Notes
- For production, consider building and pushing a Docker image to a container registry (Yandex Container Registry) and changing `backend_image` and container `command` accordingly.
- The provided Ansible playbook is minimal and intended as a starting point; hardening (firewall, SSL, users) is out of scope.
