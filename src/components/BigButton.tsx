import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type Variant = "primary" | "secondary" | "accent" | "success" | "danger" | "ghost";

type BigButtonProps = {
    label: string;
    onPress: () => void;
    icon?: string;
    description?: string;
    variant?: Variant;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityHint?: string;
};

export function BigButton({
    label,
    onPress,
    icon,
    description,
    variant = "primary",
    loading = false,
    disabled = false,
    style,
    accessibilityHint,
}: BigButtonProps) {
    const { colors } = useAppTheme();
    const isDisabled = disabled || loading;
    const isLightText =
        variant === "primary" ||
        variant === "accent" ||
        variant === "success" ||
        variant === "danger";
    const indicatorColor = isLightText ? colors.onPrimary : colors.primaryInk;

    const variantStyle: ViewStyle =
        variant === "primary"
            ? { backgroundColor: colors.primary, borderColor: colors.primary }
            : variant === "accent"
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : variant === "success"
                ? { backgroundColor: colors.success, borderColor: colors.success }
                : variant === "danger"
                  ? { backgroundColor: colors.danger, borderColor: colors.danger }
                  : variant === "secondary"
                    ? { backgroundColor: colors.card, borderColor: colors.primaryInk }
                    : { backgroundColor: "transparent", borderColor: "transparent" };

    const labelColor = isLightText ? colors.onPrimary : colors.primaryInk;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            style={({ pressed }) => [
                styles.base,
                variantStyle,
                description ? styles.withDescription : null,
                pressed && !isDisabled ? styles.pressed : null,
                isDisabled ? styles.disabled : null,
                style,
            ]}
        >
            {loading ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="large" color={indicatorColor} />
                    <Text style={[styles.label, { color: labelColor }]}>Aguarde...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {icon ? (
                        <Text
                            style={styles.icon}
                            accessibilityElementsHidden
                            importantForAccessibility="no"
                        >
                            {icon}
                        </Text>
                    ) : null}
                    <View style={styles.texts}>
                        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
                        {description ? (
                            <Text
                                style={[
                                    styles.description,
                                    {
                                        color: isLightText
                                            ? "rgba(255, 255, 255, 0.88)"
                                            : colors.textMuted,
                                    },
                                ]}
                            >
                                {description}
                            </Text>
                        ) : null}
                    </View>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: theme.touch.button,
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        justifyContent: "center",
    },
    withDescription: {
        minHeight: 76,
    },
    pressed: {
        opacity: 0.82,
    },
    disabled: {
        opacity: 0.5,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.md,
    },
    icon: {
        fontSize: 28,
        lineHeight: 32,
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    label: {
        fontSize: theme.font.button,
        fontWeight: "700",
        lineHeight: 24,
    },
    description: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
    },
});
