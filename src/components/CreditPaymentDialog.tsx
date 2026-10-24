import { useMutation } from "convex/react";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BigButton } from "@/components/BigButton";
import { ChoiceRow } from "@/components/ChoiceRow";
import { MoneyInput } from "@/components/MoneyInput";
import { api } from "@/lib/api";
import {
    creditBalanceCents,
    type Credit,
    type CreditPaymentMethod,
} from "@/lib/credit";
import { friendlyError } from "@/lib/errors";
import { fieldHelp } from "@/lib/help";
import { formatCents } from "@/lib/money";
import { theme } from "@/theme";

const PAYMENT_OPTIONS = [
    { value: "cash", label: "Dinheiro" },
    { value: "card", label: "Cartão" },
    { value: "pix", label: "Pix" },
] as const;

type CreditPaymentDialogProps = {
    visible: boolean;
    credit: Credit;
    /** Nome atual do cadastro do cliente (o fiado guarda o nome da época). */
    customerName: string;
    onClose: () => void;
    onPaid: (message: string) => void;
};

export function CreditPaymentDialog({
    visible,
    credit,
    customerName,
    onClose,
    onPaid,
}: CreditPaymentDialogProps) {
    const registerPayment = useMutation(api.credits.registerPayment);
    const [amountCents, setAmountCents] = useState(0);
    const [method, setMethod] = useState<CreditPaymentMethod>("cash");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const balanceCents = creditBalanceCents(credit);
    const remainingCents = Math.max(0, balanceCents - amountCents);

    const handleConfirm = async () => {
        if (amountCents <= 0) {
            setError("Digite o valor que o cliente pagou.");
            return;
        }
        if (amountCents > balanceCents) {
            setError(
                `O valor é maior que o saldo de ${formatCents(balanceCents)}. Confira o valor.`,
            );
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const result = await registerPayment({
                creditId: credit._id,
                amountCents,
                method,
            });
            onPaid(
                result.fullyPaid
                    ? "Compra quitada! O saldo desta compra ficou zerado."
                    : `Pagamento registrado. Saldo desta compra: ${formatCents(
                          result.balanceCents,
                      )}.`,
            );
        } catch (err) {
            setError(
                friendlyError(err, "Não foi possível registrar o pagamento. Tente de novo."),
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.card} accessibilityViewIsModal>
                    <ScrollView
                        contentContainerStyle={styles.cardContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator
                    >
                        <Text style={styles.title}>Registrar pagamento</Text>
                        <Text style={styles.customer}>{customerName}</Text>

                        <View style={styles.balanceBox}>
                            <Text style={styles.balanceLabel}>Saldo devedor</Text>
                            <Text style={styles.balanceValue}>{formatCents(balanceCents)}</Text>
                        </View>

                        <MoneyInput
                            label="Valor recebido"
                            required
                            info={fieldHelp.creditPayment}
                            valueCents={amountCents}
                            onChangeCents={(cents) => {
                                setAmountCents(cents);
                                setError(null);
                            }}
                            error={error}
                        />

                        <BigButton
                            label="Usar o saldo todo"
                            description={formatCents(balanceCents)}
                            variant="secondary"
                            onPress={() => {
                                setAmountCents(balanceCents);
                                setError(null);
                            }}
                            disabled={saving}
                        />

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Forma de pagamento</Text>
                            <ChoiceRow
                                options={PAYMENT_OPTIONS}
                                value={method}
                                onChange={(value) => {
                                    setMethod(value);
                                    setError(null);
                                }}
                            />
                        </View>

                        {amountCents > 0 && amountCents <= balanceCents ? (
                            <Text style={styles.after}>
                                Saldo depois do pagamento: {formatCents(remainingCents)}
                            </Text>
                        ) : null}

                        <BigButton
                            label="Confirmar pagamento"
                            description="O saldo cai na hora"
                            icon="✓"
                            onPress={handleConfirm}
                            loading={saving}
                        />
                        <BigButton
                            label="Cancelar"
                            onPress={onClose}
                            variant="ghost"
                            disabled={saving}
                        />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: "center",
        padding: theme.spacing.xl,
    },
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        maxHeight: "92%",
        overflow: "hidden",
    },
    cardContent: {
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
    },
    title: {
        fontSize: theme.font.title,
        lineHeight: theme.lineHeight.title,
        fontWeight: "800",
        color: theme.colors.text,
    },
    customer: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "700",
        color: theme.colors.text,
    },
    balanceBox: {
        backgroundColor: theme.colors.surface,
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
        fontSize: 32,
        lineHeight: 38,
        fontWeight: "800",
        color: theme.colors.text,
    },
    fieldGroup: {
        gap: theme.spacing.md,
    },
    fieldLabel: {
        fontSize: theme.font.label,
        fontWeight: "700",
        color: theme.colors.text,
        lineHeight: 26,
    },
    after: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        fontWeight: "700",
        color: theme.colors.primary,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
    },
});
