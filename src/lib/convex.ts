import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    throw new Error(
        "EXPO_PUBLIC_CONVEX_URL não está configurada. Rode `npx convex dev` e reinicie o Expo.",
    );
}

export const convex = new ConvexReactClient(convexUrl, {
    unsavedChangesWarning: false,
});
