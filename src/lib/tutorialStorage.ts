import { appStorage } from "./storage";

const TUTORIAL_PREFIX = "meu_armazem_tutorial_v1_";

function tutorialStorageKey(key: string): string {
    return `${TUTORIAL_PREFIX}${key}`;
}

export async function hasSeenTutorial(key: string): Promise<boolean> {
    try {
        return (await appStorage.getItem(tutorialStorageKey(key))) === "1";
    } catch {
        return false;
    }
}

export async function markTutorialSeen(key: string): Promise<void> {
    try {
        await appStorage.setItem(tutorialStorageKey(key), "1");
    } catch {
        // Se o armazenamento falhar, o tutorial pode aparecer de novo.
    }
}

export async function resetTutorial(key: string): Promise<void> {
    try {
        await appStorage.removeItem(tutorialStorageKey(key));
    } catch {
        // Sem problema: o tutorial continua marcado como visto.
    }
}
