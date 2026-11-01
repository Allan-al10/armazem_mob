import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type StepIndicatorProps = {
    current: number;
    total: number;
    label?: string;
};

export function StepIndicator({ current, total, label }: StepIndicatorProps) {
    const { colors } = useAppTheme();
    const safeTotal = Math.max(1, total);
    const safeCurrent = Math.min(Math.max(1, current), safeTotal);
    const progress = Math.round((safeCurrent / safeTotal) * 100);
    const steps = Array.from({ length: safeTotal }, (_, index) => index + 1);

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={styles.text}>
                    {label ? `${label} • ` : ""}Passo {safeCurrent} de {safeTotal}
                </Text>
                <Text style={styles.percent}>{progress}%</Text>
            </View>

            <View
                style={styles.stepsRow}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 1, max: safeTotal, now: safeCurrent, text: `${progress}%` }}
            >
                {steps.map((step) => {
                    const done = step < safeCurrent;
                    const active = step === safeCurrent;
                    return (
                        <View key={step} style={styles.stepWrap}>
                            <View
                                style={[
                                    styles.circle,
                                    {
                                        backgroundColor: done
                                            ? colors.success
                                            : active
                                              ? colors.primary
                                              : colors.card,
                                        borderColor: done
                                            ? colors.success
                                            : active
                                              ? colors.primary
                                              : colors.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.circleText,
                                        {
                                            color: done || active ? colors.onPrimary : colors.textMuted,
                                        },
                                    ]}
                                >
                                    {done ? "✓" : step}
                                </Text>
                            </View>
                            {step < safeTotal ? (
                                <View
                                    style={[
                                        styles.connector,
                                        {
                                            backgroundColor:
                                                step < safeCurrent ? colors.success : colors.border,
                                        },
                                    ]}
                                />
                            ) : null}
                        </View>
                    );
                })}
            </View>
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
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    text: {
        flex: 1,
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    percent: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.primaryInk,
    },
    stepsRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    stepWrap: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    circle: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.pill,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    circleText: {
        fontSize: 15,
        lineHeight: 19,
        fontWeight: "700",
    },
    connector: {
        flex: 1,
        height: 3,
        marginHorizontal: 4,
        borderRadius: theme.radius.pill,
    },
});
