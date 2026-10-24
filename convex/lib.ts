import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Exige um usuário logado com estabelecimento cadastrado.
 * Usado por todas as funções de estoque para garantir o isolamento por loja.
 */
export async function requireStore(ctx: QueryCtx | MutationCtx) {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
        throw new ConvexError("Entre na sua conta para continuar.");
    }

    const store = await ctx.db
        .query("stores")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .first();
    if (store === null) {
        throw new ConvexError("Cadastro do estabelecimento não encontrado.");
    }

    return store;
}
