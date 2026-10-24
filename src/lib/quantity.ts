import type { ProductUnit } from "./types";

export const unitLabels: Record<ProductUnit, string> = {
    unidade: "Unidade",
    kg: "Quilo (kg)",
    pacote: "Pacote",
};

const unitNames: Record<ProductUnit, { singular: string; plural: string }> = {
    unidade: { singular: "unidade", plural: "unidades" },
    kg: { singular: "kg", plural: "kg" },
    pacote: { singular: "pacote", plural: "pacotes" },
};

/** Formata quantidade com até 3 casas decimais: 1.5 -> "1,5"; 10 -> "10". */
export function formatQuantity(value: number): string {
    if (!Number.isFinite(value)) return "0";
    const rounded = Math.round(value * 1000) / 1000;
    return rounded.toFixed(3).replace(".", ",").replace(/,?0+$/, "");
}

/** Nome da unidade no singular ou plural: 1 -> "unidade", 10 -> "unidades", 1,5 -> "kg". */
export function unitName(value: number, unit: ProductUnit): string {
    const rounded = Math.round(value * 1000) / 1000;
    const names = unitNames[unit];
    return rounded === 1 ? names.singular : names.plural;
}

/** Ex.: 10 unidades, 1,5 kg, 1 pacote. */
export function formatQuantityWithUnit(value: number, unit: ProductUnit): string {
    return `${formatQuantity(value)} ${unitName(value, unit)}`;
}

/** Converte texto em quantidade. Aceita "1,5" e "1.5". Retorna NaN se inválido. */
export function parseQuantity(value: string): number {
    const cleaned = value.replace(/[^\d,.]/g, "").trim();
    if (!cleaned) return Number.NaN;

    let normalized = cleaned;
    if (cleaned.includes(",")) {
        normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (cleaned.split(".").length > 2) {
        normalized = cleaned.replace(/\./g, "");
    }

    const number = Number(normalized);
    return Number.isFinite(number) ? number : Number.NaN;
}

function hasAtMostThreeDecimals(value: number): boolean {
    return Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6;
}

/** Quantidade que chegou: precisa ser maior que zero. Decimal só para kg. */
export function isValidQuantityForUnit(value: number, unit: ProductUnit): boolean {
    if (!Number.isFinite(value) || value <= 0) return false;
    if (unit === "kg") return hasAtMostThreeDecimals(value);
    return Number.isInteger(value);
}

/** Quantidade contada no ajuste: pode ser zero. Decimal só para kg. */
export function isValidStockLevel(value: number, unit: ProductUnit): boolean {
    if (!Number.isFinite(value) || value < 0) return false;
    if (unit === "kg") return hasAtMostThreeDecimals(value);
    return Number.isInteger(value);
}
