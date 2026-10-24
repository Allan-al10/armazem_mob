import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
    addressValidator,
    creditPaymentMethodValidator,
    creditStatusValidator,
    productUnitValidator,
    salePaymentMethodValidator,
    saleStatusValidator,
    stockMovementTypeValidator,
} from "./validators";

export default defineSchema({
    ...authTables,

    // Tabela de usuários do Convex Auth com os campos que o cadastro usa.
    users: defineTable({
        name: v.optional(v.string()),
        image: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()),
        phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
    })
        .index("email", ["email"])
        .index("phone", ["phone"]),

    stores: defineTable({
        ownerId: v.id("users"),
        tradeName: v.string(),
        cnpj: v.string(),
        ownerName: v.string(),
        phone: v.string(),
        address: addressValidator,
        // Próximo número sequencial de venda. Opcional para lojas criadas antes da Fase 3.
        nextSaleNumber: v.optional(v.number()),
    })
        .index("by_owner", ["ownerId"])
        .index("by_cnpj", ["cnpj"]),

    // Produtos do estoque. Quantidades podem ser decimais apenas para kg.
    products: defineTable({
        storeId: v.id("stores"),
        name: v.string(),
        // Nome normalizado (minúsculas, sem acentos) para busca e evitar duplicados.
        nameQuery: v.string(),
        unit: productUnitValidator,
        stockQty: v.number(),
        lastUnitCostCents: v.number(),
        salePriceCents: v.number(),
        lowStockThreshold: v.number(),
        active: v.boolean(),
    })
        .index("by_store", ["storeId"])
        .index("by_store_and_nameQuery", ["storeId", "nameQuery"]),

    // Clientes da loja. O telefone é opcional, mas é necessário para enviar a nota.
    customers: defineTable({
        storeId: v.id("stores"),
        name: v.string(),
        // Nome normalizado para sugestões e para evitar cadastros repetidos.
        nameQuery: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
    })
        .index("by_store", ["storeId"])
        .index("by_store_and_nameQuery", ["storeId", "nameQuery"]),

    // Venda com os dados do cliente copiados no momento (snapshot para a nota).
    sales: defineTable({
        storeId: v.id("stores"),
        customerId: v.id("customers"),
        number: v.number(),
        customerName: v.string(),
        customerPhone: v.optional(v.string()),
        // Valor total em centavos inteiros.
        totalCents: v.number(),
        paymentMethod: salePaymentMethodValidator,
        status: saleStatusValidator,
        createdAt: v.number(),
        canceledAt: v.optional(v.number()),
    })
        .index("by_store", ["storeId"])
        .index("by_store_and_createdAt", ["storeId", "createdAt"])
        .index("by_customer", ["customerId"]),

    // Itens da venda com nome, unidade e preços copiados do produto.
    saleItems: defineTable({
        saleId: v.id("sales"),
        productId: v.id("products"),
        productName: v.string(),
        unit: productUnitValidator,
        quantity: v.number(),
        unitPriceCents: v.number(),
        unitCostCents: v.number(),
        subtotalCents: v.number(),
    })
        .index("by_sale", ["saleId"]),

    // Fiado de uma venda. O saldo devedor é totalCents - paidCents.
    credits: defineTable({
        storeId: v.id("stores"),
        saleId: v.id("sales"),
        customerId: v.id("customers"),
        // Dados copiados no momento do fiado para a cobrança e para o histórico.
        customerName: v.string(),
        phone: v.string(),
        address: v.string(),
        totalCents: v.number(),
        paidCents: v.number(),
        // Data combinada para pagamento, em timestamp (início do dia local).
        dueDate: v.number(),
        status: creditStatusValidator,
        note: v.optional(v.string()),
        createdAt: v.number(),
        paidAt: v.optional(v.number()),
        // Reservado para o cron de avisos da Fase 5.
        lastReminderAt: v.optional(v.number()),
    })
        .index("by_store", ["storeId"])
        .index("by_store_and_dueDate", ["storeId", "dueDate"])
        .index("by_customer", ["customerId"])
        .index("by_sale", ["saleId"]),

    // Cada pagamento recebido de um fiado (permite pagamentos parciais).
    creditPayments: defineTable({
        creditId: v.id("credits"),
        amountCents: v.number(),
        method: creditPaymentMethodValidator,
        paidAt: v.number(),
    }).index("by_credit", ["creditId"]),

    // Cada lote que chegou (o histórico de compras do produto).
    stockEntries: defineTable({
        storeId: v.id("stores"),
        productId: v.id("products"),
        quantity: v.number(),
        boxTotalCostCents: v.number(),
        unitCostCents: v.number(),
        salePriceCents: v.number(),
        arrivedAt: v.number(),
        supplier: v.optional(v.string()),
    })
        .index("by_store", ["storeId"])
        .index("by_product", ["productId"]),

    // Livro-caixa do estoque: entradas, saídas (vendas) e ajustes.
    stockMovements: defineTable({
        storeId: v.id("stores"),
        productId: v.id("products"),
        type: stockMovementTypeValidator,
        // Positivo soma ao estoque; negativo subtrai.
        quantity: v.number(),
        balanceAfter: v.number(),
        reason: v.optional(v.string()),
        // Quando o movimento nasceu de uma venda, guarda o id dela.
        refId: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_store", ["storeId"])
        .index("by_product", ["productId"]),
});
