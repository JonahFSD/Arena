---
name: verify-this
description: Prove or disprove a specific claim with repeatable evidence. Returns exactly one verdict — VERIFIED, NOT VERIFIED, or INCONCLUSIVE.
---

# Verify This

Verification is not a recap. It proves or disproves a specific claim with repeatable evidence.

## When To Use

- The user asks "verify this", "prove it works", "did this fix it", or "show me the evidence".
- A bug fix needs a before/after repro.
- A TypeScript, build, or runtime claim needs measurement.
- A check passes in CI but the user-visible behavior still needs confirmation.

Do not use this for vague claims like "the code is cleaner". Ask for a measurable claim first.

## Workflow

1. Restate the claim in falsifiable form: condition, metric, and threshold.
2. Pick the smallest local surface that can disprove it (see below).
3. Capture a baseline from the old state: merge base, parent commit, failing branch, or current broken repro.
4. Capture treatment from the changed state with the same command and environment.
5. Compare raw artifacts: terminal transcripts, error counts, HTTP responses, or browser screenshots.
6. Return exactly one verdict: `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE`.

## Local Surfaces (what Arena can produce today)

- **TypeScript correctness:** `npm run typecheck` — zero errors = passing; capture exact error counts baseline vs. treatment.
- **Production build:** `npm run build:ci` — captures Next.js compilation errors and bundle issues.
- **CI gates:** `gh pr checks --json name,bucket,state,workflow,link` — authoritative pass/fail for Typecheck and Build jobs.
- **Runtime / UI behavior:** manual browser steps with screenshots or recorded terminal transcripts.
- **Convex function behavior:** `npx convex run <function>` with explicit arguments, capturing output.

### Not yet available — Phase 7+

The following verdict tiers exist in the general `verify-this` workflow but **are not available until Arena adds its test harness in Phase 7**. Do not claim a test-based verdict before then:

- **`unit-test-verified`** — requires a unit/integration test suite (added in Phase 7).
- **`live-ui-verified`** — requires Playwright smoke tests (added in Phase 7).

Until Phase 7, UI claims must be verified with manual browser steps and described screenshots. Build and type claims use `npm run typecheck` / `npm run build:ci` only.

## Verdict Rules

- `VERIFIED`: baseline and treatment differ in the predicted direction, by the claimed threshold, with no obvious confound.
- `NOT VERIFIED`: the behavior is unchanged, moves the wrong way, or misses the threshold.
- `INCONCLUSIVE`: no valid baseline, noisy signal, failed measurement, or an environment difference invalidates the comparison.

## Output

```
VERIFIED | NOT VERIFIED | INCONCLUSIVE
Claim: <falsifiable claim>

Evidence:
  Baseline (before): <observed behaviour, failing check, or metric>
  Treatment (after): <observed behaviour, passing check, or metric>
  How checked: <npm run typecheck | npm run build:ci | browser steps | gh pr checks>

Reasoning:
<one tight paragraph naming the evidence and any confounds>
```

## Guardrails

- Always restate the claim before gathering evidence — verification without a falsifiable claim is theater.
- Use `gh pr checks` as the CI source of truth; do not guess at CI state from local commands alone.
- **NEVER use `--no-verify`** to bypass hooks during verification.
- If the baseline cannot be captured cleanly, return `INCONCLUSIVE` rather than fabricating one.
