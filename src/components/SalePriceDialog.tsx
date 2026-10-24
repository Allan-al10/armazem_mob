import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BigButton } from "@/components/BigButton";
import { MoneyInput } from "@/components/MoneyInput";
import { formatCents } from "@/lib/money";
import { theme } from "@/theme";

type SalePriceDialogProps = {
    visible: boolean;
    itemName: string;
    currentPriceCents: number;
    tablePriceCents: number;
    onSave: (cents: number) => void;
    onClose: () => void;
};

export function SalePriceDialog({
    visible,
    itemName,
    currentPriceCents,
    tablePriceCents,
    onSave,
    onClose,
}: SalePriceDialogProps) {
    const [draftCents, setDraftCents] = useState(currentPriceCents);
    const [error, setError] = useState<string | null>(null);

    const differenceCents = draftCents - tablePriceCents;

    const handleSave = () => {
        if (draftCents <= 0) {
            setError("Digite um preço maior que zero.");
            return;
        }
        onSave(draftCents);
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
                    <Text style={styles.title}>Alterar preço</Text>
                    <Text style={styles.itemName}>{itemName}</Text>
                    <Text style={styles.tablePrice}>
                        Preço de tabela: {formatCents(tablePriceCents)}
                    </Text>

                    <MoneyInput
                        label="Novo preço por unidade"
                        required
                        valueCents={draftCents}
                        onChangeCents={(cents) => {
                            setDraftCents(cents);
                            setError(null);
                        }}
                        error={error}
                        info="O preço de tabela não muda. Esta alteração vale só para esta venda."
                    />

                    {draftCents > 0 && differenceCents < 0 ? (
                        <Text style={styles.discount}>
                            Desconto de {formatCents(Math.abs(differenceCents))} por unidade.
                        </Text>
                    ) : null}
                    {draftCents > 0 && differenceCents > 0 ? (
                        <Text style={styles.increase}>
                            Aumento de {formatCents(differenceCents)} por unidade.
                        </Text>
                    ) : null}

                    <BigButton label="Usar este preço" onPress={handleSave} icon="✓" />
                    <BigButton label="Cancelar" onPress={onClose} variant="ghost" />
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
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
    },
    title: {
        fontSize: theme.font.title,
        lineHeight: theme.lineHeight.title,
        fontWeight: "800",
        color: theme.colors.text,
    },
    itemName: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "700",
        color: theme.colors.text,
    },
    tablePrice: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.textMuted,
    },
    discount: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.primary,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
    },
    increase: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.warning,
        backgroundColor: theme.colors.warningSurface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
    },
});
