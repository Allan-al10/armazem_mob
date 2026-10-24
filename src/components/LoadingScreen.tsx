import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

type LoadingScreenProps = {
    message?: string;
};

export function LoadingScreen({ message = "Carregando..." }: LoadingScreenProps) {
    return (
        <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.xl,
    },
    text: {
        fontSize: theme.font.body,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
});
