import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { formatCents } from "../src/lib/money";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
    internalAction,
    internalMutation,
    internalQuery,
    mutation,
    query,
} from "./_generated/server";
import { requireStore } from "./lib";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REMINDER_DAYS = 3;
const DEFAULT_REMINDER_HOUR = 8;
// Brasília (UTC-3). O app envia o fuso real do aparelho ao registrar o token.
const DEFAULT_TIMEZONE_OFFSET_MINUTES = -180;
const REMINDER_CHANNEL_ID = "credit-reminders";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const MAX_PUSH_BATCH = 100;

type StoreSettings = {
    enabled: boolean;
    daysBefore: number;
    hour: number;
    timezoneOffsetMinutes: number;
};

type ReminderGroup = {
    customerId: Id<"customers">;
    customerName: string;
    balanceCents: number;
    earliestDueDate: number;
    creditCount: number;
    triggerCreditIds: Id<"credits">[];
};

type Reminder = {
    customerId: Id<"customers">;
    customerName: string;
    title: string;
    body: string;
    creditIds: Id<"credits">[];
    tokens: string[];
};

type ExpoPushTicket = {
    status: "ok" | "error";
    id?: string;
    message?: string;
    details?: {
        error?: string;
    };
};

type ExpoPushResponse = {
    data?: ExpoPushTicket[];
    errors?: unknown[];
};

const reminderValidator = v.object({
    customerId: v.id("customers"),
    customerName: v.string(),
    title: v.string(),
    body: v.string(),
    creditIds: v.array(v.id("credits")),
    tokens: v.array(v.string()),
});

function readSettings(store: Doc<"stores">): StoreSettings {
    return {
        enabled: store.remindersEnabled ?? true,
        daysBefore: store.reminderDaysBefore ?? DEFAULT_REMINDER_DAYS,
        hour: store.reminderHour ?? DEFAULT_REMINDER_HOUR,
        timezoneOffsetMinutes:
            store.reminderTimezoneOffsetMinutes ?? DEFAULT_TIMEZONE_OFFSET_MINUTES,
    };
}

function validateDaysBefore(value: number): number {
    if (!Number.isInteger(value) || value < 1 || value > 30) {
        throw new ConvexError("Escolha de 1 a 30 dias de antecedência para os avisos.");
    }
    return value;
}

function validateHour(value: number): number {
    if (!Number.isInteger(value) || value < 0 || value > 23) {
        throw new ConvexError("Escolha um horário entre 0 e 23 horas.");
    }
    return value;
}

function validateTimezoneOffset(value: number): number {
    if (!Number.isInteger(value) || value < -840 || value > 840) {
        throw new ConvexError("O fuso horário do aparelho não pôde ser usado. Tente de novo.");
    }
    return value;
}

/** Número do dia local, independente do fuso do servidor. */
function localDayNumber(timestamp: number, offsetMinutes: number): number {
    return Math.floor((timestamp + offsetMinutes * 60_000) / DAY_MS);
}

function localHour(timestamp: number, offsetMinutes: number): number {
    return new Date(timestamp + offsetMinutes * 60_000).getUTCHours();
}

function dueLabel(days: number): string {
    if (days === 0) return "Vence hoje.";
    if (days === 1) return "Vence amanhã.";
    if (days > 1) return `Vence em ${days} dias.`;
    if (days === -1) return "Venceu ontem.";
    return `Venceu há ${Math.abs(days)} dias.`;
}

/** Configurações usadas pela tela de Configurações. */
export const settings = query({
    args: {},
    returns: v.object({
        enabled: v.boolean(),
        daysBefore: v.number(),
        hour: v.number(),
        timezoneOffsetMinutes: v.number(),
        hasPushToken: v.boolean(),
    }),
    handler: async (ctx) => {
        const store = await requireStore(ctx);
        const userId = await getAuthUserId(ctx);
        const current = readSettings(store);

        let hasPushToken = false;
        if (userId !== null) {
            const tokens = await ctx.db
                .query("pushTokens")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();
            hasPushToken = tokens.some((token) => token.storeId === store._id);
        }

        return { ...current, hasPushToken };
    },
});

export const updateSettings = mutation({
    args: {
        enabled: v.boolean(),
        daysBefore: v.number(),
        hour: v.number(),
        timezoneOffsetMinutes: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);
        const daysBefore = validateDaysBefore(args.daysBefore);
        const hour = validateHour(args.hour);
        const timezoneOffsetMinutes = validateTimezoneOffset(
            args.timezoneOffsetMinutes,
        );

        await ctx.db.patch(store._id, {
            remindersEnabled: args.enabled,
            reminderDaysBefore: daysBefore,
            reminderHour: hour,
            reminderTimezoneOffsetMinutes: timezoneOffsetMinutes,
        });

        return null;
    },
});

/**
 * Salva o token do aparelho. Se o mesmo token já existir (por exemplo, depois de
 * uma renovação), ele é atualizado em vez de duplicado.
 */
export const registerPushToken = mutation({
    args: {
        token: v.string(),
        platform: v.union(v.literal("android"), v.literal("ios")),
        timezoneOffsetMinutes: v.optional(v.number()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            throw new ConvexError("Entre na sua conta para continuar.");
        }

        const token = args.token.trim();
        if (token.length < 10 || token.length > 400) {
            throw new ConvexError("O token de aviso do aparelho não foi reconhecido.");
        }

        const timezoneOffsetMinutes =
            args.timezoneOffsetMinutes === undefined
                ? undefined
                : validateTimezoneOffset(args.timezoneOffsetMinutes);

        const now = Date.now();
        const existing = await ctx.db
            .query("pushTokens")
            .withIndex("by_token", (q) => q.eq("token", token))
            .first();

        if (existing !== null) {
            await ctx.db.patch(existing._id, {
                userId,
                storeId: store._id,
                platform: args.platform,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("pushTokens", {
                userId,
                storeId: store._id,
                token,
                platform: args.platform,
                createdAt: now,
                updatedAt: now,
            });
        }

        // O fuso é atualizado a cada registro para acompanhar viagens e
        // mudanças de horário de verão. A tela de Configurações também pode
        // atualizar esse valor.
        if (timezoneOffsetMinutes !== undefined) {
            await ctx.db.patch(store._id, {
                reminderTimezoneOffsetMinutes: timezoneOffsetMinutes,
            });
        }

        return null;
    },
});

/** Remove o token no logout, para o aparelho não receber avisos de outra conta. */
export const unregisterPushToken = mutation({
    args: {
        token: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const store = await requireStore(ctx);
        const userId = await getAuthUserId(ctx);
        if (userId === null) return null;

        const token = args.token.trim();
        if (!token) return null;

        const existing = await ctx.db
            .query("pushTokens")
            .withIndex("by_token", (q) => q.eq("token", token))
            .first();

        if (
            existing !== null &&
            existing.userId === userId &&
            existing.storeId === store._id
        ) {
            await ctx.db.delete(existing._id);
        }

        return null;
    },
});

/** Atualiza o status dos fiados vencidos. Roda de hora em hora. */
export const refreshOverdueCredits = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const now = Date.now();
        const stores = await ctx.db.query("stores").collect();

        for (const store of stores) {
            const offset = readSettings(store).timezoneOffsetMinutes;
            const todayStart =
                localDayNumber(now, offset) * DAY_MS - offset * 60_000;

            const credits = await ctx.db
                .query("credits")
                .withIndex("by_store_and_dueDate", (q) =>
                    q.eq("storeId", store._id).lt("dueDate", todayStart),
                )
                .collect();

            for (const credit of credits) {
                if (credit.status === "open") {
                    await ctx.db.patch(credit._id, { status: "overdue" });
                }
            }
        }

        return null;
    },
});

/**
 * Monta os avisos que devem sair nesta hora. O cron roda de hora em hora e
 * cada loja escolhe o horário local em Configurações.
 */
export const collectDueReminders = internalQuery({
    args: {
        now: v.number(),
    },
    returns: v.array(reminderValidator),
    handler: async (ctx, args) => {
        const now = Math.round(args.now);
        if (!Number.isFinite(now)) return [];

        const stores = await ctx.db.query("stores").collect();
        const reminders: Reminder[] = [];

        for (const store of stores) {
            const current = readSettings(store);
            if (!current.enabled) continue;
            if (localHour(now, current.timezoneOffsetMinutes) !== current.hour) {
                continue;
            }

            const tokens = await ctx.db
                .query("pushTokens")
                .withIndex("by_store", (q) => q.eq("storeId", store._id))
                .collect();
            if (tokens.length === 0) continue;

            const credits = await ctx.db
                .query("credits")
                .withIndex("by_store", (q) => q.eq("storeId", store._id))
                .collect();

            const nowDay = localDayNumber(now, current.timezoneOffsetMinutes);
            const groups = new Map<string, ReminderGroup>();

            for (const credit of credits) {
                const balanceCents = Math.max(
                    0,
                    Math.round(credit.totalCents - credit.paidCents),
                );
                if (credit.status === "paid" || balanceCents <= 0) continue;

                const key = credit.customerId as string;
                let group = groups.get(key);
                if (!group) {
                    group = {
                        customerId: credit.customerId,
                        customerName: credit.customerName,
                        balanceCents: 0,
                        earliestDueDate: credit.dueDate,
                        creditCount: 0,
                        triggerCreditIds: [],
                    };
                    groups.set(key, group);
                }

                group.balanceCents += balanceCents;
                group.creditCount += 1;
                if (credit.dueDate < group.earliestDueDate) {
                    group.earliestDueDate = credit.dueDate;
                }

                const days =
                    localDayNumber(
                        credit.dueDate,
                        current.timezoneOffsetMinutes,
                    ) - nowDay;
                const shouldWarn =
                    days < 0 ||
                    days === 0 ||
                    days === 1 ||
                    days === current.daysBefore;
                if (!shouldWarn) continue;

                const lastReminderDay =
                    credit.lastReminderAt === undefined
                        ? null
                        : localDayNumber(
                              credit.lastReminderAt,
                              current.timezoneOffsetMinutes,
                          );
                if (lastReminderDay === nowDay) continue;

                group.triggerCreditIds.push(credit._id);
            }

            for (const group of groups.values()) {
                if (group.triggerCreditIds.length === 0) continue;

                const days =
                    localDayNumber(
                        group.earliestDueDate,
                        current.timezoneOffsetMinutes,
                    ) - nowDay;
                const countText =
                    group.creditCount > 1
                        ? ` (${group.creditCount} compras em aberto)`
                        : "";

                reminders.push({
                    customerId: group.customerId,
                    customerName: group.customerName,
                    title: `Fiado de ${group.customerName}`,
                    body: `${formatCents(group.balanceCents)} em aberto${countText}. ${dueLabel(days)}`,
                    creditIds: group.triggerCreditIds,
                    tokens: tokens.map((token) => token.token),
                });
            }
        }

        return reminders;
    },
});

/** Marca os fiados avisados para não repetir a notificação no mesmo dia. */
export const markRemindersSent = internalMutation({
    args: {
        creditIds: v.array(v.id("credits")),
        sentAt: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const sentAt = Math.round(args.sentAt);
        if (!Number.isFinite(sentAt)) return null;

        for (const creditId of new Set(args.creditIds)) {
            const credit = await ctx.db.get(creditId);
            if (credit !== null) {
                await ctx.db.patch(credit._id, { lastReminderAt: sentAt });
            }
        }

        return null;
    },
});

/** Remove tokens que o Expo informou que não existem mais. */
export const removePushTokens = internalMutation({
    args: {
        tokens: v.array(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        for (const token of new Set(args.tokens)) {
            const existing = await ctx.db
                .query("pushTokens")
                .withIndex("by_token", (q) => q.eq("token", token))
                .first();
            if (existing !== null) {
                await ctx.db.delete(existing._id);
            }
        }

        return null;
    },
});

/**
 * Envia os avisos pelo Expo Push Service. O agendamento fica em convex/crons.ts.
 * Só marca o fiado como avisado quando o Expo aceita pelo menos um envio.
 */
export const sendDueReminders = internalAction({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const now = Date.now();
        const reminders = await ctx.runQuery(
            internal.reminders.collectDueReminders,
            { now },
        );
        if (reminders.length === 0) return null;

        const entries: {
            reminderIndex: number;
            token: string;
        }[] = [];
        reminders.forEach((reminder, reminderIndex) => {
            for (const token of reminder.tokens) {
                entries.push({ reminderIndex, token });
            }
        });
        if (entries.length === 0) return null;

        const sentReminderIndexes = new Set<number>();
        const invalidTokens = new Set<string>();

        for (let start = 0; start < entries.length; start += MAX_PUSH_BATCH) {
            const batch = entries.slice(start, start + MAX_PUSH_BATCH);
            const messages = batch.map(({ reminderIndex, token }) => {
                const reminder = reminders[reminderIndex];
                return {
                    to: token,
                    sound: "default",
                    title: reminder.title,
                    body: reminder.body,
                    data: {
                        url: "/fiado",
                        customerId: reminder.customerId,
                    },
                    channelId: REMINDER_CHANNEL_ID,
                    priority: "high",
                };
            });

            let response: Response;
            try {
                response = await fetch(EXPO_PUSH_URL, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Accept-encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(messages),
                });
            } catch (error) {
                console.error("Não foi possível enviar os avisos de fiado.", error);
                continue;
            }

            if (!response.ok) {
                console.error(
                    "O Expo Push Service recusou os avisos de fiado.",
                    response.status,
                );
                continue;
            }

            let result: ExpoPushResponse;
            try {
                result = (await response.json()) as ExpoPushResponse;
            } catch (error) {
                console.error("Resposta inválida do Expo Push Service.", error);
                continue;
            }

            const tickets = result.data ?? [];
            batch.forEach((entry, index) => {
                const ticket = tickets[index];
                if (!ticket) return;

                if (ticket.status === "ok") {
                    sentReminderIndexes.add(entry.reminderIndex);
                    return;
                }

                if (ticket.details?.error === "DeviceNotRegistered") {
                    invalidTokens.add(entry.token);
                }
            });
        }

        if (invalidTokens.size > 0) {
            await ctx.runMutation(internal.reminders.removePushTokens, {
                tokens: [...invalidTokens],
            });
        }

        const sentCreditIds = new Set<Id<"credits">>();
        for (const reminderIndex of sentReminderIndexes) {
            for (const creditId of reminders[reminderIndex].creditIds) {
                sentCreditIds.add(creditId);
            }
        }

        if (sentCreditIds.size > 0) {
            await ctx.runMutation(internal.reminders.markRemindersSent, {
                creditIds: [...sentCreditIds],
                sentAt: now,
            });
        }

        return null;
    },
});
