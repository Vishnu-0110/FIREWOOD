# Vijaya Lakshmi Firewood Billing & Load Management System

Full-stack billing and load management platform for firewood supply operations.

## Stack
- Frontend: React + Vite, Bootstrap, React Router, Redux Toolkit, Axios, Recharts
- Backend: Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcrypt, Helmet

## Local Setup
1. Clone the repo.
2. Install all dependencies from root:
   - `npm run install:all`
3. Backend setup:
   - copy `server/.env.example` to `server/.env`
   - fill all values in `.env`
   - run `npm run dev:server`
4. Frontend setup:
   - copy `client/.env.example` to `client/.env`
   - run `npm run dev:client`
5. Open `http://localhost:5173`

## Pre-Deploy Validation
Run this before every deployment from repo root:
- `npm run deploy:check`
- `npm run audit:deploy`
- `npm run deploy:gate` (strict full check with live URLs)

`deploy:check` validates backend environment variables and builds the frontend bundle.
`audit:deploy` adds deployment audit checks (Vercel SPA fallback, Render blueprint sanity checks, frontend API variable setup, and optional live URL probes).
`deploy:gate` is the final strict gate and fails unless both deployed URLs are provided and healthy.

### Deployment Audit (Optional Live Probes)
To validate the actual deployed URLs (Vercel + Render), run:

- Bash:
  - `AUDIT_FRONTEND_URL=https://<your-vercel-project>.vercel.app AUDIT_API_URL=https://<your-render-service>.onrender.com npm run audit:deploy`
- PowerShell:
  - `$env:AUDIT_FRONTEND_URL='https://<your-vercel-project>.vercel.app'; $env:AUDIT_API_URL='https://<your-render-service>.onrender.com'; npm run audit:deploy`

For strict mode (warnings fail the run):

- Bash:
  - `AUDIT_FRONTEND_URL=https://<your-vercel-project>.vercel.app AUDIT_API_URL=https://<your-render-service>.onrender.com npm run audit:deploy:strict`
- PowerShell:
  - `$env:AUDIT_FRONTEND_URL='https://<your-vercel-project>.vercel.app'; $env:AUDIT_API_URL='https://<your-render-service>.onrender.com'; npm run audit:deploy:strict`

For full live gate mode (recommended before sharing production URL):

- Bash:
  - `AUDIT_FRONTEND_URL=https://<your-vercel-project>.vercel.app AUDIT_API_URL=https://<your-render-service>.onrender.com npm run deploy:gate`
- PowerShell:
  - `$env:AUDIT_FRONTEND_URL='https://<your-vercel-project>.vercel.app'; $env:AUDIT_API_URL='https://<your-render-service>.onrender.com'; npm run deploy:gate`

The audit writes a JSON report to `reports/deployment-audit-report.json`.

## Production Checklist
- Use Node.js `22` (see `.nvmrc`).
- Set `JWT_SECRET` to at least 32 characters.
- Set `CORS_ORIGIN` to exact frontend URL(s), comma-separated. Do not use `*`.
- Verify readiness endpoints after deploy:
  - `/health`
  - `/ready`

## Deploy Option A (Render API + Vercel Frontend)
1. Push code to GitHub.
2. Deploy backend on Render using `render.yaml` (Blueprint) or manual setup with `Root Directory=server`.
3. Set required backend env vars:
   - `MONGO_URI`
   - `JWT_SECRET` (minimum 32 chars)
   - `JWT_EXPIRE=1d`
   - `CORS_ORIGIN=https://<your-vercel-domain>`
   - `SEED_ADMIN_NAME`
   - `SEED_ADMIN_EMAIL`
   - `SEED_ADMIN_PASSWORD`
   - `NODE_ENV=production`
4. Deploy frontend on Vercel with `Root Directory=client` and:
   - `VITE_API_URL=https://<render-service>.onrender.com/api`
5. Seed admin once on backend:
   - `npm run seed` (from Render shell)
6. Verify:
   - `https://<render-service>.onrender.com/health`
   - `https://<render-service>.onrender.com/ready`
   - Login and load dashboard/customers/invoices from frontend.

## Deploy Option B (Docker)
1. Configure `server/.env` with production values.
2. Run:
   - `docker compose up --build -d`
3. Verify:
   - API: `http://localhost:5000/health`
   - Frontend: `http://localhost:8080`
   - Container health: `docker compose ps`

## CI Deployment Guard
- GitHub Actions workflow: `.github/workflows/deploy-readiness.yml`
- It runs install + `npm run audit:deploy` on pushes/PRs to prevent broken deployment config from being merged.

## Beginner Step-by-Step Deployment (Render + Vercel)
Use this if you are deploying for the first time.

### 1. Prepare accounts
1. Create/login to GitHub.
2. Create/login to Render: https://render.com
3. Create/login to Vercel: https://vercel.com
4. Create/login to MongoDB Atlas: https://www.mongodb.com/atlas

### 2. Create MongoDB Atlas database
1. In Atlas, create a project.
2. Create a free cluster.
3. Go to **Database Access** and add a DB user (username + password).
4. Go to **Network Access** and allow IP access:
   - for quick start use `0.0.0.0/0`
   - later tighten this for security.
5. Open **Clusters -> Connect -> Drivers** and copy Mongo connection string.
6. Replace placeholders in URI:
   - `<username>`
   - `<password>`
   - database name (for example `firewood`)

### 3. Push code to GitHub
1. Open terminal at repo root.
2. Run:
   - `git add .`
   - `git commit -m "prepare deployment"`
   - `git push`
3. Confirm GitHub has latest commit.

### 4. Deploy backend on Render
You can use Blueprint (`render.yaml`) or manual setup. Blueprint is easier here.

1. In Render dashboard click **New + -> Blueprint**.
2. Connect your GitHub repo.
3. Select this repo and continue.
4. Render reads `render.yaml` and creates `firewood-api`.
5. Open the new service and set environment variables:
   - `MONGO_URI` = your Atlas URI
   - `JWT_SECRET` = long random string (32+ chars)
   - `JWT_EXPIRE` = `1d`
   - `CORS_ORIGIN` = your Vercel URL (set after frontend deploy; temporary value allowed first)
   - `SEED_ADMIN_NAME`
   - `SEED_ADMIN_EMAIL`
   - `SEED_ADMIN_PASSWORD`
   - `NODE_ENV` = `production`
6. Save and trigger deploy.
7. Wait until Render status is **Live**.
8. Test backend in browser:
   - `https://<your-render-service>.onrender.com/health`
   - `https://<your-render-service>.onrender.com/ready`

### 5. Seed first admin user on Render
1. Open Render service shell/console (available on paid plans).
2. Run:
   - `npm run seed`
3. If seed succeeds, admin login is ready.
4. If shell is unavailable on your plan, run from your local machine:
   - set `MONGO_URI`, `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
   - run `npm run seed --prefix server`

### 6. Deploy frontend on Vercel
1. In Vercel click **Add New -> Project**.
2. Import same GitHub repository.
3. Set **Root Directory** to `client`.
4. Framework should auto-detect as **Vite**.
5. Set environment variable:
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api`
6. Deploy project.
7. Wait until deployment is finished.
8. Open frontend URL:
   - `https://<your-vercel-project>.vercel.app`

### 7. Final CORS update in Render
1. Go back to Render service env vars.
2. Set `CORS_ORIGIN` to exact Vercel URL:
   - `https://<your-vercel-project>.vercel.app`
3. If you have multiple frontend domains, comma-separate them.
4. Redeploy Render service.

### 8. Run deployment checks (important)
From repo root, run:

1. Static checks:
   - `npm run deploy:check`
2. Audit checks:
   - `npm run audit:deploy`
3. Full strict live gate:
   - PowerShell:
     - `$env:AUDIT_FRONTEND_URL='https://<your-vercel-project>.vercel.app'`
     - `$env:AUDIT_API_URL='https://<your-render-service>.onrender.com'`
     - `npm run deploy:gate`

If `deploy:gate` passes, deployment is healthy and verified.

### 9. Smoke test in browser
1. Open Vercel app and login with seeded admin credentials.
2. Open Dashboard, Customers, Invoice pages.
3. Create a test customer.
4. Create a test invoice.
5. Print/download invoice PDF.
6. Confirm data appears in history and dashboard totals.

### 10. Common mistakes and fixes
1. **Frontend shows network error**:
   - check `VITE_API_URL` in Vercel env vars.
2. **CORS error in browser console**:
   - set correct `CORS_ORIGIN` in Render.
3. **Backend 500 error**:
   - verify `MONGO_URI`, `JWT_SECRET`, Atlas access.
4. **Direct route refresh gives 404 on Vercel**:
   - keep `client/vercel.json` rewrite as-is.
5. **Login fails after deploy**:
   - run `npm run seed` once in Render shell.

## API Routes
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Customers
- `POST /api/customers`
- `GET /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

### Invoices
- `POST /api/invoices`
- `GET /api/invoices`
- `GET /api/invoices/:id`
- `PUT /api/invoices/:id`
- `DELETE /api/invoices/:id`
- `GET /api/invoices/export/excel`

### Dashboard
- `GET /api/dashboard/stats`

### Backup
- `GET /api/backup/db`
