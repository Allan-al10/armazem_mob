import { ConvexError, v } from "convex/values";
import { formatQuantityWithUnit, isValidQuantityForUnit } from "../src/lib/quantity";
import { isValidPhone, normalizeForSearch, normalizeSpaces, onlyDigits } from "../src/lib/validation";
import { mutation, query } from "./_generated/server";
import { requireStore } from "./lib";
import {
    productUnitValidator,
    salePaymentMethodValidator,
    saleStatusValidator,
} from "./validators";

const MAX_CENTS = 100_000_000; // R$ 1.000.000,00

const saleValidator = v.object({
    _id: v.id("sales"),
    _creationTime: v.number(),
    storeId: v.id("stores"),
    customerId: v.id("customers"),
    number: v.number(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    totalCents: v.number(),
    paymentMethod: salePaymentMethodValidator,
    status: saleStatusValidator,
    createdAt: v.number(),
    canceledAt: v.optional(v.number()),
});

const saleItemValidator = v.object({
    _id: v.id("saleItems"),
    _creationTime: v.number(),
    saleId: v.id("sales"),
    productId: v.id("products"),
    productName: v.string(),
    unit: productUnitValidator,
    quantity: v.number(),
    unitPriceCents: v.number(),
    unitCostCents: v.number(),
    subtotalCents: v.number(),
});

function roundQuantity(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function saleNumberText(number: number): string {
    return number.toString().padStart(6, "0");
}

function validatePhone(phone: string | undefined): string | undefined {
    if (!phone) return undefined;
    const digits = onlyDigits(phone);
    if (!digits) return undefined;
    if (!isValidPhone(digits)) {
        throw new ConvexError("Telefone inválido. Digite DDD e número. Exemplo: (11) 91234-5678.");
    }
    return digits;
}

/**
 * Cria a venda, os itens, baixa o estoque e grava os movimentos na mesma transação.
 * Se qualquer produto não tiver estoque suficiente, nada é gravado.
 */
export const create = mutation({
    args: {
        customerId: v.optional(v.id("customers")),
        customerName: v.string(),
        customerPhone: v.optional(v.string()),
        items: v.array(
            v.object({
                productId: v.id("products"),
                quantity: v.number(),
                unitPriceCents: v.number(),
            }),
        ),
        paymentMethod: salePaymentMethodValidator,
        // Dados obrigatórios quando o pagamento é fiado.
        credit: v.optional(
            v.object({
                dueDate: v.number(),
                address: v.string(),
                note: v.optional(v.string()),
            }),
        ),
    },
    returns: v.id("sales"),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        if (args.items.length === 0) {
            throw new ConvexError("Adicione pelo menos um produto à venda.");
        }

        const customerPhone = validatePhone(args.customerPhone);

        let creditData: { dueDate: number; address: string; note?: string } | null = null;
        if (args.paymentMethod === "credit_account") {
            if (!args.credit) {
                throw new ConvexError(
                    "Preencha os dados do fiado: telefone, endereço e data de pagamento.",
                );
            }
            if (!customerPhone) {
                throw new ConvexError("Para venda fiado, digite o telefone do cliente com DDD.");
            }

            const address = normalizeSpaces(args.credit.address);
            if (!address) {
                throw new ConvexError("Digite o endereço do cliente para o fiado.");
            }
            if (address.length < 5) {
                throw new ConvexError("O endereço está muito curto. Confira.");
            }
            if (address.length > 160) {
                throw new ConvexError("O endereço está muito comprido. Use até 160 letras.");
            }

            const note = normalizeSpaces(args.credit.note ?? "");
            if (note.length > 120) {
                throw new ConvexError("A observação do fiado pode ter até 120 letras.");
            }

            if (!Number.isFinite(args.credit.dueDate)) {
                throw new ConvexError("Escolha a data combinada para pagamento do fiado.");
            }
            const dueDate = Math.round(args.credit.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dueDate < today.getTime() - 24 * 60 * 60 * 1000) {
                throw new ConvexError("A data combinada não pode estar no passado.");
            }
            if (dueDate > today.getTime() + 366 * 24 * 60 * 60 * 1000) {
                throw new ConvexError("A data combinada está muito distante. Confira.");
            }

            creditData = {
                dueDate,
                address,
                ...(note ? { note } : {}),
            };
        }

        const name = normalizeSpaces(args.customerName);
        if (!name) {
            throw new ConvexError("Digite o nome do cliente.");
        }
        if (name.length < 2) {
            throw new ConvexError("O nome do cliente está muito curto. Confira.");
        }
        if (name.length > 80) {
            throw new ConvexError("O nome do cliente está muito comprido. Use até 80 letras.");
        }

        const nameQuery = normalizeForSearch(name);
        let customer = null;
        if (args.customerId !== undefined) {
            customer = await ctx.db.get(args.customerId);
            if (customer === null || customer.storeId !== store._id) {
                throw new ConvexError("Cliente não encontrado. Escolha o cliente de novo.");
            }

            // O nome pode ser corrigido no formulário do fiado.
            if (customer.name !== name) {
                const duplicate = await ctx.db
                    .query("customers")
                    .withIndex("by_store_and_nameQuery", (q) =>
                        q.eq("storeId", store._id).eq("nameQuery", nameQuery),
                    )
                    .first();
                if (duplicate !== null && duplicate._id !== customer._id) {
                    throw new ConvexError(
                        "Já existe outro cliente com esse nome. Confira o nome ou escolha o cliente na lista.",
                    );
                }
                await ctx.db.patch(customer._id, { name, nameQuery });
                customer = { ...customer, name, nameQuery };
            }
        } else {
            customer = await ctx.db
                .query("customers")
                .withIndex("by_store_and_nameQuery", (q) =>
                    q.eq("storeId", store._id).eq("nameQuery", nameQuery),
                )
                .first();

            if (customer === null) {
                const customerId = await ctx.db.insert("customers", {
                    storeId: store._id,
                    name,
                    nameQuery,
                    ...(customerPhone ? { phone: customerPhone } : {}),
                    ...(creditData ? { address: creditData.address } : {}),
                });
                customer = await ctx.db.get(customerId);
            }
        }

        if (customer === null) {
            throw new ConvexError("Não foi possível salvar o cliente. Tente de novo.");
        }

        // O telefone pode ser corrigido tanto para um cliente escolhido na lista
        // quanto para um cliente encontrado pelo nome. O novo número também
        // precisa aparecer na nota desta venda. No fiado, o endereço também é
        // atualizado no cadastro do cliente.
        const customerPatch: { phone?: string; address?: string } = {};
        if (customerPhone && customer.phone !== customerPhone) {
            customerPatch.phone = customerPhone;
        }
        if (creditData && customer.address !== creditData.address) {
            customerPatch.address = creditData.address;
        }
        if (Object.keys(customerPatch).length > 0) {
            await ctx.db.patch(customer._id, customerPatch);
            customer = { ...customer, ...customerPatch };
        }

        const seenProducts = new Set<string>();
        const lines: {
            productId: typeof args.items[number]["productId"];
            productName: string;
            unit: "unidade" | "kg" | "pacote";
            quantity: number;
            unitPriceCents: number;
            unitCostCents: number;
            subtotalCents: number;
            stockQty: number;
        }[] = [];

        for (const item of args.items) {
            const product = await ctx.db.get(item.productId);
            if (product === null || product.storeId !== store._id) {
                throw new ConvexError("Um dos produtos não foi encontrado. Volte e confira a lista.");
            }
            if (!product.active) {
                throw new ConvexError(`${product.name} não está disponível para venda.`);
            }
            if (seenProducts.has(product._id)) {
                throw new ConvexError("Há um produto repetido na venda. Volte e confira.");
            }
            seenProducts.add(product._id);

            if (!isValidQuantityForUnit(item.quantity, product.unit)) {
                throw new ConvexError(
                    product.unit === "kg"
                        ? `Digite uma quantidade válida de ${product.name}. Exemplo: 1,5 kg.`
                        : `Digite uma quantidade inteira de ${product.name}.`,
                );
            }
            const quantity = roundQuantity(item.quantity);
            if (quantity > product.stockQty + 1e-9) {
                throw new ConvexError(
                    `Só tem ${formatQuantityWithUnit(product.stockQty, product.unit)} de ${product.name}.`,
                );
            }

            const unitPriceCents = Math.round(item.unitPriceCents);
            if (
                !Number.isFinite(unitPriceCents) ||
                unitPriceCents < 0 ||
                unitPriceCents > MAX_CENTS
            ) {
                throw new ConvexError(`Confira o preço de ${product.name}.`);
            }

            const subtotalCents = Math.round(quantity * unitPriceCents);
            if (!Number.isFinite(subtotalCents) || subtotalCents < 0) {
                throw new ConvexError(`Confira o valor de ${product.name}.`);
            }

            lines.push({
                productId: product._id,
                productName: product.name,
                unit: product.unit,
                quantity,
                unitPriceCents,
                unitCostCents: product.lastUnitCostCents,
                subtotalCents,
                stockQty: product.stockQty,
            });
        }

        const totalCents = lines.reduce((total, line) => total + line.subtotalCents, 0);
        if (totalCents <= 0) {
            throw new ConvexError("O total da venda precisa ser maior que zero.");
        }

        const number = store.nextSaleNumber ?? 1;
        if (!Number.isInteger(number) || number < 1) {
            throw new ConvexError("Não foi possível gerar o número da nota. Tente de novo.");
        }

        const now = Date.now();
        const saleId = await ctx.db.insert("sales", {
            storeId: store._id,
            customerId: customer._id,
            number,
            customerName: customer.name,
            ...(customer.phone ? { customerPhone: customer.phone } : {}),
            totalCents,
            paymentMethod: args.paymentMethod,
            status: "completed",
            createdAt: now,
        });

        for (const line of lines) {
            await ctx.db.insert("saleItems", {
                saleId,
                productId: line.productId,
                productName: line.productName,
                unit: line.unit,
                quantity: line.quantity,
                unitPriceCents: line.unitPriceCents,
                unitCostCents: line.unitCostCents,
                subtotalCents: line.subtotalCents,
            });

            const newStockQty = Math.max(0, roundQuantity(line.stockQty - line.quantity));
            await ctx.db.patch(line.productId, { stockQty: newStockQty });
            await ctx.db.insert("stockMovements", {
                storeId: store._id,
                productId: line.productId,
                type: "saida",
                quantity: -line.quantity,
                balanceAfter: newStockQty,
                reason: `Venda nº ${saleNumberText(number)}`,
                refId: saleId,
                createdAt: now,
            });
        }

        await ctx.db.patch(store._id, { nextSaleNumber: number + 1 });

        if (creditData) {
            const creditPhone = customerPhone ?? customer.phone;
            if (!creditPhone) {
                throw new ConvexError("Para venda fiado, digite o telefone do cliente com DDD.");
            }

            await ctx.db.insert("credits", {
                storeId: store._id,
                saleId,
                customerId: customer._id,
                customerName: customer.name,
                phone: creditPhone,
                address: creditData.address,
                totalCents,
                paidCents: 0,
                dueDate: creditData.dueDate,
                status: "open",
                ...(creditData.note ? { note: creditData.note } : {}),
                createdAt: now,
            });
        }

        return saleId;
    },
});

/** Busca a venda com os itens para mostrar ou imprimir a nota. */
export const get = query({
    args: { saleId: v.id("sales") },
    returns: v.union(
        v.object({
            sale: saleValidator,
            items: v.array(saleItemValidator),
        }),
        v.null(),
    ),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const sale = await ctx.db.get(args.saleId);
        if (sale === null || sale.storeId !== store._id) {
            return null;
        }

        const items = await ctx.db
            .query("saleItems")
            .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
            .collect();
        items.sort((a, b) => a._creationTime - b._creationTime);

        return { sale, items };
    },
});

/** Lista as vendas mais recentes da loja. */
export const listRecent = query({
    args: { limit: v.optional(v.number()) },
    returns: v.array(saleValidator),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);
        const limit = Math.min(Math.max(Math.round(args.limit ?? 20), 1), 50);

        return await ctx.db
            .query("sales")
            .withIndex("by_store_and_createdAt", (q) => q.eq("storeId", store._id))
            .order("desc")
            .take(limit);
    },
});

/**
 * Cancela uma venda: devolve os itens ao estoque, grava os movimentos
 * de cancelamento e marca a venda como cancelada.
 */
export const cancel = mutation({
    args: { saleId: v.id("sales") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const sale = await ctx.db.get(args.saleId);
        if (sale === null || sale.storeId !== store._id) {
            throw new ConvexError("Venda não encontrada.");
        }
        if (sale.status === "canceled") {
            throw new ConvexError("Esta venda já foi cancelada.");
        }

        // Fiado sem nenhum pagamento pode ser cancelado junto com a venda.
        // Depois do primeiro pagamento, o cancelamento precisaria de estorno,
        // que fica fora do escopo desta fase.
        const credit = await ctx.db
            .query("credits")
            .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
            .first();
        if (credit !== null) {
            const firstPayment = await ctx.db
                .query("creditPayments")
                .withIndex("by_credit", (q) => q.eq("creditId", credit._id))
                .first();
            if (Math.round(credit.paidCents) > 0 || credit.status === "paid" || firstPayment) {
                throw new ConvexError(
                    "Este fiado já tem pagamento registrado. Não é possível cancelar a venda.",
                );
            }
            await ctx.db.delete(credit._id);
        }

        const items = await ctx.db
            .query("saleItems")
            .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
            .collect();

        const now = Date.now();

        for (const item of items) {
            const product = await ctx.db.get(item.productId);
            if (product === null || product.storeId !== store._id) {
                throw new ConvexError(
                    "Um dos produtos desta venda não foi encontrado. Não foi possível cancelar.",
                );
            }

            const newStockQty = roundQuantity(product.stockQty + item.quantity);
            await ctx.db.patch(product._id, { stockQty: newStockQty });
            await ctx.db.insert("stockMovements", {
                storeId: store._id,
                productId: product._id,
                type: "cancelamento",
                quantity: item.quantity,
                balanceAfter: newStockQty,
                reason: `Cancelamento da venda nº ${saleNumberText(sale.number)}`,
                refId: sale._id,
                createdAt: now,
            });
        }

        await ctx.db.patch(sale._id, { status: "canceled", canceledAt: now });
        return null;
    },
});
