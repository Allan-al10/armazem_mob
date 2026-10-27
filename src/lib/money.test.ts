import { describe, expect, test } from "vitest";
import {
    calculateChangeCents,
    calculateProfit,
    calculateTotalCents,
    calculateUnitCostCents,
    centsToInput,
    formatCents,
    parseMoneyToCents,
} from "./money";

describe("formatCents", () => {
    test("formata reais e centavos com separadores brasileiros", () => {
        expect(formatCents(123456)).toBe("R$ 1.234,56");
        expect(formatCents(5)).toBe("R$ 0,05");
        expect(formatCents(0)).toBe("R$ 0,00");
        expect(formatCents(-123456)).toBe("-R$ 1.234,56");
    });

    test("arredonda centavos e trata valores inválidos", () => {
        expect(formatCents(1234.6)).toBe("R$ 12,35");
        expect(formatCents(Number.NaN)).toBe("R$ 0,00");
        expect(formatCents(Number.POSITIVE_INFINITY)).toBe("R$ 0,00");
    });
});

describe("centsToInput", () => {
    test("mostra o valor sem o R$ e sem valores negativos", () => {
        expect(centsToInput(123456)).toBe("1.234,56");
        expect(centsToInput(-500)).toBe("0,00");
    });
});

describe("parseMoneyToCents", () => {
    test("aceita os formatos digitados no app", () => {
        expect(parseMoneyToCents("1.234,56")).toBe(123456);
        expect(parseMoneyToCents("1234,56")).toBe(123456);
        expect(parseMoneyToCents("1234")).toBe(123400);
        expect(parseMoneyToCents("12.34")).toBe(1234);
        expect(parseMoneyToCents("R$ 8,90")).toBe(890);
    });

    test("trata campo vazio e texto sem número", () => {
        expect(parseMoneyToCents("")).toBe(0);
        expect(parseMoneyToCents("abc")).toBe(0);
    });
});

describe("calculateUnitCostCents", () => {
    test("divide o valor da caixa pela quantidade e arredonda", () => {
        expect(calculateUnitCostCents(1000, 3)).toBe(333);
        expect(calculateUnitCostCents(1000, 4)).toBe(250);
        expect(calculateUnitCostCents(1999, 1.5)).toBe(1333);
    });

    test("devolve zero para quantidade inválida", () => {
        expect(calculateUnitCostCents(1000, 0)).toBe(0);
        expect(calculateUnitCostCents(1000, -1)).toBe(0);
        expect(calculateUnitCostCents(Number.NaN, 2)).toBe(0);
    });
});

describe("calculateProfit", () => {
    test("calcula lucro e margem sobre o custo", () => {
        expect(calculateProfit(520, 400)).toEqual({
            profitCents: 120,
            marginPercent: 30,
        });
    });

    test("calcula prejuízo e evita divisão por zero", () => {
        expect(calculateProfit(300, 400)).toEqual({
            profitCents: -100,
            marginPercent: -25,
        });
        expect(calculateProfit(300, 0)).toEqual({
            profitCents: 300,
            marginPercent: 0,
        });
    });
});

describe("calculateChangeCents", () => {
    test("calcula o troco e nunca devolve valor negativo", () => {
        expect(calculateChangeCents(5000, 3500)).toBe(1500);
        expect(calculateChangeCents(3500, 3500)).toBe(0);
        expect(calculateChangeCents(1000, 3500)).toBe(0);
    });
});

describe("calculateTotalCents", () => {
    test("soma os subtotais com quantidade fracionada", () => {
        expect(
            calculateTotalCents([
                { quantity: 2, unitPriceCents: 150 },
                { quantity: 1.5, unitPriceCents: 1000 },
            ]),
        ).toBe(1800);
    });

    test("devolve zero para uma venda sem itens", () => {
        expect(calculateTotalCents([])).toBe(0);
    });
});
