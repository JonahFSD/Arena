# Reusable Audit Prompt for Claude Code

Drop this into Claude Code (or any Claude agent CLI) to re-run the full audit. It's self-contained — paste from the `---` line down. The agent will fan out to 5 parallel subagents, one per concern area, and synthesize the results into `docs/AUDIT.md`.

Tips for getting good output:
- Run from the repo root.
- Have the Convex MCP / git connected if you want subagents to inspect deploy state.
- The prompt is tuned to a Next.js + Convex + React stack. Edit the "Stack" section if you fork it.

---

# Codebase Audit — Full Sweep

Run a complete audit of this codebase for tech debt, security vulnerabilities, and suboptimal patterns. Fan out to five parallel subagents — one per concern area below — then synthesize into a single prioritized report at `docs/AUDIT.md`.

## Phase 0 — Ground yourself (do this serially, before fanning out)

1. Read `CLAUDE.md`, `AGENTS.md`, `README.md`, and any `docs/ARCHITECTURE.md` to learn the stack, conventions, and known-deprecated paths.
2. Read `package.json` to confirm framework versions.
3. List top-level directories and count TS/TSX files: `find . -name node_modules -prune -o -name .next -prune -o -name .git -prune -o \( -name "*.ts" -o -name "*.tsx" \) -print | wc -l`.
4. Read the database schema (`convex/schema.ts` or equivalent) end-to-end. This is the source of truth subagents need.
5. Read the auth helpers (e.g., `convex/helpers.ts`) so subagents know what "properly authed" looks like.
6. Grep TODO/FIXME/HACK and `: any` / `as any` counts so subagents have a budget.

Use Glob/Read/Grep/Bash only — no edits in this phase.

## Phase 1 — Fan out to 5 parallel subagents

Spawn all five in a single message (multiple Agent tool calls in one turn) so they run concurrently. Each gets:
- The repo root path
- The same stack context from Phase 0
- A tight, single-concern brief (below)
- An output contract: punch list grouped by Critical / High / Medium / Low; each finding has `file:line`, one-sentence description, one-line concrete fix; capped at 500 words; findings only, no positive notes; write nothing to disk.

### Subagent A — Security & Authorization

Audit every Convex `mutation` / `action` and HTTP route for:
- Missing auth checks (`getAuthUser` / `requireAdmin` / `requireOwnerOrAdmin`).
- IDOR: function takes `userId` / `submissionId` / etc. and doesn't verify caller ownership.
- Privilege escalation: places where `role`, `points`, `totalEarnings`, or other admin/computed fields can be written by a non-admin (especially generic "patch from args" patterns).
- Webhook safety: Stripe / OAuth / Twilio signature verification + idempotency on retries.
- `internalMutation` vs `mutation` confusion — anything that should be internal but is client-callable.
- Secrets: `process.env` leaks, anything `NEXT_PUBLIC_*` that shouldn't be.
- Input validation: `v.any()`, `v.string()` where an enum literal union should be, missing length caps.
- File storage: who can upload, MIME/size checks, ID ownership tracking.
- PII leakage: queries that return emails/phones to unauth or non-admin callers.
- Token generation: `Math.random()` for anything secret.

### Subagent B — Backend Patterns (Convex correctness & scale)

Read `convex/_generated/ai/guidelines.md` first — its rules override training data. Then audit:
- Validators: missing `args`/`returns`, `v.any()`, validators that drift from schema.
- N+1 patterns: `await ctx.db.get` in loops without `Promise.all`; `filter()` chained after `withIndex` that should be a compound index.
- Indexes: fields used in `withIndex` not defined in schema; indexes defined but never read.
- Unbounded `collect()` on user-data tables (users, votes, messages, notifications, submissions). Should be `paginate()` or `.take(N)`.
- Action/mutation boundary: `action` calling `ctx.db.*` directly (illegal); external network in `mutation` (illegal).
- Idempotency: mutations that can produce duplicate rows under concurrent calls or external retries; cron jobs that double-process if rerun.
- Schema drift: code reading fields that aren't on the schema; schema fields nothing reads.
- Dead/duplicate code in `convex/` (one-off seed scripts shipped to prod).
- `as any`, `// @ts-ignore` anywhere in `convex/`.

### Subagent C — Frontend (Next.js / React)

Audit `src/app/**`, `src/components/**`, `src/contexts/**`, `src/lib/**`:
- Server vs client component boundary: hooks without `"use client"`; `"use client"` slapped on components that don't need it.
- Loading / error / empty states: `useQuery` callers that crash on `undefined`/`null`; mutations without try/catch; lists without empty states.
- Hydration risks: `new Date()` / `Math.random()` / `window.*` / `localStorage` in render bodies.
- Accessibility: dialogs without `role`/`aria-modal`/focus trap; `<div onClick>`; missing `alt`/`aria-label`; missing form labels; color-only state.
- Forms: uncontrolled inputs, no disabled state during submit (double-submit), client-side validation gaps.
- Routing: `<a href>` for internal routes (should be `<Link>`); missing `loading.tsx` / `error.tsx` siblings.
- Images: `<img>` instead of `next/image`; missing `images.remotePatterns` in `next.config.ts`.
- Bundle hazards: `import * as` from large libs (`three`, `lodash`); heavy libs at static import time on shared chunks.
- Context misuse: providers that re-render the world on every keystroke.
- Dead components, leftover scaffold types.

### Subagent D — Type Safety & Tech Debt

Audit the entire repo for:
- `any` / `as any` / `as unknown as` / `// @ts-ignore` / `// @ts-expect-error` / `// eslint-disable` — judge each.
- Legacy types duplicating codegen (e.g., hand-written `User` type vs `Doc<"users">`).
- Residue from prior stacks (e.g., a `supabase/` folder when Supabase has been removed).
- TODOs / FIXMEs / HACKs / XXX with file:line and severity.
- Dead exports — components/functions never imported. Cross-reference with grep.
- Duplicate constants across files (role names, point values, prize splits, enum literals).
- `tsconfig.json` hygiene: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
- ESLint config: is it the bare framework default or are real rules enabled?
- Schema drift: enum literals in seed/demo data that don't match the schema.
- `console.log` left in production code.
- Naming inconsistencies that would trip up new contributors.

### Subagent E — Perf, Tooling, Deploy, Observability

Audit:
- `package.json`: wrong version pins (e.g., a popular lib pinned to a version line that doesn't exist), outdated/risky deps, heavy deps used by only one route (should be dynamic-imported), unused direct deps that are pulled transitively anyway.
- Build/deploy: `vercel.json` / `next.config.ts` / CI workflows. Particular look for build scripts that deploy backend on every preview build.
- Env hygiene: `.env.example` present? Runtime validation (zod) at startup? `NEXT_PUBLIC_*` secrets-shaped?
- Security headers / middleware: CSP, HSTS, X-Frame-Options, Referrer-Policy.
- Caching / ISR / `revalidate` on public routes (especially token-gated public pages).
- Images: `remotePatterns` for the file-storage host.
- Bundle weight: heavy libs at static top-level; duplicate font loading; oversized assets in `public/`.
- Testing: any infra at all (vitest, jest, playwright)? If not, flag.
- CI: lint/typecheck/build gate on PRs?
- Observability: Sentry / structured logger / OpenTelemetry?
- Rate limiting on public mutations.
- Email/SMS: `List-Unsubscribe`, idempotency keys, single `from` address config.
- Webhook handlers: raw-body handling, signature verification, idempotency on event ID.
- Cron jobs: schedule overlap risk, idempotency on rerun.

## Phase 2 — Synthesize

When all five subagents return:
1. Dedupe findings that overlap (e.g., a single Stripe webhook issue surfaced by Security and Tooling).
2. Re-rank into Critical / High / Medium / Low based on this rubric:
   - **Critical:** ship blocker. Privilege escalation, IDOR, data corruption, prod-deploy hazards, anything that's actively broken or letting a stranger become admin.
   - **High:** fix before user growth. PII leaks to unauth callers, unbounded queries that will brown out at scale, missing rate limits, missing security headers, missing CI.
   - **Medium:** next sprint. Tech debt that slows new contributors, missed RSC opportunities, accessibility gaps short of WCAG-A blockers, observability gaps.
   - **Low:** backlog. Cosmetic, dead code, naming.
3. For each finding: `file:line` — one-sentence problem — one-line fix.
4. End with a short "What good code looks like" section codifying the patterns this codebase should adopt (auth-first mutations, validator-first args, single-source constants, idempotent writes, RSC by default).
5. Write the report to `docs/AUDIT.md`.

## Phase 3 — Acknowledge limits

The audit reads code statically. It does not:
- Run the app or hit a live DB.
- Detect runtime issues that only surface under load.
- Replace a penetration test or a real SOC2 review.

Tell the user this. Suggest a follow-up: have an engineer triage Critical/High and open issues per finding.

---

## How to invoke

Paste the section above into Claude Code. If your CLI doesn't support parallel subagent fan-out, the agent will still produce findings — just serially and slower. If you want a narrower sweep, delete subagent briefs you don't need (e.g., keep only A + B for a security-first pass).
