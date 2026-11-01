import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { BigActionButton } from "@/components/BigActionButton";
import { BigButton } from "@/components/BigButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatCard } from "@/components/StatCard";
import { TutorialModal } from "@/components/TutorialModal";
import { api } from "@/lib/api";
import { addMonths, daysUntil, formatMonthYearBR, startOfMonth } from "@/lib/date";
import { friendlyError } from "@/lib/errors";
import { formatCents } from "@/lib/money";
import {
    QUICK_ACCESS_CATALOG,
    getQuickAccessItem,
} from "@/lib/preferences";
import { formatQuantity } from "@/lib/quantity";
import { unregisterPushNotificationsAsync } from "@/lib/push";
import { useTutorial } from "@/lib/useTutorial";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

export default function HomeScreen() {
    const { signOut } = useAuthActions();
    const unregisterPushToken = useMutation(api.reminders.unregisterPushToken);
    const tutorial = useTutorial("home");
    const { colors, quickAccess } = useAppTheme();
    const store = useQuery(api.stores.getMine);
    const products = useQuery(api.products.list, store ? {} : "skip");

    const monthStart = startOfMonth();
    const previousMonthStart = addMonths(monthStart, -1);
    const monthSummary = useQuery(
        api.sales.periodSummary,
        store
            ? {
                  from: monthStart.getTime(),
                  to: addMonths(monthStart, 1).getTime(),
              }
            : "skip",
    );
    const previousMonthSummary = useQuery(
        api.sales.periodSummary,
        store
            ? {
                  from: previousMonthStart.getTime(),
                  to: monthStart.getTime(),
              }
            : "skip",
    );
    const debtors = useQuery(api.credits.debtors, store ? {} : "skip");
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    if (store === undefined) {
        return <LoadingScreen />;
    }
    if (store === null) {
        return null;
    }
    if (
        products === undefined ||
        monthSummary === undefined ||
        previousMonthSummary === undefined ||
        debtors === undefined
    ) {
        return <LoadingScreen />;
    }

    const firstName = store.ownerName.split(" ")[0] || store.ownerName;
    const lowStockProducts = products.filter(
        (product) => product.stockQty <= product.lowStockThreshold,
    );
    const totalItems = products.reduce((total, product) => total + product.stockQty, 0);
    const creditTotalCents = debtors.reduce(
        (total, debtor) => total + debtor.balanceCents,
        0,
    );
    const urgentCredits = debtors.filter(
        (debtor) => daysUntil(debtor.dueDate) <= 3,
    ).length;

    const variation =
        previousMonthSummary.totalCents > 0
            ? Math.round(
                  ((monthSummary.totalCents - previousMonthSummary.totalCents) /
                      previousMonthSummary.totalCents) *
                      100,
              )
            : null;
    const monthLabel = formatMonthYearBR(monthStart).toUpperCase();
    const activeQuickAccess = quickAccess
        .map((key) => QUICK_ACCESS_CATALOG.find((item) => item.key === key))
        .filter((item): item is (typeof QUICK_ACCESS_CATALOG)[number] => Boolean(item));

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            const token = await unregisterPushNotificationsAsync();
            if (token) {
                await unregisterPushToken({ token });
            }
        } catch (error) {
            // O logout não deve ficar preso se o servidor não responder.
            console.warn("Não foi possível remover o token de aviso no logout.", error);
        }

        try {
            await signOut();
        } catch (error) {
            Alert.alert("Não foi possível sair", friendlyError(error));
        } finally {
            setLoggingOut(false);
            setLogoutVisible(false);
        }
    };

    return (
        <>
            <ScreenHeader
                title={store.tradeName}
                subtitle="Início"
                helpKey="home"
                actionIcon="⚙"
                actionLabel="Abrir configurações"
                onAction={() => router.push("/configuracoes")}
            />
            <Screen>
                <View style={styles.greetingBox}>
                    <Text style={styles.greeting}>Olá, {firstName}!</Text>
                    <Text style={styles.question}>O que você quer fazer hoje?</Text>
                </View>

                <View style={styles.statsRow}>
                    <StatCard
                        icon="📦"
                        label="Produtos"
                        value={String(products.length)}
                        tone="primary"
                    />
                    <StatCard
                        icon="🔢"
                        label="Itens no total"
                        value={formatQuantity(totalItems)}
                        tone="accent"
                    />
                </View>

                <Pressable
                    onPress={() => router.push("/vendas")}
                    accessibilityRole="button"
                    accessibilityLabel={`Vendas de ${monthLabel}. Total ${formatCents(
                        monthSummary.totalCents,
                    )}. Toque para abrir o registro de vendas.`}
                    style={({ pressed }) => [
                        styles.monthCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                        pressed ? styles.pressed : null,
                    ]}
                >
                    <View style={styles.monthHeader}>
                        <Text style={[styles.monthLabel, { color: colors.textMuted }]}>
                            VENDAS DE {monthLabel}
                        </Text>
                        <Text style={[styles.monthArrow, { color: colors.textMuted }]}>›</Text>
                    </View>

                    <Text style={[styles.monthTotal, { color: colors.text }]}>
                        {formatCents(monthSummary.totalCents)}
                    </Text>

                    <Text
                        style={[
                            styles.variation,
                            {
                                color:
                                    variation === null
                                        ? colors.textMuted
                                        : variation >= 0
                                          ? colors.success
                                          : colors.danger,
                            },
                        ]}
                    >
                        {variation === null
                            ? monthSummary.totalCents > 0
                                ? "Primeiro mês com vendas"
                                : "Nenhuma venda neste mês"
                            : `${variation >= 0 ? "▲" : "▼"} ${Math.abs(variation)}% em relação ao mês anterior`}
                    </Text>

                    <View style={styles.monthMetrics}>
                        <View style={styles.metric}>
                            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                                Custo
                            </Text>
                            <Text style={[styles.metricValue, { color: colors.accent }]}>
                                {formatCents(monthSummary.costCents)}
                            </Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metric}>
                            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                                Lucro
                            </Text>
                            <Text style={[styles.metricValue, { color: colors.success }]}>
                                {formatCents(monthSummary.profitCents)}
                            </Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metric}>
                            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                                Vendas
                            </Text>
                            <Text style={[styles.metricValue, { color: colors.primaryInk }]}>
                                {monthSummary.salesCount}
                            </Text>
                        </View>
                    </View>
                </Pressable>

                {lowStockProducts.length > 0 ? (
                    <FeedbackBanner
                        tone="danger"
                        icon="⚠"
                        title="Estoque baixo"
                        message={`${lowStockProducts.length} produto${
                            lowStockProducts.length === 1 ? "" : "s"
                        } precisa${lowStockProducts.length === 1 ? "" : "m"} repor`}
                        onPress={() => router.navigate("/estoque")}
                    />
                ) : null}

                {debtors.length > 0 ? (
                    <FeedbackBanner
                        tone={urgentCredits > 0 ? "warning" : "info"}
                        icon={urgentCredits > 0 ? "⏰" : "🤝"}
                        title={`${debtors.length} conta${
                            debtors.length === 1 ? "" : "s"
                        } de fiado`}
                        message={`${formatCents(creditTotalCents)} em aberto${
                            urgentCredits > 0
                                ? ` • ${urgentCredits} vencendo ou atrasada${
                                      urgentCredits === 1 ? "" : "s"
                                  }`
                                : " • tudo em dia"
                        }`}
                        onPress={() => router.navigate("/fiado")}
                    />
                ) : null}

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                        ACESSO RÁPIDO
                    </Text>
                    <Pressable
                        onPress={() => router.push("/configuracoes")}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Editar acesso rápido"
                        style={({ pressed }) => (pressed ? styles.pressed : null)}
                    >
                        <Text style={[styles.editLink, { color: colors.primaryInk }]}>
                            Editar
                        </Text>
                    </Pressable>
                </View>

                {activeQuickAccess.length > 0 ? (
                    activeQuickAccess.map((item) => (
                        <BigActionButton
                            key={item.key}
                            item={getQuickAccessItem(item.key)}
                            onPress={() => router.push(item.route)}
                        />
                    ))
                ) : (
                    <View style={[styles.emptyQuick, { borderColor: colors.border }]}>
                        <Text style={[styles.emptyQuickText, { color: colors.textMuted }]}>
                            Nenhum atalho escolhido. Toque em Editar para adicionar.
                        </Text>
                    </View>
                )}

                <View style={styles.footerLinks}>
                    <BigButton
                        label="Meus dados"
                        onPress={() => router.push("/meu-cadastro")}
                        variant="secondary"
                        icon="🏪"
                    />
                    <BigButton
                        label="Sair da conta"
                        onPress={() => setLogoutVisible(true)}
                        variant="ghost"
                    />
                </View>

                <Text style={styles.version}>Estoque Fácil • versão 1.0</Text>
            </Screen>

            <ConfirmDialog
                visible={logoutVisible}
                title="Sair da conta?"
                message="Você vai precisar do e-mail e da senha para entrar de novo. Seus dados continuam salvos."
                confirmLabel="Sim, sair"
                cancelLabel="Não, ficar"
                destructive
                loading={loggingOut}
                onConfirm={handleLogout}
                onCancel={() => setLogoutVisible(false)}
            />

            <TutorialModal
                visible={tutorial.visible}
                tutorialKey="home"
                onClose={tutorial.close}
            />
        </>
    );
}

const styles = StyleSheet.create({
    greetingBox: {
        gap: theme.spacing.xs,
    },
    greeting: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "700",
        color: theme.colors.text,
    },
    question: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.textMuted,
    },
    statsRow: {
        flexDirection: "row",
        gap: theme.spacing.md,
    },
    monthCard: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    pressed: {
        opacity: 0.75,
    },
    monthHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    monthLabel: {
        flex: 1,
        fontSize: 13,
        lineHeight: 17,
        fontWeight: "700",
        letterSpacing: 0.6,
    },
    monthArrow: {
        fontSize: 28,
        lineHeight: 28,
        fontWeight: "700",
    },
    monthTotal: {
        fontSize: 30,
        lineHeight: 38,
        fontWeight: "700",
    },
    variation: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: "700",
    },
    monthMetrics: {
        flexDirection: "row",
        alignItems: "stretch",
        marginTop: theme.spacing.xs,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    metric: {
        flex: 1,
        gap: 2,
    },
    metricDivider: {
        width: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: theme.spacing.sm,
    },
    metricLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    metricValue: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "700",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: theme.spacing.sm,
    },
    sectionLabel: {
        fontSize: theme.font.label,
        lineHeight: 20,
        fontWeight: "700",
        letterSpacing: 0.6,
    },
    editLink: {
        fontSize: theme.font.label,
        lineHeight: 24,
        fontWeight: "700",
    },
    emptyQuick: {
        borderWidth: 2,
        borderStyle: "dashed",
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
    },
    emptyQuickText: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        textAlign: "center",
    },
    footerLinks: {
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    version: {
        fontSize: theme.font.small,
        color: theme.colors.textMuted,
        textAlign: "center",
        marginTop: theme.spacing.md,
    },
});
