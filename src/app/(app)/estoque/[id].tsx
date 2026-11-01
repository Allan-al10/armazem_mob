import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ChoiceRow } from "@/components/ChoiceRow";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MoneyInput } from "@/components/MoneyInput";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { api, type Doc, type Id } from "@/lib/api";
import { formatDateBR } from "@/lib/date";
import { friendlyError } from "@/lib/errors";
import { fieldHelp } from "@/lib/help";
import { formatCents } from "@/lib/money";
import {
    formatQuantity,
    formatQuantityWithUnit,
    isValidStockLevel,
    parseQuantity,
    unitLabels,
} from "@/lib/quantity";
import type { ProductUnit } from "@/lib/types";
import { normalizeSpaces } from "@/lib/validation";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type ProductRecord = Doc<"products">;

function PriceAndThresholdForm({ product }: { product: ProductRecord }) {
    const update = useMutation(api.products.update);
    const [salePriceCents, setSalePriceCents] = useState(product.salePriceCents);
    const [thresholdText, setThresholdText] = useState(() =>
        formatQuantity(product.lowStockThreshold),
    );
    const [saleError, setSaleError] = useState<string | null>(null);
    const [thresholdError, setThresholdError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmBelowCost, setConfirmBelowCost] = useState(false);

    const persist = async () => {
        setConfirmBelowCost(false);
        setError(null);
        setSaving(true);
        try {
            await update({
                productId: product._id,
                salePriceCents,
                lowStockThreshold: parseQuantity(thresholdText),
                active: product.active,
            });
            setSaved(true);
        } catch (err) {
            setError(friendlyError(err, "Não foi possível salvar. Tente de novo."));
        } finally {
            setSaving(false);
        }
    };

    const handleSave = () => {
        const nextSaleError = salePriceCents <= 0 ? "Digite o preço de venda." : null;
        const threshold = parseQuantity(thresholdText);
        const nextThresholdError = !isValidStockLevel(threshold, product.unit)
            ? product.unit === "kg"
                ? "Digite um número em quilos. Exemplo: 1,5."
                : "Digite um número inteiro."
            : null;

        setSaleError(nextSaleError);
        setThresholdError(nextThresholdError);
        setSaved(false);
        if (nextSaleError || nextThresholdError) {
            return;
        }

        if (product.lastUnitCostCents > 0 && salePriceCents < product.lastUnitCostCents) {
            setConfirmBelowCost(true);
            return;
        }

        void persist();
    };

    return (
        <View style={styles.card}>
            <MoneyInput
                label="Preço de venda"
                info={fieldHelp.salePrice}
                required
                valueCents={salePriceCents}
                onChangeCents={(cents) => {
                    setSalePriceCents(cents);
                    setSaleError(null);
                    setSaved(false);
                }}
                error={saleError}
            />

            <TextField
                label="Aviso de estoque baixo"
                info={fieldHelp.lowStockThreshold}
                required
                value={thresholdText}
                onChangeText={(text) => {
                    setThresholdText(text);
                    setThresholdError(null);
                    setSaved(false);
                }}
                error={thresholdError}
                placeholder={product.unit === "kg" ? "Ex.: 2,5" : "Ex.: 5"}
                keyboardType={product.unit === "kg" ? "decimal-pad" : "number-pad"}
                maxLength={8}
            />

            <ErrorBanner message={error} />

            {saved ? (
                <Text style={styles.savedText} accessibilityLiveRegion="polite">
                    ✔ Dados salvos.
                </Text>
            ) : null}

            <BigButton label="Salvar dados" onPress={handleSave} loading={saving} icon="✓" />

            <ConfirmDialog
                visible={confirmBelowCost}
                title="Preço abaixo do custo?"
                message={`O preço de venda (${formatCents(
                    salePriceCents,
                )}) é menor que o último custo (${formatCents(
                    product.lastUnitCostCents,
                )}). Deseja salvar mesmo assim?`}
                confirmLabel="Sim, salvar"
                cancelLabel="Não, corrigir"
                destructive
                loading={saving}
                onConfirm={() => void persist()}
                onCancel={() => setConfirmBelowCost(false)}
            />
        </View>
    );
}

type AdjustReason = "perda" | "contagem" | "outro";

const REASON_OPTIONS = [
    { value: "perda", label: "Perda ou quebra" },
    { value: "contagem", label: "Contagem" },
    { value: "outro", label: "Outro motivo" },
] as const;

function AdjustStockForm({ product }: { product: ProductRecord }) {
    const adjust = useMutation(api.stock.adjust);
    const { colors } = useAppTheme();
    const [open, setOpen] = useState(false);
    const [quantityText, setQuantityText] = useState("");
    const [reason, setReason] = useState<AdjustReason>("perda");
    const [otherReason, setOtherReason] = useState("");
    const [reasonError, setReasonError] = useState<string | null>(null);
    const [quantityError, setQuantityError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const openForm = (initialQuantity?: number) => {
        setOpen(true);
        setQuantityText(
            initialQuantity === undefined ? "" : formatQuantity(initialQuantity),
        );
        setReason("perda");
        setOtherReason("");
        setQuantityError(null);
        setReasonError(null);
        setError(null);
    };

    const step = product.unit === "kg" ? 0.5 : 1;
    const nextQuantity = Math.max(
        0,
        Math.round((product.stockQty + step) * 1000) / 1000,
    );
    const previousQuantity = Math.max(
        0,
        Math.round((product.stockQty - step) * 1000) / 1000,
    );

    const closeForm = () => {
        setOpen(false);
        setQuantityError(null);
        setReasonError(null);
        setError(null);
    };

    const newQuantity = parseQuantity(quantityText);
    const difference = Number.isFinite(newQuantity)
        ? Math.round((newQuantity - product.stockQty) * 1000) / 1000
        : Number.NaN;

    const handleSubmit = async () => {
        const nextQuantityError = !isValidStockLevel(newQuantity, product.unit)
            ? product.unit === "kg"
                ? "Digite a quantidade contada em quilos. Exemplo: 1,5."
                : "Digite a quantidade contada, sem vírgula."
            : difference === 0
              ? "A quantidade não mudou. Confira o valor."
              : null;
        const nextReasonError =
            reason === "outro" && !normalizeSpaces(otherReason)
                ? "Digite o motivo do ajuste."
                : null;

        setQuantityError(nextQuantityError);
        setReasonError(nextReasonError);
        if (nextQuantityError || nextReasonError) {
            return;
        }

        const reasonText =
            reason === "perda"
                ? "Perda ou quebra"
                : reason === "contagem"
                  ? "Contagem do estoque"
                  : `Outro: ${normalizeSpaces(otherReason)}`;

        setError(null);
        setSaving(true);
        try {
            await adjust({ productId: product._id, newQuantity, reason: reasonText });
            setSavedMessage(
                `Ajuste salvo. Estoque agora: ${formatQuantityWithUnit(
                    newQuantity,
                    product.unit,
                )}.`,
            );
            setOpen(false);
            setQuantityText("");
            setOtherReason("");
        } catch (err) {
            setError(friendlyError(err, "Não foi possível ajustar o estoque. Tente de novo."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.card}>
            <View
                style={[
                    styles.stockRow,
                    { borderColor: colors.border, backgroundColor: colors.bg },
                ]}
            >
                <View style={styles.stockTexts}>
                    <Text style={[styles.stockLabel, { color: colors.textMuted }]}>
                        Quantidade atual
                    </Text>
                    <Text style={[styles.stockValue, { color: colors.text }]}>
                        {formatQuantityWithUnit(product.stockQty, product.unit)}
                    </Text>
                </View>
                <View style={styles.stepper}>
                    <Pressable
                        onPress={() => openForm(previousQuantity)}
                        disabled={product.stockQty <= 0 || open}
                        accessibilityRole="button"
                        accessibilityLabel="Diminuir quantidade"
                        style={({ pressed }) => [
                            styles.stepperButton,
                            { borderColor: colors.border, backgroundColor: colors.card },
                            product.stockQty <= 0 || open ? styles.disabled : null,
                            pressed ? styles.pressed : null,
                        ]}
                    >
                        <Text style={[styles.stepperSymbol, { color: colors.text }]}>
                            −
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => openForm(nextQuantity)}
                        disabled={open}
                        accessibilityRole="button"
                        accessibilityLabel="Aumentar quantidade"
                        style={({ pressed }) => [
                            styles.stepperButton,
                            { borderColor: colors.border, backgroundColor: colors.card },
                            open ? styles.disabled : null,
                            pressed ? styles.pressed : null,
                        ]}
                    >
                        <Text style={[styles.stepperSymbol, { color: colors.text }]}>
                            +
                        </Text>
                    </Pressable>
                </View>
            </View>

            {savedMessage ? (
                <Text style={styles.savedText} accessibilityLiveRegion="polite">
                    ✔ {savedMessage}
                </Text>
            ) : null}

            {!open ? (
                <BigButton
                    label="Ajustar estoque"
                    description="Perdas, quebras ou contagem"
                    onPress={openForm}
                    variant="secondary"
                />
            ) : (
                <>
                    <TextField
                        label={`Quantidade contada (${
                            product.unit === "kg"
                                ? "kg"
                                : product.unit === "pacote"
                                  ? "pacotes"
                                  : "unidades"
                        })`}
                        info={fieldHelp.newQuantity}
                        required
                        value={quantityText}
                        onChangeText={(text) => {
                            setQuantityText(text);
                            setQuantityError(null);
                            setError(null);
                        }}
                        error={quantityError}
                        placeholder={product.unit === "kg" ? "Ex.: 1,5" : "Ex.: 8"}
                        keyboardType={product.unit === "kg" ? "decimal-pad" : "number-pad"}
                        maxLength={8}
                    />

                    {Number.isFinite(newQuantity) && difference !== 0 ? (
                        <Text style={styles.hint}>
                            {difference > 0
                                ? `O estoque vai aumentar ${formatQuantityWithUnit(
                                      difference,
                                      product.unit,
                                  )}.`
                                : `O estoque vai diminuir ${formatQuantityWithUnit(
                                      Math.abs(difference),
                                      product.unit,
                                  )}.`}
                        </Text>
                    ) : null}

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Motivo</Text>
                        <ChoiceRow
                            options={REASON_OPTIONS}
                            value={reason}
                            onChange={(value) => {
                                setReason(value);
                                setReasonError(null);
                            }}
                        />
                    </View>

                    {reason === "outro" ? (
                        <TextField
                            label="Motivo do ajuste"
                            info={fieldHelp.adjustReason}
                            required
                            value={otherReason}
                            onChangeText={(text) => {
                                setOtherReason(text);
                                setReasonError(null);
                            }}
                            error={reasonError}
                            placeholder="Ex.: produto vencido"
                            autoCapitalize="sentences"
                            maxLength={80}
                        />
                    ) : null}

                    <ErrorBanner message={error} />

                    <BigButton
                        label="Confirmar ajuste"
                        onPress={handleSubmit}
                        loading={saving}
                        icon="✓"
                    />
                    <BigButton
                        label="Cancelar"
                        onPress={closeForm}
                        variant="ghost"
                        disabled={saving}
                    />
                </>
            )}
        </View>
    );
}

type HistoryItem = {
    key: string;
    label: string;
    quantityText: string;
    detail: string;
    date: string;
    when: number;
};

function HistorySection({ productId, unit }: { productId: Id<"products">; unit: ProductUnit }) {
    const history = useQuery(api.stock.history, { productId });

    if (history === undefined) {
        return <Text style={styles.hint}>Carregando histórico...</Text>;
    }

    const items: HistoryItem[] = [
        ...history.entries.map((entry) => ({
            key: entry._id,
            label: "Entrada",
            quantityText: `+${formatQuantityWithUnit(entry.quantity, unit)}`,
            detail: `Custo: ${formatCents(entry.unitCostCents)} cada${
                entry.supplier ? ` • ${entry.supplier}` : ""
            }`,
            date: formatDateBR(entry.arrivedAt),
            when: entry.arrivedAt,
        })),
        ...history.movements
            .filter((movement) => movement.type !== "entrada")
            .map((movement) => ({
                key: movement._id,
                label:
                    movement.type === "saida"
                        ? "Saída"
                        : movement.type === "cancelamento"
                          ? "Cancelamento"
                          : "Ajuste",
                quantityText: `${movement.quantity > 0 ? "+" : "-"}${formatQuantityWithUnit(
                    Math.abs(movement.quantity),
                    unit,
                )}`,
                detail: movement.reason ?? "",
                date: formatDateBR(movement.createdAt),
                when: movement.createdAt,
            })),
    ].sort((a, b) => b.when - a.when);

    if (items.length === 0) {
        return (
            <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Sem movimentações ainda.</Text>
            </View>
        );
    }

    return (
        <View style={styles.historyList}>
            {items.map((item) => (
                <View
                    key={item.key}
                    style={styles.historyItem}
                    accessible
                    accessibilityLabel={`${item.label}: ${item.quantityText}. ${
                        item.detail ? `${item.detail}. ` : ""
                    }${item.date}`}
                >
                    <View style={styles.historyTop}>
                        <Text style={styles.historyLabel}>{item.label}</Text>
                        <Text style={styles.historyQuantity}>{item.quantityText}</Text>
                    </View>
                    {item.detail ? <Text style={styles.historyDetail}>{item.detail}</Text> : null}
                    <Text style={styles.historyDate}>{item.date}</Text>
                </View>
            ))}
        </View>
    );
}

export default function ProductDetailScreen() {
    const params = useLocalSearchParams<{ id?: string }>();
    const productId = typeof params.id === "string" && params.id ? params.id : undefined;
    const product = useQuery(
        api.products.get,
        productId ? { productId: productId as Id<"products"> } : "skip",
    );
    const removeProduct = useMutation(api.products.remove);
    const { colors } = useAppTheme();
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (productId === undefined) {
        return (
            <>
                <ScreenHeader title="Produto" helpKey="produto" showBack />
                <Screen>
                    <ErrorBanner message="Produto não encontrado. Volte para o estoque." />
                </Screen>
            </>
        );
    }

    if (product === undefined) {
        return <LoadingScreen />;
    }

    if (product === null) {
        return (
            <>
                <ScreenHeader title="Produto" helpKey="produto" showBack />
                <Screen>
                    <ErrorBanner message="Este produto não existe mais. Volte para o estoque." />
                </Screen>
            </>
        );
    }

    const lowStock = product.stockQty <= product.lowStockThreshold;

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await removeProduct({ productId: product._id });
            setDeleteVisible(false);
            if (router.canGoBack()) router.back();
            else router.replace("/estoque");
        } catch (error) {
            Alert.alert(
                "Não foi possível excluir",
                friendlyError(error, "Tente de novo em alguns instantes."),
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <ScreenHeader
                title={product.name}
                subtitle={unitLabels[product.unit]}
                helpKey="produto"
                showBack
            />
            <Screen>
                <View
                    style={[
                        styles.summaryCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                >
                    <View style={styles.summaryTop}>
                        <View
                            style={[
                                styles.productIcon,
                                { backgroundColor: colors.surfaceStrong },
                            ]}
                        >
                            <Text style={styles.productIconText}>📦</Text>
                        </View>
                        <View style={styles.summaryTexts}>
                            <Text
                                style={[
                                    styles.summaryLabel,
                                    { color: colors.textMuted },
                                ]}
                            >
                                Quantidade em estoque
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>
                                {formatQuantityWithUnit(product.stockQty, product.unit)}
                            </Text>
                            <Text
                                style={[styles.summaryRow, { color: colors.textMuted }]}
                            >
                                Aviso de estoque baixo: até{" "}
                                {formatQuantityWithUnit(
                                    product.lowStockThreshold,
                                    product.unit,
                                )}
                            </Text>
                        </View>
                    </View>
                </View>

                {lowStock ? (
                    <FeedbackBanner
                        tone="danger"
                        icon="⚠"
                        title="Estoque baixo"
                        message={`Este produto está no limite de ${formatQuantityWithUnit(
                            product.lowStockThreshold,
                            product.unit,
                        )}. Registre uma entrada no Caixa.`}
                    />
                ) : null}

                <View style={styles.priceCards}>
                    <View
                        style={[
                            styles.priceCard,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                    >
                        <Text style={[styles.priceLabel, { color: colors.textMuted }]}>
                            Preço de compra
                        </Text>
                        <Text style={[styles.priceValue, { color: colors.text }]}>
                            {product.lastUnitCostCents > 0
                                ? formatCents(product.lastUnitCostCents)
                                : "—"}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.priceCard,
                            {
                                backgroundColor: colors.successBg,
                                borderColor: colors.success,
                            },
                        ]}
                    >
                        <Text style={[styles.priceLabel, { color: colors.success }]}>
                            Preço de venda
                        </Text>
                        <Text style={[styles.priceValue, { color: colors.success }]}>
                            {formatCents(product.salePriceCents)}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Preço e aviso
                </Text>
                <PriceAndThresholdForm product={product} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Ajustar estoque
                </Text>
                <AdjustStockForm product={product} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Histórico
                </Text>
                <HistorySection productId={product._id} unit={product.unit} />

                <BigButton
                    label="Excluir produto"
                    description="O histórico de vendas continua guardado"
                    icon="🗑"
                    variant="danger"
                    onPress={() => setDeleteVisible(true)}
                    style={styles.deleteButton}
                />
            </Screen>

            <ConfirmDialog
                visible={deleteVisible}
                title="Excluir produto?"
                message={`Tem certeza que deseja excluir "${product.name}"? Ele deixa de aparecer para novas vendas e entradas, mas o histórico continua guardado.`}
                confirmLabel="Sim, excluir"
                cancelLabel="Não, manter"
                destructive
                loading={deleting}
                onConfirm={() => {
                    void handleDelete();
                }}
                onCancel={() => setDeleteVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    summaryCard: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
    },
    summaryTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.lg,
    },
    productIcon: {
        width: 76,
        height: 76,
        borderRadius: theme.radius.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    productIconText: {
        fontSize: 40,
        lineHeight: 46,
    },
    summaryTexts: {
        flex: 1,
        gap: 2,
    },
    summaryLabel: {
        fontSize: theme.font.small,
        fontWeight: "700",
    },
    priceCards: {
        flexDirection: "row",
        gap: theme.spacing.md,
    },
    priceCard: {
        flex: 1,
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: 2,
    },
    priceLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    priceValue: {
        fontSize: theme.font.subtitle,
        lineHeight: 27,
        fontWeight: "700",
    },
    stockRow: {
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    stockTexts: {
        flex: 1,
        gap: 1,
    },
    stockLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    stockValue: {
        fontSize: theme.font.subtitle,
        lineHeight: 27,
        fontWeight: "700",
    },
    stepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    stepperButton: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.pill,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    stepperSymbol: {
        fontSize: 24,
        lineHeight: 26,
        fontWeight: "700",
    },
    disabled: {
        opacity: 0.35,
    },
    pressed: {
        opacity: 0.7,
    },
    deleteButton: {
        marginTop: theme.spacing.lg,
    },
    summaryValue: {
        fontSize: theme.font.title,
        lineHeight: theme.lineHeight.title,
        fontWeight: "800",
        color: theme.colors.text,
    },
    summaryRow: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    badge: {
        alignSelf: "flex-start",
        backgroundColor: theme.colors.warningSurface,
        borderWidth: 2,
        borderColor: theme.colors.warning,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    badgeText: {
        fontSize: theme.font.small,
        fontWeight: "800",
        color: theme.colors.warning,
    },
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
    },
    card: {
        gap: theme.spacing.md,
    },
    currentStock: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
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
    savedText: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    hint: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    emptyBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
    },
    emptyText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    historyList: {
        gap: theme.spacing.md,
    },
    historyItem: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    historyTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    historyLabel: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    historyQuantity: {
        fontSize: theme.font.body,
        fontWeight: "800",
        color: theme.colors.primary,
    },
    historyDetail: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    historyDate: {
        fontSize: theme.font.small,
        color: theme.colors.textMuted,
    },
});
