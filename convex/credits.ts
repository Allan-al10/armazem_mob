import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { customerValidator } from "./customers";
import { requireStore } from "./lib";
import { creditPaymentMethodValidator, creditStatusValidator } from "./validators";

const MAX_CENTS = 100_000_000; // R$ 1.000.000,00

export const creditValidator = v.object({
    _id: v.id("credits"),
    _creationTime: v.number(),
    storeId: v.id("stores"),
    saleId: v.id("sales"),
    customerId: v.id("customers"),
    customerName: v.string(),
    phone: v.string(),
    address: v.string(),
    totalCents: v.number(),
    paidCents: v.number(),
    dueDate: v.number(),
    status: creditStatusValidator,
    note: v.optional(v.string()),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    lastReminderAt: v.optional(v.number()),
});

export const creditPaymentValidator = v.object({
    _id: v.id("creditPayments"),
    _creationTime: v.number(),
    creditId: v.id("credits"),
    amountCents: v.number(),
    method: creditPaymentMethodValidator,
    paidAt: v.number(),
});

function balanceOf(credit: { totalCents: number; paidCents: number }): number {
    return Math.max(0, Math.round(credit.totalCents - credit.paidCents));
}

function compareNames(a: string, b: string): number {
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

/**
 * Lista os clientes com saldo devedor, agrupados por cliente e ordenados
 * pelo vencimento mais próximo.
 */
export const debtors = query({
    args: {},
    returns: v.array(
        v.object({
            customerId: v.id("customers"),
            customerName: v.string(),
            phone: v.string(),
            address: v.string(),
            balanceCents: v.number(),
            dueDate: v.number(),
            creditCount: v.number(),
        }),
    ),
    handler: async (ctx) => {
        const store = await requireStore(ctx);

        const credits = await ctx.db
            .query("credits")
            .withIndex("by_store", (q) => q.eq("storeId", store._id))
            .collect();

        const groups = new Map<
            string,
            {
                customerId: Id<"customers">;
                customerName: string;
                phone: string;
                address: string;
                balanceCents: number;
                dueDate: number;
                creditCount: number;
            }
        >();

        for (const credit of credits) {
            const balance = balanceOf(credit);
            if (credit.status === "paid" || balance <= 0) continue;

            const current = groups.get(credit.customerId);
            if (!current) {
                groups.set(credit.customerId, {
                    customerId: credit.customerId,
                    customerName: credit.customerName,
                    phone: credit.phone,
                    address: credit.address,
                    balanceCents: balance,
                    dueDate: credit.dueDate,
                    creditCount: 1,
                });
                continue;
            }

            current.balanceCents += balance;
            current.creditCount += 1;
            if (credit.dueDate < current.dueDate) current.dueDate = credit.dueDate;
        }

        const debtors = [...groups.values()];

        // Usa o cadastro atual do cliente para telefone/endereço/grafia do nome.
        for (const debtor of debtors) {
            const customer = await ctx.db.get(debtor.customerId);
            if (customer === null || customer.storeId !== store._id) continue;
            debtor.customerName = customer.name;
            if (customer.phone) debtor.phone = customer.phone;
            if (customer.address) debtor.address = customer.address;
        }

        return debtors.sort(
            (a, b) => a.dueDate - b.dueDate || compareNames(a.customerName, b.customerName),
        );
    },
});

/**
 * Detalhe de um cliente devedor: cadastro, compras fiadas e pagamentos.
 * As compras em aberto vêm primeiro, da mais antiga para a mais nova.
 */
export const byCustomer = query({
    args: { customerId: v.id("customers") },
    returns: v.union(
        v.object({
            customer: customerValidator,
            credits: v.array(creditValidator),
            payments: v.array(creditPaymentValidator),
        }),
        v.null(),
    ),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const customer = await ctx.db.get(args.customerId);
        if (customer === null || customer.storeId !== store._id) {
            return null;
        }

        const credits = await ctx.db
            .query("credits")
            .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
            .collect();

        const storeCredits = credits.filter((credit) => credit.storeId === store._id);
        storeCredits.sort((a, b) => {
            const aOpen = a.status !== "paid" && balanceOf(a) > 0;
            const bOpen = b.status !== "paid" && balanceOf(b) > 0;
            if (aOpen !== bOpen) return aOpen ? -1 : 1;
            if (aOpen) return a.dueDate - b.dueDate || b.createdAt - a.createdAt;
            return b.createdAt - a.createdAt;
        });

        const payments: Doc<"creditPayments">[] = [];

        for (const credit of storeCredits) {
            const creditPayments = await ctx.db
                .query("creditPayments")
                .withIndex("by_credit", (q) => q.eq("creditId", credit._id))
                .collect();
            payments.push(...creditPayments);
        }

        payments.sort((a, b) => b.paidAt - a.paidAt);

        return { customer, credits: storeCredits, payments };
    },
});

/** Fiado de uma venda, usado para mostrar o vencimento na nota. */
export const getBySale = query({
    args: { saleId: v.id("sales") },
    returns: v.union(creditValidator, v.null()),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const credit = await ctx.db
            .query("credits")
            .withIndex("by_sale", (q) => q.eq("saleId", args.saleId))
            .first();

        if (credit === null || credit.storeId !== store._id) {
            return null;
        }

        return credit;
    },
});

/**
 * Registra um pagamento parcial ou total de um fiado.
 * O valor não pode passar do saldo devedor.
 */
export const registerPayment = mutation({
    args: {
        creditId: v.id("credits"),
        amountCents: v.number(),
        method: creditPaymentMethodValidator,
    },
    returns: v.object({
        paidCents: v.number(),
        balanceCents: v.number(),
        fullyPaid: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);

        const credit = await ctx.db.get(args.creditId);
        if (credit === null || credit.storeId !== store._id) {
            throw new ConvexError("Fiado não encontrado. Volte para Quem deve e tente de novo.");
        }
        if (credit.status === "paid" || balanceOf(credit) <= 0) {
            throw new ConvexError("Este fiado já está quitado.");
        }

        const amountCents = Math.round(args.amountCents);
        if (!Number.isFinite(amountCents) || amountCents <= 0) {
            throw new ConvexError("Digite um valor recebido maior que zero.");
        }
        if (amountCents > MAX_CENTS) {
            throw new ConvexError("O valor recebido é muito alto. Confira.");
        }

        const totalCents = Math.round(credit.totalCents);
        const paidCents = Math.round(credit.paidCents);
        const balanceCents = Math.max(0, totalCents - paidCents);
        if (amountCents > balanceCents) {
            throw new ConvexError(
                "O valor recebido é maior que o saldo devedor. Confira o valor e tente de novo.",
            );
        }

        const now = Date.now();
        await ctx.db.insert("creditPayments", {
            creditId: credit._id,
            amountCents,
            method: args.method,
            paidAt: now,
        });

        const newPaidCents = paidCents + amountCents;
        const fullyPaid = newPaidCents >= totalCents;
        await ctx.db.patch(credit._id, {
            paidCents: newPaidCents,
            status: fullyPaid ? "paid" : "open",
            ...(fullyPaid ? { paidAt: now } : {}),
        });

        return {
            paidCents: newPaidCents,
            balanceCents: Math.max(0, totalCents - newPaidCents),
            fullyPaid,
        };
    },
});
