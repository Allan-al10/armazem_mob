import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStore } from "./lib";
import { productUnitValidator } from "./validators";

const MAX_PRICE_CENTS = 100_000_000; // R$ 1.000.000,00

const productValidator = v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    storeId: v.id("stores"),
    name: v.string(),
    nameQuery: v.string(),
    unit: productUnitValidator,
    stockQty: v.number(),
    lastUnitCostCents: v.number(),
    salePriceCents: v.number(),
    lowStockThreshold: v.number(),
    active: v.boolean(),
});

/** Lista todos os produtos da loja em ordem alfabética. */
export const list = query({
    args: {},
    returns: v.array(productValidator),
    handler: async (ctx) => {
        const store = await requireStore(ctx);

        const products = await ctx.db
            .query("products")
            .withIndex("by_store", (q) => q.eq("storeId", store._id))
            .collect();

        return products.sort((a, b) => {
            if (a.nameQuery === b.nameQuery) return a._creationTime - b._creationTime;
            return a.nameQuery < b.nameQuery ? -1 : 1;
        });
    },
});

/** Busca um produto da loja. Retorna null se não existir ou for de outra loja. */
export const get = query({
    args: { productId: v.id("products") },
    returns: v.union(productValidator, v.null()),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const product = await ctx.db.get(args.productId);
        if (product === null || product.storeId !== store._id) {
            return null;
        }
        return product;
    },
});

/** Edita preço de venda e limite de estoque baixo. */
export const update = mutation({
    args: {
        productId: v.id("products"),
        salePriceCents: v.number(),
        lowStockThreshold: v.number(),
        active: v.boolean(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const product = await ctx.db.get(args.productId);
        if (product === null || product.storeId !== store._id) {
            throw new ConvexError("Produto não encontrado.");
        }

        if (!Number.isFinite(args.salePriceCents) || args.salePriceCents < 0) {
            throw new ConvexError("Digite um preço de venda válido.");
        }
        if (args.salePriceCents > MAX_PRICE_CENTS) {
            throw new ConvexError("O preço de venda está alto demais. Confira o valor.");
        }
        if (!Number.isFinite(args.lowStockThreshold) || args.lowStockThreshold < 0) {
            throw new ConvexError("Digite um aviso de estoque baixo válido.");
        }
        if (product.unit !== "kg" && !Number.isInteger(args.lowStockThreshold)) {
            throw new ConvexError("O aviso de estoque baixo precisa ser um número inteiro.");
        }

        await ctx.db.patch(product._id, {
            salePriceCents: Math.round(args.salePriceCents),
            lowStockThreshold: args.lowStockThreshold,
            active: args.active,
        });
        return null;
    },
});
