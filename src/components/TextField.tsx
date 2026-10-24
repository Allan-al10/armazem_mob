import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from "react-native";
import { theme } from "@/theme";

type TextFieldProps = TextInputProps & {
    label: string;
    error?: string | null;
    info?: string;
    required?: boolean;
};

export function TextField({
    label,
    error,
    info,
    required = false,
    secureTextEntry = false,
    style,
    onFocus,
    onBlur,
    ...rest
}: TextFieldProps) {
    const [focused, setFocused] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [hidden, setHidden] = useState(secureTextEntry);

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>
                    {label}
                    {required ? <Text style={styles.required}> *</Text> : null}
                </Text>
                {info ? (
                    <Pressable
                        onPress={() => setShowInfo((current) => !current)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ajuda sobre ${label}`}
                        accessibilityState={{ expanded: showInfo }}
                        hitSlop={14}
                        style={styles.infoButton}
                    >
                        <Text style={styles.infoButtonText} maxFontSizeMultiplier={1.4}>
                            i
                        </Text>
                    </Pressable>
                ) : null}
            </View>

            {showInfo && info ? <Text style={styles.infoText}>{info}</Text> : null}

            <View
                style={[
                    styles.inputRow,
                    focused ? styles.inputRowFocused : null,
                    error ? styles.inputRowError : null,
                    rest.multiline ? styles.inputRowMultiline : null,
                ]}
            >
                <TextInput
                    {...rest}
                    style={[styles.input, rest.multiline ? styles.inputMultiline : null, style]}
                    placeholderTextColor={theme.colors.placeholder}
                    secureTextEntry={secureTextEntry ? hidden : false}
                    accessibilityLabel={label}
                    accessibilityHint={error ?? info}
                    onFocus={(event) => {
                        setFocused(true);
                        onFocus?.(event);
                    }}
                    onBlur={(event) => {
                        setFocused(false);
                        onBlur?.(event);
                    }}
                />
                {secureTextEntry ? (
                    <Pressable
                        onPress={() => setHidden((current) => !current)}
                        accessibilityRole="button"
                        accessibilityLabel={hidden ? "Mostrar senha" : "Ocultar senha"}
                        style={styles.showButton}
                    >
                        <Text style={styles.showButtonText}>{hidden ? "Mostrar" : "Ocultar"}</Text>
                    </Pressable>
                ) : null}
            </View>

            {error ? (
                <Text style={styles.error} accessibilityLiveRegion="polite">
                    ⚠ {error}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: theme.spacing.sm,
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    label: {
        flexShrink: 1,
        fontSize: theme.font.label,
        fontWeight: "700",
        color: theme.colors.text,
        lineHeight: 26,
    },
    required: {
        color: theme.colors.danger,
    },
    infoButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    infoButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.colors.primary,
        lineHeight: 20,
    },
    infoText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        backgroundColor: theme.colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
    },
    inputRow: {
        minHeight: theme.touch.input,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.inputBackground,
    },
    inputRowFocused: {
        borderColor: theme.colors.primary,
    },
    inputRowError: {
        borderColor: theme.colors.danger,
    },
    inputRowMultiline: {
        alignItems: "flex-start",
    },
    input: {
        flex: 1,
        minHeight: theme.touch.input,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        fontSize: theme.font.body,
        color: theme.colors.text,
        textAlignVertical: "center",
    },
    inputMultiline: {
        minHeight: 120,
        paddingTop: theme.spacing.lg,
        textAlignVertical: "top",
    },
    showButton: {
        minHeight: theme.touch.min,
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md,
    },
    showButtonText: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    error: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.danger,
        fontWeight: "600",
    },
});
