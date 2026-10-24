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
import { TextField } from "@/components/TextField";
import {
    formatQuantityWithUnit,
    isValidQuantityForUnit,
    parseQuantity,
} from "@/lib/quantity";
import type { ProductUnit } from "@/lib/types";
import { theme } from "@/theme";

type SaleQuantityDialogProps = {
    visible: boolean;
    itemName: string;
    currentQuantity: number;
    maxQuantity: number;
    unit: ProductUnit;
    onSave: (quantity: number) => void;
    onClose: () => void;
};

export function SaleQuantityDialog({
    visible,
    itemName,
    currentQuantity,
    maxQuantity,
    unit,
    onSave,
    onClose,
}: SaleQuantityDialogProps) {
    const [text, setText] = useState(() =>
        currentQuantity.toFixed(3).replace(".", ",").replace(/,?0+$/, ""),
    );
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        const quantity = parseQuantity(text);
        if (!isValidQuantityForUnit(quantity, unit)) {
            setError(
                unit === "kg"
                    ? "Digite a quantidade em quilos. Exemplo: 1,5."
                    : "Digite uma quantidade inteira, sem vírgula.",
            );
            return;
        }
        if (quantity > maxQuantity + 1e-9) {
            setError(`Só tem ${formatQuantityWithUnit(maxQuantity, unit)} em estoque.`);
            return;
        }
        onSave(Math.round(quantity * 1000) / 1000);
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
                    <Text style={styles.title}>Corrigir quantidade</Text>
                    <Text style={styles.itemName}>{itemName}</Text>
                    <Text style={styles.available}>
                        Disponível em estoque: {formatQuantityWithUnit(maxQuantity, unit)}
                    </Text>

                    <TextField
                        label={unit === "kg" ? "Quantidade (kg)" : "Quantidade"}
                        required
                        value={text}
                        onChangeText={(value) => {
                            setText(value);
                            setError(null);
                        }}
                        error={error}
                        keyboardType={unit === "kg" ? "decimal-pad" : "number-pad"}
                        placeholder={unit === "kg" ? "Ex.: 1,5" : "Ex.: 2"}
                        maxLength={8}
                        info="Digite a quantidade exata que o cliente está levando."
                    />

                    <BigButton label="Usar esta quantidade" onPress={handleSave} icon="✓" />
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
    available: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.textMuted,
    },
});
