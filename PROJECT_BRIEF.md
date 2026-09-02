# Nistar – Project Brief

> A single source of truth for handing the Nistar mental health platform to another AI / teammate. Covers the `nistar` React frontend and the `nistar-api` Express backend, the architecture, data model, routes and key design decisions that have already been made.

---

## 1. Project Overview

**Nistar** is a web-based mental health community platform. It is split into two repositories:

- `nistar` — React + TypeScript + Vite frontend (PWA).
- `nistar-api` — Express + TypeScript + MongoDB backend.

The platform lets users read and write posts, find counselors, schedule sessions, chat in real time, receive notifications and get moderated by admins. Counselors have their own views and chat. Department admins and super admins manage users, posts, comments and departments.

---

## 2. Architecture & Tech Stack

### Frontend (`nistar`)

- **Framework:** React 19 with TypeScript
- **Bundler:** Vite 8
- **Routing:** `react-router-dom` v7
- **State:** Zustand (auth store, persisted to `localStorage`)
- **Server state:** TanStack Query (React Query)
- **HTTP:** Axios with an interceptor that refreshes JWTs on `401`
- **Real-time:** `socket.io-client`
- **UI:** Tailwind-style CSS in `src/index.css`, `lucide-react` icons, `react-hot-toast`
- **PWA:** `vite-plugin-pwa` with manifest in `vite.config.ts`
- **Dev port:** `3000`

Key files:

- `src/App.tsx` — router setup, query client, protected routes, admin roles
- `src/api/index.ts` — all API clients grouped by domain
- `src/stores/authStore.ts` — Zustand auth store
- `src/types/index.ts` — shared frontend TypeScript types

### Backend (`nistar-api`)

- **Runtime:** Node.js + Express 4
- **Language:** TypeScript (`tsc` build)
- **Database:** MongoDB via Mongoose 8
- **Auth:** JWT access + refresh tokens, bcrypt-hashed passwords, Google OAuth `idToken` flow
- **Real-time:** Socket.IO mounted on the same HTTP server
- **Email:** Nodemailer (verification + password reset)
- **Uploads:** Multer + Sharp for image uploads, served from `/uploads`
- **Security:** Helmet, CORS, express-mongo-sanitize, express-rate-limit
- **Logging:** Winston + Morgan
- **Dev port:** `5000`

Key files:

- `src/index.ts` — bootstraps DB, HTTP server and Socket.IO
- `src/app.ts` — middleware stack and route mounting
- `src/routes/index.ts` + `src/routes/auth.routes.ts` — all REST routes
- `src/models/index.ts`, `User.ts`, `Post.ts`, `Department.ts` — Mongoose schemas
- `src/services/socket.service.ts` — WebSocket chat/call/online presence

---

## 3. Project Structure

### `nistar` (frontend)

```
nistar/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── api/index.ts          # Axios clients per domain
│   ├── stores/authStore.ts   # Zustand auth state
│   ├── types/index.ts        # Shared TS types
│   ├── components/
│   │   ├── layout/
│   │   ├── posts/
│   │   └── shared/
│   └── pages/
│       ├── auth/             # login, register, forgot/reset, verify
│       ├── app/              # landing, feed, post, write, counselors, chat, profile, etc.
│       └── admin/            # AdminPage.tsx
```

### `nistar-api` (backend)

```
nistar-api/
├── src/
│   ├── index.ts              # Server bootstrap
│   ├── app.ts                # Express app + middleware
│   ├── config/database.ts    # MongoDB connection
│   ├── routes/
│   │   ├── auth.routes.ts    # Auth-specific routes
│   │   └── index.ts          # All other routers
│   ├── controllers/          # Business logic (auth, post, comment, counselor, chat, user, admin)
│   ├── models/               # Mongoose models
│   ├── middleware/           # auth, error, upload
│   ├── services/socket.service.ts
│   ├── types/index.ts        # Shared backend TS types
│   └── utils/                # jwt, logger, response, upload helpers
```

---

## 4. Data Model

Stored in MongoDB. Main collections:

| Collection | Purpose |
|------------|---------|
| `users`    | Users, counselors, department admins, super admins |
| `posts`    | Community articles / stories |
| `comments` | Comments on posts (pending/approved/rejected) |
| `departments` | Counselor departments |
| `conversations` | One-to-one user–counselor chat threads |
| `messages` | Chat messages (text / image / file / system) |
| `sessions` | Scheduled counseling sessions |
| `notifications` | In-app notifications |

### User roles

- `user` — regular member
- `counselor` — can have a department, chat, manage sessions
- `department_admin` — can manage users / posts / comments / departments (read), but not create super users
- `super_admin` — full admin control

### User statuses

`active`, `inactive`, `suspended`, `pending_verification`.

---

## 5. Frontend Routes

All routes are declared in `nistar/src/App.tsx`.

| Path | Page | Auth |
|------|------|------|
| `/login` | `LoginPage` | Public |
| `/register` | `RegisterPage` | Public |
| `/forgot-password` | `ForgotPasswordPage` | Public |
| `/reset-password` | `ResetPasswordPage` | Public |
| `/verify-email` | `VerifyEmailPage` | Public |
| `/` | `LandingPage` | Public (inside `AppLayout`) |
| `/feed` | `FeedPage` | Public |
| `/posts/:slug` | `PostPage` | Public |
| `/counselors` | `CounselorsPage` | Public |
| `/posts/new` | `WritePostPage` / `CreatePostPage` | Authenticated |
| `/chat` | `ChatPage` | Authenticated |
| `/profile` | `ProfilePage` | Authenticated |
| `/notifications` | `NotificationsPage` | Authenticated |
| `/sessions` | `SessionsPage` | Authenticated |
| `/change-password` | `ChangePasswordPage` | Authenticated |
| `/admin` | `AdminPage` | `super_admin` or `department_admin` |
| `*` | Redirects to `/feed` | — |

`ProtectedRoute` in `src/components/layout/ProtectedRoute` enforces login and optional `roles`.

---

## 6. Backend API Routes

Base path for all: `/api` (mounted in `src/app.ts`).

### Auth (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new user (email + password) |
| POST | `/login` | Local login, sets JWT access/refresh tokens |
| POST | `/google` | Google sign-in via `idToken` |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout (authenticated) |
| GET  | `/me` | Get current user |
| GET  | `/verify-email` | Verify email by token |
| POST | `/resend-verification` | Resend verification email |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Reset password with token |
| PUT  | `/change-password` | Change current password (authenticated) |

### Posts (`/api/posts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List published posts (`optionalAuth`) |
| GET | `/my-posts` | Current user's posts |
| GET | `/:slug` | Get a single post by slug |
| POST | `/` | Create a post with optional cover image |
| PUT | `/:id` | Update a post |
| DELETE | `/:id` | Delete a post |
| POST | `/:id/like` | Like / unlike a post |
| POST | `/:id/share` | Share / increment share count |

### Comments (`/api/comments`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/post/:postId` | Get comments for a post |
| POST | `/` | Add a comment |
| POST | `/:id/like` | Like a comment |
| DELETE | `/:id` | Delete a comment |

### Counselors (`/api/counselors`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List counselors |
| GET | `/:id` | Get counselor profile |
| POST | `/request` | Request a counselor or department assignment |
| GET | `/my-users` | Counselor's assigned users |

### Sessions (`/api/sessions`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/my` | My sessions (user or counselor) |
| POST | `/` | Schedule a session with a counselor |
| PUT | `/:id/cancel` | Cancel a session |
| PUT | `/:id/rate` | Rate / review a completed session |

### Chat (`/api/chat`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations` | List my conversations |
| GET | `/conversations/:id/messages` | Get messages for a conversation |
| POST | `/conversations/:id/messages` | Send a message / image |

### Users (`/api/users`)

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/profile` | Update own profile with avatar |
| PUT | `/counselor-profile` | Update counselor profile (counselor+) |
| GET | `/notifications` | Get notifications |
| PUT | `/notifications/read-all` | Mark all read |
| PUT | `/notifications/:id/read` | Mark one read |

### Admin (`/api/admin`)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | Admin+ | Dashboard stats |
| GET | `/users` | Admin+ | List / search users |
| PUT | `/users/:id/status` | Admin+ | Update user status |
| DELETE | `/users/:id` | Super admin | Delete user |
| POST | `/counselors` | Super admin | Create counselor |
| POST | `/department-admins` | Super admin | Create department admin |
| GET | `/posts` | Admin+ | Get all posts |
| PUT | `/posts/:id/status` | Admin+ | Moderate post status |
| GET | `/comments/pending` | Admin+ | Get pending comments |
| PUT | `/comments/:id/moderate` | Admin+ | Approve/reject comment |
| GET | `/departments` | Admin+ | List departments |
| POST | `/departments` | Super admin | Create department |
| PUT | `/departments/:id` | Super admin | Update department |

Also: `GET /health` health check, `/uploads` static files.

---

## 7. Real-Time (Socket.IO)

Implemented in `nistar-api/src/services/socket.service.ts` and consumed by the frontend `socket.io-client`.

- **Auth handshake:** JWT verified on connection.
- **Rooms:** users join `user:<id>` and `conv:<conversationId>` rooms.
- **Events:**
  - `conversation:join` / `conversation:leave`
  - `message:send` / `message:new`
  - `typing:start` / `typing:stop`
  - `messages:read`
  - `user:online` / `user:offline`
  - `notification:message`
  - `call:initiate`, `call:answer`, `call:ice-candidate`, `call:end`

---

## 8. Key Features Built So Far

- Email/password auth with verification and forgot/reset password
- Google OAuth login
- JWT access/refresh tokens (Bearer header and cookie support)
- Role-based access control (user, counselor, department_admin, super_admin)
- Post CRUD with anonymous option, likes, shares, drafts and admin moderation
- Comment system with pending/approved/rejected moderation
- Counselor directory, request flow and department grouping
- 1-on-1 chat with real-time messages, typing, read receipts and online presence
- Call signaling sockets (WebRTC peer-to-peer building blocks)
- Session scheduling, cancellation and ratings
- Notifications (chat and platform)
- Admin dashboard for user/post/comment/department management
- Image upload (avatars, cover images, chat images)
- PWA support

---

## 9. Design Decisions

1. **Monorepo-ish split but not a monorepo:** The frontend and backend live in sibling repositories (`nistar` and `nistar-api`) and are wired together via `VITE_API_BASE_URL` / `CLIENT_URL` env vars.
2. **Shared HTTP server for WebSockets:** Socket.IO is mounted on the same `http.Server` as Express, so only one port is needed for both REST and real-time.
3. **JWT stored in `localStorage` on the client:** The frontend stores the access token as `nistar_token` and refreshes silently on `401`. The backend also supports cookies.
4. **Role hierarchy:** `super_admin > department_admin > counselor > user`. Middleware `requireAdmin` accepts `department_admin` and `super_admin`; `requireSuperAdmin` is stricter.
5. **Comments require approval:** New comments default to `pending` and are surfaced in the admin panel for moderation before becoming public.
6. **Posts have states:** `draft`, `published`, `archived`. Authors can save drafts; admins can change status.
7. **Slugs are auto-generated:** `slugify` runs on `Post` and `Department` `pre('save')` hooks.
8. **Uploads are local static files:** `/uploads` is served as a static directory; `MAX_FILE_SIZE` is configurable.
9. **Zustand for local auth state, React Query for server state:** Keeps auth separate from async data fetching.
10. **PWA first:** The Vite PWA manifest and service worker are configured out of the box.

---

## 10. Environment Variables

### `nistar` (frontend)

```
VITE_API_BASE_URL=https://nistar-api.onrender.com
VITE_SOCKET_URL=https://nistar-api.onrender.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### `nistar-api` (backend)

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nistar
JWT_SECRET=...
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=Nistar <noreply@nistar.app>
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
SUPER_ADMIN_EMAIL=superadmin@nistar.app
SUPER_ADMIN_PASSWORD=...
SUPER_ADMIN_NAME=Super Admin
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## 11. Common Commands

### Frontend

```bash
cd nistar
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

### Backend

```bash
cd nistar-api
npm install
npm run dev     # http://localhost:5000
npm run build
npm start
npm run setup   # seed super admin / setup
```

---

## 12. Notes for an AI Continuing This Project

- All backend controllers return `{ success, message?, data?, error? }` shapes via `sendError` / `sendSuccess` helpers.
- The backend uses `AuthRequest` from `src/types/index.ts` to attach `req.user`.
- Many route handlers are cast with `rh()` to satisfy TypeScript when `AuthRequest` is not fully accepted by Express typings.
- Frontend images may come back as a relative `/uploads/...` path; use `getMediaUrl()` from `src/api/index.ts`.
- Super admin seeding is handled by the `npm run setup` script.
- The project is currently intended for local dev and Render deployment; the frontend `.env.example` already points at a Render backend URL.
