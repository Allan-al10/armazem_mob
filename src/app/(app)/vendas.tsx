import { useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SummaryCard } from "@/components/SummaryCard";
import { api } from "@/lib/api";
import { addDays, formatDateTimeBR, startOfDay } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { formatSaleNumber, paymentMethodLabel } from "@/lib/sale";
import { theme } from "@/theme";

export default function SalesScreen() {
    const dayStart = startOfDay();
    const summary = useQuery(api.dashboard.summary, {
        from: dayStart.getTime(),
        to: addDays(dayStart, 1).getTime(),
    });
    const sales = useQuery(api.sales.listRecent, { limit: 30 });

    if (summary === undefined || sales === undefined) {
        return <LoadingScreen />;
    }

    return (
        <>
            <ScreenHeader
                title="Vendas"
                subtitle="Últimas vendas feitas na loja"
                helpKey="vendas"
                showBack
            />
            <Screen>
                <SummaryCard
                    icon="🧾"
                    title="Vendas de hoje"
                    value={formatCents(summary.salesTotalCents)}
                    hint={
                        summary.salesCount === 0
                            ? "Nenhuma venda registrada hoje"
                            : `${summary.salesCount} venda${
                                  summary.salesCount === 1 ? "" : "s"
                              } hoje`
                    }
                />

                <BigButton
                    label="Nova venda"
                    description="Registrar uma venda e preparar a nota"
                    icon="🧾"
                    onPress={() => router.push("/vender")}
                />

                <Text style={styles.sectionTitle}>Vendas recentes</Text>

                {sales.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon} accessibilityElementsHidden>
                            🧾
                        </Text>
                        <Text style={styles.emptyTitle}>Nenhuma venda registrada ainda</Text>
                        <Text style={styles.emptyText}>
                            Toque em Nova venda para registrar a primeira venda da loja.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {sales.map((sale) => {
                            const canceled = sale.status === "canceled";
                            return (
                                <Pressable
                                    key={sale._id}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/nota/[id]",
                                            params: { id: sale._id },
                                        })
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel={`Nota ${formatSaleNumber(
                                        sale.number,
                                    )}, cliente ${sale.customerName}, ${formatCents(
                                        sale.totalCents,
                                    )}, ${canceled ? "cancelada" : "concluída"}. Toque para abrir.`}
                                    style={({ pressed }) => [
                                        styles.saleCard,
                                        canceled ? styles.saleCardCanceled : null,
                                        pressed ? styles.pressed : null,
                                    ]}
                                >
                                    <View style={styles.saleTop}>
                                        <Text style={styles.saleNumber}>
                                            Nota nº {formatSaleNumber(sale.number)}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.saleTotal,
                                                canceled ? styles.saleTotalCanceled : null,
                                            ]}
                                        >
                                            {formatCents(sale.totalCents)}
                                        </Text>
                                    </View>
                                    <Text style={styles.saleCustomer}>{sale.customerName}</Text>
                                    <Text style={styles.saleMeta}>
                                        {formatDateTimeBR(sale.createdAt)} •{" "}
                                        {paymentMethodLabel(sale.paymentMethod)}
                                    </Text>
                                    {canceled ? (
                                        <View style={styles.canceledBadge}>
                                            <Text style={styles.canceledBadgeText}>
                                                VENDA CANCELADA
                                            </Text>
                                        </View>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
    },
    list: {
        gap: theme.spacing.md,
    },
    saleCard: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    saleCardCanceled: {
        backgroundColor: theme.colors.dangerSurface,
        borderColor: theme.colors.danger,
    },
    pressed: {
        opacity: 0.8,
    },
    saleTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    saleNumber: {
        flex: 1,
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    saleTotal: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
        textAlign: "right",
    },
    saleTotalCanceled: {
        color: theme.colors.danger,
        textDecorationLine: "line-through",
    },
    saleCustomer: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    saleMeta: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    canceledBadge: {
        alignSelf: "flex-start",
        marginTop: theme.spacing.xs,
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.danger,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    canceledBadgeText: {
        fontSize: theme.font.small,
        fontWeight: "800",
        color: theme.colors.danger,
    },
    emptyBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    emptyIcon: {
        fontSize: 48,
        lineHeight: 54,
    },
    emptyTitle: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
        textAlign: "center",
    },
    emptyText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
});
