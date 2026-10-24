import { useQuery } from "convex/react";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { CreditPaymentDialog } from "@/components/CreditPaymentDialog";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { api, type Id } from "@/lib/api";
import {
    buildCreditReminderText,
    creditBalanceCents,
    creditDueLabel,
    creditDueTone,
    creditPaymentMethodLabels,
    isCreditOpen,
} from "@/lib/credit";
import { daysUntil, formatDateBR, formatDateTimeBR } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { buildWhatsAppUrl } from "@/lib/sale";
import { formatPhone, onlyDigits } from "@/lib/validation";
import { theme } from "@/theme";

export default function CreditCustomerScreen() {
    const params = useLocalSearchParams<{ id?: string }>();
    const customerId =
        typeof params.id === "string" && params.id ? (params.id as Id<"customers">) : undefined;

    const data = useQuery(
        api.credits.byCustomer,
        customerId ? { customerId } : "skip",
    );

    const [payingCreditId, setPayingCreditId] = useState<Id<"credits"> | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (customerId === undefined) {
        return (
            <>
                <ScreenHeader title="Fiado do cliente" helpKey="fiado-detalhe" showBack />
                <Screen>
                    <ErrorBanner message="Cliente não encontrado. Volte para Quem deve." />
                    <BigButton label="Ir para Quem deve" onPress={() => router.replace("/fiado")} />
                </Screen>
            </>
        );
    }

    if (data === undefined) {
        return <LoadingScreen />;
    }

    if (data === null) {
        return (
            <>
                <ScreenHeader title="Fiado do cliente" helpKey="fiado-detalhe" showBack />
                <Screen>
                    <ErrorBanner message="Este cliente não foi encontrado na sua loja." />
                    <BigButton label="Ir para Quem deve" onPress={() => router.replace("/fiado")} />
                </Screen>
            </>
        );
    }

    const { customer, credits, payments } = data;
    const openCredits = credits.filter(isCreditOpen);
    const totalBalanceCents = openCredits.reduce(
        (total, credit) => total + creditBalanceCents(credit),
        0,
    );
    const nextDueDate =
        openCredits.length > 0
            ? Math.min(...openCredits.map((credit) => credit.dueDate))
            : null;
    const payingCredit =
        credits.find((credit) => credit._id === payingCreditId) ?? null;
    const phoneDigits = onlyDigits(customer.phone ?? "");
    const creditById = new Map(credits.map((credit) => [credit._id, credit]));

    const openPhone = async (url: string, failureMessage: string) => {
        try {
            await Linking.openURL(url);
        } catch {
            Alert.alert("Não foi possível abrir", failureMessage);
        }
    };

    const handleCall = () => {
        if (!phoneDigits) {
            Alert.alert(
                "Cliente sem telefone",
                "O telefone não está cadastrado. Confira o cadastro do cliente.",
            );
            return;
        }
        void openPhone(`tel:${phoneDigits}`, "Confira se o aparelho pode fazer ligações.");
    };

    const handleWhatsApp = () => {
        if (!phoneDigits) {
            Alert.alert(
                "Cliente sem telefone",
                "O telefone não está cadastrado. Confira o cadastro do cliente.",
            );
            return;
        }
        if (!nextDueDate || totalBalanceCents <= 0) {
            Alert.alert("Nada para cobrar", "Este cliente não tem fiado em aberto.");
            return;
        }

        const text = buildCreditReminderText({
            customerName: customer.name,
            balanceCents: totalBalanceCents,
            dueDate: nextDueDate,
        });
        void openPhone(
            buildWhatsAppUrl(phoneDigits, text),
            "Confira se o WhatsApp está instalado e tente de novo.",
        );
    };

    const handlePaid = (message: string) => {
        setPayingCreditId(null);
        setError(null);
        setSuccess(message);
    };

    return (
        <>
            <ScreenHeader
                title="Fiado do cliente"
                subtitle={customer.name}
                helpKey="fiado-detalhe"
                showBack
            />
            <Screen>
                <ErrorBanner message={error} />
                {success ? (
                    <View
                        style={styles.successBox}
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite"
                    >
                        <Text style={styles.successText}>✓ {success}</Text>
                    </View>
                ) : null}

                <View style={styles.customerCard}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerLine}>
                        {customer.phone
                            ? `Telefone: ${formatPhone(customer.phone)}`
                            : "Sem telefone cadastrado"}
                    </Text>
                    <Text style={styles.customerLine}>
                        {customer.address
                            ? `Endereço: ${customer.address}`
                            : "Sem endereço cadastrado"}
                    </Text>

                    <View style={styles.balanceBox}>
                        <Text style={styles.balanceLabel}>Saldo devedor total</Text>
                        <Text style={styles.balanceValue}>
                            {formatCents(totalBalanceCents)}
                        </Text>
                        {nextDueDate ? (
                            <Text style={styles.dueText}>
                                Próximo vencimento: {formatDateBR(nextDueDate)} •{" "}
                                {creditDueLabel(daysUntil(nextDueDate))}
                            </Text>
                        ) : (
                            <Text style={styles.dueText}>Nenhuma compra em aberto</Text>
                        )}
                    </View>
                </View>

                <BigButton
                    label="Ligar"
                    description="Abrir o telefone do cliente"
                    icon="☎️"
                    variant="secondary"
                    onPress={handleCall}
                    disabled={!phoneDigits}
                />
                <BigButton
                    label="Cobrar no WhatsApp"
                    description="Abrir uma mensagem educada pronta"
                    icon="💬"
                    variant="secondary"
                    onPress={handleWhatsApp}
                    disabled={!phoneDigits || openCredits.length === 0}
                />

                <Text style={styles.sectionTitle}>Compras em aberto</Text>

                {openCredits.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>Nenhuma compra em aberto</Text>
                        <Text style={styles.emptyText}>
                            Este cliente já pagou tudo o que devia. Os pagamentos continuam no
                            histórico abaixo.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {openCredits.map((credit) => {
                            const days = daysUntil(credit.dueDate);
                            const tone = creditDueTone(days);
                            const balanceCents = creditBalanceCents(credit);

                            return (
                                <View key={credit._id} style={styles.creditCard}>
                                    <View style={styles.creditTop}>
                                        <Text style={styles.creditTitle}>
                                            Compra de {formatDateBR(credit.createdAt)}
                                        </Text>
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
                                                {creditDueLabel(days)}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.creditMeta}>
                                        Vencimento: {formatDateBR(credit.dueDate)}
                                    </Text>

                                    <View style={styles.amountRow}>
                                        <Text style={styles.amountLabel}>Valor da compra</Text>
                                        <Text style={styles.amountValue}>
                                            {formatCents(credit.totalCents)}
                                        </Text>
                                    </View>
                                    {credit.paidCents > 0 ? (
                                        <View style={styles.amountRow}>
                                            <Text style={styles.amountLabel}>Já pago</Text>
                                            <Text style={styles.amountValue}>
                                                {formatCents(credit.paidCents)}
                                            </Text>
                                        </View>
                                    ) : null}
                                    <View style={styles.amountRow}>
                                        <Text style={styles.balanceLabelSmall}>
                                            Saldo desta compra
                                        </Text>
                                        <Text style={styles.creditBalance}>
                                            {formatCents(balanceCents)}
                                        </Text>
                                    </View>

                                    {credit.note ? (
                                        <Text style={styles.note}>
                                            Observação: {credit.note}
                                        </Text>
                                    ) : null}

                                    <BigButton
                                        label="Registrar pagamento"
                                        description={`Saldo: ${formatCents(balanceCents)}`}
                                        icon="💵"
                                        onPress={() => {
                                            setSuccess(null);
                                            setError(null);
                                            setPayingCreditId(credit._id);
                                        }}
                                    />
                                </View>
                            );
                        })}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Histórico de pagamentos</Text>

                {payments.length === 0 ? (
                    <Text style={styles.infoText}>
                        Nenhum pagamento recebido ainda. Quando o cliente pagar, use Registrar
                        pagamento em uma das compras em aberto.
                    </Text>
                ) : (
                    <View style={styles.list}>
                        {payments.map((payment) => {
                            const credit = creditById.get(payment.creditId);
                            return (
                                <View key={payment._id} style={styles.paymentCard}>
                                    <View style={styles.paymentTop}>
                                        <Text style={styles.paymentAmount}>
                                            {formatCents(payment.amountCents)}
                                        </Text>
                                        <Text style={styles.paymentMethod}>
                                            {creditPaymentMethodLabels[payment.method]}
                                        </Text>
                                    </View>
                                    <Text style={styles.paymentDate}>
                                        {formatDateTimeBR(payment.paidAt)}
                                    </Text>
                                    {credit ? (
                                        <Text style={styles.paymentCredit}>
                                            Compra de {formatDateBR(credit.createdAt)}
                                        </Text>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                )}

                <BigButton
                    label="Voltar para Quem deve"
                    onPress={() => router.replace("/fiado")}
                    variant="ghost"
                />
            </Screen>

            {payingCredit ? (
                <CreditPaymentDialog
                    key={payingCredit._id}
                    visible
                    credit={payingCredit}
                    customerName={customer.name}
                    onClose={() => setPayingCreditId(null)}
                    onPaid={handlePaid}
                />
            ) : null}
        </>
    );
}

const styles = StyleSheet.create({
    successBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
    },
    successText: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    customerCard: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    customerName: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
    },
    customerLine: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    balanceBox: {
        marginTop: theme.spacing.xs,
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    balanceLabel: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    balanceValue: {
        fontSize: 36,
        lineHeight: 42,
        fontWeight: "800",
        color: theme.colors.text,
    },
    dueText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
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
    creditCard: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    creditTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    creditTitle: {
        flex: 1,
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "800",
        color: theme.colors.text,
    },
    creditMeta: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    badge: {
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
    amountRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        paddingTop: theme.spacing.xs,
    },
    amountLabel: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    amountValue: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    balanceLabelSmall: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        fontWeight: "700",
        color: theme.colors.text,
    },
    creditBalance: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
    },
    note: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        backgroundColor: theme.colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
    },
    paymentCard: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    paymentTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    paymentAmount: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
    },
    paymentMethod: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    paymentDate: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    paymentCredit: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    infoText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        backgroundColor: theme.colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
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
