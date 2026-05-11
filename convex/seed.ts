import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================
// SEED DATA — realistic demo data for the platform
//
// Run with:  npx convex run seed:run
//
// This is idempotent — it checks for existing data
// before inserting. To reset, clear the tables in the
// Convex dashboard first, then re-run.
// ============================================

/**
 * Main entry point — calls the insert mutation.
 * Uses an action so we can orchestrate multiple mutations.
 */
export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.insertAll);
  },
});

/**
 * Inserts all demo data in a single transaction.
 */
export const insertAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if we've already seeded
    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) {
      console.log("⚠️  Database already has data. Skipping seed.");
      console.log("   Clear tables in the dashboard first if you want to re-seed.");
      return;
    }

    console.log("🌱 Seeding database...");

    // ============================================
    // 1. USERS (demo roster incl. executive team)
    // ============================================
    const users: Record<string, Id<"users">> = {};

    // Admin user (Jake / you)
    users.jake = await ctx.db.insert("users", {
      email: "jake@austinchristianu.org",
      fullName: "Jake Oswald",
      bio: "Platform founder. Building the future of youth entrepreneurship at the intersection of faith and innovation.",
      schoolName: "Austin Christian University",
      graduationYear: 2024,
      age: 18,
      state: "TX",
      role: "superadmin",
      skills: ["Product Design", "Full-Stack Dev", "AI/ML"],
      lookingForCofounders: false,
      bqType: "Builder",
      referralCode: "jake-demo-ref",
      points: 18750,
      totalEarnings: 5670,
      networkCount: 24,
    });

    // Connor Dore — President
    users.connor = await ctx.db.insert("users", {
      email: "connordore36@gmail.com",
      fullName: "Connor Dore",
      schoolName: "Jupiter Christian School",
      city: "Jupiter",
      graduationYear: 2027,
      state: "FL",
      role: "member",
      skills: [],
      lookingForCofounders: false,
      points: 0,
      pointsThisMonth: 0,
      totalEarnings: 0,
      networkCount: 0,
    });

    // Sarah Chen — top performer, frequent collaborator
    users.sarah = await ctx.db.insert("users", {
      email: "sarah.chen@example.com",
      fullName: "Sarah Chen",
      bio: "Passionate about using AI to solve real-world problems. Currently building EcoTrack to help communities monitor environmental impact.",
      schoolName: "Grace Academy",
      graduationYear: 2027,
      age: 16,
      state: "CA",
      role: "member",
      skills: ["AI/ML", "Python", "Data Science"],
      lookingForCofounders: true,
      bqType: "Visionary",
      points: 14200,
      pointsThisMonth: 3100,
      totalEarnings: 4250,
      networkCount: 18,
    });

    // David Park — strong builder
    users.david = await ctx.db.insert("users", {
      email: "david.park@example.com",
      fullName: "David Park",
      bio: "Full-stack developer and aspiring startup founder. Love building tools that help people grow in faith.",
      schoolName: "Covenant Prep",
      graduationYear: 2027,
      age: 16,
      city: "Minneapolis",
      state: "MN",
      role: "member",
      skills: ["React", "Node.js", "UI/UX Design"],
      lookingForCofounders: true,
      bqType: "Operator",
      points: 11800,
      pointsThisMonth: 2800,
      totalEarnings: 3100,
      networkCount: 15,
    });

    // Elijah Thompson — consistent contributor
    users.elijah = await ctx.db.insert("users", {
      email: "elijah.thompson@example.com",
      fullName: "Elijah Thompson",
      bio: "Entrepreneurship runs in my family. Using tech to bring communities together through shared faith experiences.",
      schoolName: "Liberty Christian",
      graduationYear: 2028,
      age: 15,
      state: "VA",
      role: "member",
      skills: ["Mobile Dev", "Swift", "Firebase"],
      lookingForCofounders: false,
      bqType: "Strategist",
      points: 9400,
      pointsThisMonth: 1950,
      totalEarnings: 1500,
      networkCount: 12,
    });

    // Grace Kim — creative catalyst
    users.grace = await ctx.db.insert("users", {
      email: "grace.kim@example.com",
      fullName: "Grace Kim",
      bio: "Designer turned developer. I believe beautiful products can change the world and glorify God.",
      schoolName: "Faith Lutheran",
      graduationYear: 2027,
      age: 16,
      state: "WA",
      role: "member",
      skills: ["UI/UX Design", "Figma", "React"],
      lookingForCofounders: true,
      bqType: "Catalyst",
      points: 8200,
      pointsThisMonth: 3400,
      totalEarnings: 950,
      networkCount: 14,
    });

    // Maria Garcia
    users.maria = await ctx.db.insert("users", {
      email: "maria.garcia@example.com",
      fullName: "Maria Garcia",
      bio: "First-generation entrepreneur. Building apps that serve Spanish-speaking communities.",
      schoolName: "Hope Academy",
      graduationYear: 2026,
      age: 17,
      state: "FL",
      role: "member",
      skills: ["React Native", "Spanish", "Marketing"],
      lookingForCofounders: true,
      bqType: "Anchor",
      points: 7600,
      pointsThisMonth: 2100,
      totalEarnings: 820,
      networkCount: 11,
    });

    // Noah Williams
    users.noah = await ctx.db.insert("users", {
      email: "noah.williams@example.com",
      fullName: "Noah Williams",
      bio: "Backend engineer who loves clean APIs and scalable systems. Exploring how blockchain can serve the church.",
      schoolName: "Heritage Christian",
      graduationYear: 2028,
      age: 15,
      state: "OH",
      role: "member",
      skills: ["Go", "PostgreSQL", "Docker"],
      lookingForCofounders: false,
      bqType: "Builder",
      points: 6100,
      pointsThisMonth: 1750,
      totalEarnings: 0,
      networkCount: 8,
    });

    // Maya Patel — executive team (VP Finance)
    users.maya = await ctx.db.insert("users", {
      email: "maya.patel@example.com",
      fullName: "Maya Patel",
      bio: "Numbers-driven operator. Building financial literacy tools for student founders.",
      schoolName: "Heritage Christian",
      graduationYear: 2028,
      age: 16,
      state: "TX",
      role: "member",
      skills: ["Finance", "Spreadsheets", "Pitch Analysis"],
      lookingForCofounders: true,
      bqType: "Operator",
      points: 7200,
      pointsThisMonth: 1500,
      totalEarnings: 600,
      networkCount: 10,
    });

    // Lars Ostervold — advisor (demo profile)
    users.lars = await ctx.db.insert("users", {
      email: "lars.ostervold@example.com",
      fullName: "Lars Ostervold",
      bio: "Technology leader supporting faith-forward innovation in higher ed.",
      schoolName: "Austin Christian University",
      graduationYear: 2026,
      age: 17,
      state: "TX",
      role: "admin",
      skills: ["Systems Architecture", "Security", "Mentorship"],
      lookingForCofounders: false,
      bqType: "Builder",
      points: 3200,
      pointsThisMonth: 400,
      totalEarnings: 0,
      networkCount: 16,
    });

    // Ava Martinez
    users.ava = await ctx.db.insert("users", {
      email: "ava.martinez@example.com",
      fullName: "Ava Martinez",
      bio: "Aspiring product manager with a heart for social impact. Currently exploring AI-powered mentoring platforms.",
      schoolName: "Cornerstone Academy",
      graduationYear: 2027,
      age: 16,
      state: "AZ",
      role: "member",
      skills: ["Product Management", "Pitch Decks", "Market Research"],
      lookingForCofounders: true,
      bqType: "Strategist",
      points: 5400,
      pointsThisMonth: 1200,
      totalEarnings: 500,
      networkCount: 9,
    });

    // Caleb Johnson
    users.caleb = await ctx.db.insert("users", {
      email: "caleb.johnson@example.com",
      fullName: "Caleb Johnson",
      bio: "Creative coder and worship leader. Building tools at the intersection of music and technology.",
      schoolName: "Redeemer Prep",
      graduationYear: 2026,
      age: 17,
      state: "TN",
      role: "member",
      skills: ["Web Audio API", "React", "Music Production"],
      lookingForCofounders: true,
      bqType: "Visionary",
      points: 4800,
      pointsThisMonth: 980,
      totalEarnings: 0,
      networkCount: 6,
    });

    // Sophia Lee
    users.sophia = await ctx.db.insert("users", {
      email: "sophia.lee@example.com",
      fullName: "Sophia Lee",
      bio: "Data nerd who wants to use analytics to help nonprofits maximize their impact.",
      schoolName: "Trinity Christian",
      graduationYear: 2028,
      age: 15,
      state: "GA",
      role: "member",
      skills: ["Python", "Data Visualization", "Tableau"],
      lookingForCofounders: false,
      bqType: "Operator",
      points: 3200,
      pointsThisMonth: 1420,
      totalEarnings: 0,
      networkCount: 5,
    });

    // Isaiah Brown
    users.isaiah = await ctx.db.insert("users", {
      email: "isaiah.brown@example.com",
      fullName: "Isaiah Brown",
      bio: "Aspiring tech entrepreneur. Passionate about making education accessible to underserved communities.",
      schoolName: "Victory Christian Academy",
      graduationYear: 2027,
      age: 16,
      state: "NC",
      role: "member",
      skills: ["JavaScript", "EdTech", "Community Building"],
      lookingForCofounders: true,
      bqType: "Anchor",
      points: 2800,
      pointsThisMonth: 890,
      totalEarnings: 0,
      networkCount: 4,
    });

    // Mia Rodriguez
    users.mia = await ctx.db.insert("users", {
      email: "mia.rodriguez@example.com",
      fullName: "Mia Rodriguez",
      bio: "Designer and storyteller. I believe every startup needs a compelling narrative rooted in purpose.",
      schoolName: "New Life Christian",
      graduationYear: 2026,
      age: 17,
      state: "CO",
      role: "member",
      skills: ["Graphic Design", "Copywriting", "Branding"],
      lookingForCofounders: false,
      bqType: "Catalyst",
      points: 2200,
      pointsThisMonth: 650,
      totalEarnings: 0,
      networkCount: 3,
    });

    console.log(`   ✅ Created ${Object.keys(users).length} users`);

    // ============================================
    // 2. APPLICATIONS (3 pending + 2 processed)
    // ============================================
    await ctx.db.insert("applications", {
      userEmail: "emma.watson@example.com",
      fullName: "Emma Watson",
      birthdate: "2010-03-15",
      school: "Cornerstone Academy",
      graduationYear: 2028,
      faithStatement: "My faith is the foundation of everything I do. I believe God has given me a passion for technology and entrepreneurship to serve others and make a positive impact in my community. Through my church youth group, I've learned the importance of servant leadership and using our gifts to glorify God.",
      parentFirstName: "Margaret",
      parentLastName: "Watson",
      parentRelation: "Mother",
      parentEmail: "margaret.watson@example.com",
      parentPhone: "(555) 123-4567",
      status: "pending",
    });

    await ctx.db.insert("applications", {
      userEmail: "liam.johnson@example.com",
      fullName: "Liam Johnson",
      birthdate: "2011-07-22",
      school: "Faith Academy",
      graduationYear: 2029,
      faithStatement: "Growing up in a Christian household, I've always known that my purpose is to use my talents to serve God's kingdom. I see entrepreneurship as a way to create solutions that honor God and help people in need.",
      parentFirstName: "Robert",
      parentLastName: "Johnson",
      parentRelation: "Father",
      parentEmail: "robert.johnson@example.com",
      parentPhone: "(555) 234-5678",
      status: "pending",
    });

    await ctx.db.insert("applications", {
      userEmail: "olivia.brown@example.com",
      fullName: "Olivia Brown",
      birthdate: "2009-11-04",
      school: "Grace Christian School",
      graduationYear: 2027,
      faithStatement: "My faith journey has taught me that every talent we have is a gift meant to be shared. I want to combine my love for business with my desire to make the world a better place through Christ-centered innovation.",
      parentFirstName: "Jennifer",
      parentLastName: "Brown",
      parentRelation: "Mother",
      parentEmail: "jennifer.brown@example.com",
      parentPhone: "(555) 345-6789",
      status: "pending",
    });

    // Two already-processed applications
    await ctx.db.insert("applications", {
      userEmail: "sarah.chen@example.com",
      fullName: "Sarah Chen",
      birthdate: "2010-05-18",
      school: "Grace Academy",
      graduationYear: 2027,
      faithStatement: "Faith drives my curiosity about the world. I see technology as a tool God has given us to steward creation.",
      parentFirstName: "Linda",
      parentLastName: "Chen",
      parentRelation: "Mother",
      parentEmail: "linda.chen@example.com",
      parentPhone: "(555) 456-7890",
      status: "approved",
      reviewerId: users.jake,
      reviewerNotes: "Outstanding application. Strong technical skills and clear vision.",
      reviewedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("applications", {
      userEmail: "rejected.applicant@example.com",
      fullName: "Test Applicant",
      birthdate: "2012-01-10",
      school: "Some School",
      graduationYear: 2030,
      faithStatement: "Short statement.",
      parentFirstName: "Parent",
      parentLastName: "Name",
      parentRelation: "Guardian",
      parentEmail: "parent@example.com",
      parentPhone: "(555) 000-0000",
      status: "rejected",
      reviewerId: users.jake,
      reviewerNotes: "Application lacks depth. Encouraged to reapply next cycle.",
      reviewedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    });

    console.log("   ✅ Created 5 applications");

    // ============================================
    // 3. SUBMISSIONS (across 3 months)
    // ============================================
    const submissions: Record<string, Id<"submissions">> = {};

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

    // ============================================
    // 4. SUBMISSION COLLABORATORS
    // ============================================

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

    // ============================================
    // 5. AI SCORES
    // ============================================

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

    // ============================================
    // 6. VOTING ROUNDS
    // ============================================
    const votingRounds: Record<string, Id<"votingRounds">> = {};

    votingRounds.march = await ctx.db.insert("votingRounds", {
      monthYear: "2026-03",
      opensAt: new Date("2026-04-01T14:00:00Z").getTime(),
      closesAt: new Date("2026-04-07T14:00:00Z").getTime(),
      minScoreThreshold: 80,
      status: "open",
    });

    votingRounds.february = await ctx.db.insert("votingRounds", {
      monthYear: "2026-02",
      opensAt: new Date("2026-03-01T14:00:00Z").getTime(),
      closesAt: new Date("2026-03-07T14:00:00Z").getTime(),
      minScoreThreshold: 80,
      status: "finalized",
    });

    votingRounds.january = await ctx.db.insert("votingRounds", {
      monthYear: "2026-01",
      opensAt: new Date("2026-02-01T14:00:00Z").getTime(),
      closesAt: new Date("2026-02-07T14:00:00Z").getTime(),
      minScoreThreshold: 80,
      status: "finalized",
    });

    console.log("   ✅ Created 3 voting rounds");

    // ============================================
    // 7. VOTES (for finalized rounds)
    // ============================================
    const voters = [users.elijah, users.grace, users.maria, users.noah, users.ava, users.caleb, users.sophia, users.isaiah, users.mia];

    // Feb voting: Sarah's SermonAI vs Maria's GiveSmart
    for (const voter of voters.slice(0, 7)) {
      await ctx.db.insert("votes", {
        votingRoundId: votingRounds.february,
        voterUserId: voter,
        submissionId: submissions.sermonai,
      });
    }
    for (const voter of voters.slice(0, 4)) {
      await ctx.db.insert("votes", {
        votingRoundId: votingRounds.february,
        voterUserId: voter,
        submissionId: submissions.givesmart,
      });
    }

    // Jan voting: Caleb's WorshipFlow vs Ava's FaithFunds
    for (const voter of voters.slice(0, 6)) {
      await ctx.db.insert("votes", {
        votingRoundId: votingRounds.january,
        voterUserId: voter,
        submissionId: submissions.worshipflow,
      });
    }
    for (const voter of voters.slice(0, 5)) {
      await ctx.db.insert("votes", {
        votingRoundId: votingRounds.january,
        voterUserId: voter,
        submissionId: submissions.faithfunds,
      });
    }

    console.log("   ✅ Created votes");

    // ============================================
    // 8. PRIZE POOLS
    // ============================================
    await ctx.db.insert("prizePools", {
      monthYear: "2026-03",
      totalCollected: 220000,
      operationalFeePct: 10,
      netPrize: 198000,
      firstPlacePct: 55,
      secondPlacePct: 30,
      thirdPlacePct: 15,
      payoutStatus: "pending",
    });

    await ctx.db.insert("prizePools", {
      monthYear: "2026-02",
      totalCollected: 195000,
      operationalFeePct: 10,
      netPrize: 175500,
      firstPlacePct: 55,
      secondPlacePct: 30,
      thirdPlacePct: 15,
      firstPlaceUserId: users.sarah,
      secondPlaceUserId: users.maria,
      payoutStatus: "paid",
      stripeTransferId: "tr_demo_feb2026",
      finalizedAt: new Date("2026-03-08T14:00:00Z").getTime(),
    });

    await ctx.db.insert("prizePools", {
      monthYear: "2026-01",
      totalCollected: 180000,
      operationalFeePct: 10,
      netPrize: 162000,
      firstPlacePct: 55,
      secondPlacePct: 30,
      thirdPlacePct: 15,
      firstPlaceUserId: users.caleb,
      secondPlaceUserId: users.ava,
      payoutStatus: "paid",
      stripeTransferId: "tr_demo_jan2026",
      finalizedAt: new Date("2026-02-08T14:00:00Z").getTime(),
    });

    console.log("   ✅ Created 3 prize pools");

    // ============================================
    // 9. MESSAGES
    // ============================================
    const sarahJakeThread = [users.sarah as string, users.jake as string].sort().join("_");
    const davidJakeThread = [users.david as string, users.jake as string].sort().join("_");
    const elijahJakeThread = [users.elijah as string, users.jake as string].sort().join("_");
    const graceJakeThread = [users.grace as string, users.jake as string].sort().join("_");

    // Sarah <-> Jake conversation
    await ctx.db.insert("messages", {
      threadId: sarahJakeThread,
      senderUserId: users.sarah,
      recipientUserId: users.jake,
      body: "Hey Jake! I just submitted my EcoTrack pitch for this month. Would love your feedback on the demo video before the deadline!",
      readAt: Date.now() - 2 * 60 * 60 * 1000,
    });
    await ctx.db.insert("messages", {
      threadId: sarahJakeThread,
      senderUserId: users.jake,
      recipientUserId: users.sarah,
      body: "Just watched it — the IoT sensor integration demo was really compelling. One suggestion: spend 30 more seconds on the business model slide. Judges love seeing the path to revenue.",
      readAt: Date.now() - 1.5 * 60 * 60 * 1000,
    });
    await ctx.db.insert("messages", {
      threadId: sarahJakeThread,
      senderUserId: users.sarah,
      recipientUserId: users.jake,
      body: "Great call, I'll re-record that section tonight. Also — are you coming to the virtual meetup on Friday?",
    });

    // David <-> Jake conversation
    await ctx.db.insert("messages", {
      threadId: davidJakeThread,
      senderUserId: users.david,
      recipientUserId: users.jake,
      body: "Hey! Grace and I are looking for a third team member for FaithConnect. Know anyone with backend experience who might be interested?",
      readAt: Date.now() - 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("messages", {
      threadId: davidJakeThread,
      senderUserId: users.jake,
      recipientUserId: users.david,
      body: "Noah Williams might be a great fit — he's strong with Go and databases. I'll introduce you two!",
      readAt: Date.now() - 23 * 60 * 60 * 1000,
    });

    // Elijah <-> Jake
    await ctx.db.insert("messages", {
      threadId: elijahJakeThread,
      senderUserId: users.elijah,
      recipientUserId: users.jake,
      body: "Quick question — is there a minimum AI score needed to qualify for the voting round?",
      readAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("messages", {
      threadId: elijahJakeThread,
      senderUserId: users.jake,
      recipientUserId: users.elijah,
      body: "Yes! Submissions need at least an 80 on the AI score to be eligible for community voting. Focus on the presentation and faith integration categories — those tend to make the biggest difference.",
      readAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    });

    // Grace <-> Jake (unread)
    await ctx.db.insert("messages", {
      threadId: graceJakeThread,
      senderUserId: users.grace,
      recipientUserId: users.jake,
      body: "I'm thinking about switching PrayerWall from a solo project to a team submission. David offered to help with the backend. What do you think?",
    });

    console.log("   ✅ Created message threads");

    // ============================================
    // 10. NOTIFICATIONS
    // ============================================
    await ctx.db.insert("notifications", {
      userId: users.jake,
      type: "ai_score_ready",
      title: "AI Score Ready",
      body: "EcoTrack received a score of 92/100!",
      read: false,
      actionUrl: "/submissions/" + submissions.ecotrack,
    });

    await ctx.db.insert("notifications", {
      userId: users.jake,
      type: "voting_open",
      title: "Voting is Open!",
      body: "The March 2026 voting round is now open. Cast your votes before April 7th.",
      read: false,
      actionUrl: "/voting",
    });

    await ctx.db.insert("notifications", {
      userId: users.jake,
      type: "new_message",
      title: "New Message from Grace Kim",
      body: "I'm thinking about switching PrayerWall from a solo project...",
      read: false,
      actionUrl: "/messages/" + graceJakeThread,
    });

    await ctx.db.insert("notifications", {
      userId: users.jake,
      type: "winner_announced",
      title: "February Winners Announced!",
      body: "Congratulations to Sarah Chen (1st) and Maria Garcia (2nd) for the February round!",
      read: true,
      actionUrl: "/pitches/results",
    });

    await ctx.db.insert("notifications", {
      userId: users.jake,
      type: "application_approved",
      title: "New Member Joined",
      body: "Isaiah Brown's application has been approved and they've joined the community.",
      read: true,
      actionUrl: "/members/" + users.isaiah,
    });

    console.log("   ✅ Created notifications");

    // ============================================
    // 11. BOUNTIES
    // ============================================
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

    // ============================================
    // 12. BOUNTY SUBMISSIONS
    // ============================================
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

    // ============================================
    // 13. VENTURE STUDIO FLAGS
    // ============================================
    await ctx.db.insert("ventureStudioFlags", {
      userId: users.isaiah,
      flaggedByAdminId: users.jake,
      notes: "Missed two consecutive submission deadlines. Follow up to check if student needs support or is disengaging.",
    });

    console.log("   ✅ Created admin flags");

    // ============================================
    // 14. AUDIT LOG
    // ============================================
    await ctx.db.insert("auditLog", {
      adminUserId: users.jake,
      action: "application.approved",
      targetType: "application",
      targetId: "sarah-chen-app",
      metadata: { applicantEmail: "sarah.chen@example.com" },
    });

    await ctx.db.insert("auditLog", {
      adminUserId: users.jake,
      action: "application.rejected",
      targetType: "application",
      targetId: "test-applicant",
      metadata: { applicantEmail: "rejected.applicant@example.com", reason: "Lacks depth" },
    });

    await ctx.db.insert("auditLog", {
      adminUserId: users.jake,
      action: "user.flagged",
      targetType: "user",
      targetId: users.isaiah,
      metadata: { reason: "Missed deadlines" },
    });

    console.log("   ✅ Created audit log entries");

    // ============================================
    // LEADERSHIP POSITIONS
    // ============================================
    await ctx.db.insert("leadershipPositions", {
      type: "executive", name: "Connor Dore", userId: users.connor, role: "President",
      sortOrder: 1,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "executive", name: "David Park", userId: users.david, role: "VP Marketing",
      school: "Covenant Prep", graduation: 2027, sortOrder: 2,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "executive", name: "Maria Garcia", userId: users.maria, role: "VP Technology",
      school: "Hope Academy", graduation: 2028, sortOrder: 3,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "executive", name: "Elijah Thompson", userId: users.elijah, role: "VP Recruitment",
      school: "Liberty Christian", graduation: 2028, sortOrder: 4,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "executive", name: "Grace Kim", userId: users.grace, role: "VP Operations",
      school: "Faith Lutheran", graduation: 2029, sortOrder: 5,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "executive", name: "Jake Oswald", userId: users.jake, role: "Advisor",
      company: "Austin Christian U", jobTitle: "Accelerator Director", sortOrder: 7,
    });

    // Regional Directors
    await ctx.db.insert("leadershipPositions", {
      type: "regional_director", name: "Ava Martinez", userId: users.ava, role: "Regional Director",
      region: "New England", school: "Cornerstone Academy", graduation: 2028, sortOrder: 1,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "regional_director", name: "Noah Williams", userId: users.noah, role: "Regional Director",
      region: "Mid-Atlantic", school: "Heritage Christian", graduation: 2028, sortOrder: 2,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "regional_director", name: "Sophia Lee", userId: users.sophia, role: "Regional Director",
      region: "Southeast", school: "Trinity Christian", graduation: 2029, sortOrder: 3,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "regional_director", name: "Caleb Johnson", userId: users.caleb, role: "Regional Director",
      region: "Midwest", school: "Redeemer Prep", graduation: 2028, sortOrder: 4,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "regional_director", name: "Isaiah Brown", userId: users.isaiah, role: "Regional Director",
      region: "South Central", school: "Victory Christian", graduation: 2028, sortOrder: 5,
    });

    // State Ambassadors
    await ctx.db.insert("leadershipPositions", {
      type: "ambassador", name: "Maria Garcia", userId: users.maria, role: "Ambassador",
      state: "California", school: "Hope Academy", graduation: 2028, sortOrder: 1,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "ambassador", name: "Elijah Thompson", userId: users.elijah, role: "Ambassador",
      state: "Florida", school: "Liberty Christian", graduation: 2028, sortOrder: 2,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "ambassador", name: "Grace Kim", userId: users.grace, role: "Ambassador",
      state: "New York", school: "Faith Lutheran", graduation: 2029, sortOrder: 3,
    });
    await ctx.db.insert("leadershipPositions", {
      type: "ambassador", name: "Noah Williams", userId: users.noah, role: "Ambassador",
      state: "Texas", school: "Heritage Christian", graduation: 2028, sortOrder: 4,
    });

    console.log("   ✅ Created leadership positions");

    // ============================================
    // NOMINATORS (approved nominators — demo)
    // ============================================
    await ctx.db.insert("nominators", {
      email: "adam@jupiter-school.example",
      fullName: "Adam Richardson",
      companyWebsite: "https://jupiter-school.example",
      status: "approved",
      source: "admin_added",
      approvedById: users.jake,
      approvedAt: Date.now(),
    });
    await ctx.db.insert("nominators", {
      email: "connor.precisionworks@gmail.com",
      fullName: "Connor Dore",
      status: "approved",
      source: "admin_added",
      approvedById: users.jake,
      approvedAt: Date.now(),
    });
    await ctx.db.insert("nominators", {
      email: "jonahwelliott@gmail.com",
      fullName: "Jonah Elliott",
      status: "approved",
      source: "admin_added",
      approvedById: users.jake,
      approvedAt: Date.now(),
    });
    console.log("   ✅ Created 3 approved nominators");

    console.log("\n🎉 Seed complete! All demo data is live.");
    console.log("   View it at: https://dashboard.convex.dev/d/energetic-okapi-601");
  },
});

/**
 * Clear all seed data — use from the dashboard or CLI.
 *
 * Run with:  npx convex run seed:clearAll
 */
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "authRateLimits", "authRefreshTokens", "authSessions",
      "authVerificationCodes", "authVerifiers", "authAccounts",
      "ambassadorApplications", "leadershipPositions",
      "nominations", "nominators", "nominatorRequests",
      "auditLog", "ventureStudioFlags", "bountySubmissions", "bounties",
      "notifications", "messages", "votes", "prizePools", "votingRounds",
      "aiScores", "submissionCollaborators", "submissions", "applications",
      "memberships", "users",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      console.log(`   🗑️  Cleared ${docs.length} rows from ${table}`);
    }

    console.log("\n✅ All tables cleared. Run seed:run to re-seed.");
  },
});
