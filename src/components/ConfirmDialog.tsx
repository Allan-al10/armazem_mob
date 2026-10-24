import { Modal, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { theme } from "@/theme";

type ConfirmDialogProps = {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    visible,
    title,
    message,
    confirmLabel = "Sim, confirmar",
    cancelLabel = "Não, voltar",
    destructive = false,
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.card} accessibilityViewIsModal>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.actions}>
                        <BigButton
                            label={confirmLabel}
                            onPress={onConfirm}
                            variant={destructive ? "danger" : "primary"}
                            loading={loading}
                        />
                        <BigButton
                            label={cancelLabel}
                            onPress={onCancel}
                            variant="secondary"
                            disabled={loading}
                        />
                    </View>
                </View>
            </View>
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
        borderRadius: theme.radius.xl,
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
    },
    title: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: "800",
        color: theme.colors.text,
    },
    message: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.text,
    },
    actions: {
        gap: theme.spacing.md,
    },
});
