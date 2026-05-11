# ACU Youth Venture Platform — Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router) |
| UI | React 19, Tailwind CSS 4, Lucide icons |
| Backend | **Convex** (database, auth, real-time, file storage, cron jobs) |
| Auth | Convex Auth (`@convex-dev/auth`) — email/password, Google OAuth planned |
| Payments | Stripe (SDK installed, integration not yet built) |
| AI | Anthropic + OpenAI (API keys configured, scoring not yet built) |
| State | Zustand (client), Convex reactive queries (server) |
| Validation | Zod |
| Charts | Recharts |

## Project Structure

```
venture-studio-hs-platform/
├── convex/                        # ← ALL backend logic lives here
│   ├── schema.ts                  # Database schema (15 tables, 36 indexes)
│   ├── auth.ts                    # Auth configuration
│   ├── auth.config.ts             # Auth provider config
│   ├── http.ts                    # HTTP routes (auth endpoints + webhooks)
│   ├── helpers.ts                 # Shared auth/role-checking utilities
│   ├── seed.ts                    # Demo data seeding
│   ├── verify.ts                  # Table count verification
│   └── _generated/                # Auto-generated types (DO NOT EDIT)
│
├── src/
│   ├── app/
│   │   ├── ConvexClientProvider.tsx   # Convex + Auth provider (wraps entire app)
│   │   ├── layout.tsx                 # Root layout (fonts, ConvexClientProvider)
│   │   ├── (marketing)/              # Public landing page
│   │   ├── (auth)/                    # Login, apply
│   │   │   ├── login/page.tsx         # ← Uses Convex Auth (signIn)
│   │   │   └── apply/page.tsx         # Multi-step application form
│   │   └── (platform)/               # Authenticated app
│   │       ├── dashboard/
│   │       ├── submissions/
│   │       ├── voting/
│   │       ├── bounties/
│   │       ├── leaderboard/
│   │       ├── hall-of-fame/
│   │       ├── members/
│   │       ├── network/
│   │       ├── leadership/
│   │       ├── messages/
│   │       ├── settings/
│   │       └── admin/
│   │
│   ├── components/
│   │   ├── ui/                    # 17 headless UI components
│   │   ├── layout/                # Sidebar, topbar, mobile nav
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── community/
│   │   ├── dashboard/
│   │   ├── submissions/
│   │   ├── voting/
│   │   ├── settings/
│   │   └── landing/
│   │
│   ├── lib/                       # Client-side utilities (NO backend logic)
│   │   ├── utils.ts               # cn(), formatCurrency(), formatDate(), etc.
│   │   ├── ai-score-points.ts     # Points formula (pure math, no DB)
│   │   ├── hall-of-fame-prize-pool.ts  # Prize split calculation (pure math)
│   │   ├── platform-nav.ts        # Navigation definitions
│   │   ├── school-directory.ts    # School autocomplete data
│   │   ├── profile-options.ts     # Skills, tools dropdown options
│   │   ├── us-states.ts           # US state list
│   │   └── community-filter.constants.ts
│   │
│   └── types/
│       └── index.ts               # Legacy TS types (being replaced by Convex codegen)
│
├── docs/                          # Project documentation
└── supabase/                      # DEPRECATED — SQL files kept for reference only
```

## Database Schema (Convex)

15 tables defined in `convex/schema.ts`:

### Core Entities
- **users** — member profiles (email, name, school, skills, BQ type, points, role)
- **applications** — admission applications with parent consent
- **memberships** — Stripe subscription status

### Monthly Competition Cycle
- **submissions** — venture pitch entries (video, GitHub, slides)
- **submissionCollaborators** — team members with revenue splits
- **aiScores** — AI-evaluated rubric scores (5 categories, 0-100 overall)
- **votingRounds** — monthly voting windows
- **votes** — member votes on submissions
- **prizePools** — monthly prize distribution and payouts

### Community
- **messages** — direct messaging (thread-based)
- **notifications** — in-app notifications with read tracking
- **bounties** — external funding opportunities
- **bountySubmissions** — solutions submitted to bounties

### Admin
- **ventureStudioFlags** — admin-flagged students
- **auditLog** — admin action history

## Auth Flow

1. Student applies at `/apply` → application stored with `status: "pending"`
2. Admin reviews at `/admin/applications` → approves/rejects
3. On approval, user account is created → student can log in at `/login`
4. Login uses `@convex-dev/auth` Password provider
5. Auth state managed by `ConvexAuthProvider` in root layout
6. Auth checks in Convex functions via `convex/helpers.ts`

## Data Flow Pattern

```
Component (useQuery/useMutation)
    ↕ WebSocket (real-time, automatic)
Convex Function (query/mutation/action)
    ↕ Convex DB
```

- **No REST API routes** — Convex functions replace traditional API endpoints
- **No server actions** — Convex mutations handle all writes
- **Real-time by default** — `useQuery()` auto-updates when data changes
- **Type-safe end-to-end** — schema → codegen → component props

## Environment Variables

```
CONVEX_DEPLOYMENT          # Convex deployment name (set by CLI)
NEXT_PUBLIC_CONVEX_URL     # Convex cloud URL (used by ConvexReactClient)
NEXT_PUBLIC_CONVEX_SITE_URL # Convex HTTP actions URL

# Future (configured but not yet wired):
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
RESEND_API_KEY
TWILIO_ACCOUNT_SID / AUTH_TOKEN / PHONE_NUMBER
```

## Convex Dashboard

**https://dashboard.convex.dev/d/energetic-okapi-601**

View tables, run functions, check logs, and manage the deployment.
