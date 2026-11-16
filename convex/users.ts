import { v } from "convex/values";
import { vGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, query } from "./_generated/server";

export const createUserGoogle = internalMutation({
  args: {
    method: v.object({ name: v.literal("google"), profile: vGoogleProfile }),
  },
  returns: v.id("users"),
  handler: async (ctx, { method }) => {
    const { profile } = method;
    return await ctx.db.insert("users", {
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    });
  },
});

export const yo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get("users", userId);
    if (!user) return null;
    return { name: user.name, email: user.email, image: user.image };
  },
});
