import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type FeedbackTone = "success" | "danger" | "warning" | "info";

const DEFAULT_ICON: Record<FeedbackTone, string> = {
    success: "✓",
    danger: "⚠",
    warning: "⏰",
    info: "i",
};

export function FeedbackBanner({
    tone,
    title,
    message,
    icon,
    onPress,
}: {
    tone: FeedbackTone;
    title: string;
    message?: string;
    icon?: string;
    onPress?: () => void;
}) {
    const { colors } = useAppTheme();

    const border =
        tone === "success"
            ? colors.success
            : tone === "danger"
              ? colors.danger
              : tone === "warning"
                ? colors.warn
                : colors.primaryInk;
    const background =
        tone === "success"
            ? colors.successBg
            : tone === "danger"
              ? colors.dangerBg
              : tone === "warning"
                ? colors.warnBg
                : colors.card;
    const ink =
        tone === "success"
            ? colors.success
            : tone === "danger"
              ? colors.danger
              : tone === "warning"
                ? colors.warnInk
                : colors.primaryInk;

    const content = (
        <View
            style={[styles.content, { borderColor: border, backgroundColor: background }]}
            accessibilityLiveRegion="polite"
        >
            <View style={[styles.iconCircle, { backgroundColor: border }]}>
                <Text
                    style={[
                        styles.icon,
                        { color: tone === "warning" ? "#1D2733" : colors.onPrimary },
                    ]}
                >
                    {icon ?? DEFAULT_ICON[tone]}
                </Text>
            </View>
            <View style={styles.texts}>
                <Text style={[styles.title, { color: ink }]}>{title}</Text>
                {message ? <Text style={[styles.message, { color: ink }]}>{message}</Text> : null}
            </View>
            {onPress ? <Text style={[styles.arrow, { color: ink }]}>›</Text> : null}
        </View>
    );

    if (!onPress) return content;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${message ?? ""}`}
            style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
            {content}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    content: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "700",
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    message: {
        fontSize: theme.font.small,
        lineHeight: 20,
        fontWeight: "400",
    },
    arrow: {
        fontSize: 28,
        lineHeight: 30,
        fontWeight: "700",
    },
    pressed: {
        opacity: 0.75,
    },
});
