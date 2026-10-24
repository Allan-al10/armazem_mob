import { StyleSheet, Text, View } from "react-native";
import type { Doc } from "@/lib/api";
import { formatDateBR, formatDateTimeBR } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { formatQuantityWithUnit } from "@/lib/quantity";
import { formatSaleNumber, paymentMethodLabel } from "@/lib/sale";
import { formatCnpj, formatPhone } from "@/lib/validation";
import { theme } from "@/theme";

type SaleReceiptProps = {
    store: Doc<"stores">;
    sale: Doc<"sales">;
    items: Doc<"saleItems">[];
    credit?: Doc<"credits"> | null;
};

export function SaleReceipt({ store, sale, items, credit }: SaleReceiptProps) {
    const canceled = sale.status === "canceled";
    const address = store.address;

    return (
        <View style={styles.receipt}>
            {canceled ? (
                <View style={styles.canceledBox} accessibilityRole="alert">
                    <Text style={styles.canceledText}>VENDA CANCELADA</Text>
                </View>
            ) : null}

            <View style={styles.storeHeader}>
                <Text style={styles.storeName}>{store.tradeName}</Text>
                <Text style={styles.storeLine}>CNPJ: {formatCnpj(store.cnpj)}</Text>
                <Text style={styles.storeLine}>{store.ownerName}</Text>
                <Text style={styles.storeLine}>Telefone: {formatPhone(store.phone)}</Text>
                <Text style={[styles.storeLine, styles.center]}>
                    {address.street}, {address.number} - {address.district}
                    {"\n"}
                    {address.city} - {address.state}
                </Text>
            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>NOTA</Text>
                    <Text style={styles.metaValue}>Nº {formatSaleNumber(sale.number)}</Text>
                </View>
                <View style={[styles.metaBlock, styles.metaRight]}>
                    <Text style={styles.metaLabel}>DATA</Text>
                    <Text style={styles.metaDate}>{formatDateTimeBR(sale.createdAt)}</Text>
                </View>
            </View>

            <View style={styles.customerBox}>
                <Text style={styles.customerLabel}>Cliente</Text>
                <Text style={styles.customerName}>{sale.customerName}</Text>
            </View>

            <View style={styles.itemsBox}>
                {items.map((item) => (
                    <View key={item._id} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.productName}</Text>
                            <Text style={styles.itemDetail}>
                                {formatQuantityWithUnit(item.quantity, item.unit)} ×{" "}
                                {formatCents(item.unitPriceCents)}
                            </Text>
                        </View>
                        <Text style={styles.itemSubtotal}>{formatCents(item.subtotalCents)}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>{formatCents(sale.totalCents)}</Text>
            </View>

            <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Pagamento</Text>
                <Text style={styles.paymentValue}>{paymentMethodLabel(sale.paymentMethod)}</Text>
            </View>

            {credit ? (
                <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Vencimento do fiado</Text>
                    <Text style={styles.paymentValue}>{formatDateBR(credit.dueDate)}</Text>
                </View>
            ) : null}

            <Text style={styles.thanks}>Obrigado pela preferência!</Text>
            <Text style={styles.footer}>
                Comprovante simples, não substitui documento fiscal.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    receipt: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
    },
    canceledBox: {
        backgroundColor: theme.colors.dangerSurface,
        borderWidth: 3,
        borderColor: theme.colors.danger,
        borderRadius: theme.radius.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: "center",
    },
    canceledText: {
        fontSize: theme.font.subtitle,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.danger,
        letterSpacing: 1,
    },
    storeHeader: {
        alignItems: "center",
        gap: theme.spacing.xs,
        paddingBottom: theme.spacing.lg,
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.text,
    },
    storeName: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: theme.colors.text,
        textAlign: "center",
    },
    storeLine: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
    center: {
        textAlign: "center",
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: theme.spacing.lg,
    },
    metaBlock: {
        gap: 2,
        flexShrink: 1,
    },
    metaRight: {
        alignItems: "flex-end",
    },
    metaLabel: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    metaValue: {
        fontSize: theme.font.subtitle,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
    },
    metaDate: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        textAlign: "right",
    },
    customerBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    customerLabel: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    customerName: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "700",
        color: theme.colors.text,
    },
    itemsBox: {
        gap: theme.spacing.md,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    itemInfo: {
        flex: 1,
        gap: 2,
    },
    itemName: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    itemDetail: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    itemSubtotal: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.spacing.md,
        borderTopWidth: 3,
        borderTopColor: theme.colors.text,
        paddingTop: theme.spacing.lg,
    },
    totalLabel: {
        fontSize: theme.font.bodyLarge,
        fontWeight: "800",
        color: theme.colors.text,
    },
    totalValue: {
        fontSize: 36,
        lineHeight: 42,
        fontWeight: "800",
        color: theme.colors.text,
        flexShrink: 1,
        textAlign: "right",
    },
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    paymentLabel: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    paymentValue: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    thanks: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
        textAlign: "center",
        marginTop: theme.spacing.sm,
    },
    footer: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
});
