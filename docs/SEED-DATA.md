# Seed Data — Demo Database

## Quick Reference

```bash
# Seed the database with demo data (idempotent — won't double-insert)
npx convex run seed:run

# Clear ALL data from all tables
npx convex run seed:clearAll

# Reset (clear + re-seed)
npx convex run seed:clearAll && npx convex run seed:run

# Verify counts
npx convex run verify:counts
```

## What Gets Seeded

| Table | Count | Details |
|-------|-------|---------|
| **users** | 12 | 1 superadmin (Jake) + 11 members |
| **applications** | 5 | 3 pending, 1 approved, 1 rejected |
| **submissions** | 8 | Across Jan–Mar 2026 (draft, submitted, scored) |
| **submissionCollaborators** | 5 | 2 team submissions with revenue splits |
| **aiScores** | 6 | Detailed 5-category rubric scores (78–92 range) |
| **votingRounds** | 3 | 1 open (March), 2 finalized (Jan, Feb) |
| **votes** | 22 | Distributed across finalized rounds |
| **prizePools** | 3 | 1 pending, 2 paid (with Stripe transfer IDs) |
| **messages** | 8 | 4 conversation threads |
| **notifications** | 5 | Mix of read/unread |
| **bounties** | 6 | 4 active, 1 reviewing, 1 completed |
| **bountySubmissions** | 3 | Solutions for 2 bounties |
| **ventureStudioFlags** | 1 | Flagged student |
| **auditLog** | 3 | Admin action history |

## Demo Users

| Name | Role | School | BQ Type | Points | Key Trait |
|------|------|--------|---------|--------|-----------|
| **Jake Oswald** | superadmin | Austin Christian U | Builder | 18,750 | Platform admin |
| **Sarah Chen** | member | Grace Academy | Visionary | 14,200 | Top performer, AI/ML |
| **David Park** | member | Covenant Prep | Operator | 11,800 | Full-stack, team lead |
| **Elijah Thompson** | member | Liberty Christian | Strategist | 9,400 | Mobile dev |
| **Grace Kim** | member | Faith Lutheran | Catalyst | 8,200 | Designer/dev |
| **Maria Garcia** | member | Hope Academy | Anchor | 7,600 | React Native, bilingual |
| **Noah Williams** | member | Heritage Christian | Builder | 6,100 | Backend (Go, Docker) |
| **Ava Martinez** | member | Cornerstone Academy | Strategist | 5,400 | Product management |
| **Caleb Johnson** | member | Redeemer Prep | Visionary | 4,800 | Music + tech |
| **Sophia Lee** | member | Trinity Christian | Operator | 3,200 | Data science |
| **Isaiah Brown** | member | Victory Christian | Anchor | 2,800 | EdTech |
| **Mia Rodriguez** | member | New Life Christian | Catalyst | 2,200 | Design + branding |

## Demo Submissions

| Title | Creator | Month | Status | AI Score |
|-------|---------|-------|--------|----------|
| EcoTrack — AI Environmental Monitor | Sarah Chen | Mar 2026 | scored | 92 |
| FaithConnect — Community Prayer Platform | David Park (team) | Mar 2026 | scored | 87 |
| StudyBuddy AI — Faith-Based Tutoring | Elijah Thompson | Mar 2026 | submitted | — |
| PrayerWall — Anonymous Community Prayer | Grace Kim | Mar 2026 | draft | — |
| SermonAI — Sermon Preparation Assistant | Sarah Chen | Feb 2026 | scored | 90 |
| GiveSmart — Intelligent Tithing Platform | Maria Garcia | Feb 2026 | scored | 78 |
| WorshipFlow — Smart Setlist Builder | Caleb Johnson (team) | Jan 2026 | scored | 85 |
| FaithFunds — Micro-Grant Platform | Ava Martinez | Jan 2026 | scored | 82 |

## How It Works

The seed script (`convex/seed.ts`) is an **internal action** that calls an internal mutation
to insert all data in a single transaction. It's idempotent — if any users exist, it
logs a warning and exits without inserting.

### Modifying Seed Data

1. Edit `convex/seed.ts`
2. Run `npx convex dev --once` to deploy the updated function
3. Run `npx convex run seed:clearAll && npx convex run seed:run` to reset

### Adding New Tables to the Seed

When you add a new table to `convex/schema.ts` and want demo data:

1. Add the insert block to `convex/seed.ts` inside the `insertAll` mutation
2. Add the table to the `clearAll` mutation's table list (order matters — delete children before parents)
3. Add the table to `convex/verify.ts` counts query
4. Re-deploy and re-seed

## Important Notes

- **This is NOT a mock data layer.** The data lives in the real Convex database.
- **Pages should use real `useQuery()` calls**, not import mock arrays.
- **For production**, deploy to a separate Convex project. Demo data stays isolated.
- **The seed is for development/demos only.** Never run it against production.
- **Thread IDs** are deterministic (sorted user IDs joined with `_`), matching the messaging system's convention.
- **Dates** use epoch milliseconds. Most are relative to `Date.now()` so they stay "fresh" on each re-seed.
