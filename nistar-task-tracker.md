# Nistar — Reconciled Feature Spec & Task Tracker

_Sources: `Nistar Project Brief.md`, client transcript (audio → text), `NISTAR.pdf` vision doc._

This document reconciles three sources that don't fully agree with each other, makes the calls needed to move forward as lead developer, and breaks the result into an executable task list. Decisions below are practical calls to unblock the build — flag them to the client when convenient, but nothing here should block starting work.

---

## 1. How the three sources relate

- **Project brief** = what's already built (ground truth for current code).
- **Transcript** = new features the client wants, described loosely, in implementation-adjacent language.
- **PDF vision doc** = the original product vision, written earlier, more structured, and — this matters — written *before* a lot of the current codebase existed. It's aspirational/strategic, not a spec of the current system.

Where they conflict, the transcript wins on *intent* (it's the most recent and most specific instruction), the PDF wins on *structure* (roles, dashboards, confidentiality rules), and the brief wins on *what's technically already in place* (we extend it, not rebuild it).

---

## 2. Decisions on open conflicts

### 2.1 The missing document — resolved
The PDF is what the client was trying to recall. It's now folded into this spec (see EPUB, confidentiality, and dashboard sections below).

### 2.2 "Admins are counselors" vs. PDF's separate Admin / Professional roles
**Conflict:** Transcript implies admins are drawn from counselors and any admin can promote another admin. PDF treats **Admin** (moderation, assignment, management) and **Mental Health Professional** (therapy, case notes, calls) as two distinct roles with no overlap — a professional explicitly has "no access to general platform analytics or content moderation."

**Decision:** Go with the PDF's separation — it's the architecturally sound version and matches the existing `department_admin` vs `counselor` split already in the codebase. **Do not** restrict admin promotion to counselors only. Any user can be promoted to `department_admin` by an existing admin or super admin. Counselors stay counselors; being made an admin is an independent grant, not a counselor perk.

**Why:** Conflating the two roles means a counselor-turned-admin either loses moderation objectivity over their own client base, or you build permission logic to keep them separate anyway — easier to just keep the roles orthogonal from day one. Reversible later with zero data migration if the client insists otherwise.

### 2.3 Author threshold: 10 vs 20 approvals
**Decision:** 10, implemented as a named config constant (`AUTHOR_APPROVAL_THRESHOLD`), not hardcoded. Client said 10 twice, 20 once, in a moment of self-correction — 10 is the more confident answer, and a config constant means changing it later is a one-line edit, not a deploy-and-pray.

### 2.4 Video calls: Google Meet link vs. existing WebRTC signaling
**Decision:** Ship Phase 1 using Google Meet links shared over chat, as explicitly instructed. Leave the existing WebRTC socket events (`call:initiate`, `call:answer`, `call:ice-candidate`, `call:end`) in the codebase untouched but unused — don't invest further engineering time there for now. Revisit in-app calling as a Phase 2/3 item once the platform has real usage data on whether it's worth the complexity.

**Why:** No sense deleting working infrastructure, but also no sense polishing a feature the client just deprioritized.

### 2.5 Non-image uploads (transcripts, certificates, EPUBs)
**Decision:** Extend the upload middleware with a second pipeline alongside the existing Multer+Sharp image path: a document pipeline accepting `application/pdf` (transcripts, certificates) and `application/epub+zip` (literary works), with MIME-type whitelisting and stricter size limits, stored under `/uploads/documents` and `/uploads/epubs` respectively. Images keep going through Sharp for resizing/optimization; documents pass through untouched aside from a virus/type check.

### 2.6 Role naming: "Professional" (PDF) vs. "Counselor" (existing schema)
**Decision:** No schema rename. The existing `counselor` role in the database *is* the PDF's "Mental Health Professional" — same entity, different label. Keep `counselor` as the internal/schema name (renaming touches too much code for zero functional gain); use "Professional" or "Counselor" as the user-facing label depending on context (public-facing pages say "Professional," admin tooling can keep saying "Counselor").

### 2.7 Public vs. private emotional posts (new, from PDF)
**Decision:** Add a `visibility: 'public' | 'private'` field to the existing `Post` model rather than a new collection. Public posts flow through the normal feed + existing moderation pipeline. Private posts skip the public feed entirely and are visible only to the post's author, any professional assigned to that user, and admins (metadata-level access only — see 2.9).

**Why:** Reuses all existing Post CRUD, slug generation, and moderation logic instead of duplicating it for a "private posts" system.

### 2.8 EPUB downloads with dynamic watermarking (new, from PDF)
**Decision:** Store one master EPUB per literary work server-side. Generate the watermark **on-demand at download time** (inject a small templated page — reader name or "Anonymous Reader," masked email, download date, Nistar branding — into a copy of the EPUB archive), rather than pre-generating a file per user. This keeps storage flat regardless of download volume.

### 2.9 Confidentiality rules: encrypted emotional data, admins can't read therapy conversations (new, from PDF)
**Decision, two parts:**
- **Field-level encryption** (not whole-document) on sensitive text fields — emotional-state descriptions, session case notes, request details — using a symmetric key (AES-256 via Node's `crypto`, key from env). Non-sensitive fields (status, timestamps, assigned professional) stay queryable in plaintext so admin dashboards and queues still work without decrypting everything.
- **API-layer access control**: therapy conversations (`conversations` of a `type: 'therapy'`) are only readable by the two participants. `department_admin` gets zero access, even metadata. `super_admin` gets metadata only (existence, timestamps, participants) for compliance purposes — never message content — and that access should be logged.

---

## 3. Final role model

| Role | Source | Notes |
|---|---|---|
| Visitor | PDF | Unauthenticated; public feed, categories, EPUB download (watermarked "Anonymous Reader"), mailing list signup |
| User | Existing | Base authenticated role; all PDF §3.2 permissions already map to existing features + new ones below |
| Author | Transcript + PDF | **Status, not a role** — `isAuthor` flag on User, granted automatically at 10 approvals. Confirmed against PDF §3.3 which describes it as a permission tier, not a separate account type |
| Counselor / Professional | Existing (`counselor`) | Independent of Admin; PDF's "Mental Health Professional" |
| Department Admin | Existing | Independent of Counselor (see 2.2); can promote other admins per transcript |
| Super Admin | Existing | Unchanged |

---

## 4. Task list, by phase

### Phase 1 — Transcript features (highest priority, already scoped in prior discussion)

**4.1 Admin assignment**
- [ ] Backend: endpoint for any admin (not just super_admin) to promote a user to `department_admin`, lookup by email or username
- [ ] Backend: remove/relax any "counselor only" constraint on admin promotion
- [ ] Frontend: admin panel — search + "Grant Admin" action

**4.2 Author status**
- [ ] Data model: `User.isAuthor` (bool, default false), `User.consecutiveApprovals` (number, default 0)
- [ ] Data model: `Post.autoPublished` (bool) for admin-list filtering
- [ ] Config: `AUTHOR_APPROVAL_THRESHOLD = 10`
- [ ] Backend: approval increments counter; rejection resets to 0; threshold crossing sets `isAuthor = true` + fires notification
- [ ] Backend: post creation branches on `isAuthor` — skip review if true
- [ ] Backend: `GET /api/admin/posts` — filter by auto-published vs. manually approved
- [ ] Frontend: Author badge on profile/posts; notification UI on promotion

**4.3 Consultation queue**
- [ ] Data model: extend `Session` with `description`, `status: pending | approved | ...`, `assignedCounselor` (nullable), `requestedDate`
- [ ] Backend: `POST /api/sessions` captures description + date, defaults to `pending`, no counselor attached
- [ ] Backend: `GET /api/admin/sessions/queue` — pending requests list
- [ ] Backend: `PUT /api/admin/sessions/:id/assign` — admin assigns counselor, flips to `approved`
- [ ] Backend: auto-create (or ensure) a conversation thread between user and assigned counselor on assignment
- [ ] Frontend: "Book Appointment" form (description + date)
- [ ] Frontend: admin queue view with "Assign" action
- [ ] Frontend: user sessions page shows assigned counselor + status

**4.4 Counselor/associate application**
- [ ] Data model: new `counselorApplications` collection — `user`, `documents[]`, `statement`, `status`, timestamps
- [ ] Backend: document upload pipeline (see 2.5) supporting PDF
- [ ] Backend: `POST /api/counselors/apply`
- [ ] Backend: admin review endpoints; approval flips user role to `counselor`
- [ ] Frontend: application form (uploads + statement)
- [ ] Frontend: admin review UI
- [ ] Deferred: training/certification track — no build this phase

### Phase 2 — PDF-sourced features (new scope, not previously discussed)

**4.5 Public/private emotional posts**
- [ ] Data model: `Post.visibility: 'public' | 'private'`
- [ ] Backend: feed queries exclude `private` posts; private posts visible only to author, assigned professional, admin (metadata only)
- [ ] Frontend: visibility toggle on post composer; private posts excluded from public feed UI

**4.6 Confidential help-request form**
- [ ] Data model: fields for emotional state, preferred support type (call/chat/follow-up), availability — likely folds into the existing Session/consultation model from 4.3 rather than a separate form
- [ ] Backend: field-level encryption on emotional-state text (see 2.9)
- [ ] Frontend: request form matching PDF §4.2.B

**4.7 Confidentiality & access control layer**
- [ ] Backend: AES field-level encryption utility for sensitive text fields
- [ ] Backend: therapy-conversation access restricted to participants only; super_admin metadata-only with access logging
- [ ] Backend: audit log for any super_admin access to therapy conversation metadata

**4.8 EPUB library & watermarking**
- [ ] Data model: `literaryWorks` (or extend `Post` with a `type: 'story' | 'epub'`) — title, master EPUB file path, cover, category
- [ ] Backend: document upload pipeline accepts `.epub`
- [ ] Backend: on-demand watermark injection at download time (name/masked email/date/branding)
- [ ] Backend: download endpoint works for both visitors (watermark = "Anonymous Reader") and authenticated users (personalized watermark)
- [ ] Frontend: EPUB download UI on post/story pages

**4.9 Dashboards & analytics**
- [ ] Frontend: Author Dashboard — post management, drafts, view/download/comment analytics
- [ ] Frontend: User Dashboard additions — download history, mental health request status, assigned professional details, call history
- [ ] Frontend: Admin Dashboard additions — professional management, submission review, flagged content
- [ ] Frontend: Super Admin Dashboard — admin creation/permissions, category management, system analytics, backups/health

**4.10 Supporting features**
- [ ] Mailing list signup (visitor-facing) — simple email capture endpoint + storage, no immediate email automation required unless client asks
- [ ] Category management (CRUD, super_admin only) — likely already trivial given `Department`-style patterns exist
- [ ] Community guidelines / crisis-escalation static page — content page, no new backend needed beyond what serves static/CMS-style content

---

## 5. Suggested build order

1. Author status (4.2) — self-contained, no dependencies, quick win
2. Admin assignment (4.1) — small, unblocks 4.3/4.4 admin-side work
3. Consultation queue (4.3) — core to the mental-health value prop
4. Confidentiality layer (4.7) — do this *before* 4.6, since 4.6 depends on the encryption utility existing
5. Confidential request form (4.6)
6. Counselor application (4.4)
7. Public/private posts (4.5)
8. EPUB + watermarking (4.8) — largest standalone chunk, can run in parallel with the above once uploads pipeline (2.5) is done
9. Dashboards (4.9) — mostly frontend aggregation of data these features already produce
10. Supporting features (4.10) — fill in as time allows