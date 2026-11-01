import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ProductCard } from "@/components/ProductCard";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { TutorialModal } from "@/components/TutorialModal";
import { api } from "@/lib/api";
import { useTutorial } from "@/lib/useTutorial";
import { normalizeForSearch } from "@/lib/validation";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

export default function StockListScreen() {
    const products = useQuery(api.products.list);
    const tutorial = useTutorial("estoque");
    const { colors } = useAppTheme();
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
            <ScreenHeader
                title="Produtos"
                subtitle="Consultar e repor o estoque"
                helpKey="estoque"
            />
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
                        <ActivityIndicator size="large" color={colors.primary} />
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
                            {lowStockCount > 0
                                ? ` • ${lowStockCount} com estoque baixo`
                                : " • estoque em dia"}
                        </Text>

                        {filtered.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyTitle}>Nenhum produto encontrado.</Text>
                                <Text style={styles.emptyText}>
                                    Confira o nome digitado na busca.
                                </Text>
                            </View>
                        ) : (
                            filtered.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/estoque/[id]",
                                            params: { id: product._id },
                                        })
                                    }
                                />
                            ))
                        )}
                    </>
                )}

                <BigButton
                    label="Registrar chegada no Caixa"
                    description="Somar produtos, custo e preço de venda"
                    icon="🚛"
                    onPress={() => router.navigate("/caixa")}
                    style={[styles.action, { backgroundColor: colors.accent, borderColor: colors.accent }]}
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
        backgroundColor: theme.colors.card,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
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
    action: {
        marginTop: theme.spacing.lg,
    },
});
