const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
] as const;

function pad(value: number): string {
    return value.toString().padStart(2, "0");
}

/** Data no formato dd/mm/aaaa. */
export function formatDateBR(value: number | Date): string {
    const date = typeof value === "number" ? new Date(value) : value;
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Data e hora no formato dd/mm/aaaa às hh:mm. */
export function formatDateTimeBR(value: number | Date): string {
    const date = typeof value === "number" ? new Date(value) : value;
    return `${formatDateBR(date)} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function startOfDay(value: number | Date = new Date()): Date {
    const date = typeof value === "number" ? new Date(value) : new Date(value.getTime());
    date.setHours(0, 0, 0, 0);
    return date;
}

export function addDays(value: number | Date, days: number): Date {
    const date = typeof value === "number" ? new Date(value) : new Date(value.getTime());
    date.setDate(date.getDate() + days);
    return date;
}

export function startOfMonth(value: number | Date = new Date()): Date {
    const date = typeof value === "number" ? new Date(value) : new Date(value.getTime());
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
}

/** Muda de mês mantendo o dia 1 para evitar pulos em meses mais curtos. */
export function addMonths(value: number | Date, months: number): Date {
    const date = startOfMonth(value);
    date.setMonth(date.getMonth() + months);
    return date;
}

export function isSameMonth(a: number | Date, b: number | Date): boolean {
    const first = typeof a === "number" ? new Date(a) : a;
    const second = typeof b === "number" ? new Date(b) : b;
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth()
    );
}

/** Ex.: 1751328000000 -> "Julho de 2026" (mês local do aparelho). */
export function formatMonthYearBR(value: number | Date): string {
    const date = typeof value === "number" ? new Date(value) : value;
    const name = MONTH_NAMES[date.getMonth()];
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${date.getFullYear()}`;
}

/** Dias inteiros entre hoje e a data alvo (negativo = atrasado). */
export function daysUntil(target: number | Date, from: number | Date = new Date()): number {
    const targetDay = startOfDay(target);
    const fromDay = startOfDay(from);
    return Math.round((targetDay.getTime() - fromDay.getTime()) / DAY_MS);
}

export function isSameDay(a: number | Date, b: number | Date): boolean {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}
