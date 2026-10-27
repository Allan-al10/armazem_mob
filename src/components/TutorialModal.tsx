import { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { StepIndicator } from "@/components/StepIndicator";
import { getTutorial } from "@/lib/help";
import { theme } from "@/theme";

type TutorialModalProps = {
    visible: boolean;
    tutorialKey: string;
    onClose: () => void;
};

export function TutorialModal({
    visible,
    tutorialKey,
    onClose,
}: TutorialModalProps) {
    const insets = useSafeAreaInsets();
    const [index, setIndex] = useState(0);
    const steps = getTutorial(tutorialKey);
    const step = steps[Math.min(index, steps.length - 1)];
    const isLast = index >= steps.length - 1;

    if (!visible) return null;

    const handleClose = () => {
        setIndex(0);
        onClose();
    };

    const handleNext = () => {
        if (isLast) {
            handleClose();
            return;
        }
        setIndex((current) => current + 1);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View
                style={[
                    styles.overlay,
                    {
                        paddingTop: insets.top + theme.spacing.md,
                        paddingBottom: insets.bottom + theme.spacing.md,
                    },
                ]}
            >
                <View style={styles.card} accessibilityViewIsModal>
                    <Text style={styles.kicker}>Tutorial</Text>
                    <StepIndicator
                        current={index + 1}
                        total={steps.length}
                        label="Como usar o app"
                    />

                    <ScrollView
                        style={styles.contentScroll}
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text
                            style={styles.icon}
                            accessibilityElementsHidden
                            importantForAccessibility="no"
                        >
                            {step.icon}
                        </Text>
                        <Text style={styles.title}>{step.title}</Text>
                        <Text style={styles.text}>{step.text}</Text>
                    </ScrollView>

                    <View style={styles.actions}>
                        <ReadAloudButton
                            key={`${tutorialKey}-${index}`}
                            text={`${step.title}. ${step.text}`}
                            label="Ouvir esta explicação"
                        />
                        <BigButton
                            label={isLast ? "Começar a usar" : "Próximo"}
                            onPress={handleNext}
                        />
                        <BigButton
                            label="Pular tutorial"
                            variant="ghost"
                            onPress={handleClose}
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
        paddingHorizontal: theme.spacing.xl,
    },
    card: {
        maxHeight: "94%",
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
    contentScroll: {
        flexGrow: 0,
        flexShrink: 1,
    },
    content: {
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    icon: {
        fontSize: 56,
        lineHeight: 64,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: theme.colors.text,
    },
    text: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 32,
        color: theme.colors.text,
    },
    actions: {
        gap: theme.spacing.sm,
    },
});
