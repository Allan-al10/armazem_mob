import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { isValidCnpj, isValidPhone, isValidUf, normalizeSpaces, onlyDigits } from "../src/lib/validation";
import { mutation, query } from "./_generated/server";
import { addressValidator } from "./validators";

const storeFields = {
    tradeName: v.string(),
    cnpj: v.string(),
    ownerName: v.string(),
    phone: v.string(),
    address: addressValidator,
};

const storeValidator = v.object({
    _id: v.id("stores"),
    _creationTime: v.number(),
    ownerId: v.id("users"),
    ...storeFields,
    nextSaleNumber: v.optional(v.number()),
});

type StoreInput = {
    tradeName: string;
    cnpj: string;
    ownerName: string;
    phone: string;
    address: {
        street: string;
        number: string;
        district: string;
        city: string;
        state: string;
    };
};

function normalizeStoreInput(args: StoreInput) {
    const tradeName = normalizeSpaces(args.tradeName);
    const ownerName = normalizeSpaces(args.ownerName);
    const cnpj = onlyDigits(args.cnpj);
    const phone = onlyDigits(args.phone);
    const state = args.address.state.trim().toUpperCase();

    if (!tradeName) {
        throw new ConvexError("Digite o nome do estabelecimento.");
    }
    if (!isValidCnpj(cnpj)) {
        throw new ConvexError("CNPJ inválido. Confira os 14 números.");
    }
    if (!ownerName) {
        throw new ConvexError("Digite o nome do proprietário.");
    }
    if (!isValidPhone(phone)) {
        throw new ConvexError("Digite um telefone com DDD. Exemplo: (11) 91234-5678.");
    }
    if (!isValidUf(state)) {
        throw new ConvexError("Digite a sigla do estado. Exemplo: SP.");
    }

    const address = {
        street: normalizeSpaces(args.address.street),
        number: normalizeSpaces(args.address.number),
        district: normalizeSpaces(args.address.district),
        city: normalizeSpaces(args.address.city),
        state,
    };

    if (!address.street || !address.number || !address.district || !address.city) {
        throw new ConvexError("Preencha o endereço completo: rua, número, bairro e cidade.");
    }

    return { tradeName, cnpj, ownerName, phone, address };
}

export const getMine = query({
    args: {},
    returns: v.union(storeValidator, v.null()),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) return null;

        return await ctx.db
            .query("stores")
            .withIndex("by_owner", (q) => q.eq("ownerId", userId))
            .first();
    },
});

export const create = mutation({
    args: storeFields,
    returns: v.id("stores"),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            throw new ConvexError("Entre na sua conta para continuar.");
        }

        const user = await ctx.db.get(userId);
        if (user === null) {
            throw new ConvexError("Sua conta não foi encontrada. Saia e entre de novo.");
        }

        const existing = await ctx.db
            .query("stores")
            .withIndex("by_owner", (q) => q.eq("ownerId", userId))
            .first();
        if (existing !== null) {
            throw new ConvexError("Você já tem um estabelecimento cadastrado.");
        }

        const data = normalizeStoreInput(args);

        const sameCnpj = await ctx.db
            .query("stores")
            .withIndex("by_cnpj", (q) => q.eq("cnpj", data.cnpj))
            .first();
        if (sameCnpj !== null) {
            throw new ConvexError("Já existe um estabelecimento com este CNPJ.");
        }

        return await ctx.db.insert("stores", {
            ownerId: userId,
            ...data,
        });
    },
});

export const update = mutation({
    args: storeFields,
    returns: v.null(),
    handler: async (ctx, args) => {
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

        const data = normalizeStoreInput(args);

        if (data.cnpj !== store.cnpj) {
            const sameCnpj = await ctx.db
                .query("stores")
                .withIndex("by_cnpj", (q) => q.eq("cnpj", data.cnpj))
                .first();
            if (sameCnpj !== null && sameCnpj._id !== store._id) {
                throw new ConvexError("Já existe um estabelecimento com este CNPJ.");
            }
        }

        await ctx.db.patch(store._id, data);
        return null;
    },
});
