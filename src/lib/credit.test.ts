import { describe, expect, test } from "vitest";
import {
    buildCreditReminderText,
    creditBalanceCents,
    creditDueLabel,
    creditDueTone,
    isCreditOpen,
} from "./credit";
import { addDays, formatDateBR, startOfDay } from "./date";

describe("creditBalanceCents", () => {
    test("desconta os pagamentos do total", () => {
        expect(creditBalanceCents({ totalCents: 10000, paidCents: 2500 })).toBe(7500);
        expect(creditBalanceCents({ totalCents: 10000, paidCents: 10000 })).toBe(0);
    });

    test("nunca devolve saldo negativo", () => {
        expect(creditBalanceCents({ totalCents: 10000, paidCents: 12000 })).toBe(0);
    });
});

describe("isCreditOpen", () => {
    test("considera aberto enquanto houver saldo", () => {
        expect(
            isCreditOpen({ status: "open", totalCents: 10000, paidCents: 0 }),
        ).toBe(true);
        expect(
            isCreditOpen({ status: "overdue", totalCents: 10000, paidCents: 0 }),
        ).toBe(true);
        expect(
            isCreditOpen({ status: "open", totalCents: 10000, paidCents: 10000 }),
        ).toBe(false);
        expect(
            isCreditOpen({ status: "paid", totalCents: 10000, paidCents: 10000 }),
        ).toBe(false);
    });
});

describe("etiquetas de vencimento", () => {
    test("define o tom visual do prazo", () => {
        expect(creditDueTone(-1)).toBe("danger");
        expect(creditDueTone(0)).toBe("warning");
        expect(creditDueTone(3)).toBe("warning");
        expect(creditDueTone(4)).toBe("ok");
    });

    test("escreve o prazo em português", () => {
        expect(creditDueLabel(-5)).toBe("Atrasado há 5 dias");
        expect(creditDueLabel(-1)).toBe("Atrasado há 1 dia");
        expect(creditDueLabel(0)).toBe("Vence hoje");
        expect(creditDueLabel(1)).toBe("Vence amanhã");
        expect(creditDueLabel(3)).toBe("Vence em 3 dias");
        expect(creditDueLabel(4)).toBe("Em dia");
    });
});

describe("buildCreditReminderText", () => {
    test("monta uma mensagem educada com saldo e vencimento", () => {
        const dueDate = startOfDay(addDays(new Date(), 5)).getTime();
        const text = buildCreditReminderText({
            customerName: "Maria Souza",
            balanceCents: 8500,
            dueDate,
        });

        expect(text).toContain("Olá, Maria!");
        expect(text).toContain("R$ 85,00");
        expect(text).toContain(`vence em ${formatDateBR(dueDate)}`);
        expect(text).toContain("Obrigado!");
    });

    test("usa 'vence hoje' quando o vencimento é hoje", () => {
        const text = buildCreditReminderText({
            customerName: "José",
            balanceCents: 1000,
            dueDate: startOfDay().getTime(),
        });

        expect(text).toContain("vence hoje");
    });
});
