import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HelpModal } from "@/components/HelpModal";
import { theme } from "@/theme";

type ScreenHeaderProps = {
    title: string;
    subtitle?: string;
    helpKey: string;
    showBack?: boolean;
    onBack?: () => void;
};

export function ScreenHeader({
    title,
    subtitle,
    helpKey,
    showBack = false,
    onBack,
}: ScreenHeaderProps) {
    const insets = useSafeAreaInsets();
    const [helpVisible, setHelpVisible] = useState(false);

    const handleBack = () => {
        if (onBack) {
            onBack();
            return;
        }
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/");
    };

    return (
        <>
            <View style={[styles.container, { paddingTop: insets.top + theme.spacing.sm }]}>
                <View style={styles.topRow}>
                    {showBack ? (
                        <Pressable
                            onPress={handleBack}
                            accessibilityRole="button"
                            accessibilityLabel="Voltar"
                            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
                        >
                            <Text style={styles.backText}>← Voltar</Text>
                        </Pressable>
                    ) : (
                        <View />
                    )}

                    <Pressable
                        onPress={() => setHelpVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Abrir ajuda desta tela"
                        style={({ pressed }) => [styles.helpButton, pressed ? styles.pressed : null]}
                    >
                        <Text style={styles.helpText}>? Ajuda</Text>
                    </Pressable>
                </View>

                <Text accessibilityRole="header" style={styles.title}>
                    {title}
                </Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <HelpModal
                visible={helpVisible}
                helpKey={helpKey}
                onClose={() => setHelpVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        gap: theme.spacing.sm,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: theme.touch.min,
    },
    backButton: {
        minHeight: theme.touch.min,
        justifyContent: "center",
        paddingRight: theme.spacing.md,
    },
    backText: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    helpButton: {
        minHeight: theme.touch.min,
        minWidth: theme.touch.min,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
    },
    helpText: {
        fontSize: theme.font.small,
        fontWeight: "800",
        color: theme.colors.primary,
    },
    pressed: {
        opacity: 0.7,
    },
    title: {
        fontSize: theme.font.title,
        lineHeight: theme.lineHeight.title,
        fontWeight: "800",
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.font.subtitle,
        lineHeight: 29,
        color: theme.colors.textMuted,
    },
});
