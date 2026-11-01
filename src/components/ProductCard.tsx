import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatCents } from "@/lib/money";
import { formatQuantityWithUnit } from "@/lib/quantity";
import type { ProductUnit } from "@/lib/types";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

export type ProductCardData = {
    name: string;
    stockQty: number;
    unit: ProductUnit;
    salePriceCents: number;
    lowStockThreshold: number;
};

export function ProductCard({
    product,
    onPress,
}: {
    product: ProductCardData;
    onPress: () => void;
}) {
    const { colors } = useAppTheme();
    const low = product.stockQty <= product.lowStockThreshold;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${product.name}. ${formatQuantityWithUnit(
                product.stockQty,
                product.unit,
            )} em estoque. Preço ${formatCents(product.salePriceCents)}.${
                low ? " Estoque baixo." : ""
            }`}
            accessibilityHint="Toque para ver e editar o produto"
            style={({ pressed }) => [
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: low ? colors.danger : colors.border,
                },
                pressed ? styles.pressed : null,
            ]}
        >
            <View
                style={[
                    styles.iconSquare,
                    { backgroundColor: low ? colors.dangerBg : colors.surfaceStrong },
                ]}
            >
                <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
                    📦
                </Text>
            </View>

            <View style={styles.texts}>
                <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {product.name}
                    </Text>
                    {low ? (
                        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                            <Text style={styles.badgeText}>⚠ Baixo</Text>
                        </View>
                    ) : null}
                </View>

                <Text style={[styles.quantity, { color: colors.textMuted }]}>
                    {formatQuantityWithUnit(product.stockQty, product.unit)}
                </Text>
                <Text style={[styles.price, { color: colors.primaryInk }]}>
                    {formatCents(product.salePriceCents)}
                </Text>
            </View>

            <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        minHeight: 88,
        borderWidth: 2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    pressed: {
        opacity: 0.75,
    },
    iconSquare: {
        width: 52,
        height: 52,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        fontSize: 26,
        lineHeight: 32,
    },
    texts: {
        flex: 1,
        gap: 1,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    name: {
        flexShrink: 1,
        fontSize: theme.font.body,
        lineHeight: 22,
        fontWeight: "700",
    },
    badge: {
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
    },
    badgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
    },
    quantity: {
        fontSize: 15,
        lineHeight: 20,
    },
    price: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "700",
    },
    arrow: {
        fontSize: 28,
        lineHeight: 30,
        fontWeight: "700",
    },
});
