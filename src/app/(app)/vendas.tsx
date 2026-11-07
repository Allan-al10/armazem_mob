import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ChoiceRow } from "@/components/ChoiceRow";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { MonthNavigator } from "@/components/MonthNavigator";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "@/lib/api";
import {
    addMonths,
    daysUntil,
    formatDateBR,
    formatMonthYearBR,
    startOfMonth,
} from "@/lib/date";
import { formatCents } from "@/lib/money";
import { getDeviceTimezoneOffsetMinutes } from "@/lib/push";
import { formatQuantityWithUnit } from "@/lib/quantity";
import { summarizeSalesByDay } from "@/lib/salesReport";
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
    const dailySales = summarizeSalesByDay(
        sales.map((entry) => ({
            createdAt: entry.sale.createdAt,
            status: entry.sale.status,
            totalCents: entry.sale.totalCents,
            costCents: entry.costCents,
        })),
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

    const openNotes = (dayStart?: number) => {
        const params: Record<string, string> = {
            month: String(monthStart.getTime()),
        };
        if (dayStart !== undefined) params.date = String(dayStart);

        router.push({ pathname: "/notas", params });
    };

    return (
        <>
            <ScreenHeader
                title="Registro de Vendas"
                subtitle="Relatório por data e notas separadas"
                helpKey="vendas"
                showBack
            />
            <Screen>
                <ChoiceRow options={VIEW_OPTIONS} value={view} onChange={setView} />

                {view === "month" ? (
                    <>
                        <MonthNavigator
                            monthStart={monthStart}
                            onPrevious={goToPreviousMonth}
                            onNext={goToNextMonth}
                            canGoNext={canGoNext}
                            kicker="MÊS DO REGISTRO"
                        />

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

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Relatório de vendas
                            </Text>
                            <Text style={[styles.reportHint, { color: colors.textMuted }]}>
                                Data, total, custo e lucro de cada dia. Toque em uma data
                                para abrir as notas daquele dia.
                            </Text>

                            {report === undefined ? null : dailySales.length === 0 ? (
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
                                <View
                                    style={[
                                        styles.reportTable,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.reportHeader,
                                            {
                                                backgroundColor: colors.surfaceStrong,
                                                borderBottomColor: colors.border,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.reportHeaderText,
                                                { color: colors.text },
                                            ]}
                                        >
                                            Data
                                        </Text>
                                        <Text
                                            style={[
                                                styles.reportHeaderText,
                                                styles.reportHeaderValue,
                                                { color: colors.text },
                                            ]}
                                        >
                                            Valores
                                        </Text>
                                    </View>

                                    {dailySales.map((day, index) => {
                                        const salesLabel = `${day.salesCount} venda${
                                            day.salesCount === 1 ? "" : "s"
                                        }`;
                                        const canceledLabel =
                                            day.canceledCount > 0
                                                ? ` • ${day.canceledCount} cancelada${
                                                      day.canceledCount === 1 ? "" : "s"
                                                  }`
                                                : "";

                                        return (
                                            <Pressable
                                                key={day.dayStart}
                                                accessibilityRole="button"
                                                accessibilityLabel={`${formatDateBR(
                                                    day.dayStart,
                                                )}: ${salesLabel}${canceledLabel}, total ${formatCents(
                                                    day.totalCents,
                                                )}, custo ${formatCents(
                                                    day.costCents,
                                                )}, lucro ${formatCents(
                                                    day.profitCents,
                                                )}. Toque para abrir as notas do dia.`}
                                                onPress={() => openNotes(day.dayStart)}
                                                style={({ pressed }) => [
                                                    styles.reportRow,
                                                    index > 0
                                                        ? {
                                                              borderTopWidth: 1,
                                                              borderTopColor:
                                                                  colors.border,
                                                          }
                                                        : null,
                                                    pressed ? styles.pressed : null,
                                                ]}
                                            >
                                                <View style={styles.reportRowTop}>
                                                    <View style={styles.reportDateBlock}>
                                                        <Text
                                                            style={[
                                                                styles.reportDate,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            {formatDateBR(day.dayStart)}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.reportDateMeta,
                                                                {
                                                                    color: colors.textMuted,
                                                                },
                                                            ]}
                                                        >
                                                            {salesLabel}
                                                            {canceledLabel}
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        style={[
                                                            styles.reportTotal,
                                                            { color: colors.text },
                                                        ]}
                                                        numberOfLines={1}
                                                        adjustsFontSizeToFit
                                                    >
                                                        {formatCents(day.totalCents)}
                                                    </Text>
                                                </View>

                                                <View style={styles.reportValues}>
                                                    <Text
                                                        style={[
                                                            styles.reportValueText,
                                                            {
                                                                color: colors.textMuted,
                                                            },
                                                        ]}
                                                    >
                                                        Custo{" "}
                                                        {formatCents(day.costCents)}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.reportValueText,
                                                            {
                                                                color:
                                                                    day.profitCents < 0
                                                                        ? colors.danger
                                                                        : colors.success,
                                                            },
                                                        ]}
                                                    >
                                                        Lucro{" "}
                                                        {formatCents(day.profitCents)}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.reportOpen,
                                                            {
                                                                color: colors.primaryInk,
                                                            },
                                                        ]}
                                                    >
                                                        Ver notas ›
                                                    </Text>
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        <BigButton
                            label="Abrir notas de venda"
                            description={
                                sales.length === 0
                                    ? `Nenhuma nota em ${monthLabel}`
                                    : `${sales.length} nota${
                                          sales.length === 1 ? "" : "s"
                                      } em ${monthLabel}, cada uma em sua tabela`
                            }
                            icon="🧾"
                            variant="secondary"
                            onPress={() => openNotes()}
                        />

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
    reportHint: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    reportTable: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
    },
    reportHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
    },
    reportHeaderText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    reportHeaderValue: {
        textAlign: "right",
    },
    reportRow: {
        minHeight: theme.touch.min,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    reportRowTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    reportDateBlock: {
        flex: 1,
        gap: 1,
    },
    reportDate: {
        fontSize: theme.font.body,
        lineHeight: 24,
        fontWeight: "700",
    },
    reportDateMeta: {
        fontSize: 13,
        lineHeight: 18,
    },
    reportTotal: {
        maxWidth: "48%",
        fontSize: theme.font.bodyLarge,
        lineHeight: 26,
        fontWeight: "700",
        textAlign: "right",
    },
    reportValues: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    reportValueText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
    },
    reportOpen: {
        marginLeft: "auto",
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
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
