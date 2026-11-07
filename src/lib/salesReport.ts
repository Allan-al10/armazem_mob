/**
 * Cálculos do registro de vendas. O custo de cada item é o custo guardado no
 * momento da venda, não o custo atual do produto.
 */

export type ReportItemInput = {
    quantity: number;
    unitCostCents: number;
};

export type ReportSaleInput = {
    status: "completed" | "canceled";
    totalCents: number;
    items: readonly ReportItemInput[];
};

export type ReportSummary = {
    salesCount: number;
    canceledCount: number;
    totalCents: number;
    costCents: number;
    profitCents: number;
};

/** Custo do item: quantidade × custo unitário da época da venda. */
export function calculateItemCostCents(item: ReportItemInput): number {
    return Math.round(item.quantity * item.unitCostCents);
}

export function calculateSaleCostCents(items: readonly ReportItemInput[]): number {
    return items.reduce((total, item) => total + calculateItemCostCents(item), 0);
}

export function calculateSaleProfitCents(
    totalCents: number,
    items: readonly ReportItemInput[],
): number {
    return Math.round(totalCents) - calculateSaleCostCents(items);
}

/**
 * Resumo financeiro de um período. Vendas canceladas aparecem na contagem
 * separada, mas não entram em total, custo ou lucro.
 */
export function summarizeSalesReport(sales: readonly ReportSaleInput[]): ReportSummary {
    let salesCount = 0;
    let canceledCount = 0;
    let totalCents = 0;
    let costCents = 0;

    for (const sale of sales) {
        if (sale.status !== "completed") {
            canceledCount += 1;
            continue;
        }

        salesCount += 1;
        totalCents += Math.round(sale.totalCents);
        costCents += calculateSaleCostCents(sale.items);
    }

    return {
        salesCount,
        canceledCount,
        totalCents,
        costCents,
        profitCents: totalCents - costCents,
    };
}
