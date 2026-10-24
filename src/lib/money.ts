/**
 * Dinheiro é sempre tratado em centavos (inteiros).
 * Nenhuma função deste arquivo usa float para armazenar valores.
 */

function groupThousands(value: string): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formata centavos como moeda brasileira: 123456 -> "R$ 1.234,56" */
export function formatCents(cents: number): string {
    const safe = Number.isFinite(cents) ? Math.round(cents) : 0;
    const negative = safe < 0;
    const absolute = Math.abs(safe);
    const reais = Math.floor(absolute / 100).toString();
    const centavos = (absolute % 100).toString().padStart(2, "0");
    return `${negative ? "-" : ""}R$ ${groupThousands(reais)},${centavos}`;
}

/** Formata centavos para edição, sem o "R$": 123456 -> "1.234,56" */
export function centsToInput(cents: number): string {
    const safe = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
    const reais = Math.floor(safe / 100).toString();
    const centavos = (safe % 100).toString().padStart(2, "0");
    return `${groupThousands(reais)},${centavos}`;
}

/**
 * Converte texto digitado em centavos.
 * Aceita "1.234,56", "1234,56", "1234", "12.34" e "".
 */
export function parseMoneyToCents(value: string): number {
    const cleaned = value.replace(/[^\d,.-]/g, "").trim();
    if (!cleaned) return 0;

    const negative = cleaned.startsWith("-");
    const unsigned = cleaned.replace(/-/g, "");

    let normalized = unsigned;
    if (unsigned.includes(",")) {
        normalized = unsigned.replace(/\./g, "").replace(",", ".");
    } else {
        const lastDot = unsigned.lastIndexOf(".");
        const decimals = lastDot === -1 ? 0 : unsigned.length - lastDot - 1;
        normalized = lastDot !== -1 && decimals >= 1 && decimals <= 2
            ? unsigned
            : unsigned.replace(/\./g, "");
    }

    const number = Number(normalized);
    if (!Number.isFinite(number)) return 0;
    return (negative ? -1 : 1) * Math.round(number * 100);
}

/** Custo unitário em centavos: valor da caixa dividido pela quantidade. */
export function calculateUnitCostCents(boxTotalCents: number, quantity: number): number {
    if (!Number.isFinite(boxTotalCents) || !Number.isFinite(quantity) || quantity <= 0) {
        return 0;
    }
    return Math.round(boxTotalCents / quantity);
}

/**
 * Lucro por unidade e margem sobre o custo.
 * Ex.: custo 400, venda 520 -> lucro 120 e margem 30%.
 */
export function calculateProfit(salePriceCents: number, unitCostCents: number): {
    profitCents: number;
    marginPercent: number;
} {
    const profitCents = Math.round(salePriceCents - unitCostCents);
    const marginPercent = unitCostCents > 0
        ? Math.round((profitCents / unitCostCents) * 100)
        : 0;
    return { profitCents, marginPercent };
}

/** Troco em centavos. Nunca negativo. */
export function calculateChangeCents(receivedCents: number, totalCents: number): number {
    return Math.max(0, Math.round(receivedCents - totalCents));
}

/** Soma os subtotais de uma venda (quantidade × preço unitário). */
export function calculateTotalCents(
    items: readonly { quantity: number; unitPriceCents: number }[],
): number {
    return items.reduce(
        (total, item) => total + Math.round(item.quantity * item.unitPriceCents),
        0,
    );
}
