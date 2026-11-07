import Constants from "expo-constants";
import { ConvexReactClient } from "convex/react";
import { resolveConvexUrl } from "@/lib/convexUrl";

/**
 * Em desenvolvimento, o backend local pode estar configurado como
 * 127.0.0.1 no `.env.local`. No Expo Go de um celular físico esse endereço
 * aponta para o próprio aparelho. Quando o servidor do Expo está em uma rede
 * local, trocamos o host pelo endereço da máquina que roda o Convex.
 */
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    throw new Error(
        "EXPO_PUBLIC_CONVEX_URL não está configurada. Rode `npx convex dev` e reinicie o Expo.",
    );
}

export const convex = new ConvexReactClient(
    resolveConvexUrl(convexUrl, Constants.expoConfig?.hostUri, __DEV__),
    {
        unsavedChangesWarning: false,
    },
);
