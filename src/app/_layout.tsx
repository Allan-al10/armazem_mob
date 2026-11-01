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

    if (!fontsLoaded && !fontError) return null;

    return (
        <SafeAreaProvider>
            <AppPreferencesProvider>
                <ConvexAuthProvider client={convex} storage={authStorage}>
                    <ThemedApp />
                </ConvexAuthProvider>
            </AppPreferencesProvider>
        </SafeAreaProvider>
    );
}

function ThemedApp() {
    const { mode } = useAppTheme();

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
    const ready = !isLoading && (!isAuthenticated || store !== undefined);

    useEffect(() => {
        if (ready) {
            void SplashScreen.hideAsync().catch(() => {
                // A splash screen pode não existir na versão web.
            });
        }
    }, [ready]);

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
