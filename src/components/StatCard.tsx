import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type StatTone = "primary" | "accent" | "success" | "danger" | "text";

export function StatCard({
    label,
    value,
    tone = "text",
    icon,
    style,
}: {
    label: string;
    value: string;
    tone?: StatTone;
    icon?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const { colors } = useAppTheme();
    const color =
        tone === "primary"
            ? colors.primaryInk
            : tone === "accent"
              ? colors.accent
              : tone === "success"
                ? colors.success
                : tone === "danger"
                  ? colors.danger
                  : colors.text;

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
            <View style={styles.labelRow}>
                {icon ? (
                    <Text
                        style={[styles.icon, { color }]}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                    >
                        {icon}
                    </Text>
                ) : null}
                <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
            </View>
            <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: 0,
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
        justifyContent: "space-between",
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
    },
    icon: {
        fontSize: 16,
        lineHeight: 20,
    },
    label: {
        flexShrink: 1,
        fontSize: 13,
        lineHeight: 17,
        fontWeight: "700",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    value: {
        fontSize: 21,
        lineHeight: 27,
        fontWeight: "700",
    },
});
