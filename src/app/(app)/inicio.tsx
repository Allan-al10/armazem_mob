import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SummaryCard } from "@/components/SummaryCard";
import { TutorialModal } from "@/components/TutorialModal";
import { api } from "@/lib/api";
import { addDays, daysUntil, startOfDay } from "@/lib/date";
import { friendlyError } from "@/lib/errors";
import { formatCents } from "@/lib/money";
import { unregisterPushNotificationsAsync } from "@/lib/push";
import { useTutorial } from "@/lib/useTutorial";
import { theme } from "@/theme";

export default function HomeScreen() {
    const { signOut } = useAuthActions();
    const unregisterPushToken = useMutation(api.reminders.unregisterPushToken);
    const tutorial = useTutorial("home");
    const store = useQuery(api.stores.getMine);
    const dayStart = startOfDay();
    const summary = useQuery(
        api.dashboard.summary,
        store
            ? {
                  from: dayStart.getTime(),
                  to: addDays(dayStart, 1).getTime(),
              }
            : "skip",
    );
    const debtors = useQuery(api.credits.debtors, store ? {} : "skip");
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    if (store === undefined) {
        return <LoadingScreen />;
    }
    if (store === null) {
        return null;
    }
    if (summary === undefined || debtors === undefined) {
        return <LoadingScreen />;
    }

    const firstName = store.ownerName.split(" ")[0] || store.ownerName;
    const lowStockCount = summary.lowStockCount;
    const creditTotalCents = debtors.reduce(
        (total, debtor) => total + debtor.balanceCents,
        0,
    );
    const urgentCredits = debtors.filter(
        (debtor) => daysUntil(debtor.dueDate) <= 3,
    ).length;

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            const token = await unregisterPushNotificationsAsync();
            if (token) {
                await unregisterPushToken({ token });
            }
        } catch (error) {
            // O logout não deve ficar preso se o servidor não responder.
            console.warn("Não foi possível remover o token de aviso no logout.", error);
        }

        try {
            await signOut();
        } catch (error) {
            Alert.alert("Não foi possível sair", friendlyError(error));
        } finally {
            setLoggingOut(false);
            setLogoutVisible(false);
        }
    };

    return (
        <>
            <ScreenHeader title="Início" subtitle={store.tradeName} helpKey="home" />
            <Screen>
                <View style={styles.greetingBox}>
                    <Text style={styles.greeting}>Olá, {firstName}!</Text>
                    <Text style={styles.question}>O que você quer fazer hoje?</Text>
                </View>

                <Text style={styles.sectionTitle}>Resumo de hoje</Text>

                <SummaryCard
                    icon="🧾"
                    title="Vendas de hoje"
                    value={formatCents(summary.salesTotalCents)}
                    hint={
                        summary.salesCount === 0
                            ? "Nenhuma venda hoje • Toque para ver"
                            : `${summary.salesCount} venda${
                                  summary.salesCount === 1 ? "" : "s"
                              } hoje • Toque para ver`
                    }
                    onPress={() => router.push("/vendas")}
                />
                <SummaryCard
                    icon="📦"
                    title="Estoque baixo"
                    value={`${lowStockCount} produto${lowStockCount === 1 ? "" : "s"}`}
                    hint={
                        lowStockCount > 0
                            ? "Toque em Estoque para repor"
                            : "Nada para repor por enquanto"
                    }
                />
                <SummaryCard
                    icon="📒"
                    title="Fiados para cobrar"
                    value={`${debtors.length} cliente${debtors.length === 1 ? "" : "s"}`}
                    hint={
                        debtors.length === 0
                            ? "Nenhum vencimento próximo"
                            : `${formatCents(creditTotalCents)} em aberto${
                                  urgentCredits > 0
                                      ? ` • ${urgentCredits} ${
                                            urgentCredits === 1
                                                ? "vencendo ou atrasado"
                                                : "vencendo ou atrasados"
                                        }`
                                      : " • Em dia"
                              }`
                    }
                    onPress={() => router.push("/fiado")}
                />

                <Text style={styles.sectionTitle}>Atalhos</Text>

                <BigButton
                    label="Chegou mercadoria"
                    description="Registrar os produtos que chegaram"
                    icon="📦"
                    onPress={() => router.push("/chegou-mercadoria")}
                />
                <BigButton
                    label="Nova venda"
                    description="Vender e preparar a nota"
                    icon="🧾"
                    onPress={() => router.push("/vender")}
                />
                <BigButton
                    label="Estoque"
                    description="Ver produtos e quantidades"
                    icon="📋"
                    onPress={() => router.push("/estoque")}
                />
                <BigButton
                    label="Quem deve"
                    description="Fiados e vencimentos"
                    icon="📒"
                    onPress={() => router.push("/fiado")}
                />

                <Text style={styles.sectionTitle}>Sua conta</Text>

                <BigButton
                    label="Configurações"
                    description="Avisos de fiado, horário e tutorial"
                    icon="🔔"
                    onPress={() => router.push("/configuracoes")}
                    variant="secondary"
                />
                <BigButton
                    label="Meu cadastro"
                    description="Conferir e corrigir os dados do estabelecimento"
                    icon="⚙️"
                    onPress={() => router.push("/meu-cadastro")}
                    variant="secondary"
                />
                <BigButton
                    label="Sair da conta"
                    onPress={() => setLogoutVisible(true)}
                    variant="ghost"
                />

                <Text style={styles.version}>Meu Armazém • versão 1.0</Text>
            </Screen>

            <ConfirmDialog
                visible={logoutVisible}
                title="Sair da conta?"
                message="Você vai precisar do e-mail e da senha para entrar de novo. Seus dados continuam salvos."
                confirmLabel="Sim, sair"
                cancelLabel="Não, ficar"
                destructive
                loading={loggingOut}
                onConfirm={handleLogout}
                onCancel={() => setLogoutVisible(false)}
            />

            <TutorialModal
                visible={tutorial.visible}
                tutorialKey="home"
                onClose={tutorial.close}
            />
        </>
    );
}

const styles = StyleSheet.create({
    greetingBox: {
        gap: theme.spacing.xs,
    },
    greeting: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: theme.colors.text,
    },
    question: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.textMuted,
    },
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.colors.text,
        marginTop: theme.spacing.md,
    },
    version: {
        fontSize: theme.font.small,
        color: theme.colors.textMuted,
        textAlign: "center",
        marginTop: theme.spacing.md,
    },
});
