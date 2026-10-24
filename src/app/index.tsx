import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Redirect } from "expo-router";
import { api } from "@/lib/api";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Index() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const store = useQuery(api.stores.getMine, isAuthenticated ? {} : "skip");

    if (isLoading || (isAuthenticated && store === undefined)) {
        return <LoadingScreen />;
    }
    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }
    if (!store) {
        return <Redirect href="/loja" />;
    }
    return <Redirect href="/inicio" />;
}
