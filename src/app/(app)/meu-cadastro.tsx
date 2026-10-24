import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StoreForm } from "@/components/StoreForm";
import { api } from "@/lib/api";
import type { StoreFormValues } from "@/lib/types";
import { formatPhone } from "@/lib/validation";
import { theme } from "@/theme";

export default function MyRegistrationScreen() {
    const store = useQuery(api.stores.getMine);
    const me = useQuery(api.users.current);
    const updateStore = useMutation(api.stores.update);

    if (store === undefined || me === undefined) {
        return <LoadingScreen />;
    }
    if (store === null) {
        return null;
    }

    const handleUpdate = async (values: StoreFormValues) => {
        await updateStore(values);
        Alert.alert("Pronto", "Seus dados foram salvos.", [
            {
                text: "OK",
                onPress: () => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace("/inicio");
                    }
                },
            },
        ]);
    };

    return (
        <>
            <ScreenHeader title="Meu cadastro" helpKey="meu-cadastro" showBack />
            <Screen>
                <View style={styles.accountCard}>
                    <Text style={styles.sectionTitle}>Sua conta</Text>
                    <View style={styles.accountRow}>
                        <Text style={styles.accountLabel}>Nome</Text>
                        <Text style={styles.accountValue}>{me?.name ?? "—"}</Text>
                    </View>
                    <View style={styles.accountRow}>
                        <Text style={styles.accountLabel}>E-mail</Text>
                        <Text style={styles.accountValue}>{me?.email ?? "—"}</Text>
                    </View>
                    <View style={styles.accountRow}>
                        <Text style={styles.accountLabel}>Telefone</Text>
                        <Text style={styles.accountValue}>
                            {me?.phone ? formatPhone(me.phone) : "—"}
                        </Text>
                    </View>
                </View>

                <Text style={styles.intro}>
                    Confira os dados do estabelecimento. Eles aparecem no cabeçalho das notas.
                </Text>

                <StoreForm
                    initial={store}
                    submitLabel="Salvar alterações"
                    onSubmit={handleUpdate}
                />
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    accountCard: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.colors.text,
    },
    accountRow: {
        gap: 2,
    },
    accountLabel: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    accountValue: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.text,
    },
    intro: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.text,
    },
});
