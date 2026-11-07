import {
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";
import { ConvexAuthProvider, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { convex } from "@/lib/convex";
import { authStorage } from "@/lib/storage";
import { AppPreferencesProvider, useAppTheme } from "@/themeContext";

void SplashScreen.preventAutoHideAsync().catch(() => {
    // A splash screen pode não existir na versão web.
});

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        AtkinsonHyperlegible_400Regular,
        AtkinsonHyperlegible_700Bold,
    });
    const fontsReady = fontsLoaded || Boolean(fontError);

    // A autenticação e as preferências começam a carregar imediatamente,
    // em paralelo com as fontes. Antes, cada etapa esperava a anterior.
    return (
        <SafeAreaProvider>
            <ConvexAuthProvider client={convex} storage={authStorage}>
                <AppPreferencesProvider>
                    <ThemedApp fontsReady={fontsReady} />
                </AppPreferencesProvider>
            </ConvexAuthProvider>
        </SafeAreaProvider>
    );
}

function ThemedApp({ fontsReady }: { fontsReady: boolean }) {
    const { mode } = useAppTheme();

    if (!fontsReady) return null;

    return (
        <>
            <StatusBar style={mode === "dark" ? "light" : "dark"} />
            <RootNavigator />
        </>
    );
}

function RootNavigator() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const { colors } = useAppTheme();
    const store = useQuery(api.stores.getMine, isAuthenticated ? {} : "skip");

    useEffect(() => {
        // A splash não deve esperar a consulta da loja: se o servidor estiver
        // lento ou indisponível, a tela de carregamento do app aparece antes.
        if (!isLoading) {
            void SplashScreen.hideAsync().catch(() => {
                // A splash screen pode não existir na versão web.
            });
        }
    }, [isLoading]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
            }}
        >
            <Stack.Screen name="index" />

            <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name="(auth)" />
            </Stack.Protected>

            <Stack.Protected guard={isAuthenticated && !store}>
                <Stack.Screen name="(setup)" />
            </Stack.Protected>

            <Stack.Protected guard={isAuthenticated && !!store}>
                <Stack.Screen name="(app)" />
            </Stack.Protected>
        </Stack>
    );
}
