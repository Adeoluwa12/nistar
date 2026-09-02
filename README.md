# Nistar — Frontend

Nistar is a web-based **mental health community platform**. This repository is the
**React + TypeScript + Vite** frontend (a PWA). It talks to the separate
`nistar-api` (Express + MongoDB) backend over REST and Socket.IO.

Users can read and write community posts, find and chat with counselors, book
counseling sessions, receive notifications, and (for admins) moderate content and
manage users, departments and applications.

## Tech stack

- **React 19** + **TypeScript**, bundled with **Vite 8**
- **react-router-dom v7** for routing
- **Zustand** for auth state (persisted to `localStorage`)
- **TanStack Query** for server state / data fetching
- **Axios** HTTP client with a 401 → refresh-token interceptor
- **socket.io-client** for real-time chat, typing and presence
- **vite-plugin-pwa** for PWA support
- `lucide-react` icons, `react-hot-toast` notifications, `date-fns`

## Prerequisites

- Node.js 20+ (or 22+)
- npm (this project is standardized on **npm** / `package-lock.json` — do not
  commit `pnpm-lock.yaml` or `yarn.lock`)
- A running instance of the `nistar-api` backend

## Getting started

```bash
npm install
cp .env.example .env   # then edit values
npm run dev            # http://localhost:3000
```

## Environment variables

Create a `.env` file (it is git-ignored — never commit it). See `.env.example`:

| Variable                | Description                                            |
|-------------------------|--------------------------------------------------------|
| `VITE_API_BASE_URL`     | Base URL of the `nistar-api` backend (REST)            |
| `VITE_SOCKET_URL`       | Base URL for the Socket.IO connection                  |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (public; used for Google login) |

> Note: all `VITE_*` variables are embedded into the client bundle and are
> therefore **public**. Do not put server-side secrets here.

## Scripts

| Command           | Description                                        |
|-------------------|----------------------------------------------------|
| `npm run dev`     | Start the Vite dev server on port 3000             |
| `npm run build`   | Type-check (`tsc -b`) and build for production     |
| `npm run preview` | Preview the production build locally               |
| `npm run lint`    | Run ESLint over the project                        |

## Project structure

```
src/
├── main.tsx                 # App entry
├── App.tsx                  # Router, QueryClient, auth bootstrap, routes
├── index.css                # Global styles / design tokens
├── api/index.ts             # Axios instance + domain API clients + getMediaUrl
├── lib/
│   ├── errors.ts            # getErrorMessage() helper
│   └── socket.ts            # shared Socket.IO client (getSocket/disconnectSocket)
├── stores/authStore.ts      # Zustand auth store (persisted)
├── types/index.ts           # Shared TypeScript types
├── components/
│   ├── layout/              # AppLayout, ProtectedRoute
│   ├── posts/               # PostCard
│   └── shared/              # Avatar, Spinner
└── pages/
    ├── auth/                # login, register, forgot/reset, verify (one file)
    ├── app/                 # landing, feed, post, write, counselors, chat, etc.
    └── admin/               # AdminPage
```

## Routes

Public: `/login`, `/register`, `/forgot-password`, `/reset-password`,
`/verify-email`, `/` (landing), `/feed`, `/posts/:slug`, `/counselors`.

Authenticated: `/posts/new`, `/chat`, `/profile`, `/notifications`, `/sessions`,
`/change-password`.

Admin (`super_admin` / `department_admin`): `/admin`.

`ProtectedRoute` enforces authentication and optional role restrictions. Unknown
routes redirect to `/feed`.

## Notes

- The auth token is stored under `localStorage["nistar_token"]` and attached as a
  `Bearer` header; on `401` the Axios interceptor transparently refreshes it and
  retries the request, or clears the session and redirects to `/login`.
- Server media paths (e.g. `/uploads/...`) should be resolved with
  `getMediaUrl()` from `src/api` before use in `<img>`/`<a>`.
- On load, `AuthBootstrap` re-validates the persisted session via `/auth/me`.
