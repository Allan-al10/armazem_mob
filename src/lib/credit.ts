import type { Doc } from "./api";
import { daysUntil, formatDateBR } from "./date";
import { formatCents } from "./money";

export type Credit = Doc<"credits">;
export type CreditPayment = Doc<"creditPayments">;
export type CreditPaymentMethod = CreditPayment["method"];

export const creditPaymentMethodLabels: Record<CreditPaymentMethod, string> = {
    cash: "Dinheiro",
    card: "Cartão",
    pix: "Pix",
};

/** Saldo devedor em centavos, nunca negativo. */
export function creditBalanceCents(
    credit: Pick<Credit, "totalCents" | "paidCents">,
): number {
    return Math.max(0, Math.round(credit.totalCents - credit.paidCents));
}

/** Um fiado continua em aberto enquanto não foi quitado. */
export function isCreditOpen(
    credit: Pick<Credit, "status" | "totalCents" | "paidCents">,
): boolean {
    return credit.status !== "paid" && creditBalanceCents(credit) > 0;
}

export type CreditDueTone = "danger" | "warning" | "ok";

export function creditDueTone(days: number): CreditDueTone {
    if (days < 0) return "danger";
    if (days <= 3) return "warning";
    return "ok";
}

/** Etiqueta em texto do vencimento: "Vence hoje", "Atrasado há 5 dias"... */
export function creditDueLabel(days: number): string {
    if (days < 0) {
        const late = Math.abs(days);
        return `Atrasado há ${late} ${late === 1 ? "dia" : "dias"}`;
    }
    if (days === 0) return "Vence hoje";
    if (days === 1) return "Vence amanhã";
    if (days <= 3) return `Vence em ${days} dias`;
    return "Em dia";
}

/** Mensagem educada e pronta para cobrar no WhatsApp. */
export function buildCreditReminderText({
    customerName,
    balanceCents,
    dueDate,
}: {
    customerName: string;
    balanceCents: number;
    dueDate: number;
}): string {
    const firstName = customerName.trim().split(/\s+/)[0] || customerName;
    const days = daysUntil(dueDate);
    const when =
        days < 0
            ? `venceu em ${formatDateBR(dueDate)}`
            : days === 0
              ? "vence hoje"
              : `vence em ${formatDateBR(dueDate)}`;

    return `Olá, ${firstName}! Tudo bem? Passando para lembrar do fiado de ${formatCents(
        balanceCents,
    )}, que ${when}. Quando puder, podemos acertar. Obrigado!`;
}
