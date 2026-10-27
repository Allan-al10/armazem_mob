import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BigButton } from "@/components/BigButton";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { getHelp } from "@/lib/help";
import { theme } from "@/theme";

type HelpModalProps = {
    visible: boolean;
    helpKey: string;
    onClose: () => void;
};

export function HelpModal({ visible, helpKey, onClose }: HelpModalProps) {
    const help = getHelp(helpKey);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.card} accessibilityViewIsModal>
                    <Text style={styles.kicker}>Ajuda</Text>
                    <Text style={styles.title}>{help.title}</Text>

                    <ScrollView
                        style={styles.stepsScroll}
                        contentContainerStyle={styles.steps}
                        showsVerticalScrollIndicator={false}
                    >
                        {help.steps.map((step, index) => (
                            <View key={`${index}-${step}`} style={styles.stepRow}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText} maxFontSizeMultiplier={1.4}>
                                        {index + 1}
                                    </Text>
                                </View>
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
        justifyContent: "center",
        padding: theme.spacing.xl,
    },
    card: {
        maxHeight: "88%",
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    kicker: {
        fontSize: theme.font.small,
        fontWeight: "800",
        color: theme.colors.primary,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    title: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: "800",
        color: theme.colors.text,
    },
    stepsScroll: {
        flexGrow: 0,
        flexShrink: 1,
    },
    steps: {
        gap: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    stepRow: {
        flexDirection: "row",
        gap: theme.spacing.md,
        alignItems: "flex-start",
    },
    stepNumber: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumberText: {
        color: theme.colors.onPrimary,
        fontSize: theme.font.small,
        fontWeight: "800",
    },
    stepText: {
        flex: 1,
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.text,
    },
});
