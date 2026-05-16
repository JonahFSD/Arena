import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Resend from "@auth/core/providers/resend";
import { bumpPlatformStat } from "./helpers";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      reset: Resend({
        from: "The Arena <hello@austinchristianu.org>",
      }),
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // If this is an existing auth session, just return the user ID
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const email = args.profile.email as string | undefined;

      // Check if a user with this email already exists (e.g., from seed data).
      // Use by_email index instead of scanning the whole users table on every
      // login — that scan dominated cold-start latency once seed data grew.
      // The convex-auth callback ctx is GenericMutationCtx (no schema-aware
      // index types), so the .withIndex call needs an `any` cast.
      if (email) {
        const existing = await (ctx.db as any)
          .query("users")
          .withIndex("by_email", (q: any) => q.eq("email", email))
          .first();
        if (existing) {
          return existing._id;
        }
      }

      // Create a new user with required defaults
      const newUserId = await ctx.db.insert("users", {
        email: email ?? "",
        fullName:
          (args.profile.name as string) ?? email ?? "New User",
        role: "member",
        skills: [],
        lookingForCofounders: false,
        points: 0,
        pointsThisMonth: 0,
        totalEarnings: 0,
        networkCount: 0,
      });
      // Bump platformStats.totalMembers — auth-callback ctx is
      // GenericMutationCtx, so the helper needs the cast.
      await bumpPlatformStat(ctx as any, "totalMembers", 1);
      return newUserId;
    },
  },
});
