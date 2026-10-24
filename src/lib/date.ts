const DAY_MS = 24 * 60 * 60 * 1000;

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

/** Dias inteiros entre hoje e a data alvo (negativo = atrasado). */
export function daysUntil(target: number | Date, from: number | Date = new Date()): number {
    const targetDay = startOfDay(target);
    const fromDay = startOfDay(from);
    return Math.round((targetDay.getTime() - fromDay.getTime()) / DAY_MS);
}

export function isSameDay(a: number | Date, b: number | Date): boolean {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}
