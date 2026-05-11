<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:convex-agent-rules -->
# Convex Backend Rules

This project uses **Convex** (NOT Supabase) as the backend. Supabase has been fully removed.

## Critical Rules
- **NEVER** import from `@supabase/*` — those packages are uninstalled
- **NEVER** create files in `src/lib/supabase/` — that directory is deleted
- **NEVER** create API routes in `src/app/api/` — use Convex functions instead
- **NEVER** use `"use server"` server actions for data mutations — use Convex mutations
- **ALWAYS** put backend logic in `convex/` directory as queries, mutations, or actions
- **ALWAYS** use `useQuery()` and `useMutation()` from `convex/react` in client components
- **ALWAYS** check auth with helpers from `convex/helpers.ts` (getAuthUser, requireAdmin, etc.)

## File Conventions
- Schema: `convex/schema.ts` — single source of truth for all tables
- Auth: `convex/auth.ts` — Convex Auth with Password provider
- HTTP: `convex/http.ts` — HTTP routes (auth + future webhooks)
- Helpers: `convex/helpers.ts` — shared auth/role-checking utilities
- Types: Use `Doc<"tableName">` from `convex/_generated/dataModel` (NOT `src/types/index.ts`)

## Function Types
- **query** — read-only, cached, reactive (auto-updates UI via useQuery)
- **mutation** — read-write, transactional, called via useMutation
- **action** — for external API calls (Stripe, OpenAI, etc.), NOT for direct DB access
- **internalMutation/internalAction** — only callable from other Convex functions, not from client

## Seed Data
- Demo data lives in the real Convex database (NOT mock arrays in frontend code)
- See `docs/SEED-DATA.md` for commands and details
- `npx convex run seed:clearAll` to wipe, `npx convex run seed:run` to re-seed
<!-- END:convex-agent-rules -->

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
