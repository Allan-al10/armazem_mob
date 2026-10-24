import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    BackHandler,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BigButton } from "@/components/BigButton";
import { ChoiceRow } from "@/components/ChoiceRow";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MoneyInput } from "@/components/MoneyInput";
import { SalePriceDialog } from "@/components/SalePriceDialog";
import { SaleQuantityDialog } from "@/components/SaleQuantityDialog";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StepIndicator } from "@/components/StepIndicator";
import { TextField } from "@/components/TextField";
import { api, type Id } from "@/lib/api";
import { addDays, formatDateBR, startOfDay } from "@/lib/date";
import { friendlyError } from "@/lib/errors";
import { fieldHelp } from "@/lib/help";
import {
    calculateChangeCents,
    calculateTotalCents,
    formatCents,
} from "@/lib/money";
import {
    formatQuantityWithUnit,
    isValidQuantityForUnit,
} from "@/lib/quantity";
import type { ProductUnit } from "@/lib/types";
import {
    formatPhone,
    isValidPhone,
    normalizeForSearch,
    normalizeSpaces,
    onlyDigits,
} from "@/lib/validation";
import { theme } from "@/theme";

type Step = 1 | 2 | 3 | 4;
type PaymentChoice = "cash" | "card" | "pix" | "credit_account";
type CreditDueChoice = "7" | "15" | "30";

type CartItem = {
    productId: Id<"products">;
    name: string;
    unit: ProductUnit;
    quantity: number;
    unitPriceCents: number;
    tablePriceCents: number;
};

const STEP_LABELS: Record<Step, string> = {
    1: "Cliente",
    2: "Produtos",
    3: "Resumo",
    4: "Pagamento",
};

const STEP_SUBTITLES: Record<Step, string> = {
    1: "Quem está comprando?",
    2: "Adicione os produtos da venda",
    3: "Confira antes de escolher o pagamento",
    4: "Como o cliente vai pagar?",
};

const PAYMENT_OPTIONS = [
    { value: "cash", label: "Dinheiro" },
    { value: "card", label: "Cartão" },
    { value: "pix", label: "Pix" },
    { value: "credit_account", label: "Fiado" },
] as const;

const PAYMENT_LABELS: Record<PaymentChoice, string> = {
    cash: "Dinheiro",
    card: "Cartão",
    pix: "Pix",
    credit_account: "Fiado",
};

const CREDIT_DUE_OPTIONS = [
    { value: "7", label: "Em 7 dias" },
    { value: "15", label: "Em 15 dias" },
    { value: "30", label: "Em 30 dias" },
] as const;

function roundQuantity(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function quantityStep(unit: ProductUnit): number {
    return unit === "kg" ? 0.5 : 1;
}

function minimumQuantity(unit: ProductUnit): number {
    return unit === "kg" ? 0.1 : 1;
}

export default function SellScreen() {
    const products = useQuery(api.products.list, {});
    const customers = useQuery(api.customers.list, {});
    const createSale = useMutation(api.sales.create);

    const [step, setStep] = useState<Step>(1);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<Id<"customers"> | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentChoice>("cash");
    const [cashReceivedCents, setCashReceivedCents] = useState(0);
    const [creditAddress, setCreditAddress] = useState("");
    const [creditDueDays, setCreditDueDays] = useState<CreditDueChoice>("7");
    const [creditNote, setCreditNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [priceEditorId, setPriceEditorId] = useState<Id<"products"> | null>(null);
    const [quantityEditorId, setQuantityEditorId] = useState<Id<"products"> | null>(null);

    const productsList = products ?? [];
    const customersList = customers ?? [];

    const totalCents = useMemo(() => calculateTotalCents(cart), [cart]);
    const changeCents = calculateChangeCents(cashReceivedCents, totalCents);
    const cashInsufficient =
        paymentMethod === "cash" && cashReceivedCents > 0 && cashReceivedCents < totalCents;

    const nameQuery = normalizeForSearch(customerName);
    const suggestions =
        showSuggestions && !selectedCustomerId && nameQuery.length >= 2
            ? customersList.filter((customer) => customer.nameQuery.includes(nameQuery)).slice(0, 5)
            : [];

    const filteredProducts = productsList
        .filter((product) => product.active)
        .filter((product) => {
            if (!productSearch.trim()) return true;
            return product.nameQuery.includes(normalizeForSearch(productSearch));
        })
        .slice(0, 20);

    const priceEditorItem = cart.find((item) => item.productId === priceEditorId) ?? null;
    const quantityEditorItem = cart.find((item) => item.productId === quantityEditorId) ?? null;
    const quantityEditorProduct = productsList.find(
        (product) => product._id === quantityEditorId,
    );

    useEffect(() => {
        if (Platform.OS === "web") return;
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            if (step > 1) {
                setStep((current) => (current - 1) as Step);
                setError(null);
                return true;
            }
            return false;
        });
        return () => subscription.remove();
    }, [step]);

    if (products === undefined || customers === undefined) {
        return <LoadingScreen />;
    }

    const findProduct = (productId: Id<"products">) =>
        productsList.find((product) => product._id === productId);

    const goBack = () => {
        if (step > 1) {
            setStep((step - 1) as Step);
            setError(null);
            return;
        }
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/inicio");
    };

    const handleCustomerName = (value: string) => {
        setCustomerName(value);
        setShowSuggestions(true);
        setError(null);
        if (selectedCustomerId) {
            setSelectedCustomerId(null);
            setCustomerPhone("");
            setCreditAddress("");
        }
    };

    // No passo do fiado, o nome pode ser corrigido sem perder o cliente escolhido.
    const handleCreditName = (value: string) => {
        setCustomerName(value);
        setError(null);
    };

    const handleSelectCustomer = (customer: (typeof customersList)[number]) => {
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone ? formatPhone(customer.phone) : "");
        setCreditAddress(customer.address ?? "");
        setSelectedCustomerId(customer._id);
        setShowSuggestions(false);
        setError(null);
    };

    const validateCustomer = (): boolean => {
        const name = normalizeSpaces(customerName);
        if (!name) {
            setError("Digite o nome do cliente.");
            return false;
        }
        if (name.length < 2) {
            setError("O nome do cliente está muito curto. Confira.");
            return false;
        }
        const phone = onlyDigits(customerPhone);
        if (phone && !isValidPhone(phone)) {
            setError("Telefone inválido. Digite DDD e número. Exemplo: (11) 91234-5678.");
            return false;
        }
        setError(null);
        return true;
    };

    const validateCredit = (): boolean => {
        const name = normalizeSpaces(customerName);
        if (!name) {
            setError("Digite o nome do cliente.");
            return false;
        }
        if (name.length < 2) {
            setError("O nome do cliente está muito curto. Confira.");
            return false;
        }

        const phone = onlyDigits(customerPhone);
        if (!phone) {
            setError("Para venda fiado, digite o telefone do cliente com DDD.");
            return false;
        }
        if (!isValidPhone(phone)) {
            setError("Telefone inválido. Digite DDD e número. Exemplo: (11) 91234-5678.");
            return false;
        }

        const address = normalizeSpaces(creditAddress);
        if (!address) {
            setError("Digite o endereço do cliente para o fiado.");
            return false;
        }
        if (address.length < 5) {
            setError("O endereço está muito curto. Confira.");
            return false;
        }

        setError(null);
        return true;
    };

    const handleContinueCustomer = () => {
        if (validateCustomer()) setStep(2);
    };

    const handleAddProduct = (product: (typeof productsList)[number]) => {
        if (product.stockQty <= 0) {
            setError(`${product.name} está sem estoque. Registre a entrada antes de vender.`);
            return;
        }

        setError(null);
        const existing = cart.find((item) => item.productId === product._id);
        if (existing) {
            const stepQty = quantityStep(product.unit);
            const next = roundQuantity(Math.min(product.stockQty, existing.quantity + stepQty));
            if (next <= existing.quantity) {
                setError(
                    `Só tem ${formatQuantityWithUnit(product.stockQty, product.unit)} de ${
                        product.name
                    }.`,
                );
                return;
            }
            setCart((current) =>
                current.map((item) =>
                    item.productId === product._id ? { ...item, quantity: next } : item,
                ),
            );
            return;
        }

        const initial =
            product.unit === "kg"
                ? roundQuantity(Math.min(0.5, product.stockQty))
                : 1;
        if (initial <= 0) {
            setError(`${product.name} está sem estoque.`);
            return;
        }

        setCart((current) => [
            ...current,
            {
                productId: product._id,
                name: product.name,
                unit: product.unit,
                quantity: initial,
                unitPriceCents: product.salePriceCents,
                tablePriceCents: product.salePriceCents,
            },
        ]);
    };

    const handleQuantityChange = (item: CartItem, nextQuantity: number) => {
        const product = findProduct(item.productId);
        if (!product) {
            setError("Este produto não está mais disponível. Remova e escolha outro.");
            return false;
        }
        if (!isValidQuantityForUnit(nextQuantity, item.unit)) {
            setError(
                item.unit === "kg"
                    ? "Digite a quantidade em quilos. Exemplo: 1,5."
                    : "Digite uma quantidade inteira.",
            );
            return false;
        }
        if (nextQuantity > product.stockQty + 1e-9) {
            setError(
                `Só tem ${formatQuantityWithUnit(product.stockQty, product.unit)} de ${
                    product.name
                }.`,
            );
            return false;
        }
        setError(null);
        setCart((current) =>
            current.map((cartItem) =>
                cartItem.productId === item.productId
                    ? { ...cartItem, quantity: roundQuantity(nextQuantity) }
                    : cartItem,
            ),
        );
        return true;
    };

    const handleStepQuantity = (item: CartItem, direction: 1 | -1) => {
        const product = findProduct(item.productId);
        if (!product) {
            setError("Este produto não está mais disponível. Remova e escolha outro.");
            return;
        }

        const stepQty = quantityStep(item.unit);
        if (direction > 0) {
            const next = roundQuantity(Math.min(product.stockQty, item.quantity + stepQty));
            if (next <= item.quantity) {
                setError(
                    `Só tem ${formatQuantityWithUnit(product.stockQty, product.unit)} de ${
                        product.name
                    }.`,
                );
                return;
            }
            handleQuantityChange(item, next);
            return;
        }

        const next = Math.max(
            minimumQuantity(item.unit),
            roundQuantity(item.quantity - stepQty),
        );
        if (next >= item.quantity) return;
        handleQuantityChange(item, next);
    };

    const handleRemoveItem = (productId: Id<"products">) => {
        setCart((current) => current.filter((item) => item.productId !== productId));
        setError(null);
    };

    const handleSavePrice = (cents: number) => {
        if (!priceEditorItem) return;
        setCart((current) =>
            current.map((item) =>
                item.productId === priceEditorItem.productId
                    ? { ...item, unitPriceCents: cents }
                    : item,
            ),
        );
        setPriceEditorId(null);
        setError(null);
    };

    const handleSaveQuantity = (quantity: number) => {
        if (!quantityEditorItem) return;
        const saved = handleQuantityChange(quantityEditorItem, quantity);
        if (saved) setQuantityEditorId(null);
    };

    const validateCart = (): boolean => {
        if (cart.length === 0) {
            setError("Adicione pelo menos um produto à venda.");
            return false;
        }

        for (const item of cart) {
            const product = findProduct(item.productId);
            if (!product || !product.active) {
                setError(`${item.name} não está mais disponível. Remova e escolha outro.`);
                return false;
            }
            if (!isValidQuantityForUnit(item.quantity, item.unit)) {
                setError(`Confira a quantidade de ${item.name}.`);
                return false;
            }
            if (item.quantity > product.stockQty + 1e-9) {
                setError(
                    `Só tem ${formatQuantityWithUnit(product.stockQty, product.unit)} de ${
                        product.name
                    }.`,
                );
                return false;
            }
            if (item.unitPriceCents < 0) {
                setError(`Confira o preço de ${item.name}.`);
                return false;
            }
        }

        if (totalCents <= 0) {
            setError("O total da venda precisa ser maior que zero. Confira os preços.");
            return false;
        }

        setError(null);
        return true;
    };

    const handleContinueProducts = () => {
        if (validateCart()) setStep(3);
    };

    const handleContinueSummary = () => {
        if (validateCart()) setStep(4);
    };

    const handleOpenConfirm = () => {
        if (cashInsufficient) {
            setError("O valor recebido é menor que o total da venda. Confira.");
            return;
        }
        if (paymentMethod === "credit_account" && !validateCredit()) {
            return;
        }
        setError(null);
        setConfirmVisible(true);
    };

    const handleConfirmSale = async () => {
        setSaving(true);
        setError(null);
        try {
            const credit =
                paymentMethod === "credit_account"
                    ? {
                          dueDate: addDays(startOfDay(), Number(creditDueDays)).getTime(),
                          address: normalizeSpaces(creditAddress),
                          ...(normalizeSpaces(creditNote)
                              ? { note: normalizeSpaces(creditNote) }
                              : {}),
                      }
                    : undefined;

            const saleId = await createSale({
                ...(selectedCustomerId ? { customerId: selectedCustomerId } : {}),
                customerName: normalizeSpaces(customerName),
                ...(onlyDigits(customerPhone)
                    ? { customerPhone: onlyDigits(customerPhone) }
                    : {}),
                items: cart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPriceCents: item.unitPriceCents,
                })),
                paymentMethod,
                ...(credit ? { credit } : {}),
            });
            router.replace({ pathname: "/nota/[id]", params: { id: saleId } });
        } catch (err) {
            setError(friendlyError(err, "Não foi possível concluir a venda. Tente de novo."));
            setConfirmVisible(false);
        } finally {
            setSaving(false);
        }
    };

    const creditDueDate = addDays(startOfDay(), Number(creditDueDays));

    const renderCustomerStep = () => (
        <>
            <TextField
                label="Nome do cliente"
                info={fieldHelp.customerName}
                required
                value={customerName}
                onChangeText={handleCustomerName}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ex.: Maria Souza"
                autoCapitalize="words"
                autoComplete="name"
                maxLength={80}
                returnKeyType="next"
            />

            {suggestions.length > 0 ? (
                <View style={styles.suggestionsBox}>
                    <Text style={styles.suggestionsTitle}>Clientes já cadastrados</Text>
                    {suggestions.map((customer) => (
                        <Pressable
                            key={customer._id}
                            onPress={() => handleSelectCustomer(customer)}
                            accessibilityRole="button"
                            accessibilityLabel={`Usar cliente ${customer.name}${
                                customer.phone ? `, telefone ${formatPhone(customer.phone)}` : ""
                            }`}
                            style={({ pressed }) => [
                                styles.suggestion,
                                pressed ? styles.pressed : null,
                            ]}
                        >
                            <View style={styles.suggestionTexts}>
                                <Text style={styles.suggestionName}>{customer.name}</Text>
                                <Text style={styles.suggestionPhone}>
                                    {customer.phone
                                        ? formatPhone(customer.phone)
                                        : "Sem telefone cadastrado"}
                                </Text>
                            </View>
                            <Text style={styles.suggestionAction}>Usar</Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}

            <TextField
                label="Telefone do cliente"
                info={fieldHelp.customerPhone}
                value={customerPhone}
                onChangeText={(value) => {
                    setCustomerPhone(formatPhone(value));
                    setError(null);
                }}
                placeholder="(11) 91234-5678"
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={16}
            />

            {!customerPhone ? (
                <Text style={styles.infoText}>
                    Sem telefone, você ainda faz a venda, mas não vai conseguir enviar a nota por
                    WhatsApp ou SMS.
                </Text>
            ) : null}

            <BigButton
                label="Continuar"
                description="Escolher os produtos"
                onPress={handleContinueCustomer}
                icon="→"
            />
        </>
    );

    const renderProductsStep = () => (
        <>
            <TextField
                label="Buscar produto"
                info={fieldHelp.productSearch}
                value={productSearch}
                onChangeText={(value) => {
                    setProductSearch(value);
                    setError(null);
                }}
                placeholder="Ex.: arroz"
                autoCapitalize="none"
                returnKeyType="search"
            />

            <View style={styles.productList}>
                {filteredProducts.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>Nenhum produto encontrado</Text>
                        <Text style={styles.emptyText}>
                            Confira o nome ou registre a mercadoria em Chegou mercadoria.
                        </Text>
                        <BigButton
                            label="Ir para Chegou mercadoria"
                            onPress={() => router.push("/chegou-mercadoria")}
                            variant="secondary"
                        />
                    </View>
                ) : (
                    filteredProducts.map((product) => {
                        const inCart = cart.find((item) => item.productId === product._id);
                        const outOfStock = product.stockQty <= 0;
                        const atLimit =
                            outOfStock ||
                            Boolean(inCart && inCart.quantity >= product.stockQty - 1e-9);
                        return (
                            <Pressable
                                key={product._id}
                                onPress={() => handleAddProduct(product)}
                                disabled={atLimit}
                                accessibilityRole="button"
                                accessibilityLabel={`${product.name}. ${formatCents(
                                    product.salePriceCents,
                                )}. Estoque: ${formatQuantityWithUnit(
                                    product.stockQty,
                                    product.unit,
                                )}.${inCart ? ` No carrinho: ${formatQuantityWithUnit(inCart.quantity, product.unit)}.` : ""}`}
                                accessibilityHint={
                                    outOfStock
                                        ? "Produto sem estoque"
                                        : atLimit
                                          ? "Todo o estoque já está no carrinho"
                                          : "Toque para adicionar à venda"
                                }
                                accessibilityState={{ disabled: atLimit }}
                                style={({ pressed }) => [
                                    styles.productRow,
                                    atLimit ? styles.productRowDisabled : null,
                                    inCart ? styles.productRowInCart : null,
                                    pressed && !atLimit ? styles.pressed : null,
                                ]}
                            >
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{product.name}</Text>
                                    <Text style={styles.productMeta}>
                                        {formatCents(product.salePriceCents)} • Estoque:{" "}
                                        {formatQuantityWithUnit(product.stockQty, product.unit)}
                                    </Text>
                                    {inCart ? (
                                        <Text style={styles.productInCart}>
                                            No carrinho:{" "}
                                            {formatQuantityWithUnit(inCart.quantity, product.unit)}
                                        </Text>
                                    ) : null}
                                </View>
                                <View style={styles.addBadge}>
                                    <Text style={styles.addBadgeText}>
                                        {outOfStock
                                            ? "Sem estoque"
                                            : atLimit
                                              ? "No máximo"
                                              : inCart
                                                ? "+1"
                                                : "Adicionar"}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })
                )}
            </View>

            <View style={styles.cartHeader}>
                <Text style={styles.sectionTitle}>Produtos na venda</Text>
                <Text style={styles.cartCount}>
                    {cart.length} {cart.length === 1 ? "produto" : "produtos"}
                </Text>
            </View>

            {cart.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>Nenhum produto adicionado</Text>
                    <Text style={styles.emptyText}>
                        Toque em Adicionar no produto que o cliente está levando.
                    </Text>
                </View>
            ) : (
                <View style={styles.cartList}>
                    {cart.map((item) => {
                        const product = findProduct(item.productId);
                        const stock = product?.stockQty ?? item.quantity;
                        const subtotal = Math.round(item.quantity * item.unitPriceCents);
                        const canIncrease = item.quantity < stock - 1e-9;
                        const canDecrease = item.quantity > minimumQuantity(item.unit) + 1e-9;
                        return (
                            <View key={item.productId} style={styles.cartItem}>
                                <View style={styles.cartItemTop}>
                                    <View style={styles.cartItemInfo}>
                                        <Text style={styles.cartItemName}>{item.name}</Text>
                                        <Text style={styles.cartItemPrice}>
                                            {formatCents(item.unitPriceCents)} por{" "}
                                            {item.unit === "kg" ? "quilo" : item.unit}
                                        </Text>
                                        {item.unitPriceCents !== item.tablePriceCents ? (
                                            <Text style={styles.priceChanged}>
                                                Preço de tabela: {formatCents(item.tablePriceCents)}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Text style={styles.cartSubtotal}>{formatCents(subtotal)}</Text>
                                </View>

                                <View style={styles.quantityRow}>
                                    <Pressable
                                        onPress={() => handleStepQuantity(item, -1)}
                                        disabled={!canDecrease}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Diminuir quantidade de ${item.name}`}
                                        accessibilityState={{ disabled: !canDecrease }}
                                        style={({ pressed }) => [
                                            styles.quantityButton,
                                            !canDecrease ? styles.quantityButtonDisabled : null,
                                            pressed && canDecrease ? styles.pressed : null,
                                        ]}
                                    >
                                        <Text style={styles.quantityButtonText}>−</Text>
                                    </Pressable>
                                    <View style={styles.quantityDisplay}>
                                        <Text style={styles.quantityValue}>
                                            {formatQuantityWithUnit(item.quantity, item.unit)}
                                        </Text>
                                        <Text style={styles.quantityStock}>
                                            Estoque: {formatQuantityWithUnit(stock, item.unit)}
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={() => handleStepQuantity(item, 1)}
                                        disabled={!canIncrease}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Aumentar quantidade de ${item.name}`}
                                        accessibilityState={{ disabled: !canIncrease }}
                                        style={({ pressed }) => [
                                            styles.quantityButton,
                                            !canIncrease ? styles.quantityButtonDisabled : null,
                                            pressed && canIncrease ? styles.pressed : null,
                                        ]}
                                    >
                                        <Text style={styles.quantityButtonText}>+</Text>
                                    </Pressable>
                                </View>

                                <View style={styles.itemActions}>
                                    <Pressable
                                        onPress={() => {
                                            setQuantityEditorId(item.productId);
                                            setError(null);
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Corrigir quantidade de ${item.name}`}
                                        style={({ pressed }) => [
                                            styles.smallAction,
                                            pressed ? styles.pressed : null,
                                        ]}
                                    >
                                        <Text style={styles.smallActionText}>Corrigir</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => {
                                            setPriceEditorId(item.productId);
                                            setError(null);
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Alterar preço de ${item.name}`}
                                        style={({ pressed }) => [
                                            styles.smallAction,
                                            pressed ? styles.pressed : null,
                                        ]}
                                    >
                                        <Text style={styles.smallActionText}>Alterar preço</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handleRemoveItem(item.productId)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Remover ${item.name} da venda`}
                                        style={({ pressed }) => [
                                            styles.removeAction,
                                            pressed ? styles.pressed : null,
                                        ]}
                                    >
                                        <Text style={styles.removeActionText}>Remover</Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            <View style={styles.totalBar}>
                <Text style={styles.totalBarLabel}>Total da venda</Text>
                <Text style={styles.totalBarValue}>{formatCents(totalCents)}</Text>
            </View>

            <BigButton
                label="Continuar"
                description="Conferir o resumo"
                onPress={handleContinueProducts}
                icon="→"
                disabled={cart.length === 0}
            />
        </>
    );

    const renderSummaryStep = () => (
        <>
            <View style={styles.summaryCustomer}>
                <Text style={styles.summaryLabel}>Cliente</Text>
                <Text style={styles.summaryCustomerName}>{normalizeSpaces(customerName)}</Text>
                <Text style={styles.summaryCustomerPhone}>
                    {onlyDigits(customerPhone)
                        ? formatPhone(customerPhone)
                        : "Sem telefone para envio da nota"}
                </Text>
            </View>

            <View style={styles.summaryItems}>
                {cart.map((item) => {
                    const subtotal = Math.round(item.quantity * item.unitPriceCents);
                    return (
                        <View key={item.productId} style={styles.summaryItem}>
                            <View style={styles.summaryItemInfo}>
                                <Text style={styles.summaryItemName}>{item.name}</Text>
                                <Text style={styles.summaryItemDetail}>
                                    {formatQuantityWithUnit(item.quantity, item.unit)} ×{" "}
                                    {formatCents(item.unitPriceCents)}
                                </Text>
                            </View>
                            <Text style={styles.summaryItemValue}>{formatCents(subtotal)}</Text>
                        </View>
                    );
                })}
            </View>

            <View style={styles.totalBar}>
                <Text style={styles.totalBarLabel}>TOTAL</Text>
                <Text style={styles.totalBarValueLarge}>{formatCents(totalCents)}</Text>
            </View>

            <Text style={styles.infoText}>
                Ao concluir, o estoque será baixado automaticamente e a nota ficará pronta para
                enviar.
            </Text>

            <BigButton
                label="Continuar para pagamento"
                description="Escolher dinheiro, cartão, Pix ou fiado"
                onPress={handleContinueSummary}
                icon="→"
            />
            <BigButton
                label="Voltar e corrigir"
                onPress={() => {
                    setError(null);
                    setStep(2);
                }}
                variant="ghost"
            />
        </>
    );

    const renderPaymentStep = () => (
        <>
            <View style={styles.totalBar}>
                <Text style={styles.totalBarLabel}>Total a pagar</Text>
                <Text style={styles.totalBarValueLarge}>{formatCents(totalCents)}</Text>
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Forma de pagamento</Text>
                <ChoiceRow
                    options={PAYMENT_OPTIONS}
                    value={paymentMethod}
                    onChange={(value) => {
                        setPaymentMethod(value);
                        setError(null);
                    }}
                />
            </View>

            {paymentMethod === "cash" ? (
                <>
                    <MoneyInput
                        label="Valor recebido (opcional)"
                        info={fieldHelp.cashReceived}
                        valueCents={cashReceivedCents}
                        onChangeCents={(cents) => {
                            setCashReceivedCents(cents);
                            setError(null);
                        }}
                    />

                    {cashReceivedCents > 0 && cashReceivedCents >= totalCents ? (
                        <View style={styles.changeBox}>
                            <Text style={styles.changeLabel}>Troco</Text>
                            <Text style={styles.changeValue}>{formatCents(changeCents)}</Text>
                        </View>
                    ) : null}

                    {cashInsufficient ? (
                        <Text style={styles.inlineError} accessibilityLiveRegion="polite">
                            ⚠ O valor recebido é menor que o total. Faltam{" "}
                            {formatCents(totalCents - cashReceivedCents)}.
                        </Text>
                    ) : null}
                </>
            ) : paymentMethod === "card" ? (
                <Text style={styles.infoText}>
                    Passe o cartão na máquina. O app registra a venda como Cartão.
                </Text>
            ) : paymentMethod === "pix" ? (
                <Text style={styles.infoText}>
                    Confira no seu banco se o Pix caiu antes de concluir a venda.
                </Text>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>Dados do fiado</Text>

                    <TextField
                        label="Nome do cliente"
                        info={fieldHelp.customerName}
                        required
                        value={customerName}
                        onChangeText={handleCreditName}
                        placeholder="Ex.: Maria Souza"
                        autoCapitalize="words"
                        maxLength={80}
                    />

                    <TextField
                        label="Telefone do cliente"
                        info={fieldHelp.creditPhone}
                        required
                        value={customerPhone}
                        onChangeText={(value) => {
                            setCustomerPhone(formatPhone(value));
                            setError(null);
                        }}
                        placeholder="(11) 91234-5678"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        maxLength={16}
                    />

                    <TextField
                        label="Endereço do cliente"
                        info={fieldHelp.creditAddress}
                        required
                        value={creditAddress}
                        onChangeText={(value) => {
                            setCreditAddress(value);
                            setError(null);
                        }}
                        placeholder="Rua, número, bairro e cidade"
                        autoCapitalize="sentences"
                        maxLength={160}
                    />

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Data combinada para pagamento *</Text>
                        <ChoiceRow
                            options={CREDIT_DUE_OPTIONS}
                            value={creditDueDays}
                            onChange={(value) => {
                                setCreditDueDays(value);
                                setError(null);
                            }}
                        />
                        <Text style={styles.dueDateText}>
                            Vence em {formatDateBR(creditDueDate)}
                        </Text>
                    </View>

                    <TextField
                        label="Observação (opcional)"
                        info={fieldHelp.creditNote}
                        value={creditNote}
                        onChangeText={(value) => {
                            setCreditNote(value);
                            setError(null);
                        }}
                        placeholder="Ex.: pagar depois do dia 10"
                        maxLength={120}
                    />

                    <Text style={styles.infoText}>
                        O valor entra em Quem deve. O cliente pode pagar tudo de uma vez ou aos
                        poucos.
                    </Text>
                </>
            )}

            <BigButton
                label="Concluir venda"
                description="Baixar o estoque e preparar a nota"
                onPress={handleOpenConfirm}
                icon="✓"
                disabled={cashInsufficient}
            />
            <BigButton
                label="Voltar ao resumo"
                onPress={() => {
                    setError(null);
                    setStep(3);
                }}
                variant="ghost"
            />
        </>
    );

    return (
        <>
            <ScreenHeader
                title="Nova venda"
                subtitle={STEP_SUBTITLES[step]}
                helpKey="vender"
                showBack
                onBack={goBack}
            />
            <Screen key={step}>
                <StepIndicator current={step} total={4} label={STEP_LABELS[step]} />
                <ErrorBanner message={error} />

                {step === 1 ? renderCustomerStep() : null}
                {step === 2 ? renderProductsStep() : null}
                {step === 3 ? renderSummaryStep() : null}
                {step === 4 ? renderPaymentStep() : null}
            </Screen>

            {priceEditorItem ? (
                <SalePriceDialog
                    visible
                    itemName={priceEditorItem.name}
                    currentPriceCents={priceEditorItem.unitPriceCents}
                    tablePriceCents={priceEditorItem.tablePriceCents}
                    onSave={handleSavePrice}
                    onClose={() => setPriceEditorId(null)}
                />
            ) : null}

            {quantityEditorItem ? (
                <SaleQuantityDialog
                    visible
                    itemName={quantityEditorItem.name}
                    currentQuantity={quantityEditorItem.quantity}
                    maxQuantity={quantityEditorProduct?.stockQty ?? quantityEditorItem.quantity}
                    unit={quantityEditorItem.unit}
                    onSave={handleSaveQuantity}
                    onClose={() => setQuantityEditorId(null)}
                />
            ) : null}

            <ConfirmDialog
                visible={confirmVisible}
                title="Concluir venda?"
                message={`Cliente: ${normalizeSpaces(customerName)}\nTotal: ${formatCents(
                    totalCents,
                )}\nPagamento: ${PAYMENT_LABELS[paymentMethod]}${
                    paymentMethod === "credit_account"
                        ? `\nFiado para ${formatDateBR(creditDueDate)}`
                        : ""
                }\n\nO estoque será baixado agora.`}
                confirmLabel="Sim, concluir venda"
                cancelLabel="Não, voltar"
                loading={saving}
                onConfirm={handleConfirmSale}
                onCancel={() => setConfirmVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    suggestionsBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    suggestionsTitle: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
        paddingHorizontal: theme.spacing.sm,
        paddingTop: theme.spacing.xs,
    },
    suggestion: {
        minHeight: theme.touch.min,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    suggestionTexts: {
        flex: 1,
        gap: 2,
    },
    suggestionName: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    suggestionPhone: {
        fontSize: theme.font.small,
        color: theme.colors.textMuted,
    },
    suggestionAction: {
        fontSize: theme.font.body,
        fontWeight: "800",
        color: theme.colors.primary,
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
    productList: {
        gap: theme.spacing.md,
    },
    productRow: {
        minHeight: 80,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
    },
    productRowInCart: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surface,
    },
    productRowDisabled: {
        opacity: 0.55,
    },
    productInfo: {
        flex: 1,
        gap: 2,
    },
    productName: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "700",
        color: theme.colors.text,
    },
    productMeta: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    productInCart: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    addBadge: {
        minHeight: theme.touch.min,
        minWidth: 96,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.background,
    },
    addBadgeText: {
        fontSize: theme.font.small,
        fontWeight: "800",
        color: theme.colors.primary,
    },
    cartHeader: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.colors.text,
    },
    cartCount: {
        fontSize: theme.font.small,
        color: theme.colors.textMuted,
    },
    cartList: {
        gap: theme.spacing.md,
    },
    cartItem: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    cartItemTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    cartItemInfo: {
        flex: 1,
        gap: 2,
    },
    cartItemName: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "700",
        color: theme.colors.text,
    },
    cartItemPrice: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    priceChanged: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.warning,
        fontWeight: "700",
    },
    cartSubtotal: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
        textAlign: "right",
    },
    quantityRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
    },
    quantityButton: {
        width: 64,
        height: 64,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
    },
    quantityButtonDisabled: {
        opacity: 0.4,
    },
    quantityButtonText: {
        fontSize: 34,
        lineHeight: 38,
        fontWeight: "800",
        color: theme.colors.primary,
    },
    quantityDisplay: {
        flex: 1,
        alignItems: "center",
        gap: 2,
    },
    quantityValue: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
        textAlign: "center",
    },
    quantityStock: {
        fontSize: theme.font.small,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
    itemActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.sm,
    },
    smallAction: {
        minHeight: theme.touch.min,
        flexGrow: 1,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.background,
    },
    smallActionText: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    removeAction: {
        minHeight: theme.touch.min,
        flexGrow: 1,
        borderWidth: 2,
        borderColor: theme.colors.danger,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.dangerSurface,
    },
    removeActionText: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.danger,
    },
    emptyBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    emptyTitle: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    emptyText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    totalBar: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    totalBarLabel: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    totalBarValue: {
        fontSize: 32,
        lineHeight: 38,
        fontWeight: "800",
        color: theme.colors.text,
    },
    totalBarValueLarge: {
        fontSize: 40,
        lineHeight: 46,
        fontWeight: "800",
        color: theme.colors.text,
    },
    summaryCustomer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    summaryLabel: {
        fontSize: theme.font.small,
        fontWeight: "700",
        color: theme.colors.textMuted,
    },
    summaryCustomerName: {
        fontSize: theme.font.bodyLarge,
        lineHeight: 28,
        fontWeight: "800",
        color: theme.colors.text,
    },
    summaryCustomerPhone: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    summaryItems: {
        gap: theme.spacing.md,
    },
    summaryItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    summaryItemInfo: {
        flex: 1,
        gap: 2,
    },
    summaryItemName: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    summaryItemDetail: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    summaryItemValue: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    fieldGroup: {
        gap: theme.spacing.md,
    },
    fieldLabel: {
        fontSize: theme.font.label,
        fontWeight: "700",
        color: theme.colors.text,
        lineHeight: 26,
    },
    dueDateText: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        fontWeight: "700",
        color: theme.colors.primary,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
    },
    changeBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
    },
    changeLabel: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    changeValue: {
        fontSize: 32,
        lineHeight: 38,
        fontWeight: "800",
        color: theme.colors.primary,
    },
    inlineError: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        fontWeight: "700",
        color: theme.colors.danger,
    },
    pressed: {
        opacity: 0.78,
    },
});
