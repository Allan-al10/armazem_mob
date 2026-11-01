import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FeedbackBanner } from "@/components/FeedbackBanner";
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
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!saved) return;
        const timer = setTimeout(() => {
            if (router.canGoBack()) router.back();
            else router.replace("/inicio");
        }, 1500);
        return () => clearTimeout(timer);
    }, [saved]);

    if (store === undefined || me === undefined) {
        return <LoadingScreen />;
    }
    if (store === null) {
        return null;
    }

    const handleUpdate = async (values: StoreFormValues) => {
        await updateStore(values);
        setSaved(true);
    };

    return (
        <>
            <ScreenHeader
                title="Meus Dados"
                subtitle="Dados do estabelecimento"
                helpKey="meu-cadastro"
                showBack
            />
            <Screen>
                {saved ? (
                    <FeedbackBanner
                        tone="success"
                        icon="✓"
                        title="Dados salvos!"
                        message="As notas novas já usam estas informações."
                    />
                ) : null}

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
                    Confira os dados do estabelecimento. Eles aparecem no cabeçalho das
                    notas enviadas aos clientes.
                </Text>

                <StoreForm
                    initial={store}
                    submitLabel="Salvar Alterações"
                    onSubmit={handleUpdate}
                />
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    accountCard: {
        backgroundColor: theme.colors.card,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "700",
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
