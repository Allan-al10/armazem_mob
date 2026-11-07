import { beforeEach, describe, expect, test, vi } from "vitest";
import {
    DEFAULT_PREFERENCES,
    DEFAULT_QUICK_ACCESS,
    QUICK_ACCESS_CATALOG,
    getQuickAccessItem,
    loadPreferences,
    parsePreferences,
    sanitizeQuickAccess,
    savePreferences,
} from "./preferences";

const storage = vi.hoisted(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({ appStorage: storage }));

describe("preferências do app", () => {
    beforeEach(() => {
        storage.getItem.mockReset().mockResolvedValue(null);
        storage.setItem.mockReset().mockResolvedValue(undefined);
        storage.removeItem.mockReset().mockResolvedValue(undefined);
    });

    test("remove chaves desconhecidas e repetidas preservando a ordem", () => {
        expect(
            sanitizeQuickAccess(["vendas", "desconhecido", "vendas", "profile", "caixa"]),
        ).toEqual(["vendas", "profile", "caixa"]);
    });

    test("catálogo do acesso rápido cobre todas as chaves padrão", () => {
        const catalogKeys = QUICK_ACCESS_CATALOG.map((item) => item.key);

        for (const key of DEFAULT_QUICK_ACCESS) {
            expect(catalogKeys).toContain(key);
        }
        expect(getQuickAccessItem("vendas")).toMatchObject({
            label: "Registro de Vendas",
            route: "/vendas",
        });
    });

    test("lê preferências válidas e descarta valores inválidos", () => {
        expect(
            parsePreferences(
                JSON.stringify({
                    theme: "dark",
                    fontScale: "xlarge",
                    quickAccess: ["vendas", "vendas", "fiados", "inexistente"],
                }),
            ),
        ).toEqual({
            theme: "dark",
            fontScale: "xlarge",
            quickAccess: ["vendas", "fiados"],
        });

        expect(
            parsePreferences(
                JSON.stringify({
                    theme: "sepia",
                    fontScale: "gigante",
                    quickAccess: ["profile"],
                }),
            ),
        ).toEqual({
            theme: DEFAULT_PREFERENCES.theme,
            fontScale: DEFAULT_PREFERENCES.fontScale,
            quickAccess: ["profile"],
        });
    });

    test("volta aos padrões quando o conteúdo é inválido ou está vazio", () => {
        const defaults = {
            theme: "light",
            fontScale: "normal",
            quickAccess: [...DEFAULT_QUICK_ACCESS],
        };

        expect(parsePreferences(null)).toEqual(defaults);
        expect(parsePreferences("{")).toEqual(defaults);
        expect(parsePreferences("null")).toEqual(defaults);
    });

    test("carrega, salva e não quebra quando o armazenamento falha", async () => {
        storage.getItem.mockResolvedValue(
            JSON.stringify({
                theme: "dark",
                fontScale: "large",
                quickAccess: ["caixa"],
            }),
        );

        await expect(loadPreferences()).resolves.toEqual({
            theme: "dark",
            fontScale: "large",
            quickAccess: ["caixa"],
        });

        await savePreferences({
            theme: "light",
            fontScale: "normal",
            quickAccess: ["nota", "nota", "vendas"],
        });

        expect(storage.setItem).toHaveBeenCalledOnce();
        expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual({
            theme: "light",
            fontScale: "normal",
            quickAccess: ["nota", "vendas"],
        });

        storage.getItem.mockRejectedValue(new Error("storage indisponível"));
        await expect(loadPreferences()).resolves.toEqual({
            theme: DEFAULT_PREFERENCES.theme,
            fontScale: DEFAULT_PREFERENCES.fontScale,
            quickAccess: [...DEFAULT_QUICK_ACCESS],
        });
    });

    test("migra preferências salvas na chave antiga", async () => {
        storage.getItem.mockImplementation(async (key: string) =>
            key === "estoque-facil:preferences:v1"
                ? JSON.stringify({ theme: "dark", fontScale: "xlarge" })
                : null,
        );

        await expect(loadPreferences()).resolves.toEqual({
            theme: "dark",
            fontScale: "xlarge",
            quickAccess: [...DEFAULT_QUICK_ACCESS],
        });

        expect(storage.setItem).toHaveBeenCalledWith(
            "estoque-facil.preferences.v1",
            expect.any(String),
        );
    });
});
