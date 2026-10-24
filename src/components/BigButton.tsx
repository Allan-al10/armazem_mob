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

type Variant = "primary" | "secondary" | "danger" | "ghost";

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

const variantStyles: Record<Variant, ViewStyle> = {
    primary: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    secondary: {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.primary,
    },
    danger: {
        backgroundColor: theme.colors.danger,
        borderColor: theme.colors.danger,
    },
    ghost: {
        backgroundColor: "transparent",
        borderColor: "transparent",
    },
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
    const isDisabled = disabled || loading;
    const isLightText = variant === "primary" || variant === "danger";
    const indicatorColor = isLightText ? theme.colors.onPrimary : theme.colors.primary;

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
                variantStyles[variant],
                description ? styles.withDescription : null,
                pressed && !isDisabled ? styles.pressed : null,
                isDisabled ? styles.disabled : null,
                style,
            ]}
        >
            {loading ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="large" color={indicatorColor} />
                    <Text style={[styles.label, isLightText ? styles.lightLabel : styles.darkLabel]}>
                        Aguarde...
                    </Text>
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
                        <Text style={[styles.label, isLightText ? styles.lightLabel : styles.darkLabel]}>
                            {label}
                        </Text>
                        {description ? (
                            <Text
                                style={[
                                    styles.description,
                                    isLightText ? styles.lightDescription : styles.darkDescription,
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
        minHeight: 80,
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
        fontSize: 30,
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    label: {
        fontSize: theme.font.button,
        fontWeight: "700",
        lineHeight: 28,
    },
    lightLabel: {
        color: theme.colors.onPrimary,
    },
    darkLabel: {
        color: theme.colors.primary,
    },
    description: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
    },
    lightDescription: {
        color: "#F2F7F2",
    },
    darkDescription: {
        color: theme.colors.textMuted,
    },
});
