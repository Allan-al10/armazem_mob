import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ChoiceRow } from "@/components/ChoiceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TutorialModal } from "@/components/TutorialModal";
import { api } from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import {
    getDeviceTimezoneOffsetMinutes,
    getPushPermissionStatusAsync,
    registerForPushNotificationsAsync,
} from "@/lib/push";
import type { PushPermissionStatus } from "@/lib/pushTypes";
import { theme } from "@/theme";

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
                        ? "Este celular está cadastrado. Toque em Salvar configurações para confirmar os dias e o horário."
                        : "Este celular está cadastrado, mas os avisos estão desligados. Ligue os avisos e toque em Salvar configurações.",
                );
                return;
            }

            if (result.status === "denied") {
                setPermission("denied");
                Alert.alert(
                    "Avisos bloqueados",
                    "Para receber os lembretes, abra os ajustes do celular e permita as notificações do Meu Armazém.",
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
            Alert.alert(
                "Configurações salvas",
                enabled === "yes"
                    ? "Os avisos de fiado vão seguir os dias e o horário escolhidos."
                    : "Os avisos de fiado estão desligados.",
            );
        } catch (error) {
            Alert.alert("Não foi possível salvar", friendlyError(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <ScreenHeader
                title="Configurações"
                subtitle="Avisos de fiado e tutorial"
                helpKey="configuracoes"
                showBack
            />
            <Screen>
                <View style={styles.introBox}>
                    <Text style={styles.introTitle}>Avisos de fiado</Text>
                    <Text style={styles.introText}>
                        O aplicativo avisa quando um fiado está perto de vencer, no dia do
                        vencimento e enquanto estiver atrasado.
                    </Text>
                </View>

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

                <View style={styles.deviceBox}>
                    <Text style={styles.deviceTitle}>Avisos no celular</Text>
                    <Text style={styles.deviceText}>{permissionLabel(permission)}</Text>
                    <Text style={styles.deviceText}>
                        {deviceRegistered
                            ? "Há um celular cadastrado para receber os avisos."
                            : "Nenhum celular está cadastrado para receber os avisos."}
                    </Text>

                    {Platform.OS === "web" ? (
                        <Text style={styles.deviceText}>
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
                    label="Salvar configurações"
                    icon="✓"
                    loading={saving}
                    onPress={() => {
                        void handleSave();
                    }}
                />

                <View style={styles.tutorialBox}>
                    <Text style={styles.tutorialTitle}>Precisa rever as explicações?</Text>
                    <Text style={styles.tutorialText}>
                        Abra o tutorial de novo para lembrar como usar as partes principais do
                        aplicativo.
                    </Text>
                    <BigButton
                        label="Rever tutorial"
                        icon="❓"
                        variant="secondary"
                        onPress={() => setTutorialVisible(true)}
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
    introBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    introTitle: {
        fontSize: theme.font.subtitle,
        fontWeight: "800",
        color: theme.colors.text,
    },
    introText: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.textMuted,
    },
    fieldGroup: {
        gap: theme.spacing.sm,
    },
    fieldLabel: {
        fontSize: theme.font.label,
        fontWeight: "700",
        color: theme.colors.text,
        lineHeight: 26,
    },
    hint: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    deviceBox: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    deviceTitle: {
        fontSize: theme.font.subtitle,
        fontWeight: "800",
        color: theme.colors.primary,
    },
    deviceText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.text,
    },
    tutorialBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    tutorialTitle: {
        fontSize: theme.font.subtitle,
        fontWeight: "800",
        color: theme.colors.text,
    },
    tutorialText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
});
