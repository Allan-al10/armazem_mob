import { describe, expect, test } from "vitest";
import {
    addMonths,
    formatMonthYearBR,
    isSameMonth,
    startOfMonth,
} from "./date";

describe("datas do registro mensal", () => {
    test("startOfMonth volta para o dia 1 à meia-noite", () => {
        const result = startOfMonth(new Date(2026, 6, 27, 15, 45, 12, 300));

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(6);
        expect(result.getDate()).toBe(1);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
    });

    test("addMonths atravessa o ano sem pular meses", () => {
        const december = new Date(2026, 11, 31, 23, 0, 0);
        const january = addMonths(december, 1);
        const previous = addMonths(january, -2);

        expect(formatMonthYearBR(january)).toBe("Janeiro de 2027");
        expect(formatMonthYearBR(previous)).toBe("Novembro de 2026");
    });

    test("isSameMonth compara ano e mês", () => {
        expect(isSameMonth(new Date(2026, 6, 1), new Date(2026, 6, 31))).toBe(true);
        expect(isSameMonth(new Date(2026, 6, 1), new Date(2025, 6, 1))).toBe(false);
        expect(isSameMonth(new Date(2026, 6, 1), new Date(2026, 7, 1))).toBe(false);
    });
});
