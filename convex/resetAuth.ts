import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-off admin utility: delete all auth records for a given email
 * so the user can sign up fresh with a new password.
 *
 * Usage: npx convex run resetAuth:resetByEmail '{"email":"user@example.com"}'
 *
 * WARNING: This deletes auth accounts, sessions, and refresh tokens for that user.
 * The user doc in the `users` table is NOT deleted (seed data stays intact).
 */
export const resetByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Find the auth account(s) for this email
    const allAccounts = await ctx.db.query("authAccounts").collect();
    // authAccounts is a convex-auth internal table with no public schema type.
    const matchingAccounts = allAccounts.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.providerAccountId === email || a.email === email
    );

    if (matchingAccounts.length === 0) {
      console.log(`No auth accounts found for ${email}`);
      return { deleted: 0 };
    }

    let deleted = 0;

    for (const account of matchingAccounts) {
      // Delete sessions for this user
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", account.userId))
        .collect();

      for (const session of sessions) {
        // Delete refresh tokens for this session
        const tokens = await ctx.db
          .query("authRefreshTokens")
          .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
          .collect();
        for (const token of tokens) {
          await ctx.db.delete(token._id);
          deleted++;
        }
        await ctx.db.delete(session._id);
        deleted++;
      }

      // Delete verification codes
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
        deleted++;
      }

      // Delete the auth account itself
      await ctx.db.delete(account._id);
      deleted++;
    }

    // Also delete any pending application for this email so they can re-apply
    const apps = await ctx.db
      .query("applications")
      .withIndex("by_email", (q) => q.eq("userEmail", email))
      .collect();
    for (const app of apps) {
      if (app.status === "pending") {
        await ctx.db.delete(app._id);
        deleted++;
      }
    }

    console.log(`Deleted ${deleted} auth records for ${email}`);
    return { deleted };
  },
});
