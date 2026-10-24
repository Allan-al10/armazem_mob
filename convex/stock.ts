import { ConvexError, v } from "convex/values";
import { isValidQuantityForUnit, isValidStockLevel } from "../src/lib/quantity";
import { normalizeForSearch, normalizeSpaces } from "../src/lib/validation";
import { mutation, query } from "./_generated/server";
import { requireStore } from "./lib";
import { productUnitValidator, stockMovementTypeValidator } from "./validators";

const DEFAULT_LOW_STOCK_THRESHOLD = 5;
const MAX_CENTS = 100_000_000; // R$ 1.000.000,00

const stockEntryValidator = v.object({
    _id: v.id("stockEntries"),
    _creationTime: v.number(),
    storeId: v.id("stores"),
    productId: v.id("products"),
    quantity: v.number(),
    boxTotalCostCents: v.number(),
    unitCostCents: v.number(),
    salePriceCents: v.number(),
    arrivedAt: v.number(),
    supplier: v.optional(v.string()),
});

const stockMovementValidator = v.object({
    _id: v.id("stockMovements"),
    _creationTime: v.number(),
    storeId: v.id("stores"),
    productId: v.id("products"),
    type: stockMovementTypeValidator,
    quantity: v.number(),
    balanceAfter: v.number(),
    reason: v.optional(v.string()),
    refId: v.optional(v.string()),
    createdAt: v.number(),
});

function validateCents(value: number, message: string) {
    if (!Number.isFinite(value) || value < 0 || value > MAX_CENTS) {
        throw new ConvexError(message);
    }
}

/**
 * Registra mercadoria que chegou (um produto por vez).
 * Cria o produto se for novo e, na mesma transação, soma o estoque,
 * grava a entrada (lote) e o movimento de entrada.
 */
export const registerEntry = mutation({
    args: {
        productId: v.optional(v.id("products")),
        newProductName: v.optional(v.string()),
        newProductUnit: v.optional(productUnitValidator),
        quantity: v.number(),
        boxTotalCostCents: v.number(),
        unitCostCents: v.number(),
        salePriceCents: v.number(),
        arrivedAt: v.number(),
        supplier: v.optional(v.string()),
    },
    returns: v.id("products"),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        validateCents(args.boxTotalCostCents, "Digite o valor total da caixa.");
        validateCents(args.unitCostCents, "Digite o valor unitário de compra.");
        validateCents(args.salePriceCents, "Digite o preço de venda.");

        if (!Number.isFinite(args.arrivedAt) || args.arrivedAt <= 0) {
            throw new ConvexError("Data de chegada inválida.");
        }

        let product = null;
        if (args.productId !== undefined) {
            product = await ctx.db.get(args.productId);
            if (product === null || product.storeId !== store._id) {
                throw new ConvexError("Produto não encontrado.");
            }
        }

        let newName = "";
        let newNameQuery = "";
        if (product === null) {
            newName = normalizeSpaces(args.newProductName ?? "");
            if (!newName) {
                throw new ConvexError("Digite o nome do novo produto.");
            }
            if (newName.length > 80) {
                throw new ConvexError("O nome do produto está muito comprido. Use até 80 letras.");
            }
            newNameQuery = normalizeForSearch(newName);

            const existing = await ctx.db
                .query("products")
                .withIndex("by_store_and_nameQuery", (q) =>
                    q.eq("storeId", store._id).eq("nameQuery", newNameQuery),
                )
                .first();
            if (existing !== null) {
                throw new ConvexError("Já existe um produto com esse nome. Escolha na lista.");
            }
        }

        const unit = product !== null ? product.unit : args.newProductUnit ?? "unidade";
        if (!isValidQuantityForUnit(args.quantity, unit)) {
            throw new ConvexError(
                unit === "kg"
                    ? "Digite a quantidade em quilos. Exemplo: 1,5."
                    : "Digite uma quantidade inteira de unidades.",
            );
        }

        const quantity = Math.round(args.quantity * 1000) / 1000;
        const boxTotalCostCents = Math.round(args.boxTotalCostCents);
        const unitCostCents = Math.round(args.unitCostCents);
        const salePriceCents = Math.round(args.salePriceCents);
        const supplier = args.supplier ? normalizeSpaces(args.supplier) : undefined;
        if (supplier !== undefined && supplier.length > 80) {
            throw new ConvexError("O nome do fornecedor está muito comprido. Use até 80 letras.");
        }
        const now = Date.now();
        const newStockQty =
            Math.round(((product === null ? 0 : product.stockQty) + quantity) * 1000) / 1000;

        const productId =
            product === null
                ? await ctx.db.insert("products", {
                      storeId: store._id,
                      name: newName,
                      nameQuery: newNameQuery,
                      unit,
                      stockQty: quantity,
                      lastUnitCostCents: unitCostCents,
                      salePriceCents,
                      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
                      active: true,
                  })
                : product._id;

        if (product !== null) {
            await ctx.db.patch(product._id, {
                stockQty: newStockQty,
                lastUnitCostCents: unitCostCents,
                salePriceCents,
                // Uma entrada reativa o produto que estava desativado.
                active: true,
            });
        }

        await ctx.db.insert("stockEntries", {
            storeId: store._id,
            productId,
            quantity,
            boxTotalCostCents,
            unitCostCents,
            salePriceCents,
            arrivedAt: args.arrivedAt,
            ...(supplier ? { supplier } : {}),
        });

        await ctx.db.insert("stockMovements", {
            storeId: store._id,
            productId,
            type: "entrada",
            quantity,
            balanceAfter: newStockQty,
            reason: "Chegou mercadoria",
            createdAt: now,
        });

        return productId;
    },
});

/**
 * Ajusta o estoque pela contagem real do comerciante
 * (perdas, quebras, contagem). Sempre grava o motivo no histórico.
 */
export const adjust = mutation({
    args: {
        productId: v.id("products"),
        newQuantity: v.number(),
        reason: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const product = await ctx.db.get(args.productId);
        if (product === null || product.storeId !== store._id) {
            throw new ConvexError("Produto não encontrado.");
        }

        const reason = normalizeSpaces(args.reason);
        if (!reason) {
            throw new ConvexError("Escolha o motivo do ajuste.");
        }
        if (reason.length > 100) {
            throw new ConvexError("O motivo do ajuste está muito comprido. Use até 100 letras.");
        }
        if (!isValidStockLevel(args.newQuantity, product.unit)) {
            throw new ConvexError(
                product.unit === "kg"
                    ? "Digite a quantidade contada em quilos. Exemplo: 1,5."
                    : "Digite a quantidade contada, sem vírgula.",
            );
        }

        const newQuantity = Math.round(args.newQuantity * 1000) / 1000;
        const delta = Math.round((newQuantity - product.stockQty) * 1000) / 1000;
        if (delta === 0) {
            throw new ConvexError("A quantidade não mudou. Confira o valor.");
        }

        await ctx.db.patch(product._id, { stockQty: newQuantity });

        await ctx.db.insert("stockMovements", {
            storeId: store._id,
            productId: product._id,
            type: "ajuste",
            quantity: delta,
            balanceAfter: newQuantity,
            reason,
            createdAt: Date.now(),
        });

        return null;
    },
});

/** Histórico do produto: lotes que chegaram e movimentos (saídas/ajustes). */
export const history = query({
    args: { productId: v.id("products") },
    returns: v.object({
        entries: v.array(stockEntryValidator),
        movements: v.array(stockMovementValidator),
    }),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const product = await ctx.db.get(args.productId);
        if (product === null || product.storeId !== store._id) {
            throw new ConvexError("Produto não encontrado.");
        }

        const entries = await ctx.db
            .query("stockEntries")
            .withIndex("by_product", (q) => q.eq("productId", product._id))
            .collect();
        const movements = await ctx.db
            .query("stockMovements")
            .withIndex("by_product", (q) => q.eq("productId", product._id))
            .collect();

        entries.sort((a, b) => b.arrivedAt - a.arrivedAt || b._creationTime - a._creationTime);
        movements.sort((a, b) => b.createdAt - a.createdAt || b._creationTime - a._creationTime);

        return { entries, movements };
    },
});
