import { query } from "./_generated/server";
import { v } from "convex/values";
import { readPlatformStats, requireAdmin } from "./helpers";

/**
 * Get aggregate stats for the admin dashboard.
 *
 * Six full-table .collect() calls used to run on every dashboard render.
 * Now: one read of the platformStats singleton, plus a bounded indexed
 * query for currentMonthSubmissions (since "current" shifts and isn't a
 * stored field).
 *
 * The singleton is maintained inline by the mutations that change each
 * underlying source; counters.recomputeAll rebuilds it from scratch for
 * drift repair or cold starts.
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const stats = await readPlatformStats(ctx);

    const avgAiScore =
      stats.aiScoreCount > 0
        ? Math.round((stats.aiScoreSum / stats.aiScoreCount) * 10) / 10
        : 0;

    // currentMonthSubmissions: scoped to one monthYear via the existing
    // by_monthYear_status index. Capped at 1000 — realistic monthly
    // throughput is far below that for this scale.
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthRows = await ctx.db
      .query("submissions")
      .withIndex("by_monthYear_status", (q) => q.eq("monthYear", currentMonth))
      .take(1000);

    return {
      totalMembers: stats.totalMembers,
      totalSubmissions: stats.totalSubmissions,
      pendingApplications: stats.pendingApplications,
      totalRevenue: stats.totalRevenue,
      currentMonthSubmissions: monthRows.length,
      totalVotes: stats.totalVotes,
      avgAiScore,
    };
  },
});

/**
 * Get monthly trend data for admin analytics charts.
 * Returns last 12 months of aggregated platform data.
 */
export const getAnalyticsTrends = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const submissions = await ctx.db.query("submissions").collect();
    const applications = await ctx.db.query("applications").collect();
    const votes = await ctx.db.query("votes").collect();
    const aiScores = await ctx.db.query("aiScores").collect();
    const prizePools = await ctx.db.query("prizePools").collect();

    // Build month keys for last 12 months
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    const monthLabels = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    // Cumulative member count: users created on or before each month's end
    const membersByMonth = months.map((mk) => {
      const [y, m] = mk.split("-").map(Number);
      const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999).getTime();
      return users.filter(
        (u) => u.role !== "superadmin" && u._creationTime <= endOfMonth
      ).length;
    });

    // Submissions per month (by monthYear field)
    const submissionsByMonth = months.map(
      (mk) => submissions.filter((s) => s.monthYear === mk).length
    );

    // Applications per month (by creation time)
    const applicationsByMonth = months.map((mk) => {
      const [y, m] = mk.split("-").map(Number);
      const start = new Date(y, m - 1, 1).getTime();
      const end = new Date(y, m, 0, 23, 59, 59, 999).getTime();
      return applications.filter(
        (a) => a._creationTime >= start && a._creationTime <= end
      ).length;
    });

    // Votes per month (by creation time)
    const votesByMonth = months.map((mk) => {
      const [y, m] = mk.split("-").map(Number);
      const start = new Date(y, m - 1, 1).getTime();
      const end = new Date(y, m, 0, 23, 59, 59, 999).getTime();
      return votes.filter(
        (v) => v._creationTime >= start && v._creationTime <= end
      ).length;
    });

    // Avg AI score per month (by scoredAt)
    const avgAiScoreByMonth = months.map((mk) => {
      const [y, m] = mk.split("-").map(Number);
      const start = new Date(y, m - 1, 1).getTime();
      const end = new Date(y, m, 0, 23, 59, 59, 999).getTime();
      const monthScores = aiScores.filter(
        (a) => a.scoredAt >= start && a.scoredAt <= end
      );
      if (monthScores.length === 0) return 0;
      return (
        Math.round(
          (monthScores.reduce((s, a) => s + a.overallScore, 0) /
            monthScores.length) *
            10
        ) / 10
      );
    });

    // Revenue per month (from prizePools)
    const revenueByMonth = months.map((mk) => {
      const pool = prizePools.find((p) => p.monthYear === mk);
      return pool?.totalCollected ?? 0;
    });

    // Total points earned per month (sum of all user points is cumulative,
    // so we approximate from prize pool finalization months)
    const pointsByMonth = months.map((mk) => {
      // Points are hard to decompose per-month without a log.
      // Use submissions * avg score as a proxy for activity.
      const subs = submissionsByMonth[months.indexOf(mk)];
      const avgScore = avgAiScoreByMonth[months.indexOf(mk)];
      return Math.round(subs * (avgScore > 0 ? avgScore : 50));
    });

    return months.map((mk, i) => {
      const monthNum = parseInt(mk.split("-")[1]) - 1;
      return {
        monthKey: mk,
        label: monthLabels[monthNum],
        members: membersByMonth[i],
        revenue: revenueByMonth[i],
        applicants: applicationsByMonth[i],
        submissions: submissionsByMonth[i],
        avgAiScore: avgAiScoreByMonth[i],
        votes: votesByMonth[i],
        points: pointsByMonth[i],
      };
    });
  },
});

/**
 * Get audit log entries (admin only).
 */
export const getAuditLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const entries = await ctx.db
      .query("auditLog")
      .order("desc")
      .take(args.limit ?? 50);

    // Attach admin user info
    const withAdmins = await Promise.all(
      entries.map(async (entry) => {
        const admin = await ctx.db.get(entry.adminUserId);
        return {
          ...entry,
          adminName: admin?.fullName ?? "Unknown",
        };
      })
    );

    return withAdmins;
  },
});
