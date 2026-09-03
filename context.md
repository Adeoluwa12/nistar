# Nistar — Redesign Context Document

> **Purpose:** This document gives a complete picture of the Nistar mental health platform to anyone (human designer or AI model) tasked with redesigning the homepage and other pages. It covers what the product is, the current branding and design system, the file structure, what's built vs planned, and the specific aesthetic problems that need fixing.

---

## 1. What is Nistar?

**Nistar** is a web-based **mental health community platform** built as a PWA (Progressive Web App). It connects people who want to share their mental health stories with a community of readers, and with verified professional counselors for 1-on-1 support.

**Core value propositions:**
- **Community stories:** Users read and write posts about mental health experiences, anonymously if they choose.
- **Professional support:** Users find and chat with verified counselors, schedule sessions, and get real-time help.
- **Safety & moderation:** All content is moderated, counselors are verified, and the platform enforces strict confidentiality rules.

**Target audience:** People seeking mental health support — likely in the 18-45 age range, comfortable with web/apps, looking for a safe, non-clinical community space.

---

## 2. Current Branding & Visual Identity

### 2.1 Color Palette (CSS Variables in `src/index.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--white` | `#FFFFFF` | Backgrounds, cards |
| `--sage` | `#9CAF88` | Primary brand color, accents, active states |
| `--sage-dark` | `#6B8E5A` | Hover states, emphasis, primary buttons |
| `--sage-light` | `#B8C5A6` | Subtle backgrounds, gradients |
| `--beige` | `#F5F5DC` | Secondary backgrounds, input fields |
| `--beige-warm` | `#E6D7C3` | Warmer beige for layered backgrounds |
| `--beige-rich` | `#D2B48C` | Borders, hover states |
| `--text-primary` | `#2C2C2C` | Body text, headings |
| `--text-secondary` | `#5A5A5A` | Subtitles, descriptions |
| `--text-light` | `#8A8A8A` | Metadata, timestamps, placeholders |
| `--error` | `#C0392B` | Errors, destructive actions |
| `--success` | `#27AE60` | Success states, verified badges |
| `--warning` | `#E67E22` | Warnings |
| `--border` | `#E6D7C3` | Borders, dividers |
| `--border-light` | `#F0EBE1` | Subtle borders, card edges |

**Palette character:** Muted, natural, wellness-oriented. Sage green + beige/cream. The current palette is genuinely good and should be **preserved**, not replaced. The problem is not the colors — it's how they're applied.

### 2.2 Typography

- **Font family:** `'Spectral', Georgia, serif` — a literary, editorial serif typeface.
- **Usage:** Every piece of text on the site uses this font (body, headings, buttons, nav, forms).
- **Feeling:** Bookish, reflective, somewhat old-fashioned. Good for a mental health/wellness brand in theory, but in practice it reads as generic "wellness startup" because it's applied uniformly without hierarchy.

### 2.3 Logo & Mark

- **Wordmark:** "Nistar" with a split-color treatment — "Nis" in `--sage-dark`, "tar" in `--sage`.
- **Logo mark:** A rounded square with the letter "N" in sage green on white.
- **Favicon:** SVG — sage green rounded square with white "N".
- **Tagline:** "Safe space. Real support."

### 2.4 Current Design System Problems (The "AI Slop" Issues)

The user's complaint about "AI slop" is accurate. The current design has these telltale generic patterns:

1. **Everything is rounded.** Every card, button, input, avatar, badge has `border-radius`. The sidebar, drawer, modals, cards, chips — all rounded. It reads as "default design system output."

2. **Uniform serif font everywhere.** No contrast between display text, body text, UI labels, and data. Everything feels the same weight and tone.

3. **Generic wellness gradient backgrounds.** Landing page hero uses `linear-gradient(160deg, var(--beige) 0%, rgba(156,175,136,0.08) 60%, var(--white) 100%)`. Auth pages use `radial-gradient(ellipse at 0% 0%, rgba(156,175,136,0.2) 0%, transparent 60%)`. This is the exact gradient pattern seen in thousands of AI-generated wellness sites.

4. **Cards on white with subtle shadows.** Standard pattern: white background, 1px border, `box-shadow: 0 2px 16px rgba(107,142,90,0.08)`, hover lifts 2px. Predictable and flat.

5. **Emoji as decoration.** The landing page uses 💚, 😔, 🌱 as decorative icons. This is a hallmark of low-effort AI-generated design.

6. **Over-reliance on CSS variables for everything.** While CSS variables are good, the current system uses them so uniformly that there's no texture, no photography, no illustration, no personality.

7. **No imagery strategy.** The site has no photography, no illustrations, no custom graphics. Just icons from `lucide-react` and CSS shapes. For a mental health platform, this is a missed opportunity and contributes to the generic feel.

---

## 3. Project Architecture

### 3.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript |
| **Bundler** | Vite 8 |
| **Routing** | `react-router-dom` v7 |
| **State** | Zustand (auth, persisted to `localStorage`) |
| **Server state** | TanStack Query (React Query) |
| **HTTP** | Axios (with 401 → refresh-token interceptor) |
| **Real-time** | `socket.io-client` |
| **PWA** | `vite-plugin-pwa` |
| **Icons** | `lucide-react` |
| **Notifications** | `react-hot-toast` |
| **Dates** | `date-fns` |
| **CSS** | Plain CSS in `src/index.css` (no Tailwind, no CSS-in-JS) |

### 3.2 Two-Repo Structure

```
nistar/                  ← This repo (frontend)
nistar-api/              ← Separate repo (Express + MongoDB backend)
```

They communicate via REST + Socket.IO, configured through `VITE_API_BASE_URL` and `VITE_SOCKET_URL` env vars.

---

## 4. File Structure

```
nistar/
├── index.html                    # HTML shell, meta tags, PWA manifest link
├── vite.config.ts                # Vite + PWA plugin config
├── package.json                  # Dependencies, scripts
├── tsconfig.json / tsconfig.*.json
├── .env.example                  # Public env vars (API base, Google client ID)
├── .env                          # Actual values (gitignored)
├── public/
│   └── favicon.svg               # Sage "N" on rounded square
├── src/
│   ├── main.tsx                  # Entry: React.StrictMode + ErrorBoundary + App
│   ├── App.tsx                   # Router, QueryClient, AuthBootstrap, routes
│   ├── index.css                 # **THE BIG ONE** — 2502 lines of plain CSS
│   ├── api/
│   │   └── index.ts              # Axios instance, domain API clients, getMediaUrl(), refresh interceptor
│   ├── lib/
│   │   ├── errors.ts             # getErrorMessage() helper
│   │   └── socket.ts             # Shared Socket.IO client (getSocket/disconnectSocket)
│   ├── stores/
│   │   └── authStore.ts          # Zustand auth store (persisted)
│   ├── types/
│   │   └── index.ts              # Shared TypeScript interfaces (User, Post, Comment, Session, etc.)
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── admin/                # AnalyticsPanel, CategoriesPanel, SubscribersPanel, TeamPanel
│   │   ├── auth/
│   │   │   └── GoogleButton.tsx
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx     # **MAIN LAYOUT** — desktop sidebar, mobile top nav + drawer, footer, bottom nav
│   │   │   └── ProtectedRoute.tsx
│   │   ├── posts/
│   │   │   └── PostCard.tsx      # Post card with cover, tags, author, stats
│   │   └── shared/
│   │       ├── Avatar.tsx
│   │       ├── Spinner.tsx
│   │       └── SubscribeForm.tsx
│   └── pages/
│       ├── admin/
│       │   └── AdminPage.tsx     # 36KB — massive admin dashboard
│       └── app/
│           ├── ChangePasswordPage.tsx
│           ├── ChatPage.tsx
│           ├── CounselorsPage.tsx
│           ├── FeedPage.tsx
│           ├── LandingPage.tsx    # **HOMEPAGE** — hero, features, CTA
│           ├── LibraryPage.tsx
│           ├── NotificationsPage.tsx
│           ├── PostPage.tsx
│           ├── ProfilePage.tsx
│           ├── SessionsPage.tsx
│           └── WritePostPage.tsx
```

### 3.3 Routes

| Path | Page | Access |
|------|------|--------|
| `/` | `LandingPage` | Public |
| `/feed` | `FeedPage` | Public |
| `/posts/:slug` | `PostPage` | Public |
| `/counselors` | `CounselorsPage` | Public |
| `/login` | `LoginPage` | Public (auth shell) |
| `/register` | `RegisterPage` | Public (auth shell) |
| `/forgot-password` | `ForgotPasswordPage` | Public (auth shell) |
| `/reset-password` | `ResetPasswordPage` | Public (auth shell) |
| `/verify-email` | `VerifyEmailPage` | Public (auth shell) |
| `/posts/new` | `WritePostPage` | Authenticated |
| `/chat` | `ChatPage` | Authenticated |
| `/profile` | `ProfilePage` | Authenticated |
| `/notifications` | `NotificationsPage` | Authenticated |
| `/sessions` | `SessionsPage` | Authenticated |
| `/change-password` | `ChangePasswordPage` | Authenticated |
| `/admin` | `AdminPage` | `super_admin` / `department_admin` |

---

## 5. Current Design System Deep Dive

### 5.1 Layout Architecture

The app uses a **three-tier responsive layout**:

1. **Mobile (<768px):** Fixed top nav + fixed bottom nav + full-width content + slide-out drawer for navigation.
2. **Landing page (all sizes):** Transparent/frosted top header, no sidebar, footer at bottom.
3. **Authenticated desktop (≥768px):** Collapsible left sidebar (260px → 76px), no top nav, content offset by sidebar width.

### 5.2 Component Patterns

- **Cards:** White bg, 1px border `--border-light`, `border-radius: var(--radius-md)` (12px), subtle shadow. Hover lifts 2px with stronger shadow.
- **Buttons:** `.btn` base with modifiers `.btn--primary` (sage), `.btn--secondary` (beige), `.btn--ghost` (transparent), `.btn--danger` (red). All rounded, all serif font.
- **Forms:** Inputs with 1.5px border, sage focus ring, optional left icon, optional right action button. All `border-radius: var(--radius)` (8px).
- **Chips/Pills:** Filter chips, tag pills — all `border-radius: 20px`, pill-shaped.
- **Avatars:** Circular, sage-dark text on beige-warm fallback background.
- **Modals:** Bottom-sheet on mobile, centered dialog on desktop. Rounded top corners, slide-up animation.

### 5.3 What's Good (Keep This)

- The **sage + beige palette** is genuinely appropriate for a mental health brand. It's calming, natural, and distinctive from the typical blue/purple tech palette.
- The **serif font** (Spectral) gives literary weight to user stories — appropriate for a "share your story" platform.
- The **PWA support** is correctly configured.
- The **layout system** (sidebar on desktop, drawer on mobile, bottom nav) is solid UX for a community app.
- The **data model** is well-thought-out with roles, post states, comment moderation, session management, etc.

### 5.4 What Needs Redesign

**The user explicitly mentioned "AI slop" and wants the homepage and possibly other pages redesigned.** Key areas:

1. **Landing page (`LandingPage.tsx`):**
   - Hero uses generic gradient + emoji (💚) + cliché copy ("You don't have to carry it alone").
   - Feature grid is 4 identical cards with `lucide-react` icons in sage circles.
   - Bottom CTA section uses another generic gradient.
   - No photography, no illustration, no personality.

2. **Auth pages (`auth/index.tsx`):**
   - Auth shell uses beige background with radial gradients — very "AI-generated landing page."
   - Auth cards are generic white cards on beige.

3. **Feed page (`FeedPage.tsx`):**
   - The header area is a beige gradient bar with serif text — fine but feels like a generic dashboard.
   - Post cards are standard white cards.

4. **Typography hierarchy:**
   - Everything uses the same font, same weight variations. No display font for headlines, no monospace for data, no sans-serif for UI labels.
   - Need to introduce typographic contrast.

5. **Visual texture:**
   - Zero photography, zero illustrations, zero custom graphics.
   - Every surface is flat color or gradient.
   - Need to consider: hero imagery, user-generated content photography, illustrated elements, or at minimum more sophisticated CSS-only textures.

6. **Micro-interactions & motion:**
   - Currently: hover lifts, focus rings, spinner animation, shimmer skeleton, typing indicator dots.
   - Could be more considered: scroll-triggered reveals, staggered card entrances, parallax on hero, smoother transitions.

---

## 6. What Exists vs What's Planned

### 6.1 Already Built

- ✅ Full auth system (email/password, Google OAuth, forgot/reset, email verification)
- ✅ Post CRUD with anonymous option, likes, shares, drafts, admin moderation
- ✅ Comment system with pending/approved/rejected moderation
- ✅ Counselor directory, request flow, department grouping
- ✅ 1-on-1 chat with real-time messages, typing, read receipts, online presence
- ✅ Call signaling sockets (WebRTC peer-to-peer building blocks — not polished)
- ✅ Session scheduling, cancellation, ratings
- ✅ Notifications (chat + platform)
- ✅ Admin dashboard (user/post/comment/department management)
- ✅ Image upload (avatars, cover images, chat images)
- ✅ PWA support
- ✅ Email verification + password reset via Nodemailer
- ✅ JWT access/refresh tokens with transparent 401 retry
- ✅ Role-based access (user, counselor, department_admin, super_admin)
- ✅ Sidebar navigation (desktop) + drawer (mobile) + bottom nav (mobile authenticated)
- ✅ Responsive design (mobile, tablet, desktop breakpoints)
- ✅ Search, filter, tag system on feed

### 6.2 Planned / In Progress

From `nistar-task-tracker.md` (the reconciled feature spec):

**Phase 1 (highest priority):**
- Admin assignment (any admin can promote users)
- Author status (10 approvals grants `isAuthor`, auto-publish)
- Consultation queue (session requests, admin assigns counselors)
- Counselor/associate application flow

**Phase 2:**
- Public/private emotional posts
- Confidential help-request form (emotional state, support type)
- Field-level encryption for therapy conversations
- EPUB library with dynamic watermarking
- Dashboards & analytics (Author, User, Admin, Super Admin)
- Mailing list signup
- Category management
- Community guidelines / crisis-escalation static page

---

## 7. Key Files for Redesign

When redesigning, these are the files most likely to need changes:

| File | Why |
|------|-----|
| `src/index.css` | **The entire design system lives here.** 2502 lines. Any redesign will touch this extensively. |
| `src/pages/app/LandingPage.tsx` | **Homepage.** Hero, features, CTA — all need redesign. |
| `src/components/layout/AppLayout.tsx` | Desktop sidebar, mobile drawer, header, footer, bottom nav. Branding touchpoints everywhere. |
| `src/pages/auth/index.tsx` | Auth shell, login, register, forgot/reset, verify pages. |
| `src/App.tsx` | Route definitions, loading splash screen, toast config. |
| `index.html` | Meta tags, PWA manifest, theme color, favicon. |
| `public/favicon.svg` | Logo mark — may need updating if brand evolves. |
| `vite.config.ts` | PWA manifest (name, theme color, icons). |
| `src/components/posts/PostCard.tsx` | Post card design — likely needs refresh. |
| `src/pages/app/FeedPage.tsx` | Feed header, search, filters, grid layout. |
| `src/pages/app/ProfilePage.tsx` | Profile header, stats, settings. |
| `src/pages/app/CounselorsPage.tsx` | Counselor cards, directory layout. |
| `src/pages/app/ChatPage.tsx` | Chat interface — may need visual refresh. |
| `src/components/shared/Avatar.tsx` | Avatar component — size variants, fallback styling. |
| `src/components/shared/SubscribeForm.tsx` | Newsletter signup form. |

---

## 8. Brand Values & Emotional Tone

**Nistar is not a productivity app. It is not a social network. It is a mental health sanctuary.**

The redesign should feel:
- **Safe:** Not clinical, not cold. Warm but professional.
- **Human:** Stories, faces, real voices. Not algorithmic, not gamified.
- **Calm:** Low cognitive load. No notification badges screaming for attention. No viral hooks.
- **Trustworthy:** Verified counselors, moderated content, confidentiality — these should be visible in the design, not hidden in footers.
- **Accessible:** Mental health platforms serve people in distress. High contrast, clear typography, keyboard navigation, screen reader support.

**Avoid:**
- Dark patterns (urgency, streaks, "X people are viewing this post")
- Gamification (likes as validation metrics, leaderboards)
- Cliché wellness stock photography (meditating on mountaintops, hands forming hearts)
- Overly clinical or sterile design (all white, no warmth)
- Overly playful or "fun" design (confetti, emojis everywhere, bright primary colors)

---

## 9. Recommended Design Direction

Based on the current palette and the product's values, consider:

1. **Keep the sage/beige palette** but use it more deliberately — not as a default fill, but as strategic accents.
2. **Introduce a display typeface** for headlines (maybe a clean sans-serif like Inter or DM Sans) while keeping Spectral for body text and story content. This creates the typographic contrast that's currently missing.
3. **Add visual texture:** Subtle noise texture, organic shapes, or photography of real people (with consent) to replace flat gradients.
4. **Hero section:** Instead of a gradient + emoji, consider a full-width image or illustration of a real community moment, with text overlay or adjacent.
5. **Cards:** Move away from the uniform "white card on beige" pattern. Consider different card treatments for different content types — editorial-style for posts, profile-style for counselors, conversational for chat.
6. **Motion:** Add purposeful motion — staggered card reveals on scroll, smooth page transitions, subtle parallax on hero. Not decorative, but storytelling.
7. **Iconography:** Move beyond `lucide-react` for key brand moments. Consider custom illustrations or a more distinctive icon set for the feature grid.
8. **Footer:** The current footer is generic. Make it more personal — real contact info, community guidelines, maybe a "Crisis? Call..." link for people in immediate distress.

---

## 10. Environment & Deployment

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend REST API URL (currently points to Render) |
| `VITE_SOCKET_URL` | Socket.IO server URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

**Dev server:** `npm run dev` → `http://localhost:3000`
**Build:** `npm run build` → `tsc -b && vite build`
**Lint:** `npm run lint`

The backend (`nistar-api`) runs on port 5000 and is deployed separately on Render.

---

## 11. Quick Reference: Current Page Screenshots (Conceptual)

Since there are no screenshots attached, here's a text description of each page's current visual character:

- **Landing:** Full-viewport beige gradient hero, sage-green CTA buttons, emoji as decorative elements, 4-column feature grid (1-col mobile → 4-col desktop), another gradient CTA band at bottom.
- **Auth pages:** Beige background with radial gradients, white card centered, sage logo at top, "Safe space. Real support." subtitle.
- **Feed:** Beige gradient header bar, search in beige pill, horizontal scrollable filter chips, single-column post cards (2-col tablet, 3-col desktop).
- **Post detail:** Not fully explored, but follows similar card patterns.
- **Profile:** Sage-to-beige gradient header, avatar centered, stats row, settings list.
- **Chat:** Split pane — conversation list on left, chat window on right. Beige chat background, sage sent bubbles, white received bubbles.
- **Admin:** Data-heavy dashboard with tables, stats cards, sidebar navigation.

---

## 12. Summary for the Redesigner / AI Model

**You are redesigning a mental health community platform called Nistar.**

- **Don't change the product.** The features, routes, and data model are solid. Change the visual layer.
- **Don't change the color palette.** Sage + beige is correct. Change how it's used.
- **Focus first on `LandingPage.tsx` and `index.css`.** These two files contain 90% of the visual identity.
- **The biggest wins will be:**
  1. Replacing the generic gradient hero with something with personality.
  2. Adding typographic hierarchy (display font for headlines).
  3. Introducing photography or illustration to break the flat-color monotony.
  4. Rethinking the card system so it's not "white card with shadow" everywhere.
  5. Removing emoji decoration and generic wellness copy.
- **Preserve:** The responsive layout architecture, the sidebar/drawer system, the PWA setup, the accessibility basics, the data flow.
- **The codebase is React + TypeScript + plain CSS.** No design system library, no Tailwind, no component library. All styling is in `src/index.css`. A redesign will likely require reorganizing that CSS file substantially.

---

*Generated from codebase exploration on 2026-09-02.*
