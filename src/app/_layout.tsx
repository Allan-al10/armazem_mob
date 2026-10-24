import { ConvexAuthProvider, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { convex } from "@/lib/convex";
import { authStorage } from "@/lib/storage";
import { theme } from "@/theme";

void SplashScreen.preventAutoHideAsync().catch(() => {
    // A splash screen pode não existir na versão web.
});

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ConvexAuthProvider client={convex} storage={authStorage}>
                <StatusBar style="dark" />
                <RootNavigator />
            </ConvexAuthProvider>
        </SafeAreaProvider>
    );
}

function RootNavigator() {
    const { isLoading, isAuthenticated } = useConvexAuth();
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
                contentStyle: { backgroundColor: theme.colors.background },
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
