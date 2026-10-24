import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { theme } from "@/theme";

type ComingSoonProps = {
    title: string;
    description: string;
    icon?: string;
};

export function ComingSoon({ title, description, icon = "🚧" }: ComingSoonProps) {
    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/inicio");
    };

    return (
        <>
            <ScreenHeader title={title} helpKey="coming-soon" showBack />
            <Screen>
                <View style={styles.body}>
                    <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
                        {icon}
                    </Text>
                    <Text style={styles.title}>Em construção</Text>
                    <Text style={styles.description}>{description}</Text>
                    <BigButton label="Voltar ao início" onPress={handleBack} variant="secondary" />
                </View>
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: theme.spacing.lg,
        paddingVertical: theme.spacing.xxxl,
    },
    icon: {
        fontSize: 72,
        lineHeight: 82,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: theme.colors.text,
        textAlign: "center",
    },
    description: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.textMuted,
        textAlign: "center",
        maxWidth: 420,
    },
});
