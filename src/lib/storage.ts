import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

async function readSecure(key: string): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(key);
    } catch {
        return null;
    }
}

async function writeSecure(key: string, value: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(key, value);
    } catch {
        // O app continua funcionando se o armazenamento seguro falhar.
    }
}

async function removeSecure(key: string): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch {
        // O app continua funcionando se o armazenamento seguro falhar.
    }
}

const secureStorage = {
    getItem: readSecure,
    setItem: writeSecure,
    removeItem: removeSecure,
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

/** Armazenamento local para preferências simples, como o tutorial já visto. */
export const appStorage = Platform.OS === "web" ? webStorage : secureStorage;
