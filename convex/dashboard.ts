import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { requireStore } from "./lib";

/**
 * Resumo do período escolhido pelo app (normalmente o dia local do celular).
 * Vendas canceladas não entram na soma.
 */
export const summary = query({
    args: {
        from: v.number(),
        to: v.number(),
    },
    returns: v.object({
        salesCount: v.number(),
        salesTotalCents: v.number(),
        lowStockCount: v.number(),
    }),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        if (!Number.isFinite(args.from) || !Number.isFinite(args.to) || args.to <= args.from) {
            throw new ConvexError("Período do resumo inválido.");
        }

        const sales = await ctx.db
            .query("sales")
            .withIndex("by_store_and_createdAt", (q) =>
                q.eq("storeId", store._id).gte("createdAt", args.from).lt("createdAt", args.to),
            )
            .collect();

        let salesCount = 0;
        let salesTotalCents = 0;
        for (const sale of sales) {
            if (sale.status !== "completed") continue;
            salesCount += 1;
            salesTotalCents += sale.totalCents;
        }

        const products = await ctx.db
            .query("products")
            .withIndex("by_store", (q) => q.eq("storeId", store._id))
            .collect();

        const lowStockCount = products.filter(
            (product) => product.active && product.stockQty <= product.lowStockThreshold,
        ).length;

        return { salesCount, salesTotalCents, lowStockCount };
    },
});
