import { describe, expect, test } from "vitest";
import {
    calculateItemCostCents,
    calculateSaleCostCents,
    calculateSaleProfitCents,
    summarizeSalesReport,
} from "./salesReport";

const items = [
    { quantity: 3, unitCostCents: 600 },
    { quantity: 0.5, unitCostCents: 650 },
];

describe("cálculos do registro de vendas", () => {
    test("calcula o custo por item e por venda", () => {
        expect(calculateItemCostCents(items[0])).toBe(1800);
        expect(calculateItemCostCents(items[1])).toBe(325);
        expect(calculateSaleCostCents(items)).toBe(2125);
        expect(calculateSaleProfitCents(2875, items)).toBe(750);
    });

    test("arredonda o custo de quantidades fracionadas", () => {
        expect(calculateItemCostCents({ quantity: 2.5, unitCostCents: 333 })).toBe(833);
    });

    test("soma o resumo e mantém vendas canceladas fora do financeiro", () => {
        const summary = summarizeSalesReport([
            { status: "completed", totalCents: 2875, items },
            {
                status: "completed",
                totalCents: 900,
                items: [{ quantity: 1, unitCostCents: 400 }],
            },
            {
                status: "canceled",
                totalCents: 5000,
                items: [{ quantity: 5, unitCostCents: 900 }],
            },
        ]);

        expect(summary).toEqual({
            salesCount: 2,
            canceledCount: 1,
            totalCents: 3775,
            costCents: 2525,
            profitCents: 1250,
        });
    });

    test("período sem vendas fica zerado", () => {
        expect(summarizeSalesReport([])).toEqual({
            salesCount: 0,
            canceledCount: 0,
            totalCents: 0,
            costCents: 0,
            profitCents: 0,
        });
    });
});
