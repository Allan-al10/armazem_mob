import { formatDateBR, formatDateTimeBR } from "./date";
import { formatCents } from "./money";
import { formatQuantityWithUnit } from "./quantity";
import { formatCnpj, formatPhone, onlyDigits } from "./validation";
import type { Doc } from "./api";

export type SaleNoteData = {
    store: Doc<"stores">;
    sale: Doc<"sales">;
    items: Doc<"saleItems">[];
    /** Fiado vinculado à venda, quando houver. */
    credit?: Doc<"credits"> | null;
};

export type PaymentMethod = Doc<"sales">["paymentMethod"];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: "Dinheiro",
    card: "Cartão",
    pix: "Pix",
    credit_account: "Fiado",
};

export const saleStatusLabels: Record<Doc<"sales">["status"], string> = {
    completed: "Concluída",
    canceled: "Cancelada",
};

/** Número da nota sempre com 6 dígitos: 1 -> 000001. */
export function formatSaleNumber(number: number): string {
    return Math.round(number).toString().padStart(6, "0");
}

export function paymentMethodLabel(method: PaymentMethod): string {
    return paymentMethodLabels[method];
}

/** Telefone com o código do Brasil para links do WhatsApp. */
export function whatsappPhone(phone: string | undefined): string {
    const digits = onlyDigits(phone ?? "");
    if (!digits) return "";
    if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
        return digits;
    }
    return `55${digits}`;
}

export function buildWhatsAppUrl(phone: string | undefined, text: string): string {
    return `https://wa.me/${whatsappPhone(phone)}?text=${encodeURIComponent(text)}`;
}

/**
 * Link de SMS. No iOS o separador do corpo é "&"; no Android e na web é "?".
 */
export function buildSmsUrl(phone: string | undefined, text: string, separator: "?" | "&" = "?"): string {
    return `sms:${onlyDigits(phone ?? "")}${separator}body=${encodeURIComponent(text)}`;
}

function storeAddress(store: Doc<"stores">): string {
    const address = store.address;
    return `${address.street}, ${address.number} - ${address.district}\n${address.city} - ${address.state}`;
}

/** Texto simples da nota, usado no WhatsApp e no SMS. */
export function buildSaleNoteText({ store, sale, items, credit }: SaleNoteData): string {
    const lines: string[] = [];
    lines.push(`*${store.tradeName.toUpperCase()}*`);
    lines.push(`CNPJ: ${formatCnpj(store.cnpj)}`);
    lines.push(store.ownerName);
    lines.push(`Telefone: ${formatPhone(store.phone)}`);
    lines.push(storeAddress(store));
    lines.push("");
    lines.push(`*NOTA Nº ${formatSaleNumber(sale.number)}*`);
    lines.push(formatDateTimeBR(sale.createdAt));
    lines.push(`Cliente: ${sale.customerName}`);
    lines.push("");
    lines.push("*ITENS*");

    for (const item of items) {
        lines.push(`• ${item.productName}`);
        lines.push(
            `  ${formatQuantityWithUnit(item.quantity, item.unit)} × ${formatCents(
                item.unitPriceCents,
            )} = ${formatCents(item.subtotalCents)}`,
        );
    }

    lines.push("");
    lines.push(`*TOTAL: ${formatCents(sale.totalCents)}*`);
    lines.push(`Pagamento: ${paymentMethodLabel(sale.paymentMethod)}`);
    if (sale.paymentMethod === "credit_account" && credit) {
        lines.push(`Vencimento do fiado: ${formatDateBR(credit.dueDate)}`);
    }

    if (sale.status === "canceled") {
        lines.push("");
        lines.push("*VENDA CANCELADA*");
    }

    lines.push("");
    lines.push("Obrigado pela preferência!");
    lines.push("Comprovante simples, não substitui documento fiscal.");
    return lines.join("\n");
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** HTML da nota, usado para gerar o PDF e para imprimir. */
export function buildSaleNoteHtml({ store, sale, items, credit }: SaleNoteData): string {
    const address = store.address;
    const canceled = sale.status === "canceled";
    const creditLine =
        sale.paymentMethod === "credit_account" && credit
            ? `<p class="payment"><strong>Vencimento do fiado:</strong> ${escapeHtml(
                  formatDateBR(credit.dueDate),
              )}</p>`
            : "";

    const itemRows = items
        .map(
            (item) => `
                <tr>
                    <td>
                        <strong>${escapeHtml(item.productName)}</strong><br />
                        <span class="muted">${escapeHtml(
                            formatQuantityWithUnit(item.quantity, item.unit),
                        )} × ${escapeHtml(formatCents(item.unitPriceCents))}</span>
                    </td>
                    <td class="right">${escapeHtml(formatCents(item.subtotalCents))}</td>
                </tr>`,
        )
        .join("");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nota ${escapeHtml(formatSaleNumber(sale.number))}</title>
<style>
    @page { margin: 14mm; }
    * { box-sizing: border-box; }
    body {
        margin: 0;
        color: #111111;
        background: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 15px;
        line-height: 1.45;
    }
    .page { max-width: 720px; margin: 0 auto; padding: 8px; }
    .store { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; }
    .store h1 { font-size: 24px; margin: 0 0 6px; letter-spacing: 0.5px; }
    .store p { margin: 2px 0; }
    .muted { color: #444; }
    .canceled {
        margin: 14px 0;
        border: 3px solid #A4161A;
        color: #A4161A;
        background: #FDECEA;
        padding: 10px;
        text-align: center;
        font-size: 20px;
        font-weight: 800;
        letter-spacing: 1px;
    }
    .meta { margin-top: 16px; display: flex; justify-content: space-between; gap: 16px; }
    .meta strong { font-size: 19px; }
    .customer { margin-top: 12px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; border-bottom: 2px solid #111; padding: 8px 4px; font-size: 14px; text-transform: uppercase; }
    th.right, td.right { text-align: right; }
    td { border-bottom: 1px solid #bbb; padding: 10px 4px; vertical-align: top; }
    .total {
        margin-top: 18px;
        border-top: 3px solid #111;
        padding-top: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
    }
    .total span { font-size: 17px; font-weight: 700; }
    .total strong { font-size: 28px; }
    .payment { margin-top: 8px; font-size: 17px; }
    .footer { margin-top: 26px; text-align: center; font-size: 13px; color: #333; }
</style>
</head>
<body>
    <main class="page">
        <header class="store">
            <h1>${escapeHtml(store.tradeName)}</h1>
            <p>CNPJ: ${escapeHtml(formatCnpj(store.cnpj))}</p>
            <p>${escapeHtml(store.ownerName)}</p>
            <p>Telefone: ${escapeHtml(formatPhone(store.phone))}</p>
            <p>${escapeHtml(address.street)}, ${escapeHtml(address.number)} - ${escapeHtml(
                address.district,
            )}<br />${escapeHtml(address.city)} - ${escapeHtml(address.state)}</p>
        </header>

        ${canceled ? '<div class="canceled">VENDA CANCELADA</div>' : ""}

        <section class="meta">
            <div>
                <strong>NOTA Nº ${escapeHtml(formatSaleNumber(sale.number))}</strong><br />
                <span class="muted">${escapeHtml(formatDateTimeBR(sale.createdAt))}</span>
            </div>
        </section>

        <p class="customer"><strong>Cliente:</strong> ${escapeHtml(sale.customerName)}</p>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="right">Subtotal</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <div class="total">
            <span>TOTAL</span>
            <strong>${escapeHtml(formatCents(sale.totalCents))}</strong>
        </div>

        <p class="payment"><strong>Pagamento:</strong> ${escapeHtml(
            paymentMethodLabel(sale.paymentMethod),
        )}</p>
        ${creditLine}

        <p class="footer">
            Obrigado pela preferência!<br />
            Comprovante simples, não substitui documento fiscal.
        </p>
    </main>
</body>
</html>`;
}
