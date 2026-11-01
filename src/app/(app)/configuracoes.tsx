import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BigButton } from "@/components/BigButton";
import { ChoiceRow } from "@/components/ChoiceRow";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TutorialModal } from "@/components/TutorialModal";
import { api } from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import {
    getQuickAccessItem,
    QUICK_ACCESS_CATALOG,
    type FontScaleName,
    type ThemeMode,
} from "@/lib/preferences";
import {
    getDeviceTimezoneOffsetMinutes,
    getPushPermissionStatusAsync,
    registerForPushNotificationsAsync,
} from "@/lib/push";
import type { PushPermissionStatus } from "@/lib/pushTypes";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type SettingsData = {
    enabled: boolean;
    daysBefore: number;
    hour: number;
    timezoneOffsetMinutes: number;
    hasPushToken: boolean;
};

type EnabledChoice = "yes" | "no";
type DayChoice = "1" | "2" | "3" | "5" | "7";
type HourChoice = "6" | "8" | "10" | "12" | "18";

const THEME_OPTIONS = [
    { value: "light", label: "Claro", icon: "☀" },
    { value: "dark", label: "Escuro", icon: "🌙" },
] as const;

const FONT_OPTIONS = [
    { value: "normal", label: "Normal" },
    { value: "large", label: "Grande" },
    { value: "xlarge", label: "Muito grande" },
] as const;

const ENABLED_OPTIONS = [
    { value: "yes", label: "Avisos ligados" },
    { value: "no", label: "Avisos desligados" },
] as const;

const DAY_OPTIONS = [
    { value: "1", label: "1 dia antes" },
    { value: "2", label: "2 dias antes" },
    { value: "3", label: "3 dias antes" },
    { value: "5", label: "5 dias antes" },
    { value: "7", label: "7 dias antes" },
] as const;

const HOUR_OPTIONS = [
    { value: "6", label: "6 horas" },
    { value: "8", label: "8 horas" },
    { value: "10", label: "10 horas" },
    { value: "12", label: "12 horas" },
    { value: "18", label: "18 horas" },
] as const;

function dayChoice(value: number): DayChoice {
    const text = String(value);
    return DAY_OPTIONS.some((option) => option.value === text)
        ? (text as DayChoice)
        : "3";
}

function hourChoice(value: number): HourChoice {
    const text = String(value);
    return HOUR_OPTIONS.some((option) => option.value === text)
        ? (text as HourChoice)
        : "8";
}

function permissionLabel(permission: PushPermissionStatus | "loading"): string {
    switch (permission) {
        case "granted":
            return "Permissão do celular: permitida.";
        case "denied":
            return "Permissão do celular: bloqueada.";
        case "undetermined":
            return "Permissão do celular: ainda não perguntada.";
        case "unsupported":
            return "Este aparelho não permite avisos no aplicativo.";
        default:
            return "Verificando a permissão do celular...";
    }
}

export default function SettingsScreen() {
    const settings = useQuery(api.reminders.settings);

    if (settings === undefined) {
        return <LoadingScreen />;
    }

    return <SettingsForm initial={settings} />;
}

function SettingsForm({ initial }: { initial: SettingsData }) {
    const updateSettings = useMutation(api.reminders.updateSettings);
    const registerPushToken = useMutation(api.reminders.registerPushToken);
    const {
        colors,
        theme: appTheme,
        mode,
        fontScale,
        quickAccess,
        setMode,
        setFontScale,
        addQuickAccess,
        removeQuickAccess,
        moveQuickAccess,
    } = useAppTheme();

    const [enabled, setEnabled] = useState<EnabledChoice>(initial.enabled ? "yes" : "no");
    const [days, setDays] = useState<DayChoice>(dayChoice(initial.daysBefore));
    const [hour, setHour] = useState<HourChoice>(hourChoice(initial.hour));
    const [permission, setPermission] = useState<PushPermissionStatus | "loading">(
        "loading",
    );
    const [registered, setRegistered] = useState(initial.hasPushToken);
    const deviceRegistered = registered || initial.hasPushToken;
    const [activating, setActivating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [tutorialVisible, setTutorialVisible] = useState(false);

    useEffect(() => {
        let active = true;

        void getPushPermissionStatusAsync().then((status) => {
            if (active) setPermission(status);
        });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!saved) return;
        const timer = setTimeout(() => setSaved(false), 1800);
        return () => clearTimeout(timer);
    }, [saved]);

    const handleActivate = async () => {
        setActivating(true);
        try {
            const result = await registerForPushNotificationsAsync();

            if (result.status === "registered") {
                await registerPushToken({
                    token: result.token,
                    platform: result.platform,
                    timezoneOffsetMinutes: getDeviceTimezoneOffsetMinutes(),
                });
                setPermission("granted");
                setRegistered(true);
                Alert.alert(
                    "Celular cadastrado",
                    enabled === "yes"
                        ? "Este celular está cadastrado. Toque em Salvar avisos para confirmar os dias e o horário."
                        : "Este celular está cadastrado, mas os avisos estão desligados. Ligue os avisos e toque em Salvar avisos.",
                );
                return;
            }

            if (result.status === "denied") {
                setPermission("denied");
                Alert.alert(
                    "Avisos bloqueados",
                    "Para receber os lembretes, abra os ajustes do celular e permita as notificações do Estoque Fácil.",
                    [
                        { text: "Agora não", style: "cancel" },
                        {
                            text: "Abrir ajustes",
                            onPress: () => {
                                void Linking.openSettings();
                            },
                        },
                    ],
                );
                return;
            }

            Alert.alert("Avisos não ativados", result.message);
        } catch (error) {
            Alert.alert("Não foi possível ativar os avisos", friendlyError(error));
        } finally {
            setActivating(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings({
                enabled: enabled === "yes",
                daysBefore: Number(days),
                hour: Number(hour),
                timezoneOffsetMinutes: getDeviceTimezoneOffsetMinutes(),
            });
            setSaved(true);
        } catch (error) {
            Alert.alert("Não foi possível salvar", friendlyError(error));
        } finally {
            setSaving(false);
        }
    };

    const availableQuickAccess = QUICK_ACCESS_CATALOG.filter(
        (item) => !quickAccess.includes(item.key),
    );

    return (
        <>
            <ScreenHeader
                title="Configurações"
                subtitle="Aparência, atalhos e avisos"
                helpKey="configuracoes"
                showBack
            />
            <Screen>
                {saved ? (
                    <FeedbackBanner
                        tone="success"
                        title="Configurações salvas!"
                        message="Os avisos de fiado foram atualizados."
                    />
                ) : null}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APARÊNCIA</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Tema</Text>
                        <ChoiceRow
                            options={THEME_OPTIONS}
                            value={mode}
                            onChange={(value) => setMode(value as ThemeMode)}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Tamanho das letras e símbolos</Text>
                        <ChoiceRow
                            options={FONT_OPTIONS}
                            value={fontScale}
                            onChange={(value) => setFontScale(value as FontScaleName)}
                        />
                        <View style={[styles.sampleBox, { borderColor: colors.border }]}>
                            <Text style={[styles.sampleLabel, { color: colors.textMuted }]}>
                                Exemplo
                            </Text>
                            <Text
                                style={[
                                    styles.sampleText,
                                    {
                                        color: colors.text,
                                        fontSize: appTheme.font.body,
                                        lineHeight: appTheme.lineHeight.body,
                                    },
                                ]}
                            >
                                Arroz 5 kg • R$ 24,90
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACESSO RÁPIDO NA TELA INICIAL</Text>
                    <Text style={styles.hint}>
                        Escolha o que aparece primeiro na tela inicial. Use as setas para
                        mudar a ordem.
                    </Text>

                    {quickAccess.length === 0 ? (
                        <Text style={styles.hint}>Nenhum atalho escolhido.</Text>
                    ) : (
                        quickAccess.map((key, index) => {
                            const item = getQuickAccessItem(key);
                            return (
                                <View
                                    key={key}
                                    style={[
                                        styles.quickRow,
                                        { borderColor: colors.border, backgroundColor: colors.card },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.quickIcon,
                                            {
                                                backgroundColor:
                                                    item.color === "accent"
                                                        ? colors.accent
                                                        : item.color === "yellow"
                                                          ? colors.yellow
                                                          : item.color === "success"
                                                            ? colors.success
                                                            : item.color === "danger"
                                                              ? colors.danger
                                                              : item.color === "header"
                                                                ? colors.header
                                                                : colors.primary,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.quickIconText,
                                                {
                                                    color:
                                                        item.color === "yellow"
                                                            ? "#1D2733"
                                                            : colors.onPrimary,
                                                },
                                            ]}
                                        >
                                            {item.icon}
                                        </Text>
                                    </View>
                                    <Text style={[styles.quickText, { color: colors.text }]}>
                                        {item.label}
                                    </Text>
                                    <Pressable
                                        onPress={() => moveQuickAccess(key, -1)}
                                        disabled={index === 0}
                                        hitSlop={6}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Mover ${item.label} para cima`}
                                        style={({ pressed }) => [
                                            styles.iconButton,
                                            { borderColor: colors.border },
                                            index === 0 ? styles.disabled : null,
                                            pressed ? styles.pressed : null,
                                        ]}
                                    >
                                        <Text style={[styles.iconButtonText, { color: colors.text }]}>
                                            ↑
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => moveQuickAccess(key, 1)}
                                        disabled={index === quickAccess.length - 1}
                                        hitSlop={6}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Mover ${item.label} para baixo`}
                                        style={({ pressed }) => [
                                            styles.iconButton,
                                            { borderColor: colors.border },
                                            index === quickAccess.length - 1
                                                ? styles.disabled
                                                : null,
                                            pressed ? styles.pressed : null,
                                        ]}
                                    >
                                        <Text style={[styles.iconButtonText, { color: colors.text }]}>
                                            ↓
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => removeQuickAccess(key)}
                                        hitSlop={6}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Remover ${item.label}`}
                                        style={({ pressed }) => [
                                            styles.iconButton,
                                            { borderColor: colors.danger },
                                            pressed ? styles.pressed : null,
                                        ]}
                                    >
                                        <Text
                                            style={[styles.iconButtonText, { color: colors.danger }]}
                                        >
                                            ×
                                        </Text>
                                    </Pressable>
                                </View>
                            );
                        })
                    )}

                    {availableQuickAccess.length > 0 ? (
                        <View style={styles.availableBox}>
                            <Text style={styles.availableTitle}>DISPONÍVEIS PARA ADICIONAR</Text>
                            {availableQuickAccess.map((item) => (
                                <Pressable
                                    key={item.key}
                                    onPress={() => addQuickAccess(item.key)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Adicionar ${item.label} ao acesso rápido`}
                                    style={({ pressed }) => [
                                        styles.addButton,
                                        { borderColor: colors.primaryInk },
                                        pressed ? styles.pressed : null,
                                    ]}
                                >
                                    <Text style={[styles.addPlus, { color: colors.primaryInk }]}>
                                        +
                                    </Text>
                                    <View style={styles.addTexts}>
                                        <Text style={[styles.addLabel, { color: colors.primaryInk }]}>
                                            {item.label}
                                        </Text>
                                        <Text style={[styles.addSubtitle, { color: colors.textMuted }]}>
                                            {item.subtitle}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    ) : null}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CONTA</Text>
                    <BigButton
                        label="Editar dados do estabelecimento"
                        icon="🏪"
                        variant="secondary"
                        onPress={() => router.push("/meu-cadastro")}
                    />
                    <BigButton
                        label="Rever tutorial"
                        icon="❓"
                        variant="secondary"
                        onPress={() => setTutorialVisible(true)}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AVISOS DE FIADO</Text>
                    <Text style={styles.hint}>
                        O aplicativo avisa quando um fiado está perto de vencer, no dia do
                        vencimento e enquanto estiver atrasado.
                    </Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Avisos</Text>
                        <ChoiceRow
                            options={ENABLED_OPTIONS}
                            value={enabled}
                            onChange={setEnabled}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Quantos dias antes?</Text>
                        <Text style={styles.hint}>
                            Também avisamos 1 dia antes, no dia do vencimento e enquanto
                            estiver atrasado.
                        </Text>
                        <ChoiceRow options={DAY_OPTIONS} value={days} onChange={setDays} />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Horário do aviso</Text>
                        <Text style={styles.hint}>Escolha o horário do seu celular.</Text>
                        <ChoiceRow options={HOUR_OPTIONS} value={hour} onChange={setHour} />
                    </View>

                    <View style={[styles.deviceBox, { borderColor: colors.primaryInk }]}>
                        <Text style={[styles.deviceTitle, { color: colors.primaryInk }]}>
                            Avisos no celular
                        </Text>
                        <Text style={[styles.deviceText, { color: colors.text }]}>
                            {permissionLabel(permission)}
                        </Text>
                        <Text style={[styles.deviceText, { color: colors.text }]}>
                            {deviceRegistered
                                ? "Há um celular cadastrado para receber os avisos."
                                : "Nenhum celular está cadastrado para receber os avisos."}
                        </Text>

                        {Platform.OS === "web" ? (
                            <Text style={[styles.deviceText, { color: colors.textMuted }]}>
                                Os avisos no celular funcionam no aplicativo instalado.
                            </Text>
                        ) : (
                            <BigButton
                                label="Ativar avisos neste celular"
                                icon="🔔"
                                variant="secondary"
                                loading={activating}
                                onPress={() => {
                                    void handleActivate();
                                }}
                            />
                        )}
                    </View>

                    <BigButton
                        label="Salvar avisos de fiado"
                        icon="✓"
                        loading={saving}
                        onPress={() => {
                            void handleSave();
                        }}
                    />
                </View>
            </Screen>

            <TutorialModal
                visible={tutorialVisible}
                tutorialKey="home"
                onClose={() => setTutorialVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.font.label,
        lineHeight: 20,
        fontWeight: "700",
        letterSpacing: 0.8,
        color: theme.colors.textMuted,
    },
    fieldGroup: {
        gap: theme.spacing.sm,
    },
    fieldLabel: {
        fontSize: theme.font.label,
        lineHeight: 22,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    hint: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    sampleBox: {
        borderWidth: 2,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        gap: 2,
    },
    sampleLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    sampleText: {
        fontWeight: "400",
    },
    quickRow: {
        minHeight: 60,
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    quickIcon: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
    },
    quickIconText: {
        fontSize: 20,
        lineHeight: 24,
    },
    quickText: {
        flex: 1,
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    iconButton: {
        width: 40,
        height: 44,
        borderRadius: theme.radius.md,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    iconButtonText: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "700",
    },
    disabled: {
        opacity: 0.35,
    },
    pressed: {
        opacity: 0.65,
    },
    availableBox: {
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    availableTitle: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
        color: theme.colors.textMuted,
    },
    addButton: {
        minHeight: 56,
        borderWidth: 2,
        borderStyle: "dashed",
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    addPlus: {
        fontSize: 28,
        lineHeight: 30,
        fontWeight: "700",
    },
    addTexts: {
        flex: 1,
        gap: 1,
    },
    addLabel: {
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    addSubtitle: {
        fontSize: theme.font.small,
        lineHeight: 19,
    },
    deviceBox: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    deviceTitle: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.primaryInk,
    },
    deviceText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
    },
});
