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

This validates backend environment variables and builds the frontend bundle.

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
