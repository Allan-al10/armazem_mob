import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type {
    NotificationTarget,
    PushPermissionStatus,
    PushRegistrationResult,
} from "./pushTypes";

const CHANNEL_ID = "credit-reminders";

let lastKnownToken: string | null = null;
let handlerConfigured = false;

function configureNotificationHandler() {
    if (handlerConfigured) return;
    handlerConfigured = true;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

configureNotificationHandler();

function getProjectId(): string | null {
    const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
    const easProjectId = Constants.easConfig?.projectId;
    const envProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

    return (
        (typeof envProjectId === "string" && envProjectId.trim()) ||
        (typeof expoProjectId === "string" && expoProjectId.trim()) ||
        (typeof easProjectId === "string" && easProjectId.trim()) ||
        null
    );
}

function isPermissionGranted(
    status: Notifications.NotificationPermissionsStatus,
): boolean {
    return (
        status.granted ||
        status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
        status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
}

async function ensureAndroidChannel() {
    if (Platform.OS !== "android") return;

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Avisos de fiado",
        description: "Lembretes de vencimento dos fiados",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0F5B2A",
    });
}

export function getDeviceTimezoneOffsetMinutes(): number {
    return -new Date().getTimezoneOffset();
}

export async function getPushPermissionStatusAsync(): Promise<PushPermissionStatus> {
    if (Platform.OS === "web") return "unsupported";

    try {
        const permissions = await Notifications.getPermissionsAsync();
        if (isPermissionGranted(permissions)) return "granted";
        if (permissions.status === "undetermined") return "undetermined";
        return "denied";
    } catch {
        return "unsupported";
    }
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
    if (Platform.OS === "web") {
        return {
            status: "unsupported",
            message: "Os avisos no celular funcionam no aplicativo instalado.",
        };
    }

    if (Constants.appOwnership === "expo") {
        return {
            status: "unsupported",
            message:
                "Os avisos no celular precisam do aplicativo instalado. No Expo Go, use um development build.",
        };
    }

    const projectId = getProjectId();
    if (!projectId) {
        return {
            status: "unconfigured",
            message:
                "Os avisos ainda não estão configurados neste aplicativo. O responsável precisa configurar o projeto EAS e um development build.",
        };
    }

    try {
        await ensureAndroidChannel();

        let permissions = await Notifications.getPermissionsAsync();
        if (!isPermissionGranted(permissions)) {
            permissions = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: false,
                    allowSound: true,
                },
            });
        }

        if (!isPermissionGranted(permissions)) {
            return { status: "denied" };
        }

        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        lastKnownToken = token.data;

        return {
            status: "registered",
            token: token.data,
            platform: Platform.OS === "ios" ? "ios" : "android",
        };
    } catch (error) {
        console.warn("Não foi possível registrar os avisos push.", error);
        return {
            status: "error",
            message:
                "Não foi possível ativar os avisos neste aparelho. Confira a conexão e tente de novo.",
        };
    }
}

/** Usado no logout: tenta remover o token sem pedir permissão de novo. */
export async function unregisterPushNotificationsAsync(): Promise<string | null> {
    if (lastKnownToken) return lastKnownToken;

    const permission = await getPushPermissionStatusAsync();
    if (permission !== "granted") return null;

    const projectId = getProjectId();
    if (!projectId) return null;

    try {
        await ensureAndroidChannel();
        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        lastKnownToken = token.data;
        return token.data;
    } catch {
        return null;
    }
}

export function subscribeToPushTokenChanges(onChange: () => void): () => void {
    const subscription = Notifications.addPushTokenListener(() => {
        onChange();
    });

    return () => subscription.remove();
}

function notificationTarget(
    response: Notifications.NotificationResponse,
): NotificationTarget | null {
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return null;
    }

    const data = response.notification.request.content.data;
    const customerId =
        typeof data?.customerId === "string" ? data.customerId : undefined;
    const url = typeof data?.url === "string" ? data.url : undefined;

    if (!customerId && !url) return null;
    return {
        notificationId: response.notification.request.identifier,
        customerId,
        url,
    };
}

export function addNotificationResponseListener(
    onResponse: (target: NotificationTarget | null) => void,
): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            onResponse(notificationTarget(response));
        },
    );

    return () => subscription.remove();
}

/** Trata o toque que abriu o aplicativo enquanto ele estava fechado. */
export async function getInitialNotificationTargetAsync(): Promise<NotificationTarget | null> {
    try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (!response) return null;

        const target = notificationTarget(response);
        await Notifications.clearLastNotificationResponseAsync();
        return target;
    } catch {
        return null;
    }
}
