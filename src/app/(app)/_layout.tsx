import { router, Stack } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
    addNotificationResponseListener,
    getInitialNotificationTargetAsync,
} from "@/lib/push";
import type { NotificationTarget } from "@/lib/pushTypes";
import { usePushRegistration } from "@/lib/usePushRegistration";
import { theme } from "@/theme";

export default function AppLayout() {
    usePushRegistration();

    const lastTarget = useRef<string | null>(null);

    const openTarget = useCallback((target: NotificationTarget | null) => {
        if (!target) return;

        const key =
            target.notificationId ??
            `${target.customerId ?? ""}|${target.url ?? ""}`;
        if (lastTarget.current === key) return;
        lastTarget.current = key;

        if (target.customerId) {
            router.push({
                pathname: "/fiado/[id]",
                params: { id: target.customerId },
            });
            return;
        }

        if (target.url === "/fiado") {
            router.push("/fiado");
        }
    }, []);

    useEffect(() => {
        let active = true;

        void getInitialNotificationTargetAsync().then((target) => {
            if (active) openTarget(target);
        });

        const unsubscribe = addNotificationResponseListener((target) => {
            if (active) openTarget(target);
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [openTarget]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
            }}
        />
    );
}
