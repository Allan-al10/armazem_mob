import { StyleSheet } from "react-native";
import type { ThemeMode } from "@/lib/preferences";

export type AppColors = {
    bg: string;
    card: string;
    primary: string;
    primaryInk: string;
    header: string;
    accent: string;
    yellow: string;
    success: string;
    successBg: string;
    danger: string;
    dangerBg: string;
    warn: string;
    warnBg: string;
    warnInk: string;
    text: string;
    textMuted: string;
    border: string;

    // Nomes antigos mantidos para as telas que já existiam.
    background: string;
    surface: string;
    surfaceStrong: string;
    primaryPressed: string;
    onPrimary: string;
    dangerPressed: string;
    dangerSurface: string;
    warning: string;
    warningSurface: string;
    borderLight: string;
    inputBackground: string;
    placeholder: string;
    overlay: string;
};

export const lightColors: AppColors = {
    bg: "#F4F6F9",
    card: "#FFFFFF",
    primary: "#1B5FA6",
    primaryInk: "#1B5FA6",
    header: "#154A82",
    accent: "#D9650A",
    yellow: "#F2B705",
    success: "#2E7D4F",
    successBg: "#E3F2E8",
    danger: "#C62F26",
    dangerBg: "#FBE6E4",
    warn: "#F2B705",
    warnBg: "#FFF3CC",
    warnInk: "#7A5200",
    text: "#1D2733",
    textMuted: "#566170",
    border: "#D5DBE3",

    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceStrong: "#E8EDF3",
    primaryPressed: "#154A82",
    onPrimary: "#FFFFFF",
    dangerPressed: "#A82A21",
    dangerSurface: "#FBE6E4",
    warning: "#7A5200",
    warningSurface: "#FFF3CC",
    borderLight: "#D5DBE3",
    inputBackground: "#FFFFFF",
    placeholder: "#6B7684",
    overlay: "rgba(36, 41, 43, 0.55)",
};

export const darkColors: AppColors = {
    bg: "#0F1419",
    card: "#1A212A",
    primary: "#2F6FB8",
    primaryInk: "#7DB7F0",
    header: "#13263D",
    accent: "#E0701A",
    yellow: "#F2B705",
    success: "#3A9D66",
    successBg: "#17301F",
    danger: "#E5594F",
    dangerBg: "#3A1B19",
    warn: "#F2B705",
    warnBg: "#3A3112",
    warnInk: "#F5C84B",
    text: "#EEF1F4",
    textMuted: "#9AA6B4",
    border: "#2C3641",

    background: "#1A212A",
    surface: "#1A212A",
    surfaceStrong: "#2C3641",
    primaryPressed: "#245A96",
    onPrimary: "#FFFFFF",
    dangerPressed: "#C24A42",
    dangerSurface: "#3A1B19",
    warning: "#F5C84B",
    warningSurface: "#3A3112",
    borderLight: "#2C3641",
    inputBackground: "#1A212A",
    placeholder: "#9AA6B4",
    overlay: "rgba(0, 0, 0, 0.68)",
};

export const FONT_REGULAR = "AtkinsonHyperlegible_400Regular";
export const FONT_BOLD = "AtkinsonHyperlegible_700Bold";

const baseFont = {
    small: 15,
    body: 17,
    bodyLarge: 19,
    label: 15,
    button: 18,
    subtitle: 20,
    title: 22,
    titleLarge: 30,
} as const;

const baseLineHeight = {
    small: 22,
    body: 26,
    title: 30,
    titleLarge: 40,
} as const;

export const theme = {
    colors: lightColors,
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        xxxl: 48,
        screen: 20,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        pill: 999,
    },
    font: baseFont,
    lineHeight: baseLineHeight,
    touch: {
        min: 56,
        button: 60,
        input: 56,
    },
} as const;

export type Theme = {
    colors: AppColors;
    spacing: typeof theme.spacing;
    radius: typeof theme.radius;
    font: Record<keyof typeof baseFont, number>;
    lineHeight: Record<keyof typeof baseLineHeight, number>;
    touch: typeof theme.touch;
};

type ThemeRuntime = {
    mode: ThemeMode;
    scale: number;
    version: number;
};

const runtime: ThemeRuntime = {
    mode: "light",
    scale: 1,
    version: 0,
};

export function applyThemeRuntime(mode: ThemeMode, scale: number): void {
    if (runtime.mode === mode && runtime.scale === scale) return;
    runtime.mode = mode;
    runtime.scale = scale;
    runtime.version += 1;
}

export function getThemeRuntime(): Readonly<ThemeRuntime> {
    return runtime;
}

export function fs(value: number, scale = runtime.scale): number {
    return Math.round(value * scale);
}

/** Ícones crescem um pouco mais que as letras, como pede a especificação. */
export function is(value: number, scale = runtime.scale): number {
    return Math.round(value * (1 + (scale - 1) * 1.3));
}

function scaleTokens<T extends Record<string, number>>(tokens: T, scale: number): T {
    return Object.fromEntries(
        Object.entries(tokens).map(([key, value]) => [key, fs(value, scale)]),
    ) as T;
}

export function getResolvedTheme(mode: ThemeMode = runtime.mode, scale = runtime.scale): Theme {
    return {
        ...theme,
        colors: mode === "dark" ? darkColors : lightColors,
        font: scaleTokens(baseFont, scale),
        lineHeight: scaleTokens(baseLineHeight, scale),
    };
}

export function getResolvedColors(mode: ThemeMode = runtime.mode): AppColors {
    return mode === "dark" ? darkColors : lightColors;
}

const BACKGROUND_DARK: Record<string, string> = {
    "#FFFFFF": "#1A212A",
    "#F4F6F9": "#0F1419",
    "#F2F5F2": "#1A212A",
    "#F8FAF8": "#1A212A",
    "#E8EDF3": "#2C3641",
    "#E3EAE3": "#2C3641",
    "#1B5FA6": "#2F6FB8",
    "#0F5B2A": "#2F6FB8",
    "#154A82": "#13263D",
    "#D9650A": "#E0701A",
    "#F28C28": "#E0701A",
    "#C62F26": "#E5594F",
    "#A4161A": "#E5594F",
    "#2E7D4F": "#3A9D66",
    "#FBE6E4": "#3A1B19",
    "#FDECEA": "#3A1B19",
    "#FFF3CC": "#3A3112",
    "#FFF4D6": "#3A3112",
    "#E3F2E8": "#17301F",
    "#F2B705": "#F2B705",
};

const TEXT_DARK: Record<string, string> = {
    "#1D2733": "#EEF1F4",
    "#111111": "#EEF1F4",
    "#000000": "#EEF1F4",
    "#566170": "#9AA6B4",
    "#3F3F3F": "#9AA6B4",
    "#5C5C5C": "#9AA6B4",
    "#1B5FA6": "#7DB7F0",
    "#0F5B2A": "#7DB7F0",
    "#154A82": "#7DB7F0",
    "#0A3F1D": "#7DB7F0",
    "#D9650A": "#E0701A",
    "#C62F26": "#E5594F",
    "#A4161A": "#E5594F",
    "#7A1013": "#E5594F",
    "#7A5200": "#F5C84B",
    "#7A4A00": "#F5C84B",
    "#2E7D4F": "#3A9D66",
    "#FFFFFF": "#FFFFFF",
};

const BORDER_DARK: Record<string, string> = {
    ...TEXT_DARK,
    "#D5DBE3": "#2C3641",
    "#4A4A4A": "#2C3641",
    "#6B7A6B": "#2C3641",
    "#E3EAE3": "#2C3641",
    "#E8EDF3": "#2C3641",
    "#F2B705": "#F2B705",
    "#FFFFFF": "#2C3641",
};

const COLOR_PROPERTIES = new Set([
    "color",
    "backgroundColor",
    "borderColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "borderStartColor",
    "borderEndColor",
    "outlineColor",
    "shadowColor",
    "textDecorationColor",
    "tintColor",
]);

function resolveColor(property: string, value: string): string {
    if (runtime.mode !== "dark") return value;

    const key = value.toUpperCase();
    let map: Record<string, string> | undefined;
    if (property === "backgroundColor") map = BACKGROUND_DARK;
    else if (property === "color" || property === "textDecorationColor") map = TEXT_DARK;
    else if (property.includes("order")) map = BORDER_DARK;
    else if (property === "tintColor") map = TEXT_DARK;
    else if (property === "shadowColor") map = { "#000000": "transparent" };

    return map?.[key] ?? value;
}

function isBold(weight: unknown): boolean {
    if (typeof weight === "number") return weight >= 600;
    if (typeof weight !== "string") return false;
    if (weight === "bold" || weight === "bolder") return true;
    const numeric = Number(weight);
    return Number.isFinite(numeric) ? numeric >= 600 : false;
}

type StyleDefinition = Record<string, unknown>;

function resolveStyle(definition: StyleDefinition): StyleDefinition {
    const result: StyleDefinition = { ...definition };

    for (const [property, value] of Object.entries(result)) {
        if (typeof value === "string" && COLOR_PROPERTIES.has(property)) {
            result[property] = resolveColor(property, value);
            continue;
        }

        if (
            (property === "fontSize" || property === "lineHeight") &&
            typeof value === "number" &&
            value > 0
        ) {
            result[property] = fs(value);
        }
    }

    const isTextStyle =
        typeof definition.fontSize === "number" ||
        typeof definition.fontWeight === "string" ||
        typeof definition.fontWeight === "number" ||
        typeof definition.fontFamily === "string";

    if (isTextStyle && !definition.fontFamily) {
        result.fontFamily = isBold(definition.fontWeight) ? FONT_BOLD : FONT_REGULAR;
        delete result.fontWeight;
    }

    return result;
}

type ThemedSheet = Record<string, StyleDefinition>;

function createThemedSheet<T extends ThemedSheet>(definitions: T): T {
    let cachedVersion = -1;
    const cache = new Map<string, StyleDefinition>();

    function resolveProperty(property: string): StyleDefinition | undefined {
        const definition = definitions[property];
        if (!definition) return definition;

        if (cachedVersion !== runtime.version) {
            cachedVersion = runtime.version;
            cache.clear();
        }

        const cached = cache.get(property);
        if (cached) return cached;

        const resolved = resolveStyle(definition);
        cache.set(property, resolved);
        return resolved;
    }

    return new Proxy({} as T, {
        get(_target, property) {
            if (typeof property !== "string") return undefined;
            return resolveProperty(property);
        },
        has(_target, property) {
            return typeof property === "string" && property in definitions;
        },
        ownKeys() {
            return Reflect.ownKeys(definitions);
        },
        getOwnPropertyDescriptor(_target, property) {
            if (typeof property !== "string" || !(property in definitions)) return undefined;
            return {
                enumerable: true,
                configurable: true,
                value: resolveProperty(property),
            };
        },
    });
}

type StyleCreateGlobal = typeof globalThis & {
    __estoqueFacilOriginalStyleCreate?: typeof StyleSheet.create;
};

const globalWithStyleCreate = globalThis as StyleCreateGlobal;
const originalCreate =
    globalWithStyleCreate.__estoqueFacilOriginalStyleCreate ?? StyleSheet.create;

if (!globalWithStyleCreate.__estoqueFacilOriginalStyleCreate) {
    globalWithStyleCreate.__estoqueFacilOriginalStyleCreate = originalCreate;
}

const themedCreate = ((definitions: ThemedSheet) => createThemedSheet(definitions)) as typeof StyleSheet.create;

try {
    Object.defineProperty(StyleSheet, "create", {
        value: themedCreate,
        writable: true,
        configurable: true,
    });
} catch {
    try {
        (StyleSheet as unknown as { create: typeof StyleSheet.create }).create = themedCreate;
    } catch {
        // Em plataformas que congelam StyleSheet, o app segue com o tema claro.
    }
}
