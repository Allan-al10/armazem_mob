/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

type Test = TestConvex<typeof schema>;

const modules = import.meta.glob("./**/*.ts");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 9, 24, 11, 10, 0);
const DUE_OVERDUE = Date.UTC(2026, 9, 23, 3, 0, 0);
const DUE_TODAY = Date.UTC(2026, 9, 24, 3, 0, 0);
const DUE_TOMORROW = Date.UTC(2026, 9, 25, 3, 0, 0);
const DUE_IN_3 = Date.UTC(2026, 9, 27, 3, 0, 0);
const DUE_IN_5 = Date.UTC(2026, 9, 29, 3, 0, 0);

type SeedOptions = {
    enabled?: boolean;
    withToken?: boolean;
};

async function seedReminderStore(t: Test, options: SeedOptions = {}) {
    return await t.run(async (ctx) => {
        const userId = await ctx.db.insert("users", {
            name: "Dona Maria",
            email: "avisos@example.com",
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
            remindersEnabled: options.enabled ?? true,
            reminderDaysBefore: 3,
            reminderHour: 8,
            reminderTimezoneOffsetMinutes: -180,
        });
        const customerId = await ctx.db.insert("customers", {
            storeId,
            name: "Maria Souza",
            nameQuery: "maria souza",
            phone: "11999999999",
            address: "Rua do Cliente, 20",
        });

        if (options.withToken ?? true) {
            await ctx.db.insert("pushTokens", {
                userId,
                storeId,
                token: "ExponentPushToken[fase-6-nao-enviar]",
                platform: "android",
                createdAt: NOW,
                updatedAt: NOW,
            });
        }

        const fixtures = [
            { dueDate: DUE_OVERDUE, totalCents: 1000, status: "open" as const },
            { dueDate: DUE_TODAY, totalCents: 2000, status: "open" as const },
            { dueDate: DUE_TOMORROW, totalCents: 3000, status: "open" as const },
            { dueDate: DUE_IN_3, totalCents: 4000, status: "open" as const },
            { dueDate: DUE_IN_5, totalCents: 5000, status: "open" as const },
            { dueDate: DUE_TODAY, totalCents: 6000, status: "paid" as const },
        ];

        const creditIds: Record<string, Id<"credits">> = {};
        for (const [index, fixture] of fixtures.entries()) {
            const saleId = await ctx.db.insert("sales", {
                storeId,
                customerId,
                number: 900 + index,
                customerName: "Maria Souza",
                customerPhone: "11999999999",
                totalCents: fixture.totalCents,
                paymentMethod: "credit_account",
                status: "completed",
                createdAt: NOW - 7 * HOUR,
            });
            const creditId = await ctx.db.insert("credits", {
                storeId,
                saleId,
                customerId,
                customerName: "Maria Souza",
                phone: "11999999999",
                address: "Rua do Cliente, 20",
                totalCents: fixture.totalCents,
                paidCents: fixture.status === "paid" ? fixture.totalCents : 0,
                dueDate: fixture.dueDate,
                status: fixture.status,
                createdAt: NOW - 7 * HOUR,
                ...(fixture.status === "paid" ? { paidAt: NOW - HOUR } : {}),
            });
            creditIds[`credit${index}`] = creditId;
        }

        return { userId, storeId, customerId, creditIds };
    });
}

describe("reminders.collectDueReminders", () => {
    test("agrupa por cliente e escolhe os fiados que vencem hoje, amanhã, em 3 dias ou atrasados", async () => {
        const t = convexTest(schema, modules);
        const { creditIds } = await seedReminderStore(t);

        const reminders = await t.query(internal.reminders.collectDueReminders, {
            now: NOW,
        });

        expect(reminders).toHaveLength(1);
        expect(reminders[0]).toMatchObject({
            customerName: "Maria Souza",
            title: "Fiado de Maria Souza",
            body: "R$ 150,00 em aberto (5 compras em aberto). Venceu ontem.",
            tokens: ["ExponentPushToken[fase-6-nao-enviar]"],
        });
        expect(reminders[0].creditIds.sort()).toEqual(
            [
                creditIds.credit0,
                creditIds.credit1,
                creditIds.credit2,
                creditIds.credit3,
            ].sort(),
        );
    });

    test("não envia no horário errado, com avisos desligados ou sem aparelho cadastrado", async () => {
        const wrongHour = convexTest(schema, modules);
        await seedReminderStore(wrongHour);
        const wrongHourResult = await wrongHour.query(
            internal.reminders.collectDueReminders,
            { now: NOW + HOUR },
        );
        expect(wrongHourResult).toEqual([]);

        const disabled = convexTest(schema, modules);
        await seedReminderStore(disabled, { enabled: false });
        const disabledResult = await disabled.query(
            internal.reminders.collectDueReminders,
            { now: NOW },
        );
        expect(disabledResult).toEqual([]);

        const withoutToken = convexTest(schema, modules);
        await seedReminderStore(withoutToken, { withToken: false });
        const withoutTokenResult = await withoutToken.query(
            internal.reminders.collectDueReminders,
            { now: NOW },
        );
        expect(withoutTokenResult).toEqual([]);
    });

    test("não repete no mesmo dia e volta a avisar no dia seguinte", async () => {
        const t = convexTest(schema, modules);
        const { creditIds } = await seedReminderStore(t);
        const first = await t.query(internal.reminders.collectDueReminders, {
            now: NOW,
        });

        await t.mutation(internal.reminders.markRemindersSent, {
            creditIds: first[0].creditIds,
            sentAt: NOW,
        });

        const sameDay = await t.query(internal.reminders.collectDueReminders, {
            now: NOW,
        });
        expect(sameDay).toEqual([]);

        const nextDay = await t.query(internal.reminders.collectDueReminders, {
            now: NOW + 24 * HOUR,
        });
        expect(nextDay).toHaveLength(1);
        expect(nextDay[0].body).toBe(
            "R$ 150,00 em aberto (5 compras em aberto). Venceu há 2 dias.",
        );
        expect(nextDay[0].creditIds.sort()).toEqual(
            [
                creditIds.credit0,
                creditIds.credit1,
                creditIds.credit2,
            ].sort(),
        );
    });
});

describe("reminders.refreshOverdueCredits", () => {
    test("marca como atrasado o fiado vencido", async () => {
        const t = convexTest(schema, modules);
        const { creditIds } = await seedReminderStore(t);

        await t.run(async (ctx) => {
            await ctx.db.patch(creditIds.credit0, {
                dueDate: Date.now() - 2 * DAY,
                status: "open",
            });
        });

        await t.mutation(internal.reminders.refreshOverdueCredits, {});

        const credit = await t.run(async (ctx) =>
            ctx.db.get(creditIds.credit0),
        );
        expect(credit?.status).toBe("overdue");
    });
});

describe("reminders.settings", () => {
    test("lê os padrões, salva preferências e registra o aparelho", async () => {
        const t = convexTest(schema, modules);
        const { userId, storeId } = await seedReminderStore(t, {
            withToken: false,
        });
        const asMaria = t.withIdentity({ subject: userId });

        const defaults = await asMaria.query(api.reminders.settings);
        expect(defaults).toMatchObject({
            enabled: true,
            daysBefore: 3,
            hour: 8,
            timezoneOffsetMinutes: -180,
            hasPushToken: false,
        });

        await asMaria.mutation(api.reminders.updateSettings, {
            enabled: false,
            daysBefore: 7,
            hour: 18,
            timezoneOffsetMinutes: -240,
        });

        const updated = await asMaria.query(api.reminders.settings);
        expect(updated).toMatchObject({
            enabled: false,
            daysBefore: 7,
            hour: 18,
            timezoneOffsetMinutes: -240,
        });

        const token = "ExponentPushToken[teste-settings]";
        await asMaria.mutation(api.reminders.registerPushToken, {
            token,
            platform: "android",
            timezoneOffsetMinutes: -240,
        });

        const registered = await asMaria.query(api.reminders.settings);
        expect(registered.hasPushToken).toBe(true);

        await asMaria.mutation(api.reminders.unregisterPushToken, { token });
        const unregistered = await asMaria.query(api.reminders.settings);
        expect(unregistered.hasPushToken).toBe(false);

        const stored = await t.run(async (ctx) => {
            const store = await ctx.db.get(storeId);
            const tokens = await ctx.db
                .query("pushTokens")
                .withIndex("by_store", (q) => q.eq("storeId", storeId))
                .collect();
            return { store, tokens };
        });
        expect(stored.store).toMatchObject({
            remindersEnabled: false,
            reminderDaysBefore: 7,
            reminderHour: 18,
            reminderTimezoneOffsetMinutes: -240,
        });
        expect(stored.tokens).toHaveLength(0);
    });

    test("atualiza o fuso do aparelho sempre que registra o token", async () => {
        const t = convexTest(schema, modules);
        const { userId, storeId } = await seedReminderStore(t, {
            withToken: false,
        });
        const asMaria = t.withIdentity({ subject: userId });

        await asMaria.mutation(api.reminders.registerPushToken, {
            token: "ExponentPushToken[fuso-atualizado]",
            platform: "android",
            timezoneOffsetMinutes: -240,
        });

        const store = await t.run(async (ctx) => ctx.db.get(storeId));
        expect(store?.reminderTimezoneOffsetMinutes).toBe(-240);
    });
});
