import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    DEFAULT_PREFERENCES,
    FONT_SCALE_FACTORS,
    FONT_SCALE_LABELS,
    loadPreferences,
    savePreferences,
    type FontScaleName,
    type QuickAccessKey,
    type ThemeMode,
} from "@/lib/preferences";
import {
    applyThemeRuntime,
    fs as scaleFont,
    is as scaleIcon,
    getResolvedTheme,
    type AppColors,
    type Theme,
} from "@/theme";

type AppThemeContextValue = {
    mode: ThemeMode;
    fontScale: FontScaleName;
    scale: number;
    quickAccess: QuickAccessKey[];
    theme: Theme;
    colors: AppColors;
    revision: string;
    fs: (value: number) => number;
    is: (value: number) => number;
    setMode: (mode: ThemeMode) => void;
    setFontScale: (scale: FontScaleName) => void;
    setQuickAccess: (keys: QuickAccessKey[]) => void;
    addQuickAccess: (key: QuickAccessKey) => void;
    removeQuickAccess: (key: QuickAccessKey) => void;
    moveQuickAccess: (key: QuickAccessKey, direction: -1 | 1) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const [mode, setModeState] = useState<ThemeMode>(DEFAULT_PREFERENCES.theme);
    const [fontScale, setFontScaleState] = useState<FontScaleName>(
        DEFAULT_PREFERENCES.fontScale,
    );
    const [quickAccess, setQuickAccessState] = useState<QuickAccessKey[]>(
        DEFAULT_PREFERENCES.quickAccess,
    );

    const modeRef = useRef(mode);
    const scaleRef = useRef(FONT_SCALE_FACTORS[fontScale]);

    useEffect(() => {
        let active = true;
        void loadPreferences().then((preferences) => {
            if (!active) return;

            modeRef.current = preferences.theme;
            scaleRef.current = FONT_SCALE_FACTORS[preferences.fontScale];
            applyThemeRuntime(preferences.theme, scaleRef.current);

            setModeState(preferences.theme);
            setFontScaleState(preferences.fontScale);
            setQuickAccessState(preferences.quickAccess);
            setReady(true);
        });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!ready) return;
        void savePreferences({ theme: mode, fontScale, quickAccess });
    }, [ready, mode, fontScale, quickAccess]);

    const setMode = useCallback((next: ThemeMode) => {
        modeRef.current = next;
        applyThemeRuntime(next, scaleRef.current);
        setModeState(next);
    }, []);

    const setFontScale = useCallback((next: FontScaleName) => {
        scaleRef.current = FONT_SCALE_FACTORS[next];
        applyThemeRuntime(modeRef.current, scaleRef.current);
        setFontScaleState(next);
    }, []);

    const setQuickAccess = useCallback((keys: QuickAccessKey[]) => {
        setQuickAccessState(keys);
    }, []);

    const addQuickAccess = useCallback((key: QuickAccessKey) => {
        setQuickAccessState((current) => (current.includes(key) ? current : [...current, key]));
    }, []);

    const removeQuickAccess = useCallback((key: QuickAccessKey) => {
        setQuickAccessState((current) => current.filter((entry) => entry !== key));
    }, []);

    const moveQuickAccess = useCallback((key: QuickAccessKey, direction: -1 | 1) => {
        setQuickAccessState((current) => {
            const index = current.indexOf(key);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= current.length) return current;

            const next = [...current];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }, []);

    const factor = FONT_SCALE_FACTORS[fontScale];
    const theme = useMemo(() => getResolvedTheme(mode, factor), [mode, factor]);

    const value = useMemo<AppThemeContextValue>(
        () => ({
            mode,
            fontScale,
            scale: factor,
            quickAccess,
            theme,
            colors: theme.colors,
            revision: `${mode}:${fontScale}`,
            fs: (size: number) => scaleFont(size, factor),
            is: (size: number) => scaleIcon(size, factor),
            setMode,
            setFontScale,
            setQuickAccess,
            addQuickAccess,
            removeQuickAccess,
            moveQuickAccess,
        }),
        [
            mode,
            fontScale,
            factor,
            quickAccess,
            theme,
            setMode,
            setFontScale,
            setQuickAccess,
            addQuickAccess,
            removeQuickAccess,
            moveQuickAccess,
        ],
    );

    if (!ready) return null;

    return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
    const context = useContext(AppThemeContext);
    if (!context) {
        throw new Error("useAppTheme precisa ser usado dentro de AppPreferencesProvider.");
    }
    return context;
}

export function fontScaleLabel(scale: FontScaleName): string {
    return FONT_SCALE_LABELS[scale];
}
