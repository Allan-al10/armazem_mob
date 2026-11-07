import { describe, expect, test } from "vitest";
import {
    calculateItemCostCents,
    calculateSaleCostCents,
    calculateSaleProfitCents,
    summarizeSalesByDay,
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

    test("agrupa vendas por dia e mantém canceladas fora dos valores", () => {
        const firstDay = new Date(2026, 10, 2, 9, 30).getTime();
        const secondDay = new Date(2026, 10, 3, 15, 10).getTime();

        const days = summarizeSalesByDay([
            {
                createdAt: firstDay,
                status: "completed",
                totalCents: 2500,
                costCents: 1000,
            },
            {
                createdAt: firstDay,
                status: "canceled",
                totalCents: 900,
                costCents: 400,
            },
            {
                createdAt: secondDay,
                status: "completed",
                totalCents: 1800,
                costCents: 700,
            },
        ]);

        expect(days).toEqual([
            {
                dayStart: new Date(2026, 10, 3).getTime(),
                salesCount: 1,
                canceledCount: 0,
                totalCents: 1800,
                costCents: 700,
                profitCents: 1100,
            },
            {
                dayStart: new Date(2026, 10, 2).getTime(),
                salesCount: 1,
                canceledCount: 1,
                totalCents: 2500,
                costCents: 1000,
                profitCents: 1500,
            },
        ]);
    });

    test("dia com apenas venda cancelada continua no relatório", () => {
        const [day] = summarizeSalesByDay([
            {
                createdAt: new Date(2026, 10, 4, 12).getTime(),
                status: "canceled",
                totalCents: 5000,
                costCents: 2000,
            },
        ]);

        expect(day).toMatchObject({
            salesCount: 0,
            canceledCount: 1,
            totalCents: 0,
            costCents: 0,
            profitCents: 0,
        });
    });
});
