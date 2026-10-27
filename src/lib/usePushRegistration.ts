import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/lib/api";
import {
    getDeviceTimezoneOffsetMinutes,
    registerForPushNotificationsAsync,
    subscribeToPushTokenChanges,
} from "@/lib/push";

/**
 * Registra o aparelho depois do login e renova o token quando o Expo avisa
 * que ele mudou. Falhas não bloqueiam o uso do app.
 */
export function usePushRegistration() {
    const registerToken = useMutation(api.reminders.registerPushToken);

    useEffect(() => {
        let active = true;

        const sync = async () => {
            const result = await registerForPushNotificationsAsync();
            if (!active || result.status !== "registered") return;

            try {
                await registerToken({
                    token: result.token,
                    platform: result.platform,
                    timezoneOffsetMinutes: getDeviceTimezoneOffsetMinutes(),
                });
            } catch (error) {
                console.warn("Não foi possível salvar o token de aviso.", error);
            }
        };

        void sync();
        const unsubscribe = subscribeToPushTokenChanges(() => {
            void sync();
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [registerToken]);
}
