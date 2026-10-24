import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireStore } from "./lib";

export const customerValidator = v.object({
    _id: v.id("customers"),
    _creationTime: v.number(),
    storeId: v.id("stores"),
    name: v.string(),
    nameQuery: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
});

/** Lista os clientes da loja em ordem alfabética. */
export const list = query({
    args: {},
    returns: v.array(customerValidator),
    handler: async (ctx) => {
        const store = await requireStore(ctx);

        const customers = await ctx.db
            .query("customers")
            .withIndex("by_store", (q) => q.eq("storeId", store._id))
            .collect();

        return customers.sort((a, b) => {
            if (a.nameQuery === b.nameQuery) return a._creationTime - b._creationTime;
            return a.nameQuery < b.nameQuery ? -1 : 1;
        });
    },
});
