# Vijaya Lakshmi Firewood Billing & Load Management System

Full-stack billing and load management platform for firewood supply operations.

## Stack
- Frontend: React + Vite, Bootstrap, React Router, Redux Toolkit, Axios, Recharts
- Backend: Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcrypt, Helmet

## Local Setup
1. Clone the repo.
2. Backend setup:
   - `cd server`
   - copy `server/.env.example` to `server/.env`
   - fill all values in `.env`
   - install and run:
     - `npm install`
     - `npm run seed` (creates admin user if missing)
     - `npm run dev`
3. Frontend setup:
   - `cd client`
   - copy `client/.env.example` to `client/.env`
   - install and run:
     - `npm install`
     - `npm run dev`
4. Open `http://localhost:5173`

## Deploy Step By Step (Render + Vercel)
1. Push code to GitHub.
2. Deploy backend on Render:
   - Create `Web Service`
   - Select repo and set `Root Directory` = `server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add env vars:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `JWT_EXPIRE=1d`
     - `CORS_ORIGIN=https://<your-vercel-domain>`
     - `SEED_ADMIN_NAME`
     - `SEED_ADMIN_EMAIL`
     - `SEED_ADMIN_PASSWORD`
     - `NODE_ENV=production`
   - Deploy and verify:
     - `https://<render-service>.onrender.com/health`
     - `https://<render-service>.onrender.com/api/health`
3. Seed admin on Render (one time):
   - Open Render service shell
   - Run `npm run seed`
4. Deploy frontend on Vercel:
   - Create project from same repo
   - Set `Root Directory` = `client`
   - Add env var:
     - `VITE_API_URL=https://<render-service>.onrender.com/api`
   - Deploy
5. Update backend CORS to final frontend URL:
   - In Render env vars, set `CORS_ORIGIN=https://<final-vercel-domain>`
   - Redeploy backend
6. Final verification:
   - Login from Vercel URL
   - Open Dashboard, Customers, Invoices
   - Confirm requests return `200` in browser network tab

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
