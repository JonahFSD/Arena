import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export type SeededUsers = Record<string, Id<"users">>;

export async function seedUsers(ctx: MutationCtx): Promise<SeededUsers> {
  const users: SeededUsers = {};

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
    bqType: "Luminary",
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
    bqType: "Optimizer",
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
    bqType: "Optimizer",
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
    bqType: "Luminary",
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
    bqType: "Optimizer",
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
  return users;
}
