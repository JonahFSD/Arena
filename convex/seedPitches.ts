import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { SeededUsers } from "./seedUsers";

export type SeededSubmissions = Record<string, Id<"submissions">>;

export async function seedPitches(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<SeededSubmissions> {
  const submissions = await insertSubmissions(ctx, users);
  await insertCollaborators(ctx, users, submissions);
  await insertAiScores(ctx, submissions);
  return submissions;
}

async function insertSubmissions(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<SeededSubmissions> {
  const submissions: SeededSubmissions = {};

  // March 2026 submissions (current cycle)
  submissions.ecotrack = await ctx.db.insert("submissions", {
    userId: users.sarah,
    title: "EcoTrack — AI Environmental Monitor",
    description: "A mobile app that uses AI and IoT sensors to help communities monitor air quality, water contamination, and noise pollution in real-time. Users can view neighborhood-level data, receive health alerts, and join local environmental initiatives.",
    videoUrl: "https://youtube.com/watch?v=demo1",
    githubUrl: "https://github.com/demo/ecotrack",
    websiteUrl: "https://ecotrack-demo.vercel.app",
    monthYear: "2026-03",
    status: "scored",
    isTeamSubmission: false,
  });

  submissions.faithconnect = await ctx.db.insert("submissions", {
    userId: users.david,
    title: "FaithConnect — Community Prayer Platform",
    description: "A platform connecting church communities through shared prayer requests, praise reports, and devotional content. Features include anonymous prayer walls, prayer chain notifications, and weekly faith challenges.",
    videoUrl: "https://youtube.com/watch?v=demo2",
    githubUrl: "https://github.com/demo/faithconnect",
    monthYear: "2026-03",
    status: "scored",
    isTeamSubmission: true,
  });

  submissions.studybuddy = await ctx.db.insert("submissions", {
    userId: users.elijah,
    title: "StudyBuddy AI — Faith-Based Tutoring",
    description: "An AI-powered tutoring assistant designed for Christian school students. Provides personalized learning paths, practice problems, and explanations that align with a Biblical worldview across math, science, and humanities.",
    videoUrl: "https://youtube.com/watch?v=demo3",
    monthYear: "2026-03",
    status: "submitted",
    isTeamSubmission: false,
  });

  submissions.prayerwall = await ctx.db.insert("submissions", {
    userId: users.grace,
    title: "PrayerWall — Anonymous Community Prayer",
    description: "A beautifully designed anonymous prayer wall for churches and campus ministries. Members can share prayer requests, offer encouragement, and track answered prayers — all without the pressure of public sharing.",
    monthYear: "2026-03",
    status: "draft",
    isTeamSubmission: false,
  });

  // Jake's submissions (so the admin/demo account has My Pitches content)
  submissions.arenacore = await ctx.db.insert("submissions", {
    userId: users.jake,
    title: "ArenaCore — Venture Studio Platform Engine",
    description: "A full-stack platform powering The Arena's monthly pitch competitions, AI scoring, and prize distribution. Built with Next.js, Convex, and Claude for real-time collaboration between student founders.",
    videoUrl: "https://youtube.com/watch?v=demo-arena",
    githubUrl: "https://github.com/demo/arenacore",
    websiteUrl: "https://thearena-demo.vercel.app",
    monthYear: "2026-03",
    status: "scored",
    isTeamSubmission: false,
  });

  submissions.mentormatch = await ctx.db.insert("submissions", {
    userId: users.jake,
    title: "MentorMatch — AI Founder-Advisor Pairing",
    description: "An AI-powered matching engine that pairs student founders with experienced mentors based on venture stage, industry, skills gaps, and personality fit. Includes scheduling, milestone tracking, and structured feedback loops.",
    videoUrl: "https://youtube.com/watch?v=demo-mentor",
    githubUrl: "https://github.com/demo/mentormatch",
    monthYear: "2026-02",
    status: "scored",
    isTeamSubmission: false,
  });

  submissions.pitchdrill = await ctx.db.insert("submissions", {
    userId: users.jake,
    title: "PitchDrill — AI Pitch Coach",
    description: "A practice tool that lets student founders rehearse their pitch against an AI judge. Records video, provides real-time feedback on delivery, content, and timing, and generates a detailed score report.",
    videoUrl: "https://youtube.com/watch?v=demo-pitchdrill",
    monthYear: "2026-04",
    status: "draft",
    isTeamSubmission: false,
  });

  // February 2026 submissions (previous cycle)
  submissions.sermonai = await ctx.db.insert("submissions", {
    userId: users.sarah,
    title: "SermonAI — Sermon Preparation Assistant",
    description: "An AI tool that helps pastors prepare sermons by suggesting relevant scripture passages, historical context, and illustration ideas based on a chosen topic or text.",
    videoUrl: "https://youtube.com/watch?v=demo5",
    githubUrl: "https://github.com/demo/sermonai",
    websiteUrl: "https://sermonai-demo.vercel.app",
    monthYear: "2026-02",
    status: "scored",
    isTeamSubmission: false,
  });

  submissions.givesmart = await ctx.db.insert("submissions", {
    userId: users.maria,
    title: "GiveSmart — Intelligent Tithing Platform",
    description: "A smart giving platform that helps church members manage tithes, track giving goals, and receive personalized stewardship insights powered by AI financial analysis.",
    videoUrl: "https://youtube.com/watch?v=demo6",
    monthYear: "2026-02",
    status: "scored",
    isTeamSubmission: false,
  });

  // January 2026 submissions
  submissions.worshipflow = await ctx.db.insert("submissions", {
    userId: users.caleb,
    title: "WorshipFlow — Smart Setlist Builder",
    description: "An AI-powered worship planning tool that suggests song sets based on sermon themes, congregation preferences, and musical key compatibility. Integrates with ProPresenter and Planning Center.",
    videoUrl: "https://youtube.com/watch?v=demo7",
    githubUrl: "https://github.com/demo/worshipflow",
    monthYear: "2026-01",
    status: "scored",
    isTeamSubmission: true,
  });

  submissions.faithfunds = await ctx.db.insert("submissions", {
    userId: users.ava,
    title: "FaithFunds — Micro-Grant Platform",
    description: "A platform connecting young Christian entrepreneurs with micro-grants from faith-based organizations. Features AI-powered grant matching, application assistance, and progress reporting.",
    videoUrl: "https://youtube.com/watch?v=demo8",
    monthYear: "2026-01",
    status: "scored",
    isTeamSubmission: false,
  });

  console.log(`   ✅ Created ${Object.keys(submissions).length} submissions`);
  return submissions;
}

async function insertCollaborators(
  ctx: MutationCtx,
  users: SeededUsers,
  submissions: SeededSubmissions,
): Promise<void> {
  // FaithConnect team (David as lead, Grace as collaborator)
  await ctx.db.insert("submissionCollaborators", {
    submissionId: submissions.faithconnect,
    userId: users.david,
    invitedBy: users.david,
    role: "lead",
    revenueSplitPct: 50,
    status: "accepted",
    acceptedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("submissionCollaborators", {
    submissionId: submissions.faithconnect,
    userId: users.grace,
    invitedBy: users.david,
    role: "collaborator",
    revenueSplitPct: 30,
    status: "accepted",
    acceptedAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("submissionCollaborators", {
    submissionId: submissions.faithconnect,
    userId: users.noah,
    invitedBy: users.david,
    role: "collaborator",
    revenueSplitPct: 20,
    status: "pending",
  });

  // Pending invitation for Sarah to join WorshipFlow
  await ctx.db.insert("submissionCollaborators", {
    submissionId: submissions.worshipflow,
    userId: users.caleb,
    invitedBy: users.caleb,
    role: "lead",
    revenueSplitPct: 50,
    status: "accepted",
    acceptedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("submissionCollaborators", {
    submissionId: submissions.worshipflow,
    userId: users.sarah,
    invitedBy: users.caleb,
    role: "collaborator",
    revenueSplitPct: 35,
    status: "accepted",
    acceptedAt: Date.now() - 58 * 24 * 60 * 60 * 1000,
  });

  console.log("   ✅ Created team collaborators");
}

async function insertAiScores(
  ctx: MutationCtx,
  submissions: SeededSubmissions,
): Promise<void> {
  // Jake's AI scores
  await ctx.db.insert("aiScores", {
    submissionId: submissions.arenacore,
    rubricVersion: "v2",
    overallScore: 94,
    categoryScores: [
      { category: "Innovation", score: 19, maxScore: 20, feedback: "Meta-platform for venture competitions is a strong concept. Self-referential in the best way." },
      { category: "Technical Execution", score: 19, maxScore: 20, feedback: "Production-quality stack with real-time data, auth, and AI scoring built in." },
      { category: "Impact Potential", score: 19, maxScore: 20, feedback: "Direct infrastructure for the youth venture ecosystem. High leverage." },
      { category: "Presentation", score: 19, maxScore: 20, feedback: "Polished demo with live data. Clear narrative arc from problem to solution." },
      { category: "Faith Integration", score: 18, maxScore: 20, feedback: "Platform is purpose-built for faith-based entrepreneurship communities." },
    ],
    qualitativeFeedback: "ArenaCore is an impressive full-stack platform that directly enables the youth venture studio model. The technical execution is outstanding, and the real-time capabilities provide a genuinely differentiated experience.",
    modelUsed: "claude-sonnet-4-20250514",
    scoredAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("aiScores", {
    submissionId: submissions.mentormatch,
    rubricVersion: "v2",
    overallScore: 88,
    categoryScores: [
      { category: "Innovation", score: 18, maxScore: 20, feedback: "AI matching for mentorship is well-positioned. Strong differentiation from generic platforms." },
      { category: "Technical Execution", score: 17, maxScore: 20, feedback: "Matching algorithm is solid. Could benefit from more sophisticated embedding-based similarity." },
      { category: "Impact Potential", score: 18, maxScore: 20, feedback: "Mentorship is the #1 predictor of founder success. High-impact if adopted." },
      { category: "Presentation", score: 17, maxScore: 20, feedback: "Good pitch structure. Demo could show more of the matching flow." },
      { category: "Faith Integration", score: 18, maxScore: 20, feedback: "Discipleship-style mentorship model is a natural fit." },
    ],
    qualitativeFeedback: "MentorMatch addresses a critical gap in the founder journey. The AI pairing concept is sound, and the structured feedback loops add real value beyond simple introductions.",
    modelUsed: "claude-sonnet-4-20250514",
    scoredAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("aiScores", {
    submissionId: submissions.ecotrack,
    rubricVersion: "v2",
    overallScore: 92,
    categoryScores: [
      { category: "Innovation", score: 19, maxScore: 20, feedback: "Highly original approach to environmental monitoring using accessible technology." },
      { category: "Technical Execution", score: 18, maxScore: 20, feedback: "Clean codebase with excellent architecture. IoT integration is well-implemented." },
      { category: "Impact Potential", score: 19, maxScore: 20, feedback: "Clear path to meaningful community impact. Scalable to any neighborhood." },
      { category: "Presentation", score: 18, maxScore: 20, feedback: "Compelling video pitch with strong demo. Could improve on market size discussion." },
      { category: "Faith Integration", score: 18, maxScore: 20, feedback: "Beautiful connection between environmental stewardship and faith values." },
    ],
    qualitativeFeedback: "EcoTrack demonstrates exceptional vision in combining AI with environmental stewardship. The technical implementation is solid, and the community-driven approach aligns well with faith-based values of caring for God's creation. Consider expanding the business model section.",
    modelUsed: "claude-sonnet-4-20250514",
    scoredAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("aiScores", {
    submissionId: submissions.faithconnect,
    rubricVersion: "v2",
    overallScore: 87,
    categoryScores: [
      { category: "Innovation", score: 17, maxScore: 20, feedback: "Good concept, though prayer apps exist. The anonymous wall feature is unique." },
      { category: "Technical Execution", score: 18, maxScore: 20, feedback: "Solid React Native implementation with real-time sync." },
      { category: "Impact Potential", score: 17, maxScore: 20, feedback: "Strong potential for church adoption. Network effects could drive growth." },
      { category: "Presentation", score: 17, maxScore: 20, feedback: "Clear pitch with good energy. Demo showed core features well." },
      { category: "Faith Integration", score: 18, maxScore: 20, feedback: "Deeply rooted in faith practice. Addresses real need in church communities." },
    ],
    qualitativeFeedback: "FaithConnect addresses a genuine need in church communities. The team collaboration shows good dynamics. The anonymous prayer wall is a differentiator. Recommend exploring partnership strategies with church management platforms.",
    modelUsed: "claude-sonnet-4-20250514",
    scoredAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("aiScores", {
    submissionId: submissions.sermonai,
    rubricVersion: "v2",
    overallScore: 90,
    categoryScores: [
      { category: "Innovation", score: 18, maxScore: 20, feedback: "AI sermon prep is an underserved market. Excellent positioning." },
      { category: "Technical Execution", score: 18, maxScore: 20, feedback: "RAG implementation for scripture is impressive for a high school project." },
      { category: "Impact Potential", score: 18, maxScore: 20, feedback: "Could genuinely help pastors, especially bi-vocational ones with limited prep time." },
      { category: "Presentation", score: 18, maxScore: 20, feedback: "Professional-quality pitch with clear value proposition." },
      { category: "Faith Integration", score: 18, maxScore: 20, feedback: "Built to serve pastors directly. Thoughtful about theological accuracy." },
    ],
    qualitativeFeedback: "SermonAI is technically impressive and addresses a real pain point for pastors. The RAG-based approach to scripture suggestions shows sophisticated AI understanding. Monetization strategy is well thought out.",
    modelUsed: "claude-sonnet-4-20250514",
    scoredAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("aiScores", {
    submissionId: submissions.givesmart,
    rubricVersion: "v2",
    overallScore: 78,
    categoryScores: [
      { category: "Innovation", score: 14, maxScore: 20, feedback: "Giving platforms exist but the AI insights angle is interesting." },
      { category: "Technical Execution", score: 16, maxScore: 20, feedback: "Functional MVP but could use polish. Stripe integration works." },
      { category: "Impact Potential", score: 16, maxScore: 20, feedback: "Churches need better giving tools. Competition from established players." },
      { category: "Presentation", score: 16, maxScore: 20, feedback: "Good energy but could be more structured. Demo was a bit rushed." },
      { category: "Faith Integration", score: 16, maxScore: 20, feedback: "Clear stewardship angle. Aligns with Biblical teaching on giving." },
    ],
    qualitativeFeedback: "GiveSmart has potential but faces stiff competition from established giving platforms. The AI stewardship insights could be the differentiator — lean into that. Technical execution needs more polish before launch.",
    modelUsed: "claude-sonnet-4-20250514",
    scoredAt: Date.now() - 33 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("aiScores", {
    submissionId: submissions.worshipflow,
    rubricVersion: "v2",
    overallScore: 85,
    categoryScores: [
      { category: "Innovation", score: 17, maxScore: 20, feedback: "Smart setlist building based on sermon themes is creative." },
      { category: "Technical Execution", score: 17, maxScore: 20, feedback: "Good integration approach. Web Audio API usage is well done." },
      { category: "Impact Potential", score: 17, maxScore: 20, feedback: "Worship planning is a real pain point. Good market opportunity." },
      { category: "Presentation", score: 17, maxScore: 20, feedback: "Engaging pitch with live demo of setlist generation." },
      { category: "Faith Integration", score: 17, maxScore: 20, feedback: "Built specifically for the worship experience. Thoughtful approach." },
    ],
    qualitativeFeedback: "WorshipFlow solves a genuine weekly challenge for worship teams. The AI-powered song suggestions based on sermon themes is clever. Team dynamics are strong. Consider ProPresenter integration for broader adoption.",
    modelUsed: "claude-sonnet-4-20250514",
    scoredAt: Date.now() - 62 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("aiScores", {
    submissionId: submissions.faithfunds,
    rubricVersion: "v2",
    overallScore: 82,
    categoryScores: [
      { category: "Innovation", score: 16, maxScore: 20, feedback: "Micro-grant matching for faith entrepreneurs is a novel concept." },
      { category: "Technical Execution", score: 16, maxScore: 20, feedback: "Clean UI but limited backend functionality in demo." },
      { category: "Impact Potential", score: 17, maxScore: 20, feedback: "Could unlock real funding for young entrepreneurs. Network effects." },
      { category: "Presentation", score: 17, maxScore: 20, feedback: "Compelling story and clear vision. Market research was solid." },
      { category: "Faith Integration", score: 16, maxScore: 20, feedback: "Connects faith-based donors with faith-driven entrepreneurs." },
    ],
    qualitativeFeedback: "FaithFunds addresses a real gap in funding for young faith-based entrepreneurs. The concept is strong but needs more technical depth. The matching algorithm could be the key differentiator.",
    modelUsed: "claude-sonnet-4-20250514",
    scoredAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  });

  console.log("   ✅ Created 6 AI scores");
}
