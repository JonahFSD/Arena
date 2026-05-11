import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Resend from "@auth/core/providers/resend";

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

      // Check if a user with this email already exists (e.g., from seed data)
      if (email) {
        // Use untyped table query since ctx is GenericMutationCtx
        const allUsers = await ctx.db.query("users").collect();
        const existing = allUsers.find(
          (u: any) => u.email === email
        );
        if (existing) {
          return existing._id;
        }
      }

      // Create a new user with required defaults
      return await ctx.db.insert("users", {
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
    },
  },
});
