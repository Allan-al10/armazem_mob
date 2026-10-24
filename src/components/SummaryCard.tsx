import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

type SummaryCardProps = {
    icon: string;
    title: string;
    value: string;
    hint: string;
    onPress?: () => void;
};

export function SummaryCard({ icon, title, value, hint, onPress }: SummaryCardProps) {
    const content = (
        <>
            <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
                {icon}
            </Text>
            <View style={styles.texts}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.hint}>{hint}</Text>
            </View>
        </>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={`${title}: ${value}. ${hint}`}
                accessibilityHint="Toque para abrir"
                style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
            >
                {content}
            </Pressable>
        );
    }

    return (
        <View
            style={styles.card}
            accessibilityLabel={`${title}: ${value}. ${hint}`}
            accessible
        >
            {content}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        gap: theme.spacing.lg,
        alignItems: "flex-start",
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
    },
    pressed: {
        opacity: 0.8,
    },
    icon: {
        fontSize: 32,
        lineHeight: 38,
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    value: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: theme.colors.text,
    },
    hint: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
});
