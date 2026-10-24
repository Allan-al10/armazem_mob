import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StepIndicator } from "@/components/StepIndicator";
import { StoreForm } from "@/components/StoreForm";
import { api } from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import type { StoreFormValues } from "@/lib/types";
import { theme } from "@/theme";

export default function StoreSetupScreen() {
    const { signOut } = useAuthActions();
    const store = useQuery(api.stores.getMine);
    const createStore = useMutation(api.stores.create);
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        if (store) {
            router.replace("/inicio");
        }
    }, [store]);

    const handleCreate = async (values: StoreFormValues) => {
        await createStore(values);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
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
            <ScreenHeader
                title="Meu estabelecimento"
                subtitle="Agora os dados que aparecem na nota"
                helpKey="store"
            />
            <Screen>
                <StepIndicator current={2} total={2} label="Quase pronto" />

                <Text style={styles.intro}>
                    Esses dados vão no cabeçalho das notas enviadas aos seus clientes. Você pode
                    corrigir tudo depois em Meu cadastro.
                </Text>

                <StoreForm submitLabel="Salvar e começar" onSubmit={handleCreate} />

                <BigButton
                    label="Sair da conta"
                    onPress={() => setLogoutVisible(true)}
                    variant="ghost"
                />
            </Screen>

            <ConfirmDialog
                visible={logoutVisible}
                title="Sair da conta?"
                message="Você vai precisar do e-mail e da senha para entrar de novo. Os dados do estabelecimento não serão apagados."
                confirmLabel="Sim, sair"
                cancelLabel="Não, ficar"
                destructive
                loading={loggingOut}
                onConfirm={handleLogout}
                onCancel={() => setLogoutVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    intro: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.text,
    },
});
