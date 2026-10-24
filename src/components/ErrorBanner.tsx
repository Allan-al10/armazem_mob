import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

type ErrorBannerProps = {
    message?: string | null;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
    if (!message) return null;

    return (
        <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.icon}>⚠</Text>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: theme.spacing.md,
        backgroundColor: theme.colors.dangerSurface,
        borderWidth: 2,
        borderColor: theme.colors.danger,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
    },
    icon: {
        fontSize: 24,
        color: theme.colors.danger,
        lineHeight: 28,
    },
    text: {
        flex: 1,
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.danger,
        fontWeight: "600",
    },
});
