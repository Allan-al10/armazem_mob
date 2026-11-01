import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HelpModal } from "@/components/HelpModal";
import { Logo } from "@/components/Logo";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type ScreenHeaderProps = {
    title: string;
    subtitle?: string;
    helpKey: string;
    showBack?: boolean;
    onBack?: () => void;
    actionIcon?: string;
    actionLabel?: string;
    onAction?: () => void;
};

export function ScreenHeader({
    title,
    subtitle,
    helpKey,
    showBack = false,
    onBack,
    actionIcon,
    actionLabel,
    onAction,
}: ScreenHeaderProps) {
    const insets = useSafeAreaInsets();
    const { revision } = useAppTheme();
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

    const hasAction = Boolean(actionIcon && onAction);

    return (
        <>
            <View
                key={revision}
                style={[styles.container, { paddingTop: insets.top + theme.spacing.md }]}
            >
                <View style={styles.topRow}>
                    <View style={styles.side}>
                        {showBack ? (
                            <Pressable
                                onPress={handleBack}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="Voltar"
                                style={({ pressed }) => [
                                    styles.circleButton,
                                    pressed ? styles.pressed : null,
                                ]}
                            >
                                <Text style={styles.circleText}>←</Text>
                            </Pressable>
                        ) : (
                            <Logo size={40} />
                        )}
                    </View>

                    <View style={styles.titleBlock}>
                        <Text
                            accessibilityRole="header"
                            numberOfLines={2}
                            style={styles.title}
                        >
                            {title}
                        </Text>
                    </View>

                    <View style={[styles.side, styles.sideRight]}>
                        {hasAction ? (
                            <Pressable
                                onPress={onAction}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel={actionLabel ?? "Ação"}
                                style={({ pressed }) => [
                                    styles.circleButton,
                                    pressed ? styles.pressed : null,
                                ]}
                            >
                                <Text style={styles.circleText}>{actionIcon}</Text>
                            </Pressable>
                        ) : null}

                        <Pressable
                            onPress={() => setHelpVisible(true)}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel="Abrir ajuda desta tela"
                            style={({ pressed }) => [
                                styles.circleButton,
                                pressed ? styles.pressed : null,
                            ]}
                        >
                            <Text style={styles.helpMark}>?</Text>
                        </Pressable>
                    </View>
                </View>

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
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.header,
        borderBottomWidth: 2,
        borderBottomColor: "rgba(255, 255, 255, 0.18)",
        gap: theme.spacing.xs,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 48,
        gap: theme.spacing.sm,
    },
    side: {
        width: 88,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    sideRight: {
        justifyContent: "flex-end",
    },
    titleBlock: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
    },
    circleButton: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    circleText: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "700",
        color: theme.colors.onPrimary,
    },
    helpMark: {
        fontSize: 24,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.onPrimary,
    },
    pressed: {
        opacity: 0.65,
    },
    title: {
        fontSize: theme.font.title,
        lineHeight: theme.lineHeight.title,
        fontWeight: "700",
        color: theme.colors.onPrimary,
        textAlign: "center",
    },
    subtitle: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: "rgba(255, 255, 255, 0.82)",
        textAlign: "center",
        paddingHorizontal: theme.spacing.xl,
    },
});
