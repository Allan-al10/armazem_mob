import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const current = query({
    args: {},
    returns: v.union(
        v.object({
            name: v.union(v.string(), v.null()),
            email: v.union(v.string(), v.null()),
            phone: v.union(v.string(), v.null()),
        }),
        v.null(),
    ),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) return null;

        const user = await ctx.db.get(userId);
        if (user === null) return null;

        return {
            name: user.name ?? null,
            email: user.email ?? null,
            phone: user.phone ?? null,
        };
    },
});
