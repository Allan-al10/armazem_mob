import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { TutorialModal } from "@/components/TutorialModal";
import { api } from "@/lib/api";
import { formatCents } from "@/lib/money";
import { formatQuantityWithUnit } from "@/lib/quantity";
import { useTutorial } from "@/lib/useTutorial";
import { normalizeForSearch } from "@/lib/validation";
import { theme } from "@/theme";

export default function StockListScreen() {
    const products = useQuery(api.products.list);
    const tutorial = useTutorial("estoque");
    const [search, setSearch] = useState("");

    const query = normalizeForSearch(search);
    const filtered = (products ?? []).filter((product) =>
        query ? product.nameQuery.includes(query) : true,
    );
    const lowStockCount = (products ?? []).filter(
        (product) => product.stockQty <= product.lowStockThreshold,
    ).length;

    return (
        <>
            <ScreenHeader title="Estoque" helpKey="estoque" />
            <Screen>
                <TextField
                    label="Buscar produto"
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Digite o nome do produto"
                    autoCapitalize="words"
                    autoCorrect={false}
                />

                {products === undefined ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Carregando produtos...</Text>
                    </View>
                ) : products.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>Você ainda não tem produtos.</Text>
                        <Text style={styles.emptyText}>
                            Registre a mercadoria que chegou para começar.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.summary}>
                            {filtered.length} produto{filtered.length === 1 ? "" : "s"}
                            {lowStockCount > 0 ? ` • ${lowStockCount} com estoque baixo` : ""}
                        </Text>

                        {filtered.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyTitle}>Nenhum produto encontrado.</Text>
                                <Text style={styles.emptyText}>
                                    Confira o nome digitado na busca.
                                </Text>
                            </View>
                        ) : (
                            filtered.map((product) => {
                                const lowStock = product.stockQty <= product.lowStockThreshold;
                                return (
                                    <Pressable
                                        key={product._id}
                                        onPress={() =>
                                            router.push({
                                                pathname: "/estoque/[id]",
                                                params: { id: product._id },
                                            })
                                        }
                                        accessibilityRole="button"
                                        accessibilityLabel={`${product.name}. ${formatQuantityWithUnit(
                                            product.stockQty,
                                            product.unit,
                                        )} em estoque. Preço de venda ${formatCents(
                                            product.salePriceCents,
                                        )}.${lowStock ? " Estoque baixo." : ""}`}
                                        accessibilityHint="Abre os detalhes do produto"
                                        style={({ pressed }) => [
                                            styles.row,
                                            pressed ? styles.rowPressed : null,
                                        ]}
                                    >
                                        <View style={styles.rowTexts}>
                                            <Text style={styles.rowName}>{product.name}</Text>
                                            <Text style={styles.rowQuantity}>
                                                Quantidade:{" "}
                                                {formatQuantityWithUnit(
                                                    product.stockQty,
                                                    product.unit,
                                                )}
                                            </Text>
                                            <Text style={styles.rowPrice}>
                                                Preço de venda:{" "}
                                                {formatCents(product.salePriceCents)}
                                            </Text>
                                        </View>
                                        {lowStock ? (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>Estoque baixo</Text>
                                            </View>
                                        ) : null}
                                    </Pressable>
                                );
                            })
                        )}
                    </>
                )}

                <BigButton
                    label="Chegou mercadoria"
                    description="Registrar produtos que chegaram"
                    icon="📦"
                    onPress={() => router.push("/chegou-mercadoria")}
                    style={styles.action}
                />
            </Screen>

            <TutorialModal
                visible={tutorial.visible}
                tutorialKey="estoque"
                onClose={tutorial.close}
            />
        </>
    );
}

const styles = StyleSheet.create({
    loadingBox: {
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.xxl,
    },
    loadingText: {
        fontSize: theme.font.body,
        color: theme.colors.textMuted,
    },
    emptyBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    emptyTitle: {
        fontSize: theme.font.body,
        fontWeight: "700",
        color: theme.colors.text,
    },
    emptyText: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    summary: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
    },
    row: {
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
    },
    rowPressed: {
        backgroundColor: theme.colors.surface,
    },
    rowTexts: {
        flex: 1,
        gap: 2,
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
    rowPrice: {
        fontSize: theme.font.small,
        color: theme.colors.textMuted,
    },
    badge: {
        backgroundColor: theme.colors.warningSurface,
        borderWidth: 2,
        borderColor: theme.colors.warning,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    badgeText: {
        fontSize: theme.font.small,
        fontWeight: "800",
        color: theme.colors.warning,
    },
    action: {
        marginTop: theme.spacing.lg,
    },
});
