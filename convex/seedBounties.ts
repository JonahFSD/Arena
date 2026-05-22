import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { SeededUsers } from "./seedUsers";

export async function seedBounties(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<void> {
  const bounties = await insertBounties(ctx, users);
  await insertBountySubmissions(ctx, users, bounties);
}

async function insertBounties(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<Record<string, Id<"bounties">>> {
  const bounties: Record<string, Id<"bounties">> = {};

  bounties.churchApp = await ctx.db.insert("bounties", {
    title: "Build a Church Check-In Kiosk App",
    description: "Design and build a tablet-based check-in system for Sunday services. Must support family check-in, print name badges, and alert parents via SMS when children need pickup. Looking for a clean, modern UI that any volunteer can operate.",
    founderName: "Pastor Michael Torres",
    founderCompany: "FaithOps",
    bountyAmount: 2500,
    dueDate: new Date("2026-04-30").getTime(),
    status: "active",
    creatorUserId: users.jake,
    requirements: [
      "Tablet-optimized responsive UI",
      "Family group check-in flow",
      "Name badge printing via AirPrint",
      "SMS notifications to parents",
      "Admin dashboard for reporting",
    ],
  });

  bounties.sermonSearch = await ctx.db.insert("bounties", {
    title: "AI Sermon Search Engine",
    description: "Build a search tool that lets congregants search across their church's sermon archive using natural language queries. Should support audio/video transcription, semantic search, and timestamp linking so users can jump to the exact moment a topic was discussed.",
    founderName: "Rachel Kim",
    founderCompany: "SermonCloud",
    bountyAmount: 5000,
    dueDate: new Date("2026-05-15").getTime(),
    status: "active",
    creatorUserId: users.jake,
    requirements: [
      "Audio/video transcription pipeline",
      "Semantic search with embeddings",
      "Timestamp deep-linking",
      "Mobile-responsive interface",
      "API for church website integration",
    ],
  });

  bounties.givingWidget = await ctx.db.insert("bounties", {
    title: "Embeddable Giving Widget",
    description: "Create a lightweight, embeddable giving widget that churches can drop into any website. Must support one-time and recurring donations via Stripe, be fully accessible (WCAG 2.1 AA), and load in under 2 seconds.",
    founderName: "Daniel Okafor",
    founderCompany: "GiveSmart",
    bountyAmount: 1500,
    dueDate: new Date("2026-04-15").getTime(),
    status: "needs_review",
    creatorUserId: users.sarah,
    requirements: [
      "Stripe payment integration",
      "One-time and recurring giving",
      "WCAG 2.1 AA accessibility",
      "Under 2 second load time",
      "Customizable theme/colors",
    ],
  });

  bounties.youthApp = await ctx.db.insert("bounties", {
    title: "Youth Group Event Manager",
    description: "Build a mobile-first app for youth pastors to plan events, send reminders, collect RSVPs, and share photos. Parents should be able to see event details and pick-up times. Think Evite meets ChurchCenter, but designed specifically for teen ministry.",
    founderName: "James Mitchell",
    founderCompany: "YouthMin Tech",
    bountyAmount: 3000,
    dueDate: new Date("2026-05-01").getTime(),
    status: "active",
    creatorUserId: users.jake,
    requirements: [
      "Event creation with RSVP tracking",
      "Push notification reminders",
      "Parent portal for pickup coordination",
      "Photo gallery with auto-sharing",
      "Calendar sync (Google, Apple)",
    ],
  });

  bounties.devotional = await ctx.db.insert("bounties", {
    title: "AI Daily Devotional Generator",
    description: "Create a devotional content engine that generates personalized daily devotionals based on a reader's spiritual journey, reading history, and prayer requests. Content must be theologically sound and reviewed by a pastoral advisory process.",
    founderName: "Amanda Torres",
    founderCompany: "DailyBread AI",
    bountyAmount: 2000,
    dueDate: new Date("2026-04-20").getTime(),
    status: "active",
    creatorUserId: users.jake,
    requirements: [
      "Personalized content generation",
      "Scripture integration with context",
      "Reading history tracking",
      "Pastoral review workflow",
      "Email and push delivery",
    ],
  });

  bounties.completed1 = await ctx.db.insert("bounties", {
    title: "Church Website Template System",
    description: "Build a template system allowing small churches to create beautiful websites in under 30 minutes. Must include sermon pages, event listings, staff directory, and giving integration.",
    founderName: "Sarah Anderson",
    founderCompany: "ChurchSites",
    bountyAmount: 500,
    dueDate: new Date("2026-02-28").getTime(),
    status: "completed",
    creatorUserId: users.jake,
    requirements: [
      "3+ responsive templates",
      "Drag-and-drop customization",
      "Sermon archive pages",
      "Event management",
      "Built-in giving page",
    ],
    winnerSubmissionId: undefined,
  });

  console.log("   ✅ Created 6 bounties");
  return bounties;
}

async function insertBountySubmissions(
  ctx: MutationCtx,
  users: SeededUsers,
  bounties: Record<string, Id<"bounties">>,
): Promise<void> {
  await ctx.db.insert("bountySubmissions", {
    bountyId: bounties.givingWidget,
    userId: users.david,
    isTeam: false,
    submissionUrl: "https://github.com/demo/giving-widget",
    notes: "Built with Preact for minimal bundle size. Stripe Elements integration with custom theming API.",
    isWinner: false,
    submittedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("bountySubmissions", {
    bountyId: bounties.givingWidget,
    userId: users.maria,
    isTeam: false,
    submissionUrl: "https://github.com/demo/giving-widget-v2",
    notes: "Focused on accessibility-first design. Screen reader tested. Bilingual support (English/Spanish).",
    isWinner: false,
    submittedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("bountySubmissions", {
    bountyId: bounties.churchApp,
    userId: users.elijah,
    isTeam: true,
    submissionUrl: "https://github.com/demo/church-checkin",
    notes: "Built with React Native for cross-platform tablet support. Tested with 3 churches.",
    isWinner: false,
    submittedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  });

  console.log("   ✅ Created bounty submissions");
}
