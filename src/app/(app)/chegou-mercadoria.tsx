import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ChoiceRow } from "@/components/ChoiceRow";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorBanner } from "@/components/ErrorBanner";
import { MoneyInput } from "@/components/MoneyInput";
import { ProductPicker, type ProductOption } from "@/components/ProductPicker";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { api } from "@/lib/api";
import { addDays, startOfDay } from "@/lib/date";
import { friendlyError } from "@/lib/errors";
import { fieldHelp } from "@/lib/help";
import { calculateProfit, calculateUnitCostCents, formatCents } from "@/lib/money";
import {
    formatQuantityWithUnit,
    isValidQuantityForUnit,
    parseQuantity,
} from "@/lib/quantity";
import type { ProductUnit } from "@/lib/types";
import { normalizeSpaces } from "@/lib/validation";
import { theme } from "@/theme";

type Mode = "existing" | "new";
type Arrival = "today" | "yesterday";
type FormErrors = Partial<
    Record<"product" | "productName" | "quantity" | "boxTotal" | "unitCost" | "salePrice", string>
>;

const UNIT_OPTIONS = [
    { value: "unidade", label: "Unidade" },
    { value: "kg", label: "Quilo (kg)" },
    { value: "pacote", label: "Pacote" },
] as const;

const ARRIVAL_OPTIONS = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
] as const;

export default function NewStockScreen() {
    const products = useQuery(api.products.list);
    const registerEntry = useMutation(api.stock.registerEntry);

    const [mode, setMode] = useState<Mode>("existing");
    const [selected, setSelected] = useState<ProductOption | null>(null);
    const [newName, setNewName] = useState("");
    const [newUnit, setNewUnit] = useState<ProductUnit>("unidade");
    const [quantityText, setQuantityText] = useState("");
    const [boxTotalCents, setBoxTotalCents] = useState(0);
    const [unitCostCents, setUnitCostCents] = useState(0);
    const [unitCostEdited, setUnitCostEdited] = useState(false);
    const [salePriceCents, setSalePriceCents] = useState(0);
    const [supplier, setSupplier] = useState("");
    const [arrival, setArrival] = useState<Arrival>("today");
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmBelowCost, setConfirmBelowCost] = useState(false);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    const currentUnit: ProductUnit =
        mode === "new" ? newUnit : selected?.unit ?? "unidade";

    // Enquanto o usuário não editar o valor unitário, ele segue o cálculo da caixa.
    useEffect(() => {
        if (unitCostEdited) return;
        const quantity = parseQuantity(quantityText);
        if (Number.isFinite(quantity) && quantity > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- mantém o custo unitário sincronizado com a caixa até o usuário editar
            setUnitCostCents(calculateUnitCostCents(boxTotalCents, quantity));
        }
    }, [quantityText, boxTotalCents, unitCostEdited]);

    const handleSelect = (product: ProductOption) => {
        setMode("existing");
        setSelected(product);
        setQuantityText("");
        setBoxTotalCents(0);
        setUnitCostEdited(false);
        setUnitCostCents(product.lastUnitCostCents > 0 ? product.lastUnitCostCents : 0);
        setSalePriceCents(product.salePriceCents > 0 ? product.salePriceCents : 0);
        setErrors({});
        setSubmitError(null);
        setSavedMessage(null);
    };

    const handleCreateNew = () => {
        setMode("new");
        setSelected(null);
        setNewName("");
        setNewUnit("unidade");
        setErrors({});
        setSubmitError(null);
        setSavedMessage(null);
    };

    const handleBackToList = () => {
        setMode("existing");
        setSelected(null);
        setNewName("");
        setNewUnit("unidade");
        setErrors({});
    };

    const recalcUnitCost = () => {
        setUnitCostEdited(false);
        const quantity = parseQuantity(quantityText);
        if (Number.isFinite(quantity) && quantity > 0) {
            setUnitCostCents(calculateUnitCostCents(boxTotalCents, quantity));
        }
    };

    const validate = (): FormErrors => {
        const next: FormErrors = {};

        if (mode === "existing" && selected === null) {
            next.product = "Escolha o produto.";
        }
        if (mode === "new" && !normalizeSpaces(newName)) {
            next.productName = "Digite o nome do novo produto.";
        }

        const quantity = parseQuantity(quantityText);
        if (!isValidQuantityForUnit(quantity, currentUnit)) {
            next.quantity =
                currentUnit === "kg"
                    ? "Digite a quantidade em quilos. Exemplo: 1,5."
                    : "Digite uma quantidade inteira de unidades.";
        }
        if (boxTotalCents <= 0) {
            next.boxTotal = "Digite o valor total da caixa.";
        }
        if (unitCostCents <= 0) {
            next.unitCost = "Digite o valor unitário de compra.";
        }
        if (salePriceCents <= 0) {
            next.salePrice = "Digite o preço de venda.";
        }

        return next;
    };

    const saveEntry = async () => {
        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setSubmitError("Confira os campos destacados em vermelho.");
            setConfirmBelowCost(false);
            return;
        }

        const quantity = parseQuantity(quantityText);
        const name = selected ? selected.name : normalizeSpaces(newName);
        const previousQty = selected ? selected.stockQty : 0;
        const arrivedAt =
            arrival === "today"
                ? startOfDay().getTime()
                : startOfDay(addDays(new Date(), -1)).getTime();

        setSubmitError(null);
        setConfirmBelowCost(false);
        setSaving(true);
        try {
            await registerEntry({
                ...(selected
                    ? { productId: selected._id }
                    : { newProductName: name, newProductUnit: newUnit }),
                quantity,
                boxTotalCostCents: boxTotalCents,
                unitCostCents,
                salePriceCents,
                arrivedAt,
                ...(normalizeSpaces(supplier) ? { supplier: normalizeSpaces(supplier) } : {}),
            });

            setSavedMessage(
                `${name}: entrada de ${formatQuantityWithUnit(
                    quantity,
                    currentUnit,
                )}. Estoque agora: ${formatQuantityWithUnit(
                    previousQty + quantity,
                    currentUnit,
                )}.`,
            );

            setMode("existing");
            setSelected(null);
            setNewName("");
            setNewUnit("unidade");
            setQuantityText("");
            setBoxTotalCents(0);
            setUnitCostCents(0);
            setUnitCostEdited(false);
            setSalePriceCents(0);
            setSupplier("");
            setArrival("today");
            setErrors({});
        } catch (error) {
            setSubmitError(
                friendlyError(error, "Não foi possível salvar a mercadoria. Tente de novo."),
            );
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = () => {
        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setSubmitError("Confira os campos destacados em vermelho.");
            return;
        }

        setSubmitError(null);
        if (salePriceCents < unitCostCents) {
            setConfirmBelowCost(true);
            return;
        }
        void saveEntry();
    };

    const unitWord = currentUnit === "kg" ? "quilo" : "unidade";
    const profit =
        salePriceCents > 0 && unitCostCents > 0
            ? calculateProfit(salePriceCents, unitCostCents)
            : null;

    const quantityLabel = `Quantidade que chegou (${
        currentUnit === "kg" ? "kg" : currentUnit === "pacote" ? "pacotes" : "unidades"
    })`;

    return (
        <>
            <ScreenHeader title="Chegou mercadoria" helpKey="chegou-mercadoria" showBack />
            <Screen>
                <ErrorBanner message={submitError} />

                {savedMessage ? (
                    <View style={styles.successBox} accessibilityLiveRegion="polite">
                        <Text style={styles.successTitle}>✔ Mercadoria salva!</Text>
                        <Text style={styles.successText}>{savedMessage}</Text>
                        <Text style={styles.successText}>
                            Agora você pode registrar o próximo produto.
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.sectionTitle}>Produto</Text>

                {mode === "existing" ? (
                    <>
                        <ProductPicker
                            products={products}
                            selected={selected}
                            onSelect={handleSelect}
                            onCreateNew={handleCreateNew}
                        />
                        {errors.product ? (
                            <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                                ⚠ {errors.product}
                            </Text>
                        ) : null}
                    </>
                ) : (
                    <>
                        <TextField
                            label="Nome do produto"
                            info={fieldHelp.productName}
                            required
                            value={newName}
                            onChangeText={(text) => {
                                setNewName(text);
                                setErrors((current) => ({ ...current, productName: undefined }));
                                setSubmitError(null);
                            }}
                            error={errors.productName}
                            placeholder="Ex.: Arroz 5 kg"
                            autoCapitalize="words"
                            autoCorrect={false}
                            maxLength={80}
                        />

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Unidade</Text>
                            <ChoiceRow
                                options={UNIT_OPTIONS}
                                value={newUnit}
                                onChange={setNewUnit}
                            />
                        </View>

                        <BigButton
                            label="Escolher produto da lista"
                            onPress={handleBackToList}
                            variant="ghost"
                        />
                    </>
                )}

                <Text style={styles.sectionTitle}>Quantidade e valores</Text>

                <TextField
                    label={quantityLabel}
                    info={fieldHelp.quantity}
                    required
                    value={quantityText}
                    onChangeText={(text) => {
                        setQuantityText(text);
                        setErrors((current) => ({ ...current, quantity: undefined }));
                        setSubmitError(null);
                    }}
                    error={errors.quantity}
                    placeholder={currentUnit === "kg" ? "Ex.: 1,5" : "Ex.: 10"}
                    keyboardType={currentUnit === "kg" ? "decimal-pad" : "number-pad"}
                    maxLength={8}
                />

                <MoneyInput
                    label="Valor total da caixa"
                    info={fieldHelp.boxTotal}
                    required
                    valueCents={boxTotalCents}
                    onChangeCents={(cents) => {
                        setBoxTotalCents(cents);
                        setErrors((current) => ({ ...current, boxTotal: undefined }));
                        setSubmitError(null);
                    }}
                    error={errors.boxTotal}
                />

                <MoneyInput
                    label={
                        currentUnit === "kg"
                            ? "Valor unitário de compra (por kg)"
                            : "Valor unitário de compra"
                    }
                    info={fieldHelp.unitCost}
                    required
                    valueCents={unitCostCents}
                    onChangeCents={(cents) => {
                        setUnitCostCents(cents);
                        setUnitCostEdited(true);
                        setErrors((current) => ({ ...current, unitCost: undefined }));
                        setSubmitError(null);
                    }}
                    error={errors.unitCost}
                />

                {unitCostEdited ? (
                    <BigButton
                        label="Recalcular automaticamente"
                        onPress={recalcUnitCost}
                        variant="ghost"
                    />
                ) : null}

                <MoneyInput
                    label="Preço de venda"
                    info={fieldHelp.salePrice}
                    required
                    valueCents={salePriceCents}
                    onChangeCents={(cents) => {
                        setSalePriceCents(cents);
                        setErrors((current) => ({ ...current, salePrice: undefined }));
                        setSubmitError(null);
                    }}
                    error={errors.salePrice}
                />

                {profit ? (
                    profit.profitCents >= 0 ? (
                        <View style={styles.profitBox}>
                            <Text style={styles.profitText}>
                                Você ganha {formatCents(profit.profitCents)} em cada {unitWord} (
                                {profit.marginPercent}%).
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>
                                Atenção: você vai vender abaixo do que pagou. Prejuízo de{" "}
                                {formatCents(Math.abs(profit.profitCents))} em cada {unitWord}.
                            </Text>
                        </View>
                    )
                ) : null}

                <Text style={styles.sectionTitle}>Detalhes</Text>

                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Data de chegada</Text>
                    <ChoiceRow options={ARRIVAL_OPTIONS} value={arrival} onChange={setArrival} />
                </View>

                <TextField
                    label="Fornecedor (opcional)"
                    info={fieldHelp.supplier}
                    value={supplier}
                    onChangeText={setSupplier}
                    placeholder="Ex.: Distribuidora Central"
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={80}
                />

                <BigButton
                    label="Salvar mercadoria"
                    onPress={handleSubmit}
                    loading={saving}
                    icon="✓"
                    style={styles.save}
                />
            </Screen>

            <ConfirmDialog
                visible={confirmBelowCost}
                title="Vender abaixo do custo?"
                message={`O preço de venda (${formatCents(salePriceCents)}) é menor que o custo (${formatCents(
                    unitCostCents,
                )}). Deseja salvar mesmo assim?`}
                confirmLabel="Sim, salvar"
                cancelLabel="Não, corrigir"
                destructive
                loading={saving}
                onConfirm={() => void saveEntry()}
                onCancel={() => setConfirmBelowCost(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
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
    fieldError: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.danger,
        fontWeight: "600",
    },
    successBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    successTitle: {
        fontSize: theme.font.body,
        fontWeight: "800",
        color: theme.colors.primary,
    },
    successText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    profitBox: {
        backgroundColor: theme.colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        borderRadius: theme.radius.sm,
        padding: theme.spacing.lg,
    },
    profitText: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    warningBox: {
        backgroundColor: theme.colors.warningSurface,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.warning,
        borderRadius: theme.radius.sm,
        padding: theme.spacing.lg,
    },
    warningText: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.warning,
    },
    save: {
        marginTop: theme.spacing.md,
    },
});
