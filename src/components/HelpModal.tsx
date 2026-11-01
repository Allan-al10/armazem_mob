import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { getHelp } from "@/lib/help";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type HelpModalProps = {
    visible: boolean;
    helpKey: string;
    onClose: () => void;
};

export function HelpModal({ visible, helpKey, onClose }: HelpModalProps) {
    const help = getHelp(helpKey);
    const insets = useSafeAreaInsets();
    const { revision } = useAppTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar ajuda"
                />

                <View
                    key={revision}
                    style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
                    accessibilityViewIsModal
                >
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <View style={styles.helpCircle}>
                            <Text style={styles.helpCircleText}>?</Text>
                        </View>
                        <Text style={styles.title}>{help.title}</Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Fechar ajuda"
                            style={({ pressed }) => [
                                styles.closeButton,
                                pressed ? styles.pressed : null,
                            ]}
                        >
                            <Text style={styles.closeText}>×</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.kicker}>COMO FUNCIONA</Text>

                    <ScrollView
                        style={styles.stepsScroll}
                        contentContainerStyle={styles.steps}
                        showsVerticalScrollIndicator={false}
                    >
                        {help.steps.map((step, index) => (
                            <View key={`${index}-${step}`} style={styles.stepRow}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {visible ? (
                        <ReadAloudButton
                            text={`${help.title}. ${help.steps.join(" ")}`}
                            label="Ouvir esta ajuda"
                        />
                    ) : null}

                    <BigButton label="Entendi" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: "flex-end",
    },
    sheet: {
        maxHeight: "90%",
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        borderTopWidth: 3,
        borderTopColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.screen,
        paddingTop: theme.spacing.sm,
        gap: theme.spacing.md,
    },
    handle: {
        alignSelf: "center",
        width: 44,
        height: 5,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.border,
        marginBottom: theme.spacing.xs,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    helpCircle: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    helpCircleText: {
        color: theme.colors.onPrimary,
        fontSize: 23,
        lineHeight: 28,
        fontWeight: "700",
    },
    title: {
        flex: 1,
        fontSize: theme.font.subtitle,
        lineHeight: 27,
        fontWeight: "700",
        color: theme.colors.text,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    closeText: {
        fontSize: 28,
        lineHeight: 30,
        fontWeight: "700",
        color: theme.colors.text,
    },
    pressed: {
        opacity: 0.65,
    },
    kicker: {
        fontSize: 13,
        fontWeight: "700",
        color: theme.colors.textMuted,
        letterSpacing: 0.8,
    },
    stepsScroll: {
        flexGrow: 0,
        flexShrink: 1,
    },
    steps: {
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    stepRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        alignItems: "flex-start",
    },
    bullet: {
        fontSize: 24,
        lineHeight: 27,
        fontWeight: "700",
        color: theme.colors.primaryInk,
    },
    stepText: {
        flex: 1,
        fontSize: theme.font.body,
        lineHeight: 26,
        color: theme.colors.text,
    },
});
