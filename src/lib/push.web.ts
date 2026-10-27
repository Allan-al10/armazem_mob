import type {
    NotificationTarget,
    PushPermissionStatus,
    PushRegistrationResult,
} from "./pushTypes";

export function getDeviceTimezoneOffsetMinutes(): number {
    return -new Date().getTimezoneOffset();
}

export async function getPushPermissionStatusAsync(): Promise<PushPermissionStatus> {
    return "unsupported";
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
    return {
        status: "unsupported",
        message: "Os avisos no celular funcionam no aplicativo instalado.",
    };
}

export async function unregisterPushNotificationsAsync(): Promise<string | null> {
    return null;
}

export function subscribeToPushTokenChanges(_onChange: () => void): () => void {
    return () => {};
}

export function addNotificationResponseListener(
    _onResponse: (target: NotificationTarget | null) => void,
): () => void {
    return () => {};
}

export async function getInitialNotificationTargetAsync(): Promise<NotificationTarget | null> {
    return null;
}
