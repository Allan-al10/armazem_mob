import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMonthYearBR } from "@/lib/date";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type MonthNavigatorProps = {
    monthStart: Date;
    onPrevious: () => void;
    onNext: () => void;
    canGoNext?: boolean;
    kicker?: string;
};

/** Seletor de mês compartilhado pelo relatório e pelas notas. */
export function MonthNavigator({
    monthStart,
    onPrevious,
    onNext,
    canGoNext = true,
    kicker = "MÊS DO REGISTRO",
}: MonthNavigatorProps) {
    const { colors } = useAppTheme();
    const label = formatMonthYearBR(monthStart);

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.card, borderColor: colors.border },
            ]}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mês anterior"
                hitSlop={6}
                onPress={onPrevious}
                style={({ pressed }) => [
                    styles.arrow,
                    { backgroundColor: colors.surfaceStrong },
                    pressed ? styles.pressed : null,
                ]}
            >
                <Text style={[styles.arrowText, { color: colors.primaryInk }]}>‹</Text>
            </Pressable>

            <View
                accessible
                accessibilityRole="header"
                accessibilityLabel={`Mês selecionado: ${label}`}
                style={styles.center}
            >
                <Text style={[styles.kicker, { color: colors.textMuted }]}>{kicker}</Text>
                <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
            </View>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Próximo mês"
                accessibilityState={{ disabled: !canGoNext }}
                disabled={!canGoNext}
                hitSlop={6}
                onPress={onNext}
                style={({ pressed }) => [
                    styles.arrow,
                    { backgroundColor: colors.surfaceStrong },
                    pressed ? styles.pressed : null,
                    !canGoNext ? styles.disabled : null,
                ]}
            >
                <Text style={[styles.arrowText, { color: colors.primaryInk }]}>›</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    arrow: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    arrowText: {
        fontSize: 32,
        lineHeight: 34,
        fontWeight: "700",
    },
    center: {
        flex: 1,
        alignItems: "center",
        gap: 2,
    },
    kicker: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 1,
        textAlign: "center",
    },
    title: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: "700",
        textAlign: "center",
    },
    pressed: {
        opacity: 0.7,
    },
    disabled: {
        opacity: 0.35,
    },
});
