import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { TextField } from "@/components/TextField";
import type { Doc } from "@/lib/api";
import { formatQuantityWithUnit } from "@/lib/quantity";
import { normalizeForSearch } from "@/lib/validation";
import { theme } from "@/theme";

export type ProductOption = Doc<"products">;

type ProductPickerProps = {
    products: ProductOption[] | undefined;
    selected: ProductOption | null;
    onSelect: (product: ProductOption) => void;
    onCreateNew: () => void;
};

/** Campo grande que abre a lista de produtos com busca. */
export function ProductPicker({
    products,
    selected,
    onSelect,
    onCreateNew,
}: ProductPickerProps) {
    const [visible, setVisible] = useState(false);
    const [search, setSearch] = useState("");

    const query = normalizeForSearch(search);
    const filtered = (products ?? []).filter((product) =>
        query ? product.nameQuery.includes(query) : true,
    );

    const close = () => {
        setVisible(false);
        setSearch("");
    };

    const handleSelect = (product: ProductOption) => {
        onSelect(product);
        close();
    };

    const handleCreateNew = () => {
        onCreateNew();
        close();
    };

    return (
        <>
            <View style={styles.container}>
                <Text style={styles.label}>
                    Produto <Text style={styles.required}>*</Text>
                </Text>
                <Pressable
                    onPress={() => setVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel={
                        selected ? `Produto escolhido: ${selected.name}` : "Escolher produto"
                    }
                    accessibilityHint="Abre a lista de produtos"
                    style={({ pressed }) => [styles.field, pressed ? styles.pressed : null]}
                >
                    <Text style={selected ? styles.fieldText : styles.placeholder}>
                        {selected ? selected.name : "Toque para escolher"}
                    </Text>
                    <Text
                        style={styles.chevron}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                    >
                        ▾
                    </Text>
                </Pressable>
            </View>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={close}
                statusBarTranslucent
            >
                <View style={styles.overlay}>
                    <View style={styles.card} accessibilityViewIsModal>
                        <Text style={styles.title}>Escolher produto</Text>

                        <TextField
                            label="Buscar"
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Digite o nome do produto"
                            autoCapitalize="words"
                            autoCorrect={false}
                        />

                        <ScrollView
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {filtered.length === 0 ? (
                                <Text style={styles.empty}>
                                    {products === undefined
                                        ? "Carregando produtos..."
                                        : "Nenhum produto encontrado. Toque em Criar novo produto."}
                                </Text>
                            ) : (
                                filtered.map((product) => (
                                    <Pressable
                                        key={product._id}
                                        onPress={() => handleSelect(product)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${product.name}. ${formatQuantityWithUnit(
                                            product.stockQty,
                                            product.unit,
                                        )} em estoque.`}
                                        style={({ pressed }) => [
                                            styles.row,
                                            pressed ? styles.rowPressed : null,
                                        ]}
                                    >
                                        <Text style={styles.rowName}>
                                            {product.name}
                                        </Text>
                                        <Text style={styles.rowQuantity}>
                                            {formatQuantityWithUnit(product.stockQty, product.unit)} em
                                            estoque
                                        </Text>
                                    </Pressable>
                                ))
                            )}
                        </ScrollView>

                        <BigButton
                            label="Criar novo produto"
                            onPress={handleCreateNew}
                            icon="+"
                            variant="secondary"
                        />
                        <BigButton label="Fechar" onPress={close} variant="ghost" />
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: theme.spacing.sm,
    },
    label: {
        flexShrink: 1,
        fontSize: theme.font.label,
        fontWeight: "700",
        color: theme.colors.text,
        lineHeight: 26,
    },
    required: {
        color: theme.colors.danger,
    },
    field: {
        minHeight: theme.touch.input,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.inputBackground,
        paddingHorizontal: theme.spacing.lg,
    },
    pressed: {
        opacity: 0.7,
    },
    fieldText: {
        flex: 1,
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    placeholder: {
        flex: 1,
        fontSize: theme.font.body,
        color: theme.colors.placeholder,
    },
    chevron: {
        fontSize: theme.font.body,
        color: theme.colors.primary,
    },
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: "center",
        padding: theme.spacing.xl,
    },
    card: {
        maxHeight: "88%",
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    title: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: "800",
        color: theme.colors.text,
    },
    list: {
        flexGrow: 0,
        flexShrink: 1,
    },
    listContent: {
        paddingVertical: theme.spacing.xs,
    },
    empty: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.textMuted,
        paddingVertical: theme.spacing.lg,
        textAlign: "center",
    },
    row: {
        minHeight: 72,
        justifyContent: "center",
        gap: 2,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    rowPressed: {
        backgroundColor: theme.colors.surface,
    },
    rowName: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    rowQuantity: {
        fontSize: theme.font.small,
        color: theme.colors.textMuted,
    },
});
