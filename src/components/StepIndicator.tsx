import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

type StepIndicatorProps = {
    current: number;
    total: number;
    label?: string;
};

export function StepIndicator({ current, total, label }: StepIndicatorProps) {
    const safeTotal = Math.max(1, total);
    const safeCurrent = Math.min(Math.max(1, current), safeTotal);
    const progress = Math.round((safeCurrent / safeTotal) * 100);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                {label ? `${label} • ` : ""}Passo {safeCurrent} de {safeTotal}
            </Text>
            <View
                style={styles.track}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 1, max: safeTotal, now: safeCurrent, text: `${progress}%` }}
            >
                <View style={[styles.fill, { width: `${progress}%` }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: theme.spacing.sm,
    },
    text: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    track: {
        height: 12,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceStrong,
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.pill,
    },
});
