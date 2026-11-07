import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { MonthNavigator } from "@/components/MonthNavigator";
import { SaleNoteTable } from "@/components/SaleNoteTable";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { api } from "@/lib/api";
import { addMonths, formatDateBR, startOfDay, startOfMonth } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

function parseTimestamp(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const timestamp = Number(value);
    return Number.isFinite(timestamp) ? timestamp : undefined;
}

function monthFromParam(
    monthValue: string | undefined,
    dateValue: string | undefined,
): Date {
    const monthTimestamp = parseTimestamp(monthValue);
    if (monthTimestamp !== undefined) {
        return startOfMonth(new Date(monthTimestamp));
    }

    const dateTimestamp = parseTimestamp(dateValue);
    return dateTimestamp === undefined
        ? startOfMonth()
        : startOfMonth(new Date(dateTimestamp));
}

function dayFromParam(value: string | undefined): number | undefined {
    const timestamp = parseTimestamp(value);
    return timestamp === undefined ? undefined : startOfDay(new Date(timestamp)).getTime();
}

export default function SaleNotesScreen() {
    const params = useLocalSearchParams<{ month?: string; date?: string }>();
    const { colors } = useAppTheme();

    const monthStart = monthFromParam(params.month, params.date);
    const dateFilter = dayFromParam(params.date);

    const monthEnd = addMonths(monthStart, 1);
    const canGoNext = monthStart.getTime() < startOfMonth().getTime();
    const report = useQuery(api.sales.report, {
        from: monthStart.getTime(),
        to: monthEnd.getTime(),
    });

    const allNotes = report?.sales ?? [];
    const notes =
        dateFilter === undefined
            ? allNotes
            : allNotes.filter(
                  (entry) =>
                      startOfDay(entry.sale.createdAt).getTime() === dateFilter,
              );
    const completedNotes = notes.filter((entry) => entry.sale.status === "completed");
    const completedTotalCents = completedNotes.reduce(
        (total, entry) => total + entry.sale.totalCents,
        0,
    );
    const canceledCount = notes.length - completedNotes.length;

    const goToPreviousMonth = () => {
        router.setParams({
            month: String(addMonths(monthStart, -1).getTime()),
            date: undefined,
        });
    };

    const goToNextMonth = () => {
        if (!canGoNext) return;
        router.setParams({
            month: String(addMonths(monthStart, 1).getTime()),
            date: undefined,
        });
    };

    const clearDateFilter = () => {
        router.setParams({
            month: String(monthStart.getTime()),
            date: undefined,
        });
    };

    const subtitle =
        dateFilter === undefined
            ? "Cada nota em uma tabela separada"
            : `Notas de ${formatDateBR(dateFilter)}`;

    return (
        <>
            <ScreenHeader
                title="Notas de Venda"
                subtitle={subtitle}
                helpKey="notas"
                showBack
            />
            <Screen>
                <MonthNavigator
                    monthStart={monthStart}
                    onPrevious={goToPreviousMonth}
                    onNext={goToNextMonth}
                    canGoNext={canGoNext}
                    kicker="MÊS DAS NOTAS"
                />

                {dateFilter === undefined ? null : (
                    <View
                        style={[
                            styles.filterBanner,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.primary,
                            },
                        ]}
                    >
                        <View style={styles.filterInfo}>
                            <Text style={[styles.filterKicker, { color: colors.textMuted }]}>
                                FILTRO POR DATA
                            </Text>
                            <Text style={[styles.filterDate, { color: colors.text }]}>
                                {formatDateBR(dateFilter)}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Ver todas as notas do mês"
                            onPress={clearDateFilter}
                            style={({ pressed }) => [
                                styles.clearFilter,
                                { borderColor: colors.primary },
                                pressed ? styles.pressed : null,
                            ]}
                        >
                            <Text style={[styles.clearFilterText, { color: colors.primaryInk }]}>
                                Ver mês inteiro
                            </Text>
                        </Pressable>
                    </View>
                )}

                {report === undefined ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                            Carregando as notas...
                        </Text>
                    </View>
                ) : notes.length === 0 ? (
                    <View
                        style={[
                            styles.emptyBox,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                    >
                        <Text style={styles.emptyIcon} accessibilityElementsHidden>
                            🧾
                        </Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {dateFilter === undefined
                                ? "Nenhuma nota neste mês"
                                : "Nenhuma nota nesta data"}
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            {dateFilter === undefined
                                ? "As notas aparecem aqui assim que você registrar uma venda."
                                : "Toque em Ver mês inteiro para consultar as outras notas do mês."}
                        </Text>
                    </View>
                ) : (
                    <>
                        <View
                            style={[
                                styles.summaryBox,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.summaryBlock}>
                                <Text
                                    style={[
                                        styles.summaryLabel,
                                        { color: colors.textMuted },
                                    ]}
                                >
                                    Notas encontradas
                                </Text>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>
                                    {notes.length}
                                </Text>
                                {canceledCount > 0 ? (
                                    <Text
                                        style={[
                                            styles.summaryMeta,
                                            { color: colors.danger },
                                        ]}
                                    >
                                        {canceledCount} cancelada
                                        {canceledCount === 1 ? "" : "s"} fora do total
                                    </Text>
                                ) : null}
                            </View>
                            <View style={[styles.summaryBlock, styles.summaryRight]}>
                                <Text
                                    style={[
                                        styles.summaryLabel,
                                        { color: colors.textMuted },
                                    ]}
                                >
                                    Total concluído
                                </Text>
                                <Text
                                    style={[styles.summaryValue, { color: colors.primaryInk }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {formatCents(completedTotalCents)}
                                </Text>
                            </View>
                        </View>

                        {notes.map((entry) => (
                            <SaleNoteTable
                                key={entry.sale._id}
                                sale={entry.sale}
                                items={entry.items}
                                onOpen={() =>
                                    router.push({
                                        pathname: "/nota/[id]",
                                        params: { id: entry.sale._id },
                                    })
                                }
                            />
                        ))}
                    </>
                )}

                <BigButton
                    label="Nova venda"
                    description="Registrar uma venda e preparar a nota"
                    icon="🧾"
                    variant="secondary"
                    onPress={() => router.navigate("/vender")}
                />
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    filterBanner: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    filterInfo: {
        flex: 1,
        minWidth: 150,
        gap: 2,
    },
    filterKicker: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 0.6,
    },
    filterDate: {
        fontSize: theme.font.body,
        lineHeight: 24,
        fontWeight: "700",
    },
    clearFilter: {
        minHeight: theme.touch.min,
        borderWidth: 2,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        alignItems: "center",
        justifyContent: "center",
    },
    clearFilterText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        textAlign: "center",
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
        textAlign: "center",
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
    summaryBox: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.lg,
    },
    summaryBlock: {
        flex: 1,
        gap: 2,
    },
    summaryRight: {
        alignItems: "flex-end",
        flexShrink: 1,
    },
    summaryLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    summaryValue: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "700",
    },
    summaryMeta: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
    },
    pressed: {
        opacity: 0.72,
    },
});
