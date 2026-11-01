import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ChoiceRow } from "@/components/ChoiceRow";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "@/lib/api";
import {
    addMonths,
    daysUntil,
    formatDateTimeBR,
    formatMonthYearBR,
    startOfMonth,
} from "@/lib/date";
import { formatCents } from "@/lib/money";
import { getDeviceTimezoneOffsetMinutes } from "@/lib/push";
import { formatQuantityWithUnit } from "@/lib/quantity";
import { formatSaleNumber, paymentMethodLabel } from "@/lib/sale";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type ViewMode = "month" | "overview";

type SoldItem = {
    key: string;
    name: string;
    unit: "unidade" | "kg" | "pacote";
    quantity: number;
    totalCents: number;
};

const VIEW_OPTIONS = [
    { value: "month", label: "Por mês" },
    { value: "overview", label: "Resumo geral" },
] as const;

export default function SalesReportScreen() {
    const { colors } = useAppTheme();
    const [view, setView] = useState<ViewMode>("month");
    const [monthStart, setMonthStart] = useState(() => startOfMonth());
    const monthEnd = addMonths(monthStart, 1);
    const report = useQuery(api.sales.report, {
        from: monthStart.getTime(),
        to: monthEnd.getTime(),
    });
    const overview = useQuery(
        api.sales.overview,
        view === "overview"
            ? { timezoneOffsetMinutes: getDeviceTimezoneOffsetMinutes() }
            : "skip",
    );
    const debtors = useQuery(api.credits.debtors, {});

    const monthLabel = formatMonthYearBR(monthStart);
    const currentMonthStart = startOfMonth();
    const canGoNext = monthStart.getTime() < currentMonthStart.getTime();
    const summary = report?.summary;
    const sales = report?.sales ?? [];
    const creditTotalCents =
        debtors?.reduce((total, debtor) => total + debtor.balanceCents, 0) ?? 0;
    const overdueCredits =
        debtors?.filter((debtor) => daysUntil(debtor.dueDate) < 0).length ?? 0;

    const soldItemsMap = new Map<string, SoldItem>();
    for (const entry of sales) {
        if (entry.sale.status === "canceled") continue;
        for (const item of entry.items) {
            const current = soldItemsMap.get(item.productId);
            if (current) {
                current.quantity += item.quantity;
                current.totalCents += item.subtotalCents;
            } else {
                soldItemsMap.set(item.productId, {
                    key: item.productId,
                    name: item.productName,
                    unit: item.unit,
                    quantity: item.quantity,
                    totalCents: item.subtotalCents,
                });
            }
        }
    }
    const soldItems = [...soldItemsMap.values()].sort(
        (a, b) => b.totalCents - a.totalCents,
    );
    const overviewMaxCents = overview
        ? Math.max(1, ...overview.months.map((month) => month.summary.totalCents))
        : 1;

    const goToPreviousMonth = () => {
        setMonthStart((current) => addMonths(current, -1));
    };

    const goToNextMonth = () => {
        if (!canGoNext) return;
        setMonthStart((current) => addMonths(current, 1));
    };

    return (
        <>
            <ScreenHeader
                title="Registro de Vendas"
                subtitle="Custo, lucro e itens por mês"
                helpKey="vendas"
                showBack
            />
            <Screen>
                <ChoiceRow options={VIEW_OPTIONS} value={view} onChange={setView} />

                {view === "month" ? (
                    <>
                        <View
                            style={[
                                styles.monthNav,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                        >
                            <Pressable
                                onPress={goToPreviousMonth}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel="Mês anterior"
                                style={({ pressed }) => [
                                    styles.monthArrow,
                                    { borderColor: colors.border },
                                    pressed ? styles.pressed : null,
                                ]}
                            >
                                <Text style={[styles.monthArrowText, { color: colors.text }]}>
                                    ←
                                </Text>
                            </Pressable>

                            <View style={styles.monthCenter}>
                                <Text style={[styles.monthKicker, { color: colors.textMuted }]}>
                                    MÊS DO REGISTRO
                                </Text>
                                <Text style={[styles.monthTitle, { color: colors.text }]}>
                                    {monthLabel}
                                </Text>
                            </View>

                            <Pressable
                                onPress={goToNextMonth}
                                disabled={!canGoNext}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel="Próximo mês"
                                accessibilityState={{ disabled: !canGoNext }}
                                style={({ pressed }) => [
                                    styles.monthArrow,
                                    { borderColor: colors.border },
                                    !canGoNext ? styles.disabled : null,
                                    pressed ? styles.pressed : null,
                                ]}
                            >
                                <Text style={[styles.monthArrowText, { color: colors.text }]}>
                                    →
                                </Text>
                            </Pressable>
                        </View>

                        {summary === undefined ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.loadingText}>Carregando o mês...</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.statsGrid}>
                                    <StatCard
                                        style={styles.statItem}
                                        label="Total vendido"
                                        value={formatCents(summary.totalCents)}
                                        tone="primary"
                                        icon="💰"
                                    />
                                    <StatCard
                                        style={styles.statItem}
                                        label="Custo"
                                        value={formatCents(summary.costCents)}
                                        tone="accent"
                                        icon="📦"
                                    />
                                    <StatCard
                                        style={styles.statItem}
                                        label="Lucro"
                                        value={formatCents(summary.profitCents)}
                                        tone={summary.profitCents < 0 ? "danger" : "success"}
                                        icon="📈"
                                    />
                                    <StatCard
                                        style={styles.statItem}
                                        label="Vendas"
                                        value={String(summary.salesCount)}
                                        tone="text"
                                        icon="🧾"
                                    />
                                </View>

                                <Text style={styles.summaryHint}>
                                    {summary.salesCount === 0
                                        ? "Nenhuma venda concluída neste mês."
                                        : `${summary.salesCount} venda${
                                              summary.salesCount === 1 ? "" : "s"
                                          } concluída${
                                              summary.salesCount === 1 ? "" : "s"
                                          } neste mês.`}
                                    {summary.canceledCount > 0
                                        ? ` ${summary.canceledCount} cancelada${
                                              summary.canceledCount === 1 ? "" : "s"
                                          } fora do resumo.`
                                        : ""}
                                </Text>
                            </>
                        )}

                        {creditTotalCents > 0 ? (
                            <FeedbackBanner
                                tone={overdueCredits > 0 ? "danger" : "warning"}
                                icon={overdueCredits > 0 ? "⚠" : "🤝"}
                                title="A receber (fiado)"
                                message={`${formatCents(creditTotalCents)} em ${
                                    debtors?.length ?? 0
                                } conta${(debtors?.length ?? 0) === 1 ? "" : "s"}${
                                    overdueCredits > 0
                                        ? ` • ${overdueCredits} atrasada${
                                              overdueCredits === 1 ? "" : "s"
                                          }`
                                        : ""
                                }`}
                                onPress={() => router.navigate("/fiado")}
                            />
                        ) : null}

                        <BigButton
                            label="Nova venda"
                            description="Registrar uma venda e preparar a nota"
                            icon="🧾"
                            onPress={() => router.navigate("/vender")}
                        />

                        {summary !== undefined && soldItems.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Itens vendidos no mês
                                </Text>
                                <View
                                    style={[
                                        styles.itemsCard,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    {soldItems.map((item, index) => (
                                        <View
                                            key={item.key}
                                            style={[
                                                styles.aggregateRow,
                                                index > 0
                                                    ? {
                                                          borderTopWidth: 1,
                                                          borderTopColor: colors.border,
                                                      }
                                                    : null,
                                            ]}
                                        >
                                            <View style={styles.aggregateInfo}>
                                                <Text
                                                    style={[
                                                        styles.aggregateName,
                                                        { color: colors.text },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {item.name}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.aggregateQty,
                                                        { color: colors.textMuted },
                                                    ]}
                                                >
                                                    {formatQuantityWithUnit(
                                                        item.quantity,
                                                        item.unit,
                                                    )}{" "}
                                                    vendidos
                                                </Text>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.aggregateTotal,
                                                    { color: colors.primaryInk },
                                                ]}
                                            >
                                                {formatCents(item.totalCents)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : null}

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Vendas do mês
                            </Text>

                            {report === undefined ? null : sales.length === 0 ? (
                                <View
                                    style={[
                                        styles.emptyBox,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={styles.emptyIcon} accessibilityElementsHidden>
                                        🧾
                                    </Text>
                                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                        Nenhuma venda em {monthLabel}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.emptyText,
                                            { color: colors.textMuted },
                                        ]}
                                    >
                                        Toque em Nova venda para registrar a primeira venda
                                        deste mês.
                                    </Text>
                                </View>
                            ) : (
                                sales.map((entry) => {
                                    const { sale, items, costCents, profitCents } = entry;
                                    const canceled = sale.status === "canceled";
                                    const paymentTone =
                                        sale.paymentMethod === "credit_account"
                                            ? { bg: colors.dangerBg, fg: colors.danger }
                                            : sale.paymentMethod === "cash"
                                              ? { bg: colors.successBg, fg: colors.success }
                                              : sale.paymentMethod === "pix"
                                                ? { bg: colors.warnBg, fg: colors.warnInk }
                                                : {
                                                      bg: colors.surfaceStrong,
                                                      fg: colors.primaryInk,
                                                  };

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
                                            accessibilityLabel={`Venda ${formatSaleNumber(
                                                sale.number,
                                            )}, ${sale.customerName}, ${formatCents(
                                                sale.totalCents,
                                            )}, ${
                                                canceled ? "cancelada" : "concluída"
                                            }. Toque para abrir a nota.`}
                                            style={({ pressed }) => [
                                                styles.saleCard,
                                                {
                                                    backgroundColor: canceled
                                                        ? colors.dangerBg
                                                        : colors.card,
                                                    borderColor: canceled
                                                        ? colors.danger
                                                        : colors.border,
                                                },
                                                pressed ? styles.pressed : null,
                                            ]}
                                        >
                                            <View style={styles.saleTop}>
                                                <View style={styles.saleHeading}>
                                                    <Text
                                                        style={[
                                                            styles.saleNumber,
                                                            { color: colors.textMuted },
                                                        ]}
                                                    >
                                                        Venda nº{" "}
                                                        {formatSaleNumber(sale.number)}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.saleDate,
                                                            { color: colors.textMuted },
                                                        ]}
                                                    >
                                                        {formatDateTimeBR(sale.createdAt)}
                                                    </Text>
                                                </View>
                                                <Text
                                                    style={[
                                                        styles.saleTotal,
                                                        {
                                                            color: canceled
                                                                ? colors.danger
                                                                : colors.text,
                                                            textDecorationLine: canceled
                                                                ? "line-through"
                                                                : "none",
                                                        },
                                                    ]}
                                                >
                                                    {formatCents(sale.totalCents)}
                                                </Text>
                                            </View>

                                            <View style={styles.customerRow}>
                                                <Text
                                                    style={[
                                                        styles.saleCustomer,
                                                        { color: colors.text },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {sale.customerName}
                                                </Text>
                                                <View
                                                    style={[
                                                        styles.paymentTag,
                                                        { backgroundColor: paymentTone.bg },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.paymentTagText,
                                                            { color: paymentTone.fg },
                                                        ]}
                                                    >
                                                        {paymentMethodLabel(
                                                            sale.paymentMethod,
                                                        )}
                                                    </Text>
                                                </View>
                                            </View>

                                            {canceled ? (
                                                <View
                                                    style={[
                                                        styles.canceledBadge,
                                                        {
                                                            borderColor: colors.danger,
                                                            backgroundColor: colors.card,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.canceledBadgeText,
                                                            { color: colors.danger },
                                                        ]}
                                                    >
                                                        VENDA CANCELADA • FORA DO RESUMO
                                                    </Text>
                                                </View>
                                            ) : null}

                                            <View
                                                style={[
                                                    styles.itemsBox,
                                                    {
                                                        backgroundColor: colors.bg,
                                                        borderColor: colors.border,
                                                    },
                                                ]}
                                            >
                                                {items.length === 0 ? (
                                                    <Text
                                                        style={[
                                                            styles.emptyItems,
                                                            { color: colors.textMuted },
                                                        ]}
                                                    >
                                                        Itens não encontrados para esta venda.
                                                    </Text>
                                                ) : (
                                                    items.map((item) => (
                                                        <View
                                                            key={item._id}
                                                            style={styles.itemRow}
                                                        >
                                                            <View style={styles.itemInfo}>
                                                                <Text
                                                                    style={[
                                                                        styles.itemName,
                                                                        { color: colors.text },
                                                                    ]}
                                                                    numberOfLines={1}
                                                                >
                                                                    {item.productName}
                                                                </Text>
                                                                <Text
                                                                    style={[
                                                                        styles.itemMeta,
                                                                        {
                                                                            color: colors.textMuted,
                                                                        },
                                                                    ]}
                                                                >
                                                                    {formatQuantityWithUnit(
                                                                        item.quantity,
                                                                        item.unit,
                                                                    )}{" "}
                                                                    ×{" "}
                                                                    {formatCents(
                                                                        item.unitPriceCents,
                                                                    )}
                                                                </Text>
                                                            </View>
                                                            <Text
                                                                style={[
                                                                    styles.itemSubtotal,
                                                                    { color: colors.text },
                                                                ]}
                                                            >
                                                                {formatCents(
                                                                    item.subtotalCents,
                                                                )}
                                                            </Text>
                                                        </View>
                                                    ))
                                                )}
                                            </View>

                                            <View
                                                style={[
                                                    styles.saleTotals,
                                                    { borderTopColor: colors.border },
                                                ]}
                                            >
                                                <View style={styles.totalLine}>
                                                    <Text
                                                        style={[
                                                            styles.totalLabel,
                                                            { color: colors.textMuted },
                                                        ]}
                                                    >
                                                        Custo
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.totalValue,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {formatCents(costCents)}
                                                    </Text>
                                                </View>
                                                <View style={styles.totalLine}>
                                                    <Text
                                                        style={[
                                                            styles.totalLabel,
                                                            { color: colors.textMuted },
                                                        ]}
                                                    >
                                                        Lucro
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.totalValue,
                                                            {
                                                                color:
                                                                    profitCents < 0
                                                                        ? colors.danger
                                                                        : colors.success,
                                                            },
                                                        ]}
                                                    >
                                                        {formatCents(profitCents)}
                                                    </Text>
                                                </View>
                                            </View>

                                            <Text
                                                style={[
                                                    styles.openHint,
                                                    { color: colors.primaryInk },
                                                ]}
                                            >
                                                Toque para abrir a nota
                                            </Text>
                                        </Pressable>
                                    );
                                })
                            )}
                        </View>
                    </>
                ) : overview === undefined ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Carregando o resumo geral...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.statsGrid}>
                            <StatCard
                                style={styles.statItem}
                                label="Total vendido"
                                value={formatCents(overview.summary.totalCents)}
                                tone="primary"
                                icon="💰"
                            />
                            <StatCard
                                style={styles.statItem}
                                label="Custo"
                                value={formatCents(overview.summary.costCents)}
                                tone="accent"
                                icon="📦"
                            />
                            <StatCard
                                style={styles.statItem}
                                label="Lucro"
                                value={formatCents(overview.summary.profitCents)}
                                tone={
                                    overview.summary.profitCents < 0 ? "danger" : "success"
                                }
                                icon="📈"
                            />
                            <StatCard
                                style={styles.statItem}
                                label="Vendas"
                                value={String(overview.summary.salesCount)}
                                tone="text"
                                icon="🧾"
                            />
                        </View>

                        <Text style={styles.summaryHint}>
                            Soma de todas as vendas registradas, desde a primeira até hoje.
                        </Text>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Meses com vendas
                            </Text>

                            {overview.months.length === 0 ? (
                                <View
                                    style={[
                                        styles.emptyBox,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={styles.emptyIcon} accessibilityElementsHidden>
                                        📊
                                    </Text>
                                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                        Ainda não há vendas.
                                    </Text>
                                    <Text
                                        style={[
                                            styles.emptyText,
                                            { color: colors.textMuted },
                                        ]}
                                    >
                                        Assim que você registrar uma venda, ela aparece
                                        aqui.
                                    </Text>
                                </View>
                            ) : (
                                overview.months.map((month) => {
                                    const monthLabel = formatMonthYearBR(
                                        month.monthStart,
                                    );
                                    const barPercent = Math.max(
                                        3,
                                        Math.round(
                                            (month.summary.totalCents /
                                                overviewMaxCents) *
                                                100,
                                        ),
                                    );

                                    return (
                                        <Pressable
                                            key={month.monthStart}
                                            onPress={() => {
                                                setMonthStart(new Date(month.monthStart));
                                                setView("month");
                                            }}
                                            accessibilityRole="button"
                                            accessibilityLabel={`${monthLabel}. ${formatCents(
                                                month.summary.totalCents,
                                            )} vendidos, custo ${formatCents(
                                                month.summary.costCents,
                                            )}, lucro ${formatCents(
                                                month.summary.profitCents,
                                            )}. Toque para abrir este mês.`}
                                            style={({ pressed }) => [
                                                styles.overviewRow,
                                                {
                                                    backgroundColor: colors.card,
                                                    borderColor: colors.border,
                                                },
                                                pressed ? styles.pressed : null,
                                            ]}
                                        >
                                            <View style={styles.overviewInfo}>
                                                <Text
                                                    style={[
                                                        styles.overviewMonth,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {monthLabel}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.overviewMeta,
                                                        { color: colors.textMuted },
                                                    ]}
                                                >
                                                    {month.summary.salesCount} venda
                                                    {month.summary.salesCount === 1
                                                        ? ""
                                                        : "s"}{" "}
                                                    • custo{" "}
                                                    {formatCents(month.summary.costCents)}
                                                </Text>
                                                <View
                                                    style={[
                                                        styles.barTrack,
                                                        {
                                                            backgroundColor:
                                                                colors.surfaceStrong,
                                                        },
                                                    ]}
                                                >
                                                    <View
                                                        style={[
                                                            styles.barFill,
                                                            {
                                                                width: `${barPercent}%` as `${number}%`,
                                                                backgroundColor:
                                                                    colors.primary,
                                                            },
                                                        ]}
                                                    />
                                                </View>
                                            </View>
                                            <View style={styles.overviewValues}>
                                                <Text
                                                    style={[
                                                        styles.overviewTotal,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {formatCents(
                                                        month.summary.totalCents,
                                                    )}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.overviewProfit,
                                                        {
                                                            color:
                                                                month.summary
                                                                    .profitCents < 0
                                                                    ? colors.danger
                                                                    : colors.success,
                                                        },
                                                    ]}
                                                >
                                                    lucro{" "}
                                                    {formatCents(
                                                        month.summary.profitCents,
                                                    )}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.overviewOpen,
                                                        { color: colors.primaryInk },
                                                    ]}
                                                >
                                                    abrir mês ›
                                                </Text>
                                            </View>
                                        </Pressable>
                                    );
                                })
                            )}
                        </View>

                        <BigButton
                            label="Nova venda"
                            description="Registrar uma venda e preparar a nota"
                            icon="🧾"
                            onPress={() => router.navigate("/vender")}
                        />
                    </>
                )}
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    monthNav: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    monthArrow: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.pill,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    monthArrowText: {
        fontSize: 24,
        lineHeight: 28,
        fontWeight: "700",
    },
    monthCenter: {
        flex: 1,
        alignItems: "center",
        gap: 1,
    },
    monthKicker: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 0.6,
    },
    monthTitle: {
        fontSize: theme.font.subtitle,
        lineHeight: 27,
        fontWeight: "700",
        textAlign: "center",
    },
    disabled: {
        opacity: 0.35,
    },
    pressed: {
        opacity: 0.72,
    },
    loadingBox: {
        minHeight: 180,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.md,
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        borderColor: theme.colors.border,
        padding: theme.spacing.xl,
    },
    loadingText: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.md,
    },
    statItem: {
        flexBasis: "47%",
        flexGrow: 1,
        minHeight: 92,
    },
    summaryHint: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    section: {
        gap: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    sectionTitle: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "700",
    },
    itemsCard: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.md,
    },
    aggregateRow: {
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    aggregateInfo: {
        flex: 1,
        gap: 1,
    },
    aggregateName: {
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    aggregateQty: {
        fontSize: 13,
        lineHeight: 18,
    },
    aggregateTotal: {
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
        textAlign: "right",
    },
    emptyBox: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    emptyIcon: {
        fontSize: 42,
        lineHeight: 48,
    },
    emptyTitle: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "700",
        textAlign: "center",
    },
    emptyText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        textAlign: "center",
    },
    saleCard: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    saleTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    saleHeading: {
        flex: 1,
        gap: 1,
    },
    saleNumber: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
    },
    saleDate: {
        fontSize: 13,
        lineHeight: 18,
    },
    saleTotal: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 26,
        fontWeight: "700",
        textAlign: "right",
    },
    customerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    saleCustomer: {
        flex: 1,
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    paymentTag: {
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
    },
    paymentTagText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
    },
    canceledBadge: {
        alignSelf: "flex-start",
        borderWidth: 2,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    canceledBadgeText: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: "700",
    },
    itemsBox: {
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
    },
    emptyItems: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    itemInfo: {
        flex: 1,
        gap: 1,
    },
    itemName: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "700",
    },
    itemMeta: {
        fontSize: 13,
        lineHeight: 18,
    },
    itemSubtotal: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "700",
        textAlign: "right",
    },
    saleTotals: {
        gap: theme.spacing.xs,
        borderTopWidth: 1,
        paddingTop: theme.spacing.sm,
    },
    totalLine: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    totalLabel: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
    },
    totalValue: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "700",
        textAlign: "right",
    },
    openHint: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    overviewRow: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    overviewInfo: {
        flex: 1,
        gap: 2,
    },
    overviewMonth: {
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    overviewMeta: {
        fontSize: 13,
        lineHeight: 18,
    },
    barTrack: {
        height: 8,
        borderRadius: theme.radius.pill,
        overflow: "hidden",
        marginTop: 4,
    },
    barFill: {
        height: 8,
        borderRadius: theme.radius.pill,
    },
    overviewValues: {
        alignItems: "flex-end",
        gap: 1,
    },
    overviewTotal: {
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    overviewProfit: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
    },
    overviewOpen: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
    },
});
