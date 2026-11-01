import { Pressable, StyleSheet, Text, View } from "react-native";
import type { QuickAccessItem } from "@/lib/preferences";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

export function BigActionButton({
    item,
    onPress,
}: {
    item: QuickAccessItem;
    onPress: () => void;
}) {
    const { colors } = useAppTheme();

    const iconColor =
        item.color === "accent"
            ? colors.accent
            : item.color === "yellow"
              ? colors.yellow
              : item.color === "success"
                ? colors.success
                : item.color === "danger"
                  ? colors.danger
                  : item.color === "header"
                    ? colors.header
                    : colors.primary;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}. ${item.subtitle}`}
            accessibilityHint="Toque para abrir"
            style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed ? styles.pressed : null,
            ]}
        >
            <View style={[styles.iconSquare, { backgroundColor: iconColor }]}>
                <Text
                    style={[
                        styles.icon,
                        { color: item.color === "yellow" ? "#1D2733" : colors.onPrimary },
                    ]}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                >
                    {item.icon}
                </Text>
            </View>

            <View style={styles.texts}>
                <Text style={[styles.title, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {item.subtitle}
                </Text>
            </View>

            <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        minHeight: 68,
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    pressed: {
        opacity: 0.75,
    },
    iconSquare: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        fontSize: 23,
        lineHeight: 28,
    },
    texts: {
        flex: 1,
        gap: 1,
    },
    title: {
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
    arrow: {
        fontSize: 28,
        lineHeight: 30,
        fontWeight: "700",
    },
});
