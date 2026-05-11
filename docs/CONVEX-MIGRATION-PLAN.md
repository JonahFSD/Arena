# Supabase → Convex Migration Plan

## Status Tracker

> **Update this checklist as each phase is completed.**

### Phase 1: Foundation ✅ COMPLETE
- [x] Install Convex + auth packages
- [x] Remove Supabase packages
- [x] Define schema (15 tables, 36 indexes)
- [x] Set up Convex Auth (email/password)
- [x] Create ConvexClientProvider
- [x] Wire provider into root layout
- [x] Rewrite login page (Supabase → Convex Auth)
- [x] Create auth helpers (getAuthUser, requireAdmin, requireOwnerOrAdmin)
- [x] Delete `src/lib/supabase/` directory
- [x] Deploy schema to Convex
- [x] Seed database with demo data
- [x] Verify build passes (zero errors)

### Phase 2: Applications & Admin (Days 4-6)
- [ ] **`convex/applications.ts`** — Application functions
  - [ ] `submitApplication` (mutation) — public, creates app with status "pending"
  - [ ] `listPending` (query) — admin only, returns pending applications
  - [ ] `reviewApplication` (mutation) — admin approves/rejects, creates user on approval
  - [ ] `getByEmail` (query) — check if email already applied
- [ ] **`convex/users.ts`** — User profile functions
  - [ ] `getMe` (query) — current authenticated user
  - [ ] `getById` (query) — public profile
  - [ ] `updateProfile` (mutation) — update own profile fields
  - [ ] `uploadAvatar` (mutation) — generate upload URL for file storage
  - [ ] `listMembers` (query) — paginated member directory with filters
  - [ ] `getLeaderboard` (query) — computed rankings by points
- [ ] **`convex/admin.ts`** — Admin functions
  - [ ] `getDashboardStats` (query) — aggregate counts
  - [ ] `flagUser` (mutation) — create venture studio flag
  - [ ] `getAuditLog` (query) — paginated audit history
  - [ ] `logAction` (internal mutation) — record admin actions
- [ ] **Wire up pages:**
  - [ ] `/apply` → `useMutation(api.applications.submitApplication)`
  - [ ] `/admin/applications` → `useQuery(api.applications.listPending)`
  - [ ] `/members` → `useQuery(api.users.listMembers)`
  - [ ] `/members/[id]` → `useQuery(api.users.getById)`
  - [ ] `/settings` → `useMutation(api.users.updateProfile)`
  - [ ] `/admin` dashboard → `useQuery(api.admin.getDashboardStats)`

### Phase 3: Submissions & AI Scoring (Days 7-10)
- [ ] **`convex/submissions.ts`** — Submission CRUD
  - [ ] `create` (mutation) — create draft
  - [ ] `update` (mutation) — edit own draft
  - [ ] `submit` (mutation) — mark as submitted, trigger AI scoring
  - [ ] `getById` (query) — with user + score
  - [ ] `listMine` (query) — current user's submissions
  - [ ] `listByMonth` (query) — all submissions for a month
- [ ] **`convex/collaborators.ts`** — Team collaboration
  - [ ] `invite` (mutation) — invite user to submission
  - [ ] `respond` (mutation) — accept/decline
  - [ ] `listInvitations` (query) — pending for current user
  - [ ] `getBySubmission` (query) — all collaborators
- [ ] **`convex/aiScoring.ts`** — AI evaluation
  - [ ] `scoreSubmission` (action) — call Anthropic/OpenAI, store result
  - [ ] `getScore` (query) — AI score for a submission
- [ ] **`convex/storage.ts`** — File upload/serve
  - [ ] `generateUploadUrl` (mutation)
  - [ ] `getUrl` (query)
- [ ] **Wire up pages:**
  - [ ] `/submissions` list → real data
  - [ ] `/submissions/new` form → real mutation
  - [ ] `/submissions/[id]` detail → real query
  - [ ] `/submissions/invitations` → real query + mutations

### Phase 4: Voting & Prizes (Days 11-13)
- [ ] **`convex/voting.ts`** — Voting system
  - [ ] `getCurrentRound` (query) — active round with eligible submissions
  - [ ] `castVotes` (mutation) — validate and record votes
  - [ ] `getMyVotes` (query) — current user's votes
  - [ ] `getResults` (query) — tallies (after round closes)
  - [ ] `openNewRound` (internal mutation) — called by cron
  - [ ] `closeAndFinalize` (internal mutation) — called by cron
- [ ] **`convex/prizes.ts`** — Prize pools
  - [ ] `getByMonth` (query)
  - [ ] `getPastRounds` (query) — hall of fame data
  - [ ] `finalize` (internal mutation) — calculate winners + amounts
- [ ] **`convex/crons.ts`** — Monthly automation
  - [ ] Cron: 1st of month → open voting
  - [ ] Cron: 7th of month → close voting, finalize
- [ ] **Wire up pages:**
  - [ ] `/voting` → real-time vote counts
  - [ ] `/hall-of-fame` → historical data
  - [ ] `/leaderboard` → computed rankings

### Phase 5: Messaging & Notifications (Days 14-16)
- [ ] **`convex/messages.ts`** — Real-time messaging
  - [ ] `listThreads` (query) — threads with last message + unread count
  - [ ] `getThread` (query) — all messages in thread (real-time)
  - [ ] `send` (mutation) — send message
  - [ ] `markRead` (mutation) — mark as read
- [ ] **`convex/notifications.ts`** — Notification system
  - [ ] `list` (query) — current user's notifications
  - [ ] `getUnreadCount` (query) — badge count
  - [ ] `markRead` (mutation)
  - [ ] `markAllRead` (mutation)
  - [ ] `create` (internal mutation) — called by other functions
- [ ] **Wire up pages:**
  - [ ] `/messages` → real-time threads
  - [ ] `/messages/[threadId]` → real-time conversation
  - [ ] Sidebar/topbar notification badge → `useQuery(api.notifications.getUnreadCount)`

### Phase 6: Payments & Bounties (Days 17-20)
- [ ] **`convex/stripe.ts`** — Stripe actions
  - [ ] `createCheckoutSession` (action)
  - [ ] `createPortalSession` (action)
- [ ] **`convex/http.ts`** — Extend with Stripe webhook handler
  - [ ] Handle `checkout.session.completed`
  - [ ] Handle `invoice.paid`
  - [ ] Handle `customer.subscription.updated/deleted`
- [ ] **`convex/memberships.ts`** — Membership status
  - [ ] `getMyMembership` (query)
  - [ ] `updateFromStripe` (internal mutation)
- [ ] **`convex/bounties.ts`** — Bounty system
  - [ ] `list` (query) — all bounties with filters
  - [ ] `getById` (query) — with submissions
  - [ ] `create` (mutation) — admin creates
  - [ ] `submitSolution` (mutation) — member submits
  - [ ] `selectWinner` (mutation) — admin picks winner
- [ ] **Wire up pages:**
  - [ ] `/bounties` + `/bounties/[id]`
  - [ ] Membership gate in platform layout
  - [ ] `/admin/payouts`

### Phase 7: Polish & Cleanup (Days 21-23)
- [ ] **Wire remaining pages:**
  - [ ] `/network` — connection tracking
  - [ ] `/leadership` — ambassador applications
  - [ ] `/dashboard` — real stats
  - [ ] `/admin/analytics` — aggregate queries
  - [ ] `/admin/pipeline` — venture studio flags
- [ ] **Referral system** in `convex/users.ts`:
  - [ ] `generateReferralCode` (mutation)
  - [ ] `applyReferralCode` (mutation)
- [ ] **Cleanup — delete these files:**
  - [ ] `src/lib/bounties-data.ts` (mock data — after bounties page uses real queries)
  - [ ] `src/lib/admin-trends-data.ts` (mock data — after admin dashboard uses real queries)
  - [ ] `src/lib/dashboard-trends-data.ts` (mock data — after dashboard uses real queries)
  - [ ] `src/lib/referral.ts` (mock referral code — after real referrals work)
  - [ ] `src/types/index.ts` (legacy types — after all pages use `Doc<"tableName">`)
  - [ ] `supabase/` directory (SQL files — reference only, can delete anytime)
  - [ ] All empty `src/app/api/` subdirectories
- [ ] **Verify:**
  - [ ] `npm run build` passes with zero errors
  - [ ] No remaining imports from `@supabase/*`
  - [ ] No remaining `mockData` / `mockMembers` / etc. in page files
  - [ ] All pages render with real Convex data

---

## Key Architecture Decisions

### Why Convex over Supabase?
- **Real-time by default** — `useQuery()` auto-updates. Critical for messages, voting, notifications.
- **End-to-end type safety** — schema → codegen → component. No manual type maintenance.
- **Built-in file storage** — avatars, video thumbnails, slide decks without S3/CDN setup.
- **Cron jobs** — monthly voting cycle automation built into the platform.
- **No RLS complexity** — auth checks are plain TypeScript in function handlers.
- **Timing** — since almost no Supabase backend code existed, this was effectively greenfield.

### Auth: Convex Auth (not Clerk)
- The admission model (apply → review → account) is application-layer logic, not auth-layer.
- `@convex-dev/auth` supports email/password + Google OAuth — all this platform needs.
- Clerk would add cost and complexity for a high-school-student audience.
- Google OAuth will be added later (button exists in UI, currently disabled).

### Data Model: Document-oriented
- Supabase UUIDs → Convex `Id<"tableName">` (compile-time type safety)
- `TIMESTAMPTZ` → `number` (epoch ms); `_creationTime` replaces most `created_at`
- `JSONB` → typed `v.object()` or `v.array()` (validated at insert time)
- Foreign keys → `v.id("otherTable")` (type-checked references)
- RLS policies → function-level auth checks in `convex/helpers.ts`

### No Mock Data Layer
- Demo data is seeded into the real Convex database (see `docs/SEED-DATA.md`)
- Pages use real `useQuery()` calls — same code for demo and production
- No conditional mock/real switching logic needed
- Production = separate Convex deployment, demo data stays isolated

---

## Convex Function Naming Convention

```
convex/{domain}.ts → exports → called as api.{domain}.{functionName}
```

Examples:
- `convex/users.ts` → `export const getMe` → `useQuery(api.users.getMe)`
- `convex/submissions.ts` → `export const create` → `useMutation(api.submissions.create)`
- `convex/aiScoring.ts` → `export const scoreSubmission` → internal action (not client-callable)

Internal functions (cron targets, webhook handlers) use `internalMutation`/`internalAction`
and are accessed via `internal.{domain}.{functionName}`.
