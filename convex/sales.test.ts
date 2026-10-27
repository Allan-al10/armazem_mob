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
