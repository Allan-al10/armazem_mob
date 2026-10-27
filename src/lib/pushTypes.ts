export type PushPlatform = "android" | "ios";

export type PushPermissionStatus =
    | "granted"
    | "denied"
    | "undetermined"
    | "unsupported";

export type PushRegistrationResult =
    | { status: "registered"; token: string; platform: PushPlatform }
    | { status: "denied" }
    | { status: "unsupported"; message: string }
    | { status: "unconfigured"; message: string }
    | { status: "error"; message: string };

export type NotificationTarget = {
    /** Identificador da notificação, usado para não abrir a mesma tela duas vezes. */
    notificationId?: string;
    customerId?: string;
    url?: string;
};
