# Vijaya Lakshmi Firewood Billing & Load Management System

Production-ready full-stack billing and load management platform for firewood supply operations.

## Stack
- Frontend: React + Vite, Bootstrap 5, React Router, React Hook Form, Axios, Recharts, jsPDF
- Backend: Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcrypt, Helmet, rate limiting, validation

## Features
- JWT authentication with protected routes and auto logout on token expiry
- Customer management (CRUD with soft delete)
- Invoice management (create/edit/delete/history/search/date filtering/pagination)
- Auto invoice number generation with duplicate prevention
- Net weight and total billing auto-calculation
- Indian currency amount-in-words generation
- Professional A4 invoice PDF generation and print support
- Dashboard analytics (summary cards, line/bar/pie charts, top customers, recent invoices)
- Invoice Excel export (client-side and server-side)
- Backup endpoint for customer/invoice/audit snapshots
- Audit log tracking for key actions
- Dark mode toggle

## Project Structure
- `server/` Express API + MongoDB models and controllers
- `client/` React frontend

## Backend Setup
1. `cd server`
2. `cp .env.example .env` (or create `.env` manually)
3. Fill env values:
   - `PORT=5000`
   - `MONGO_URI=<mongo atlas uri>`
   - `JWT_SECRET=<strong secret>`
   - `JWT_EXPIRE=1d`
   - `CORS_ORIGIN=http://localhost:5173`
4. Seed admin user (optional): `npm run seed`
5. Start API: `npm run dev`

## Frontend Setup
1. `cd client`
2. `cp .env.example .env`
3. Set `VITE_API_URL=http://localhost:5000/api`
4. Start app: `npm run dev`

## API Routes
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

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

## Build for Production
- Frontend: `cd client && npm run build`
- Backend: `cd server && npm start`

Deploy backend on Render and frontend on Vercel/Netlify with env variables configured.