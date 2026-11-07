import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Doc } from "@/lib/api";
import { formatDateTimeBR } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { formatQuantity } from "@/lib/quantity";
import { formatSaleNumber, paymentMethodLabel } from "@/lib/sale";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type SaleNoteTableProps = {
    sale: Doc<"sales">;
    items: readonly Doc<"saleItems">[];
    onOpen: () => void;
};

const unitShort: Record<Doc<"saleItems">["unit"], string> = {
    unidade: "un",
    kg: "kg",
    pacote: "pct",
};

/** Cada nota é exibida como uma tabela separada, com seus itens e total. */
export function SaleNoteTable({ sale, items, onOpen }: SaleNoteTableProps) {
    const { colors } = useAppTheme();
    const canceled = sale.status === "canceled";
    const totalColor = canceled ? colors.danger : colors.text;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: canceled ? colors.danger : colors.border,
                },
            ]}
        >
            <View style={styles.headerRow}>
                <View style={styles.headerInfo}>
                    <Text style={[styles.noteNumber, { color: colors.textMuted }]}>
                        Nota nº {formatSaleNumber(sale.number)}
                    </Text>
                    <Text style={[styles.noteDate, { color: colors.text }]}>
                        {formatDateTimeBR(sale.createdAt)}
                    </Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor: canceled ? colors.dangerBg : colors.successBg,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            { color: canceled ? colors.danger : colors.success },
                        ]}
                    >
                        {canceled ? "CANCELADA" : "CONCLUÍDA"}
                    </Text>
                </View>
            </View>

            <Text style={[styles.customer, { color: colors.text }]}>
                {sale.customerName}
            </Text>

            <View style={[styles.table, { borderColor: colors.border }]}>
                <View
                    style={[
                        styles.tableHeader,
                        {
                            backgroundColor: colors.surfaceStrong,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.headerCell,
                            styles.itemCell,
                            { color: colors.text },
                        ]}
                    >
                        Item
                    </Text>
                    <Text
                        style={[
                            styles.headerCell,
                            styles.qtyCell,
                            { color: colors.text },
                        ]}
                    >
                        Qtd
                    </Text>
                    <Text
                        style={[
                            styles.headerCell,
                            styles.valueCell,
                            { color: colors.text },
                        ]}
                    >
                        Subtotal
                    </Text>
                </View>

                {items.length === 0 ? (
                    <Text style={[styles.emptyItems, { color: colors.textMuted }]}>
                        Itens não encontrados para esta nota.
                    </Text>
                ) : (
                    items.map((item, index) => (
                        <View
                            key={item._id}
                            style={[
                                styles.tableRow,
                                index > 0
                                    ? {
                                          borderTopWidth: 1,
                                          borderTopColor: colors.border,
                                      }
                                    : null,
                            ]}
                        >
                            <View style={styles.itemCell}>
                                <Text
                                    numberOfLines={2}
                                    style={[styles.itemName, { color: colors.text }]}
                                >
                                    {item.productName}
                                </Text>
                                <Text
                                    style={[
                                        styles.itemPrice,
                                        { color: colors.textMuted },
                                    ]}
                                >
                                    {formatCents(item.unitPriceCents)}
                                    {item.unit === "kg" ? "/kg" : " cada"}
                                </Text>
                            </View>
                            <Text
                                style={[styles.qtyText, { color: colors.text }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {formatQuantity(item.quantity)}{" "}
                                {unitShort[item.unit]}
                            </Text>
                            <Text
                                style={[styles.subtotal, { color: colors.text }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {formatCents(item.subtotalCents)}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
                <View style={styles.paymentBlock}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                        Pagamento
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {paymentMethodLabel(sale.paymentMethod)}
                    </Text>
                </View>
                <View style={styles.totalBlock}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                        Total
                    </Text>
                    <Text
                        style={[
                            styles.totalValue,
                            {
                                color: totalColor,
                                textDecorationLine: canceled ? "line-through" : "none",
                            },
                        ]}
                    >
                        {formatCents(sale.totalCents)}
                    </Text>
                </View>
            </View>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir nota ${formatSaleNumber(sale.number)} completa`}
                accessibilityHint="Abre a nota para enviar, imprimir ou cancelar."
                onPress={onOpen}
                style={({ pressed }) => [
                    styles.openButton,
                    { borderTopColor: colors.border },
                    pressed ? styles.pressed : null,
                ]}
            >
                <Text style={[styles.openText, { color: colors.primaryInk }]}>
                    Abrir nota completa
                </Text>
                <Text style={[styles.openArrow, { color: colors.primaryInk }]}>›</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
    },
    headerInfo: {
        flex: 1,
        gap: 2,
    },
    noteNumber: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    noteDate: {
        fontSize: 17,
        lineHeight: 24,
        fontWeight: "700",
    },
    statusBadge: {
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
    },
    statusText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
    customer: {
        fontSize: 17,
        lineHeight: 24,
        fontWeight: "700",
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
    },
    table: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    tableHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
    },
    headerCell: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 56,
    },
    itemCell: {
        flex: 1,
    },
    qtyCell: {
        width: 58,
        textAlign: "center",
    },
    valueCell: {
        width: 92,
        textAlign: "right",
    },
    itemName: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: "700",
    },
    itemPrice: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "400",
    },
    qtyText: {
        width: 58,
        textAlign: "center",
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "700",
    },
    subtotal: {
        width: 92,
        textAlign: "right",
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "700",
    },
    emptyItems: {
        fontSize: 15,
        lineHeight: 21,
        padding: theme.spacing.md,
        textAlign: "center",
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        borderTopWidth: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    paymentBlock: {
        flex: 1,
        gap: 2,
    },
    totalBlock: {
        alignItems: "flex-end",
        gap: 2,
    },
    summaryLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    summaryValue: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "700",
    },
    totalValue: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "700",
    },
    openButton: {
        minHeight: theme.touch.min,
        borderTopWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.lg,
    },
    openText: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "700",
    },
    openArrow: {
        fontSize: 22,
        lineHeight: 24,
        fontWeight: "700",
    },
    pressed: {
        opacity: 0.7,
    },
});
