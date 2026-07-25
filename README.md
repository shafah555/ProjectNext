# ProjectNext

A full-stack collaborative project management tool (Trello/Asana-style) with real-time updates.

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express + Socket.io
- **Database:** PostgreSQL (Supabase)
- **Auth:** JWT (email + password, bcrypt-hashed)
- **Real-time:** WebSockets via Socket.io (live task moves, comments, notifications)

## Features

- Register / log in with a JWT-protected session
- Create projects and invite teammates by email (roles: owner, admin, member)
- Kanban board per project: To Do / In Progress / In Review / Done, drag-and-drop between columns
- Task cards with priority, assignee, due date
- Comment threads on each task, with a live "typing…" indicator
- Real-time updates: when anyone moves a task, comments, or gets assigned, everyone on the board sees it instantly — no refresh
- In-app notification bell (task assigned, commented on, invited to a project)

## Project structure

```
project-next/
├── backend/          Node.js + Express API and Socket.io server
│   ├── db/schema.sql  Run this in Supabase to create all tables
│   └── src/
├── frontend/         React + Vite + Tailwind app
│   └── src/
└── README.md         (this file)
```

---

## 1. Run it locally first

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) account (for Postgres) — or any Postgres instance

### 1a. Create the database (Supabase)
1. Create a new project at supabase.com.
2. Go to **SQL Editor → New query**, paste the contents of `backend/db/schema.sql`, and run it. This creates the `users`, `projects`, `project_members`, `tasks`, `comments`, and `notifications` tables.
3. Go to **Project Settings → Database → Connection string → URI**. Copy it — you'll use it as `DATABASE_URL`.

### 1b. Backend
```bash
cd backend
cp .env.example .env
# edit .env: paste your Supabase DATABASE_URL, and set a random JWT_SECRET
npm install
npm run dev
```
The API + WebSocket server runs on `http://localhost:5000`.

### 1c. Frontend
```bash
cd frontend
cp .env.example .env
# .env should have: VITE_API_URL=http://localhost:5000
npm install
npm run dev
```
Open `http://localhost:5173`. Register two accounts (e.g. in two browser windows) to try real-time updates and comments between "teammates".

---

## 2. Push the code to GitHub

From the `project-next` folder:

```bash
git init
git add .
git commit -m "Initial commit: ProjectNext full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/projectnext.git
git push -u origin main
```

(Create the empty `projectnext` repo on GitHub first, via github.com/new — don't initialize it with a README so the push above doesn't conflict.)

---

## 3. Set up the database on Supabase (production)

If you haven't already done step 1a, do it now — the same Supabase project is used for both local dev and production. Free tier is enough to run this app.

Keep your `DATABASE_URL` handy; you'll paste it into the backend host's environment variables next.

---

## 4. Deploy the backend

**Important:** Vercel's serverless functions don't support long-lived WebSocket connections, so the Express + Socket.io backend needs a host that keeps a persistent Node process running. **Render** is the easiest free option and is what these steps use. (Railway or Fly.io work the same way if you prefer them.)

### Deploy on Render
1. Go to [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo.
2. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Add environment variables (Render dashboard → Environment):
   - `DATABASE_URL` = your Supabase connection string
   - `JWT_SECRET` = a long random string
   - `JWT_EXPIRES_IN` = `7d`
   - `NODE_ENV` = `production`
   - `CLIENT_ORIGIN` = your Vercel frontend URL (you'll get this in step 5 — you can update this env var afterward and Render will redeploy)
4. Deploy. Render gives you a URL like `https://projectnext-api.onrender.com` — this is your backend URL.

> Free Render web services spin down after inactivity and take ~30s to wake up on the next request — expected on the free tier, not a bug.

---

## 5. Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the same GitHub repo.
2. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable:
   - `VITE_API_URL` = your Render backend URL from step 4 (e.g. `https://projectnext-api.onrender.com`)
4. Deploy. Vercel gives you a URL like `https://projectnext.vercel.app`.
5. Go back to Render and update `CLIENT_ORIGIN` to this Vercel URL (comma-separate multiple origins if needed), so CORS and Socket.io accept requests from it.

---

## 6. Verify end to end

1. Open your Vercel URL, register an account.
2. Create a project, add a task, open it, add a comment.
3. Open the same project in an incognito window with a second account you've invited as a member — moving a task or commenting in one window should update the other instantly (Socket.io).

---

## Environment variable summary

**backend/.env**
```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
JWT_SECRET=long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-app.vercel.app
```

**frontend/.env**
```
VITE_API_URL=https://your-backend.onrender.com
```

## API overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, get JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | Projects the user belongs to |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project + members + tasks |
| PATCH | `/api/projects/:id` | Rename/describe project |
| DELETE | `/api/projects/:id` | Delete project (owner only) |
| POST | `/api/projects/:id/members` | Invite member by email |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |
| POST | `/api/projects/:id/tasks` | Create task |
| PATCH | `/api/projects/:id/tasks/:taskId` | Update task (status/assignee/etc.) |
| DELETE | `/api/projects/:id/tasks/:taskId` | Delete task |
| GET | `/api/tasks/:taskId/comments` | List comments |
| POST | `/api/tasks/:taskId/comments` | Add comment |
| DELETE | `/api/tasks/:taskId/comments/:commentId` | Delete own comment |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark one read |
| PATCH | `/api/notifications/read-all` | Mark all read |

## Socket.io events

Client connects with `auth: { token: <jwt> }`.

- `project:join` / `project:leave` — join/leave a board's room
- `task:created` / `task:updated` / `task:deleted` — broadcast to everyone viewing that project
- `comment:created` / `comment:deleted` — broadcast to everyone viewing that project
- `comment:typing` — ephemeral typing indicator
- `notification:new` — sent directly to the targeted user's personal room

## Notes & possible next steps
- Passwords are hashed with bcrypt; consider adding rate limiting (e.g. `express-rate-limit`) on `/api/auth/*` before going fully public.
- Add file attachments on tasks via Supabase Storage.
- Add email notifications (e.g. with Resend or Postmark) alongside in-app ones.
- Add automated tests (Jest/Supertest for the API, Vitest/RTL for the frontend).
