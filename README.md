# Smart Timetable & Event Conflict Management System

A full-stack college timetable system with conflict detection, event booking, and role-based access control.

**Stack:** React 18 + Vite (frontend) · Express + TypeScript (backend) · MySQL

---

## Quick Start

### Prerequisites

- Node.js 18+ with npm
- MySQL 8.x running locally

### 1. Install dependencies

```bash
# From project root
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Create `backend/.env`

`backend/.env` is not committed. Create it from the example:

```bash
cp backend/.env.example backend/.env
```

Then set your MySQL credentials (and a random `JWT_SECRET`):

```
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_timetable
```

The database and all tables are **created automatically on first start** — nothing needs to be created manually.


### 3. Run the project

**Both servers in one terminal (recommended):**

```bash
npm run dev
```

**Or separate terminals:**

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

### 4. Open in browser

- **Frontend:** http://localhost:5173
- **Backend API:** http://127.0.0.1:4000
- **Health check:** http://127.0.0.1:4000/health

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nmims.edu | admin123 |
| Faculty | dr.sharma@nmims.edu | demo123 |
| Faculty | dr.patel@nmims.edu | demo123 |
| Student | rahul@nmims.edu | demo123 |
| Student | priya@nmims.edu | demo123 |
| Event Organiser | events@nmims.edu | demo123 |

The login page has a **"Demo accounts"** button that fills credentials automatically.

---

## Database Setup (manual, if needed)

```bash
cd backend
npm run db:setup        # creates DB + schema + seed data
```

Individual commands:

```bash
npm run db:schema       # tables only (drops + recreates)
npm run db:seed         # demo data only
npm run db:update-demo  # update existing DB to current demo names/emails (no schema drop)
```

Both commands create the database automatically if it does not exist. Use `db:update-demo` when you already have data and only need to align demo users with `seed.sql` (e.g. after renaming faculty/students in the project).

---

## Features

### Admin
- Live dashboard: stats, pending bookings, pending registrations, faculty requests
- Timetable management: create/edit/delete entries, auto-generate, CSV import
- Conflict detection with alternative slot suggestions
- Room management (CRUD)
- Booking approval/rejection/apply-alternative
- User management (approve/reject registrations)
- Academic data: departments, semesters, divisions, subjects, faculty assignments
- File upload (up to 20 MB)
- Reports page

### Faculty
- View assigned timetable
- Submit timetable change requests with preferred slot
- Track request status and admin responses

### Student
- View class timetable for enrolled division

### Event Organiser
- Check room availability before booking (conflict vs. timetable + existing bookings)
- Submit room booking requests
- View booking status: pending / approved / rejected

---

## Project Structure

```
tt system/
├── backend/              Express + TypeScript API
│   ├── src/
│   │   ├── config/       DB pool + auto-init + env config
│   │   ├── controllers/  Route handlers (auth, academic, timetable, bookings…)
│   │   ├── middleware/   JWT auth middleware + role guard
│   │   ├── routes/       Single API router (index.ts)
│   │   ├── services/     Conflict detection, timetable generator, notifications
│   │   ├── scripts/      runSql.ts — schema/seed runner (auto-creates DB)
│   │   └── utils/        JWT helpers, time-slot math
│   ├── sql/
│   │   ├── schema.sql    15-table MySQL schema
│   │   └── seed.sql      Demo data for all roles
│   └── .env.example      Copy to .env and set your MySQL credentials
│
├── frontend/             React 18 + Vite + Tailwind + Radix UI
│   └── src/
│       ├── app/
│       │   ├── pages/    Role-based pages (admin/, faculty/, student/, organiser/, shared/)
│       │   ├── components/ Sidebar, Navbar, UI components
│       │   └── routes.tsx  React Router with role guards
│       ├── context/      AuthContext (JWT login + /auth/me)
│       └── lib/api.ts    Fetch wrapper with auth headers
│
└── package.json          Root: dev (both servers), install:all, db:setup
```

---

## API Summary

| Prefix | Purpose | Access |
|--------|---------|--------|
| `POST /api/auth/login` | Login → JWT | Public |
| `POST /api/auth/register` | Register (pending) | Public |
| `GET /api/auth/me` | Current user info | JWT |
| `GET /api/public/divisions` | Divisions for signup | Public |
| `GET /api/dashboard/admin` | Admin stats + pending items | Admin |
| `GET /api/dashboard/faculty` | Faculty schedule + requests | Faculty |
| `GET /api/dashboard/student` | Student schedule | Student |
| `GET /api/dashboard/organiser` | Organiser bookings | Organiser |
| `GET /api/timetable` | Filtered timetable | JWT (role-aware) |
| `POST /api/timetable/check` | Conflict check | Admin |
| `POST /api/timetable/generate` | Auto-generate | Admin |
| `POST /api/bookings/check` | Room availability check | Admin, Organiser |
| `POST /api/bookings` | Create booking request | Organiser |
| `PATCH /api/bookings/:id/decision` | Approve / reject | Admin |
| `PATCH /api/bookings/:id/apply-alternative` | Apply alt slot | Admin |
| `POST /api/requests/timetable-change` | Submit change request | Faculty |
| `GET /api/requests/timetable-change/:id/suggestions` | Get alt suggestions | Admin |
| `GET /api/notifications` | User notifications | JWT |
| `GET /api/rooms` | Room list | JWT |
| All academic CRUD | Departments, semesters, divisions, subjects, rooms | Admin |

---

## Production Build

```bash
npm run build
```

Outputs `frontend/dist/` and `backend/dist/`. Set `VITE_API_ORIGIN=http://your-backend-host:4000` if serving frontend statically without a reverse proxy.
