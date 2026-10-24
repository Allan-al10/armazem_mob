import { useMutation, useQuery } from "convex/react";
import * as Linking from "expo-linking";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SaleReceipt } from "@/components/SaleReceipt";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { api, type Id } from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import {
    buildSaleNoteHtml,
    buildSaleNoteText,
    buildSmsUrl,
    buildWhatsAppUrl,
    formatSaleNumber,
} from "@/lib/sale";
import { theme } from "@/theme";

function printOnWeb(html: string): boolean {
    if (typeof window === "undefined") return false;
    const win = window.open("", "_blank");
    if (!win) return false;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 300);
    return true;
}

export default function SaleNoteScreen() {
    const params = useLocalSearchParams<{ id?: string }>();
    const saleId = typeof params.id === "string" && params.id ? params.id : undefined;
    const data = useQuery(
        api.sales.get,
        saleId ? { saleId: saleId as Id<"sales"> } : "skip",
    );
    const credit = useQuery(
        api.credits.getBySale,
        saleId && data?.sale.paymentMethod === "credit_account"
            ? { saleId: saleId as Id<"sales"> }
            : "skip",
    );
    const store = useQuery(api.stores.getMine);
    const cancelSale = useMutation(api.sales.cancel);

    const [cancelVisible, setCancelVisible] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (saleId === undefined) {
        return (
            <>
                <ScreenHeader title="Nota da venda" helpKey="nota" showBack />
                <Screen>
                    <ErrorBanner message="Venda não encontrada. Volte para as vendas." />
                    <BigButton label="Ir para o início" onPress={() => router.replace("/inicio")} />
                </Screen>
            </>
        );
    }

    if (data === undefined || store === undefined) {
        return <LoadingScreen />;
    }

    if (data === null || store === null) {
        return (
            <>
                <ScreenHeader title="Nota da venda" helpKey="nota" showBack />
                <Screen>
                    <ErrorBanner message="Esta venda não foi encontrada. Volte para as vendas." />
                    <BigButton label="Ir para o início" onPress={() => router.replace("/inicio")} />
                </Screen>
            </>
        );
    }

    if (data.sale.paymentMethod === "credit_account" && credit === undefined) {
        return <LoadingScreen />;
    }

    const { sale, items } = data;
    const canceled = sale.status === "canceled";
    const hasPhone = Boolean(sale.customerPhone);
    const creditData = credit ?? null;
    const creditHasPayment =
        creditData !== null &&
        (Math.round(creditData.paidCents) > 0 || creditData.status === "paid");
    const noteData = { store, sale, items, credit: creditData };
    const noteText = buildSaleNoteText(noteData);
    const noteHtml = buildSaleNoteHtml(noteData);

    const openWhatsApp = async () => {
        if (!sale.customerPhone) {
            Alert.alert("Cliente sem telefone", "Cadastre o telefone do cliente para enviar a nota.");
            return;
        }
        try {
            await Linking.openURL(buildWhatsAppUrl(sale.customerPhone, noteText));
        } catch {
            Alert.alert(
                "Não foi possível abrir o WhatsApp",
                "Confira se o WhatsApp está instalado e tente de novo.",
            );
        }
    };

    const openSms = async () => {
        if (!sale.customerPhone) {
            Alert.alert("Cliente sem telefone", "Cadastre o telefone do cliente para enviar a nota.");
            return;
        }
        try {
            const separator = Platform.OS === "ios" ? "&" : "?";
            await Linking.openURL(buildSmsUrl(sale.customerPhone, noteText, separator));
        } catch {
            Alert.alert(
                "Não foi possível abrir as mensagens",
                "Confira se o aplicativo de SMS está disponível e tente de novo.",
            );
        }
    };

    const printNote = async () => {
        if (printing) return;
        setPrinting(true);
        try {
            if (Platform.OS === "web") {
                const opened = printOnWeb(noteHtml);
                if (!opened) {
                    Alert.alert(
                        "Não foi possível abrir a impressão",
                        "Permita janelas pop-up no navegador e tente de novo.",
                    );
                }
                return;
            }
            await Print.printAsync({ html: noteHtml });
        } catch (err) {
            Alert.alert(
                "Não foi possível imprimir",
                friendlyError(err, "Confira a impressora e tente de novo."),
            );
        } finally {
            setPrinting(false);
        }
    };

    const sharePdf = async () => {
        if (printing) return;
        setPrinting(true);
        try {
            if (Platform.OS === "web") {
                const opened = printOnWeb(noteHtml);
                if (!opened) {
                    Alert.alert(
                        "Não foi possível abrir a impressão",
                        "Permita janelas pop-up no navegador e tente de novo.",
                    );
                }
                return;
            }

            const { uri } = await Print.printToFileAsync({ html: noteHtml });
            const sharingAvailable = await Sharing.isAvailableAsync();
            if (!sharingAvailable) {
                Alert.alert(
                    "Compartilhamento indisponível",
                    "Use a opção Imprimir para salvar a nota em PDF.",
                );
                return;
            }
            await Sharing.shareAsync(uri, {
                mimeType: "application/pdf",
                UTI: "com.adobe.pdf",
                dialogTitle: `Nota nº ${formatSaleNumber(sale.number)}`,
            });
        } catch (err) {
            Alert.alert(
                "Não foi possível preparar o PDF",
                friendlyError(err, "Tente de novo em alguns instantes."),
            );
        } finally {
            setPrinting(false);
        }
    };

    const handleCancel = async () => {
        setCanceling(true);
        setError(null);
        try {
            await cancelSale({ saleId: sale._id });
            setCancelVisible(false);
            Alert.alert(
                "Venda cancelada",
                "Os produtos voltaram para o estoque e a venda foi marcada como cancelada.",
            );
        } catch (err) {
            setError(friendlyError(err, "Não foi possível cancelar a venda. Tente de novo."));
            setCancelVisible(false);
        } finally {
            setCanceling(false);
        }
    };

    return (
        <>
            <ScreenHeader
                title="Nota da venda"
                subtitle={`Nº ${formatSaleNumber(sale.number)} • ${sale.customerName}`}
                helpKey="nota"
                showBack
            />
            <Screen>
                <ErrorBanner message={error} />

                {canceled ? (
                    <View
                        style={styles.canceledBanner}
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite"
                    >
                        <Text style={styles.canceledTitle}>Venda cancelada</Text>
                        <Text style={styles.canceledText}>
                            Os produtos voltaram para o estoque. Esta nota não pode mais ser
                            enviada.
                        </Text>
                    </View>
                ) : null}

                <SaleReceipt store={store} sale={sale} items={items} credit={creditData} />

                <Text style={styles.sectionTitle}>Enviar a nota</Text>

                <BigButton
                    label="Enviar por WhatsApp"
                    description={
                        canceled
                            ? "Venda cancelada"
                            : hasPhone
                              ? "Abrir o WhatsApp com a nota escrita"
                              : "Cliente sem telefone cadastrado"
                    }
                    icon="💬"
                    onPress={openWhatsApp}
                    disabled={canceled || !hasPhone}
                />
                <BigButton
                    label="Enviar por SMS"
                    description={
                        canceled
                            ? "Venda cancelada"
                            : hasPhone
                              ? "Abrir o aplicativo de mensagens"
                              : "Cliente sem telefone cadastrado"
                    }
                    icon="✉️"
                    variant="secondary"
                    onPress={openSms}
                    disabled={canceled || !hasPhone}
                />

                {Platform.OS === "web" ? (
                    <BigButton
                        label="Imprimir ou salvar PDF"
                        description="Abrir a janela de impressão do navegador"
                        icon="🖨️"
                        variant="secondary"
                        onPress={printNote}
                        loading={printing}
                    />
                ) : (
                    <>
                        <BigButton
                            label="Imprimir nota"
                            description="Abrir a impressão do celular"
                            icon="🖨️"
                            variant="secondary"
                            onPress={printNote}
                            loading={printing}
                        />
                        <BigButton
                            label="Salvar ou compartilhar PDF"
                            description="Gerar o arquivo PDF e escolher onde salvar"
                            icon="📄"
                            variant="secondary"
                            onPress={sharePdf}
                            loading={printing}
                        />
                    </>
                )}

                <Text style={styles.sectionTitle}>Depois da venda</Text>

                {creditData && !canceled ? (
                    <BigButton
                        label="Ver fiado em Quem deve"
                        description="Registrar pagamento ou cobrar o cliente"
                        icon="📒"
                        variant="secondary"
                        onPress={() =>
                            router.push({
                                pathname: "/fiado/[id]",
                                params: { id: creditData.customerId },
                            })
                        }
                    />
                ) : null}

                <BigButton
                    label={canceled ? "Voltar ao início" : "Concluir"}
                    description="Voltar para a tela de início"
                    icon="✓"
                    onPress={() => router.replace("/inicio")}
                />

                {!canceled && !creditHasPayment ? (
                    <BigButton
                        label="Cancelar venda"
                        description="Devolver os produtos ao estoque"
                        variant="danger"
                        onPress={() => {
                            setError(null);
                            setCancelVisible(true);
                        }}
                    />
                ) : null}

                {creditHasPayment ? (
                    <Text style={styles.infoText}>
                        Este fiado já tem pagamento registrado. Para acertar o restante, use Quem
                        deve. O cancelamento da venda fica bloqueado.
                    </Text>
                ) : null}
            </Screen>

            <ConfirmDialog
                visible={cancelVisible}
                title="Cancelar esta venda?"
                message={`A venda nº ${formatSaleNumber(
                    sale.number,
                )} será marcada como cancelada e todos os itens voltam para o estoque. Não dá para desfazer o cancelamento.`}
                confirmLabel="Sim, cancelar venda"
                cancelLabel="Não, manter venda"
                destructive
                loading={canceling}
                onConfirm={handleCancel}
                onCancel={() => setCancelVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    canceledBanner: {
        backgroundColor: theme.colors.dangerSurface,
        borderWidth: 2,
        borderColor: theme.colors.danger,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    canceledTitle: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.danger,
    },
    canceledText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.text,
    },
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
    },
    infoText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        backgroundColor: theme.colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
    },
});
