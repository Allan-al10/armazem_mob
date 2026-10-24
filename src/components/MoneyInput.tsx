import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { centsToInput, parseMoneyToCents } from "@/lib/money";
import { theme } from "@/theme";

type MoneyInputProps = {
    label: string;
    valueCents: number;
    onChangeCents: (cents: number) => void;
    error?: string | null;
    info?: string;
    required?: boolean;
    placeholder?: string;
};

export function MoneyInput({
    label,
    valueCents,
    onChangeCents,
    error,
    info,
    required = false,
    placeholder = "0,00",
}: MoneyInputProps) {
    const [text, setText] = useState(() => centsToInput(valueCents));
    const [focused, setFocused] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        if (!focused) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o texto quando o valor muda fora do foco
            setText(centsToInput(valueCents));
        }
    }, [valueCents, focused]);

    const handleChange = (raw: string) => {
        const cleaned = raw.replace(/[^\d,]/g, "");
        const [reaisPart, ...decimalParts] = cleaned.split(",");
        const reais = reaisPart.slice(0, 9);
        const decimals = decimalParts.join("").slice(0, 2);
        const next = decimalParts.length > 0 ? `${reais},${decimals}` : reais;
        setText(next);
        onChangeCents(parseMoneyToCents(next));
    };

    const handleBlur = () => {
        setFocused(false);
        const formatted = centsToInput(parseMoneyToCents(text));
        setText(formatted);
        onChangeCents(parseMoneyToCents(formatted));
    };

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
                ]}
            >
                <Text style={styles.prefix}>R$</Text>
                <TextInput
                    value={text}
                    onChangeText={handleChange}
                    onFocus={() => setFocused(true)}
                    onBlur={handleBlur}
                    keyboardType="decimal-pad"
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.placeholder}
                    style={styles.input}
                    accessibilityLabel={label}
                    accessibilityHint={error ?? info}
                />
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
        paddingLeft: theme.spacing.lg,
    },
    inputRowFocused: {
        borderColor: theme.colors.primary,
    },
    inputRowError: {
        borderColor: theme.colors.danger,
    },
    prefix: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    input: {
        flex: 1,
        minHeight: theme.touch.input,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        fontSize: theme.font.body,
        color: theme.colors.text,
    },
    error: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.danger,
        fontWeight: "600",
    },
});
