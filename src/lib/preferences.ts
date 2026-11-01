import { appStorage } from "@/lib/storage";

export type ThemeMode = "light" | "dark";
export type FontScaleName = "normal" | "large" | "xlarge";

export const FONT_SCALE_FACTORS: Record<FontScaleName, number> = {
    normal: 1,
    large: 1.15,
    xlarge: 1.3,
};

export const FONT_SCALE_LABELS: Record<FontScaleName, string> = {
    normal: "Normal",
    large: "Grande",
    xlarge: "Muito grande",
};

export type QuickAccessKey = "products" | "caixa" | "nota" | "vendas" | "fiados" | "profile";

export type QuickAccessItem = {
    key: QuickAccessKey;
    label: string;
    subtitle: string;
    icon: string;
    color: "primary" | "accent" | "yellow" | "success" | "danger" | "header";
    route: "/estoque" | "/caixa" | "/vender" | "/vendas" | "/fiado" | "/meu-cadastro";
};

export const QUICK_ACCESS_CATALOG: readonly QuickAccessItem[] = [
    {
        key: "products",
        label: "Ver produtos",
        subtitle: "Consultar estoque",
        icon: "📦",
        color: "primary",
        route: "/estoque",
    },
    {
        key: "caixa",
        label: "Registrar Caixa",
        subtitle: "Chegada de produtos",
        icon: "🚛",
        color: "accent",
        route: "/caixa",
    },
    {
        key: "nota",
        label: "Fazer Nota de Venda",
        subtitle: "Venda para cliente",
        icon: "🧾",
        color: "yellow",
        route: "/vender",
    },
    {
        key: "vendas",
        label: "Registro de Vendas",
        subtitle: "Vendas por mês, custo e lucro",
        icon: "📊",
        color: "success",
        route: "/vendas",
    },
    {
        key: "fiados",
        label: "Contas de Fiado",
        subtitle: "Quem ainda vai pagar",
        icon: "🤝",
        color: "danger",
        route: "/fiado",
    },
    {
        key: "profile",
        label: "Meus dados",
        subtitle: "Dados do estabelecimento",
        icon: "🏪",
        color: "header",
        route: "/meu-cadastro",
    },
];

export const DEFAULT_QUICK_ACCESS: readonly QuickAccessKey[] = [
    "products",
    "caixa",
    "nota",
    "vendas",
];

export type AppPreferences = {
    theme: ThemeMode;
    fontScale: FontScaleName;
    quickAccess: QuickAccessKey[];
};

const STORAGE_KEY = "estoque-facil:preferences:v1";

export const DEFAULT_PREFERENCES: AppPreferences = {
    theme: "light",
    fontScale: "normal",
    quickAccess: [...DEFAULT_QUICK_ACCESS],
};

function isThemeMode(value: unknown): value is ThemeMode {
    return value === "light" || value === "dark";
}

function isFontScale(value: unknown): value is FontScaleName {
    return value === "normal" || value === "large" || value === "xlarge";
}

/** Remove chaves desconhecidas e repetidas, preservando a ordem escolhida. */
export function sanitizeQuickAccess(value: unknown): QuickAccessKey[] {
    if (!Array.isArray(value)) return [...DEFAULT_QUICK_ACCESS];

    const known = new Set<QuickAccessKey>(QUICK_ACCESS_CATALOG.map((item) => item.key));
    const result: QuickAccessKey[] = [];
    for (const entry of value) {
        if (typeof entry !== "string" || !known.has(entry as QuickAccessKey)) continue;
        const key = entry as QuickAccessKey;
        if (!result.includes(key)) result.push(key);
    }
    return result;
}

export function parsePreferences(raw: string | null): AppPreferences {
    if (!raw) return { ...DEFAULT_PREFERENCES, quickAccess: [...DEFAULT_QUICK_ACCESS] };

    try {
        const parsed = JSON.parse(raw) as Partial<AppPreferences> | null;
        if (!parsed || typeof parsed !== "object") {
            return { ...DEFAULT_PREFERENCES, quickAccess: [...DEFAULT_QUICK_ACCESS] };
        }

        return {
            theme: isThemeMode(parsed.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
            fontScale: isFontScale(parsed.fontScale)
                ? parsed.fontScale
                : DEFAULT_PREFERENCES.fontScale,
            quickAccess: sanitizeQuickAccess(parsed.quickAccess),
        };
    } catch {
        return { ...DEFAULT_PREFERENCES, quickAccess: [...DEFAULT_QUICK_ACCESS] };
    }
}

export async function loadPreferences(): Promise<AppPreferences> {
    try {
        return parsePreferences(await appStorage.getItem(STORAGE_KEY));
    } catch {
        return { ...DEFAULT_PREFERENCES, quickAccess: [...DEFAULT_QUICK_ACCESS] };
    }
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
    try {
        await appStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                theme: preferences.theme,
                fontScale: preferences.fontScale,
                quickAccess: sanitizeQuickAccess(preferences.quickAccess),
            }),
        );
    } catch {
        // Preferências são uma conveniência; o app continua funcionando sem elas.
    }
}

export function getQuickAccessItem(key: QuickAccessKey): QuickAccessItem {
    return QUICK_ACCESS_CATALOG.find((item) => item.key === key) ?? QUICK_ACCESS_CATALOG[0];
}
