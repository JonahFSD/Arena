import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // ============================================
  // USERS — member profiles
  // ============================================
  users: defineTable({
    email: v.string(),
    fullName: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    graduationYear: v.optional(v.number()),
    age: v.optional(v.number()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    tools: v.optional(v.array(v.string())),
    role: v.union(
      v.literal("member"),
      v.literal("admin"),
      v.literal("superadmin")
    ),
    skills: v.array(v.string()),
    lookingForCofounders: v.boolean(),
    bqType: v.optional(
      v.union(
        v.literal("Anchor"),
        v.literal("Visionary"),
        v.literal("Operator"),
        v.literal("Catalyst"),
        v.literal("Strategist"),
        v.literal("Builder")
      )
    ),
    bqResultsUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.id("users")),
    // Points & computed stats (denormalized for leaderboard)
    points: v.optional(v.number()),
    /** Points earned in the current calendar month (denormalized; reset by a future job). */
    pointsThisMonth: v.optional(v.number()),
    totalEarnings: v.optional(v.number()),
    networkCount: v.optional(v.number()),
    // Auth link
    authSubject: v.optional(v.string()),
    /** Last time the user opened the Bounties list (for "new since last visit" sidebar badge). */
    lastViewedBountiesAt: v.optional(v.number()),
    /** Per-channel notification preferences (true = enabled). */
    notificationPreferences: v.optional(
      v.object({
        aiScoringEmail: v.boolean(),
        aiScoringSms: v.boolean(),
        votingRoundEmail: v.boolean(),
        votingRoundSms: v.boolean(),
        winnersEmail: v.boolean(),
        winnersSms: v.boolean(),
        monthlyRecapEmail: v.boolean(),
        monthlyRecapSms: v.boolean(),
        newMessagesEmail: v.boolean(),
        newMessagesSms: v.boolean(),
        communityUpdatesEmail: v.boolean(),
        communityUpdatesSms: v.boolean(),
      })
    ),
  })
    .index("by_email", ["email"])
    .index("by_authSubject", ["authSubject"])
    .index("by_role", ["role"])
    .index("by_referralCode", ["referralCode"])
    .index("by_points", ["points"]),

  // ============================================
  // APPLICATIONS — registration/admission
  // ============================================
  applications: defineTable({
    userEmail: v.string(),
    fullName: v.string(),
    birthdate: v.string(), // ISO date string e.g. "2010-03-15"
    school: v.string(),
    graduationYear: v.number(),
    faithStatement: v.string(),
    parentFirstName: v.string(),
    parentLastName: v.string(),
    parentRelation: v.string(), // "Mother", "Father", "Guardian"
    parentEmail: v.string(),
    parentPhone: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("more_info")
    ),
    reviewerId: v.optional(v.id("users")),
    referralCode: v.optional(v.string()),
    /** Nomination token presented at /apply?n=TOKEN. v1 = audit hint only,
     *  not cryptographically verified. v2 will link to a nominators table. */
    nominationToken: v.optional(v.string()),
    reviewerNotes: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    // Profile fields (captured at application time)
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    tools: v.optional(v.array(v.string())),
    linkedinUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    // Legacy fields (kept optional for existing data)
    age: v.optional(v.number()),
    bio: v.optional(v.string()),
    lookingForCofounders: v.optional(v.boolean()),
    entrepreneurshipInterest: v.optional(v.string()),
    aiInterest: v.optional(v.string()),
    videoIntroUrl: v.optional(v.string()),
    parentName: v.optional(v.string()),
    portfolioLinks: v.optional(v.array(v.object({
      label: v.string(),
      url: v.string(),
    }))),
  })
    .index("by_status", ["status"])
    .index("by_email", ["userEmail"]),

  // ============================================
  // MEMBERSHIPS — Stripe subscriptions
  // ============================================
  memberships: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("cancelled"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  // ============================================
  // SUBMISSIONS — monthly venture pitches
  // ============================================
  submissions: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    videoUrl: v.optional(v.string()),
    videoStorageId: v.optional(v.id("_storage")),
    videoThumbnailStorageId: v.optional(v.id("_storage")),
    githubUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    slideDeckUrl: v.optional(v.string()),
    additionalLinks: v.optional(v.any()),
    monthYear: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("scored")
    ),
    isTeamSubmission: v.boolean(),
  })
    .index("by_userId_monthYear", ["userId", "monthYear"])
    .index("by_monthYear_status", ["monthYear", "status"]),

  // ============================================
  // SUBMISSION COLLABORATORS — team members
  // ============================================
  submissionCollaborators: defineTable({
    submissionId: v.id("submissions"),
    userId: v.id("users"),
    invitedBy: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("collaborator")),
    revenueSplitPct: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_submissionId", ["submissionId"])
    .index("by_userId", ["userId"]),

  // ============================================
  // AI SCORES — AI-evaluated submission scores
  // ============================================
  aiScores: defineTable({
    submissionId: v.id("submissions"),
    rubricVersion: v.string(),
    overallScore: v.number(),
    categoryScores: v.array(
      v.object({
        category: v.string(),
        score: v.number(),
        maxScore: v.number(),
        feedback: v.string(),
      })
    ),
    qualitativeFeedback: v.string(),
    modelUsed: v.string(),
    scoredAt: v.number(),
  }).index("by_submissionId", ["submissionId"]),

  // ============================================
  // VOTING ROUNDS — monthly voting cycles
  // ============================================
  votingRounds: defineTable({
    monthYear: v.string(),
    opensAt: v.number(),
    closesAt: v.number(),
    minScoreThreshold: v.number(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("open"),
      v.literal("closed"),
      v.literal("finalized")
    ),
  })
    .index("by_monthYear", ["monthYear"])
    .index("by_status", ["status"]),

  // ============================================
  // VOTES — member votes on submissions
  // ============================================
  votes: defineTable({
    votingRoundId: v.id("votingRounds"),
    voterUserId: v.id("users"),
    submissionId: v.id("submissions"),
  })
    .index("by_roundId_submissionId", ["votingRoundId", "submissionId"])
    .index("by_roundId_voterId", ["votingRoundId", "voterUserId"]),

  // ============================================
  // PRIZE POOLS — monthly prize distribution
  // ============================================
  prizePools: defineTable({
    monthYear: v.string(),
    totalCollected: v.number(),
    operationalFeePct: v.number(),
    netPrize: v.number(),
    firstPlacePct: v.number(),
    secondPlacePct: v.number(),
    thirdPlacePct: v.number(),
    firstPlaceUserId: v.optional(v.id("users")),
    secondPlaceUserId: v.optional(v.id("users")),
    thirdPlaceUserId: v.optional(v.id("users")),
    payoutStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed")
    ),
    stripeTransferId: v.optional(v.string()),
    finalizedAt: v.optional(v.number()),
  }).index("by_monthYear", ["monthYear"]),

  // ============================================
  // MESSAGES — direct messaging
  // ============================================
  messages: defineTable({
    threadId: v.string(),
    senderUserId: v.id("users"),
    recipientUserId: v.id("users"),
    body: v.string(),
    readAt: v.optional(v.number()),
  })
    .index("by_threadId", ["threadId"])
    .index("by_recipientUserId", ["recipientUserId"]),

  // ============================================
  // VENTURE STUDIO FLAGS — admin flagging
  // ============================================
  ventureStudioFlags: defineTable({
    userId: v.id("users"),
    flaggedByAdminId: v.id("users"),
    notes: v.string(),
  }).index("by_userId", ["userId"]),

  // ============================================
  // NOTIFICATIONS — in-app notifications
  // ============================================
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
  }).index("by_userId_read", ["userId", "read"]),

  // ============================================
  // AUDIT LOG — admin action tracking
  // ============================================
  auditLog: defineTable({
    adminUserId: v.id("users"),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    metadata: v.optional(v.any()),
  }).index("by_adminUserId", ["adminUserId"]),

  // ============================================
  // LEADERSHIP POSITIONS — executive team, regional directors, ambassadors
  // ============================================
  leadershipPositions: defineTable({
    type: v.union(
      v.literal("executive"),
      v.literal("regional_director"),
      v.literal("ambassador")
    ),
    /** Display name (used when no userId link). */
    name: v.string(),
    /** Link to a platform member (optional — advisors may not have accounts). */
    userId: v.optional(v.id("users")),
    /** e.g. "President", "VP Marketing", "Advisor", "Regional Director", "Ambassador" */
    role: v.string(),
    /** Region name for directors (e.g. "New England"). */
    region: v.optional(v.string()),
    /** US state for ambassadors. */
    state: v.optional(v.string()),
    /** School name (for students). */
    school: v.optional(v.string()),
    /** Graduation year (for students). */
    graduation: v.optional(v.number()),
    /** Company name (for advisors). */
    company: v.optional(v.string()),
    /** Job title (for advisors). */
    jobTitle: v.optional(v.string()),
    /** Controls display order within each type. */
    sortOrder: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_state", ["state"]),

  // ============================================
  // AMBASSADOR APPLICATIONS
  // ============================================
  ambassadorApplications: defineTable({
    userId: v.id("users"),
    state: v.string(),
    whyStatement: v.string(),
    leadershipExperience: v.string(),
    city: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  // ============================================
  // STRIPE EVENTS — webhook idempotency log
  // ============================================
  stripeEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    processedAt: v.number(),
  }).index("by_eventId", ["eventId"]),

  // ============================================
  // BOUNTIES — marketplace funding opportunities
  // ============================================
  bounties: defineTable({
    title: v.string(),
    description: v.string(),
    founderName: v.string(),
    founderCompany: v.string(),
    bountyAmount: v.number(),
    dueDate: v.number(),
    status: v.union(
      v.literal("needs_review"),
      v.literal("reviewing"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
      v.literal("rejected")
    ),
    requirements: v.array(v.string()),
    winnerSubmissionId: v.optional(v.id("bountySubmissions")),
    creatorUserId: v.optional(v.id("users")),
    reviewToken: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_reviewToken", ["reviewToken"])
    .index("by_creatorUserId", ["creatorUserId"]),

  // ============================================
  // NOMINATOR REQUESTS — public "request to become a nominator" form
  // ============================================
  nominatorRequests: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    /** Optional free-form context the submitter provides. */
    note: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("contacted")
    ),
    /** Admin's free-form notes after triage. */
    reviewerNotes: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewerId: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  // ============================================
  // NOMINATORS — approved nominators (admins or self-requested + promoted)
  // ============================================
  nominators: defineTable({
    email: v.string(),
    fullName: v.string(),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    status: v.union(
      v.literal("approved"),
      v.literal("paused"),
      v.literal("revoked")
    ),
    source: v.union(
      v.literal("admin_added"),
      v.literal("self_request")
    ),
    fromRequestId: v.optional(v.id("nominatorRequests")),
    approvedById: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // ============================================
  // NOMINATIONS — a nominator nominating a specific student
  // ============================================
  nominations: defineTable({
    nominatorId: v.id("nominators"),
    nominatorEmailAtTime: v.string(),
    nomineeFirstName: v.string(),
    nomineeLastName: v.string(),
    nomineeEmail: v.string(),
    nomineePhone: v.optional(v.string()),
    nomineeLinks: v.optional(v.array(v.string())),
    token: v.string(),
    status: v.union(
      v.literal("sent"),
      v.literal("applied"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    applicationId: v.optional(v.id("applications")),
  })
    .index("by_token", ["token"])
    .index("by_nominator", ["nominatorId"])
    .index("by_nomineeEmail", ["nomineeEmail"]),

  // ============================================
  // BOUNTY SUBMISSIONS
  // ============================================
  bountySubmissions: defineTable({
    bountyId: v.id("bounties"),
    userId: v.id("users"),
    isTeam: v.boolean(),
    submissionUrl: v.string(),
    notes: v.optional(v.string()),
    isWinner: v.boolean(),
    submittedAt: v.number(),
    entrepreneurPick: v.optional(v.boolean()),
  })
    .index("by_bountyId", ["bountyId"])
    .index("by_userId", ["userId"]),
});
