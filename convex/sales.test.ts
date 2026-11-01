/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

type Test = TestConvex<typeof schema>;

const modules = import.meta.glob("./**/*.ts");

async function seedStore(t: Test, stockQty = 10) {
    return await t.run(async (ctx) => {
        const userId = await ctx.db.insert("users", {
            name: "Dona Maria",
            email: "dona-maria@example.com",
        });
        const storeId = await ctx.db.insert("stores", {
            ownerId: userId,
            tradeName: "Armazém da Maria",
            cnpj: "11222333000181",
            ownerName: "Maria Souza",
            phone: "11999999999",
            address: {
                street: "Rua do Comércio",
                number: "10",
                district: "Centro",
                city: "São Paulo",
                state: "SP",
            },
            nextSaleNumber: 1,
        });
        const customerId = await ctx.db.insert("customers", {
            storeId,
            name: "Maria Souza",
            nameQuery: "maria souza",
            phone: "11999999999",
        });
        const productId = await ctx.db.insert("products", {
            storeId,
            name: "Arroz 5 kg",
            nameQuery: "arroz 5 kg",
            unit: "unidade",
            stockQty,
            lastUnitCostCents: 400,
            salePriceCents: 500,
            lowStockThreshold: 2,
            active: true,
        });

        return { userId, storeId, customerId, productId };
    });
}

async function seedReportedSale(
    t: Test,
    args: {
        storeId: Id<"stores">;
        customerId: Id<"customers">;
        productId: Id<"products">;
        number: number;
        createdAt: number;
        status: "completed" | "canceled";
        totalCents: number;
        quantity: number;
        unitPriceCents: number;
        unitCostCents: number;
    },
) {
    return await t.run(async (ctx) => {
        const saleId = await ctx.db.insert("sales", {
            storeId: args.storeId,
            customerId: args.customerId,
            number: args.number,
            customerName: "Maria Souza",
            customerPhone: "11999999999",
            totalCents: args.totalCents,
            paymentMethod: "cash",
            status: args.status,
            createdAt: args.createdAt,
            ...(args.status === "canceled" ? { canceledAt: args.createdAt + 1 } : {}),
        });
        await ctx.db.insert("saleItems", {
            saleId,
            productId: args.productId,
            productName: "Arroz 5 kg",
            unit: "unidade",
            quantity: args.quantity,
            unitPriceCents: args.unitPriceCents,
            unitCostCents: args.unitCostCents,
            subtotalCents: args.totalCents,
        });
        return saleId;
    });
}

function monthStartFor(timestamp: number, offsetMinutes: number): number {
    const local = new Date(timestamp + offsetMinutes * 60_000);
    return (
        Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) -
        offsetMinutes * 60_000
    );
}

async function readSaleState(
    t: Test,
    saleId: Id<"sales">,
    productId: Id<"products">,
) {
    return await t.run(async (ctx) => {
        const product = await ctx.db.get(productId);
        const sale = await ctx.db.get(saleId);
        const items = await ctx.db
            .query("saleItems")
            .withIndex("by_sale", (q) => q.eq("saleId", saleId))
            .collect();
        const movements = await ctx.db
            .query("stockMovements")
            .withIndex("by_product", (q) => q.eq("productId", productId))
            .collect();
        const store = sale ? await ctx.db.get(sale.storeId) : null;

        return { product, sale, items, movements, store };
    });
}

describe("sales.create", () => {
    test("baixa o estoque, grava a venda e cria o movimento na mesma operação", async () => {
        const t = convexTest(schema, modules);
        const { userId, customerId, productId } = await seedStore(t, 10);
        const asMaria = t.withIdentity({ subject: userId });

        const saleId = await asMaria.mutation(api.sales.create, {
            customerId,
            customerName: "Maria Souza",
            customerPhone: "11999999999",
            items: [{ productId, quantity: 3, unitPriceCents: 500 }],
            paymentMethod: "cash",
        });

        const state = await readSaleState(t, saleId, productId);

        expect(state.product?.stockQty).toBe(7);
        expect(state.sale).toMatchObject({
            totalCents: 1500,
            paymentMethod: "cash",
            status: "completed",
            number: 1,
        });
        expect(state.items).toHaveLength(1);
        expect(state.items[0]).toMatchObject({
            quantity: 3,
            unitPriceCents: 500,
            unitCostCents: 400,
            subtotalCents: 1500,
        });
        expect(state.movements).toHaveLength(1);
        expect(state.movements[0]).toMatchObject({
            type: "saida",
            quantity: -3,
            balanceAfter: 7,
            refId: saleId,
        });
        expect(state.store?.nextSaleNumber).toBe(2);
    });

    test("não grava nada quando o estoque é insuficiente", async () => {
        const t = convexTest(schema, modules);
        const { userId, customerId, productId } = await seedStore(t, 2);
        const asMaria = t.withIdentity({ subject: userId });

        await expect(
            asMaria.mutation(api.sales.create, {
                customerId,
                customerName: "Maria Souza",
                customerPhone: "11999999999",
                items: [{ productId, quantity: 3, unitPriceCents: 500 }],
                paymentMethod: "cash",
            }),
        ).rejects.toThrow(/Só tem 2 unidades de Arroz 5 kg/);

        const state = await t.run(async (ctx) => {
            const product = await ctx.db.get(productId);
            const sales = await ctx.db.query("sales").collect();
            const items = await ctx.db.query("saleItems").collect();
            const movements = await ctx.db.query("stockMovements").collect();
            const store = await ctx.db
                .query("stores")
                .withIndex("by_owner", (q) => q.eq("ownerId", userId))
                .first();

            return { product, sales, items, movements, store };
        });

        expect(state.product?.stockQty).toBe(2);
        expect(state.sales).toHaveLength(0);
        expect(state.items).toHaveLength(0);
        expect(state.movements).toHaveLength(0);
        expect(state.store?.nextSaleNumber).toBe(1);
    });

    test("bloqueia venda sem usuário logado", async () => {
        const t = convexTest(schema, modules);
        const { customerId, productId } = await seedStore(t, 10);

        await expect(
            t.mutation(api.sales.create, {
                customerId,
                customerName: "Maria Souza",
                customerPhone: "11999999999",
                items: [{ productId, quantity: 1, unitPriceCents: 500 }],
                paymentMethod: "cash",
            }),
        ).rejects.toThrow(/Entre na sua conta/);

        const stockQty = await t.run(async (ctx) => {
            const product = await ctx.db.get(productId);
            return product?.stockQty;
        });
        expect(stockQty).toBe(10);
    });
});

describe("sales.report", () => {
    test("mostra itens, custo e lucro e exclui canceladas do resumo", async () => {
        const t = convexTest(schema, modules);
        const { userId, customerId, productId } = await seedStore(t, 10);
        const asMaria = t.withIdentity({ subject: userId });

        const activeSaleId = await asMaria.mutation(api.sales.create, {
            customerId,
            customerName: "Maria Souza",
            customerPhone: "11999999999",
            items: [{ productId, quantity: 3, unitPriceCents: 500 }],
            paymentMethod: "cash",
        });
        const canceledSaleId = await asMaria.mutation(api.sales.create, {
            customerId,
            customerName: "Maria Souza",
            customerPhone: "11999999999",
            items: [{ productId, quantity: 2, unitPriceCents: 500 }],
            paymentMethod: "pix",
        });
        await asMaria.mutation(api.sales.cancel, { saleId: canceledSaleId });

        const now = Date.now();
        const report = await asMaria.query(api.sales.report, {
            from: now - 60_000,
            to: now + 60_000,
        });

        expect(report.summary).toEqual({
            salesCount: 1,
            canceledCount: 1,
            totalCents: 1500,
            costCents: 1200,
            profitCents: 300,
        });
        expect(report.sales).toHaveLength(2);

        const active = report.sales.find((entry) => entry.sale._id === activeSaleId);
        expect(active?.sale.status).toBe("completed");
        expect(active?.costCents).toBe(1200);
        expect(active?.profitCents).toBe(300);
        expect(active?.items[0]).toMatchObject({
            productName: "Arroz 5 kg",
            quantity: 3,
            unitPriceCents: 500,
            unitCostCents: 400,
            subtotalCents: 1500,
            costCents: 1200,
        });

        const canceled = report.sales.find((entry) => entry.sale._id === canceledSaleId);
        expect(canceled?.sale.status).toBe("canceled");
        expect(canceled?.items).toHaveLength(1);
    });

    test("periodSummary devolve o mesmo resumo financeiro", async () => {
        const t = convexTest(schema, modules);
        const { userId, customerId, productId } = await seedStore(t, 10);
        const asMaria = t.withIdentity({ subject: userId });

        await asMaria.mutation(api.sales.create, {
            customerId,
            customerName: "Maria Souza",
            customerPhone: "11999999999",
            items: [{ productId, quantity: 2, unitPriceCents: 750 }],
            paymentMethod: "card",
        });

        const now = Date.now();
        const summary = await asMaria.query(api.sales.periodSummary, {
            from: now - 60_000,
            to: now + 60_000,
        });

        expect(summary).toEqual({
            salesCount: 1,
            canceledCount: 0,
            totalCents: 1500,
            costCents: 800,
            profitCents: 700,
        });
    });

    test("rejeita período inválido", async () => {
        const t = convexTest(schema, modules);
        const { userId } = await seedStore(t, 10);
        const asMaria = t.withIdentity({ subject: userId });

        await expect(
            asMaria.query(api.sales.report, { from: 2000, to: 1000 }),
        ).rejects.toThrow(/Período do registro de vendas inválido/);
    });
});

describe("sales.overview", () => {
    test("agrupa as vendas por mês local, da mais nova para a mais antiga", async () => {
        const t = convexTest(schema, modules);
        const { userId, storeId, customerId, productId } = await seedStore(t, 10);
        const asMaria = t.withIdentity({ subject: userId });

        const offsetMinutes = -180; // Brasília
        const now = Date.now();
        const currentMonthStart = monthStartFor(now, offsetMinutes);
        const previousMonthStart = monthStartFor(currentMonthStart - 1, offsetMinutes);
        const twoMonthsAgoStart = monthStartFor(previousMonthStart - 1, offsetMinutes);

        await seedReportedSale(t, {
            storeId,
            customerId,
            productId,
            number: 1,
            createdAt: now,
            status: "completed",
            totalCents: 1000,
            quantity: 2,
            unitPriceCents: 500,
            unitCostCents: 400,
        });
        await seedReportedSale(t, {
            storeId,
            customerId,
            productId,
            number: 2,
            createdAt: now,
            status: "canceled",
            totalCents: 500,
            quantity: 1,
            unitPriceCents: 500,
            unitCostCents: 400,
        });
        await seedReportedSale(t, {
            storeId,
            customerId,
            productId,
            number: 3,
            createdAt: previousMonthStart + 12 * 60 * 60 * 1000,
            status: "completed",
            totalCents: 2250,
            quantity: 3,
            unitPriceCents: 750,
            unitCostCents: 400,
        });
        await seedReportedSale(t, {
            storeId,
            customerId,
            productId,
            number: 4,
            createdAt: twoMonthsAgoStart + 12 * 60 * 60 * 1000,
            status: "completed",
            totalCents: 500,
            quantity: 1,
            unitPriceCents: 500,
            unitCostCents: 400,
        });

        const overview = await asMaria.query(api.sales.overview, {
            timezoneOffsetMinutes: offsetMinutes,
        });

        expect(overview.summary).toEqual({
            salesCount: 3,
            canceledCount: 1,
            totalCents: 3750,
            costCents: 2400,
            profitCents: 1350,
        });
        expect(overview.months.map((month) => month.monthStart)).toEqual([
            currentMonthStart,
            previousMonthStart,
            twoMonthsAgoStart,
        ]);
        expect(overview.months[0].summary).toEqual({
            salesCount: 1,
            canceledCount: 1,
            totalCents: 1000,
            costCents: 800,
            profitCents: 200,
        });
        expect(overview.months[1].summary).toEqual({
            salesCount: 1,
            canceledCount: 0,
            totalCents: 2250,
            costCents: 1200,
            profitCents: 1050,
        });
        expect(overview.months[2].summary).toEqual({
            salesCount: 1,
            canceledCount: 0,
            totalCents: 500,
            costCents: 400,
            profitCents: 100,
        });
    });

    test("rejeita fuso horário inválido", async () => {
        const t = convexTest(schema, modules);
        const { userId } = await seedStore(t, 10);
        const asMaria = t.withIdentity({ subject: userId });

        await expect(
            asMaria.query(api.sales.overview, { timezoneOffsetMinutes: 15 * 60 + 1 }),
        ).rejects.toThrow(/Fuso horário inválido/);
    });

    test("exige usuário logado", async () => {
        const t = convexTest(schema, modules);
        await seedStore(t, 10);

        await expect(
            t.query(api.sales.overview, { timezoneOffsetMinutes: -180 }),
        ).rejects.toThrow(/Entre na sua conta/);
    });
});

describe("sales.cancel", () => {
    test("devolve o estoque e mantém a venda cancelada no histórico", async () => {
        const t = convexTest(schema, modules);
        const { userId, customerId, productId } = await seedStore(t, 10);
        const asMaria = t.withIdentity({ subject: userId });

        const saleId = await asMaria.mutation(api.sales.create, {
            customerId,
            customerName: "Maria Souza",
            customerPhone: "11999999999",
            items: [{ productId, quantity: 4, unitPriceCents: 500 }],
            paymentMethod: "cash",
        });

        await asMaria.mutation(api.sales.cancel, { saleId });

        const state = await readSaleState(t, saleId, productId);

        expect(state.product?.stockQty).toBe(10);
        expect(state.sale?.status).toBe("canceled");
        expect(state.sale?.canceledAt).toBeTypeOf("number");
        expect(state.items).toHaveLength(1);
        expect(state.movements).toHaveLength(2);
        expect(state.movements.map((movement) => movement.type).sort()).toEqual([
            "cancelamento",
            "saida",
        ]);
        expect(
            state.movements.find((movement) => movement.type === "cancelamento"),
        ).toMatchObject({
            quantity: 4,
            balanceAfter: 10,
            refId: saleId,
        });
    });
});
