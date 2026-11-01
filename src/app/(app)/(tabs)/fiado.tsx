import { useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatCard } from "@/components/StatCard";
import { TutorialModal } from "@/components/TutorialModal";
import { api } from "@/lib/api";
import { creditDueLabel, creditDueTone } from "@/lib/credit";
import { daysUntil, formatDateBR } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { useTutorial } from "@/lib/useTutorial";
import { formatPhone } from "@/lib/validation";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function CreditScreen() {
    const debtors = useQuery(api.credits.debtors, {});
    const tutorial = useTutorial("fiado");
    const { colors } = useAppTheme();

    if (debtors === undefined) {
        return <LoadingScreen />;
    }

    const totalCents = debtors.reduce((total, debtor) => total + debtor.balanceCents, 0);
    const urgentCount = debtors.filter((debtor) => daysUntil(debtor.dueDate) <= 3).length;
    const overdueCount = debtors.filter((debtor) => daysUntil(debtor.dueDate) < 0).length;

    return (
        <>
            <ScreenHeader
                title="Contas de Fiado"
                subtitle="Quem ainda vai pagar"
                helpKey="fiado"
            />
            <Screen>
                <View style={styles.statsRow}>
                    <StatCard
                        icon="🤝"
                        label="Total em aberto"
                        value={formatCents(totalCents)}
                        tone="danger"
                    />
                    <StatCard
                        icon="👥"
                        label="Clientes"
                        value={String(debtors.length)}
                        tone="primary"
                    />
                </View>

                {overdueCount > 0 ? (
                    <FeedbackBanner
                        tone="danger"
                        icon="⚠"
                        title={`${overdueCount} conta${
                            overdueCount === 1 ? "" : "s"
                        } atrasada${overdueCount === 1 ? "" : "s"}`}
                        message="Toque no cliente para combinar o pagamento."
                    />
                ) : urgentCount > 0 ? (
                    <FeedbackBanner
                        tone="warning"
                        icon="⏰"
                        title={`${urgentCount} conta${
                            urgentCount === 1 ? "" : "s"
                        } vencendo`}
                        message="Falta pouco para a data combinada."
                    />
                ) : null}

                <BigButton
                    label="Nova venda fiado"
                    description="Registrar uma venda e escolher Fiado"
                    icon="🧾"
                    onPress={() => router.navigate("/vender")}
                />

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Clientes com saldo devedor
                    </Text>
                    <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                        {debtors.length} cliente{debtors.length === 1 ? "" : "s"}
                    </Text>
                </View>

                {debtors.length === 0 ? (
                    <View
                        style={[
                            styles.emptyBox,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                    >
                        <Text style={styles.emptyIcon} accessibilityElementsHidden>
                            🤝
                        </Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            Nenhum fiado em aberto
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            Quando você vender fiado, o cliente aparece aqui com o valor e a
                            data combinada para pagamento.
                        </Text>
                    </View>
                ) : (
                    debtors.map((debtor) => {
                        const days = daysUntil(debtor.dueDate);
                        const tone = creditDueTone(days);
                        const label = creditDueLabel(days);
                        const toneBg =
                            tone === "danger"
                                ? colors.dangerBg
                                : tone === "warning"
                                  ? colors.warnBg
                                  : colors.successBg;
                        const toneFg =
                            tone === "danger"
                                ? colors.danger
                                : tone === "warning"
                                  ? colors.warnInk
                                  : colors.success;

                        return (
                            <Pressable
                                key={debtor.customerId}
                                onPress={() =>
                                    router.push({
                                        pathname: "/fiado/[id]",
                                        params: { id: debtor.customerId },
                                    })
                                }
                                accessibilityRole="button"
                                accessibilityLabel={`${debtor.customerName}, deve ${formatCents(
                                    debtor.balanceCents,
                                )}. ${label}. Data combinada: ${formatDateBR(
                                    debtor.dueDate,
                                )}.`}
                                accessibilityHint="Abre as compras em aberto e os pagamentos"
                                style={({ pressed }) => [
                                    styles.card,
                                    {
                                        backgroundColor:
                                            tone === "danger"
                                                ? colors.dangerBg
                                                : colors.card,
                                        borderColor:
                                            tone === "danger"
                                                ? colors.danger
                                                : colors.border,
                                    },
                                    pressed ? styles.pressed : null,
                                ]}
                            >
                                <View style={styles.cardTop}>
                                    <View
                                        style={[
                                            styles.avatar,
                                            {
                                                backgroundColor:
                                                    tone === "danger"
                                                        ? colors.danger
                                                        : colors.primary,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.avatarText}>
                                            {initials(debtor.customerName)}
                                        </Text>
                                    </View>

                                    <View style={styles.nameBlock}>
                                        <Text
                                            style={[styles.name, { color: colors.text }]}
                                            numberOfLines={1}
                                        >
                                            {debtor.customerName}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.meta,
                                                { color: colors.textMuted },
                                            ]}
                                        >
                                            {debtor.creditCount} compra
                                            {debtor.creditCount === 1 ? "" : "s"} em aberto
                                        </Text>
                                    </View>

                                    <Text style={[styles.balance, { color: colors.text }]}>
                                        {formatCents(debtor.balanceCents)}
                                    </Text>
                                </View>

                                <View style={styles.badgeRow}>
                                    <View
                                        style={[styles.badge, { backgroundColor: toneBg }]}
                                    >
                                        <Text style={[styles.badgeText, { color: toneFg }]}>
                                            {label}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[styles.dueText, { color: colors.textMuted }]}
                                    >
                                        Data: {formatDateBR(debtor.dueDate)}
                                    </Text>
                                </View>

                                {debtor.phone ? (
                                    <Text style={[styles.phone, { color: colors.textMuted }]}>
                                        Telefone: {formatPhone(debtor.phone)}
                                    </Text>
                                ) : null}

                                <View style={styles.openRow}>
                                    <Text
                                        style={[styles.openHint, { color: colors.primaryInk }]}
                                    >
                                        Ver compras e registrar pagamento
                                    </Text>
                                    <Text
                                        style={[styles.openArrow, { color: colors.primaryInk }]}
                                    >
                                        ›
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })
                )}
            </Screen>

            <TutorialModal
                visible={tutorial.visible}
                tutorialKey="fiado"
                onClose={tutorial.close}
            />
        </>
    );
}

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: "row",
        gap: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "700",
    },
    sectionCount: {
        fontSize: 13,
        lineHeight: 18,
    },
    card: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    pressed: {
        opacity: 0.75,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 17,
        lineHeight: 21,
        fontWeight: "700",
    },
    nameBlock: {
        flex: 1,
        gap: 1,
    },
    name: {
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    meta: {
        fontSize: 13,
        lineHeight: 18,
    },
    balance: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 24,
        fontWeight: "700",
        textAlign: "right",
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        flexWrap: "wrap",
    },
    badge: {
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
    },
    badgeText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
    },
    dueText: {
        fontSize: 12,
        lineHeight: 16,
    },
    phone: {
        fontSize: 13,
        lineHeight: 18,
    },
    openRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginTop: 2,
    },
    openHint: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
    },
    openArrow: {
        fontSize: 24,
        lineHeight: 26,
        fontWeight: "700",
    },
    emptyBox: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    emptyIcon: {
        fontSize: 44,
        lineHeight: 50,
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
});
