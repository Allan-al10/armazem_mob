import { useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SummaryCard } from "@/components/SummaryCard";
import { api } from "@/lib/api";
import { creditDueLabel, creditDueTone } from "@/lib/credit";
import { daysUntil, formatDateBR } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { formatPhone } from "@/lib/validation";
import { theme } from "@/theme";

export default function CreditScreen() {
    const debtors = useQuery(api.credits.debtors, {});

    if (debtors === undefined) {
        return <LoadingScreen />;
    }

    const totalCents = debtors.reduce((total, debtor) => total + debtor.balanceCents, 0);
    const urgentCount = debtors.filter((debtor) => daysUntil(debtor.dueDate) <= 3).length;

    return (
        <>
            <ScreenHeader
                title="Quem deve"
                subtitle="Fiados em aberto e vencimentos"
                helpKey="fiado"
                showBack
            />
            <Screen>
                <SummaryCard
                    icon="📒"
                    title="Total em aberto"
                    value={formatCents(totalCents)}
                    hint={
                        debtors.length === 0
                            ? "Nenhum fiado em aberto"
                            : urgentCount > 0
                              ? `${debtors.length} cliente${
                                    debtors.length === 1 ? "" : "s"
                                } • ${urgentCount} ${
                                    urgentCount === 1
                                        ? "vencendo ou atrasado"
                                        : "vencendo ou atrasados"
                                }`
                              : `${debtors.length} cliente${
                                    debtors.length === 1 ? "" : "s"
                                } • Todos em dia`
                    }
                />

                <BigButton
                    label="Nova venda fiado"
                    description="Registrar uma venda e escolher Fiado"
                    icon="🧾"
                    onPress={() => router.push("/vender")}
                />

                <Text style={styles.sectionTitle}>Clientes com saldo devedor</Text>

                {debtors.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon} accessibilityElementsHidden>
                            📒
                        </Text>
                        <Text style={styles.emptyTitle}>Nenhum fiado em aberto</Text>
                        <Text style={styles.emptyText}>
                            Quando você vender fiado, o cliente aparece aqui com o valor e a data
                            combinada para pagamento.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {debtors.map((debtor) => {
                            const days = daysUntil(debtor.dueDate);
                            const tone = creditDueTone(days);
                            const label = creditDueLabel(days);

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
                                        pressed ? styles.pressed : null,
                                    ]}
                                >
                                    <View style={styles.cardTop}>
                                        <Text style={styles.name}>{debtor.customerName}</Text>
                                        <Text style={styles.balance}>
                                            {formatCents(debtor.balanceCents)}
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.badge,
                                            tone === "danger"
                                                ? styles.badgeDanger
                                                : tone === "warning"
                                                  ? styles.badgeWarning
                                                  : styles.badgeOk,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.badgeText,
                                                tone === "danger"
                                                    ? styles.badgeTextDanger
                                                    : tone === "warning"
                                                      ? styles.badgeTextWarning
                                                      : styles.badgeTextOk,
                                            ]}
                                        >
                                            {label}
                                        </Text>
                                    </View>

                                    <Text style={styles.meta}>
                                        {debtor.creditCount} compra
                                        {debtor.creditCount === 1 ? "" : "s"} em aberto • Data
                                        combinada: {formatDateBR(debtor.dueDate)}
                                    </Text>
                                    {debtor.phone ? (
                                        <Text style={styles.phone}>
                                            Telefone: {formatPhone(debtor.phone)}
                                        </Text>
                                    ) : null}

                                    <Text style={styles.openHint}>
                                        Toque para ver e registrar pagamento
                                    </Text>
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
    card: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    pressed: {
        opacity: 0.8,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    name: {
        flex: 1,
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
    },
    balance: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
        textAlign: "right",
    },
    badge: {
        alignSelf: "flex-start",
        borderWidth: 2,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    badgeDanger: {
        backgroundColor: theme.colors.dangerSurface,
        borderColor: theme.colors.danger,
    },
    badgeWarning: {
        backgroundColor: theme.colors.warningSurface,
        borderColor: theme.colors.warning,
    },
    badgeOk: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.primary,
    },
    badgeText: {
        fontSize: theme.font.small,
        fontWeight: "800",
    },
    badgeTextDanger: {
        color: theme.colors.danger,
    },
    badgeTextWarning: {
        color: theme.colors.warning,
    },
    badgeTextOk: {
        color: theme.colors.primary,
    },
    meta: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    phone: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    openHint: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        fontWeight: "700",
        color: theme.colors.primary,
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
