import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const secureStorage = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const webStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            if (typeof window === "undefined") return null;
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, value);
            }
        } catch {
            // O navegador pode bloquear o armazenamento local.
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(key);
            }
        } catch {
            // O navegador pode bloquear o armazenamento local.
        }
    },
};

export const authStorage = Platform.OS === "web" ? webStorage : secureStorage;
