import { v } from "convex/values";

export const addressValidator = v.object({
    street: v.string(),
    number: v.string(),
    district: v.string(),
    city: v.string(),
    state: v.string(),
});

/** Unidades aceitas no cadastro de produtos. */
export const productUnitValidator = v.union(
    v.literal("unidade"),
    v.literal("kg"),
    v.literal("pacote"),
);

/**
 * Tipos de movimento de estoque.
 * `entrada` soma, `saida` subtrai, `ajuste` corrige e `cancelamento` devolve itens de uma venda.
 */
export const stockMovementTypeValidator = v.union(
    v.literal("entrada"),
    v.literal("saida"),
    v.literal("ajuste"),
    v.literal("cancelamento"),
);

/** Formas de pagamento da venda. Fiado é usado na Fase 4. */
export const salePaymentMethodValidator = v.union(
    v.literal("cash"),
    v.literal("card"),
    v.literal("pix"),
    v.literal("credit_account"),
);

/** Situação da venda. */
export const saleStatusValidator = v.union(
    v.literal("completed"),
    v.literal("canceled"),
);

/**
 * Situação do fiado.
 * `overdue` será gravado pelo cron da Fase 5; na Fase 4 o atraso também é
 * calculado pela data de vencimento para aparecer na hora.
 */
export const creditStatusValidator = v.union(
    v.literal("open"),
    v.literal("paid"),
    v.literal("overdue"),
);

/** Formas de pagamento aceitas para quitar um fiado. */
export const creditPaymentMethodValidator = v.union(
    v.literal("cash"),
    v.literal("card"),
    v.literal("pix"),
);
