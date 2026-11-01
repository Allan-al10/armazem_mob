import { Tabs } from "expo-router";
import {
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    type ColorValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type TabIconProps = {
    symbol: string;
    focused: boolean;
};

function TabIcon({ symbol, focused }: TabIconProps) {
    const { colors } = useAppTheme();

    return (
        <View
            style={[
                styles.iconBox,
                focused ? { backgroundColor: colors.surfaceStrong } : null,
            ]}
        >
            <Text
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.icon, { opacity: focused ? 1 : 0.65 }]}
            >
                {symbol}
            </Text>
        </View>
    );
}

function TabLabel({
    label,
    focused,
    color,
}: {
    label: string;
    focused: boolean;
    color: ColorValue;
}) {
    return (
        <Text
            style={[
                styles.label,
                { color, fontWeight: focused ? "700" : "400" },
            ]}
            numberOfLines={1}
        >
            {label}
        </Text>
    );
}

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const { colors, scale } = useAppTheme();
    const { fontScale } = useWindowDimensions();
    const totalScale = fontScale * scale;
    const extraLabelHeight = Math.max(0, Math.round((totalScale - 1) * 28));

    return (
        <Tabs
            initialRouteName="inicio"
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: colors.bg },
                tabBarActiveTintColor: colors.primaryInk,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelPosition: "below-icon",
                tabBarAllowFontScaling: true,
                tabBarHideOnKeyboard: true,
                tabBarIconStyle: styles.iconWrapper,
                tabBarItemStyle: styles.item,
                tabBarStyle: [
                    styles.bar,
                    {
                        backgroundColor: colors.card,
                        borderTopColor: colors.border,
                        height: 68 + insets.bottom + extraLabelHeight,
                        paddingBottom: theme.spacing.sm + insets.bottom,
                    },
                ],
            }}
        >
            <Tabs.Screen
                name="inicio"
                options={{
                    title: "Início",
                    tabBarAccessibilityLabel: "Início",
                    tabBarIcon: ({ focused }) => <TabIcon symbol="🏠" focused={focused} />,
                    tabBarLabel: ({ focused, color }) => (
                        <TabLabel label="Início" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="estoque"
                options={{
                    title: "Produtos",
                    tabBarAccessibilityLabel: "Produtos",
                    tabBarIcon: ({ focused }) => <TabIcon symbol="📦" focused={focused} />,
                    tabBarLabel: ({ focused, color }) => (
                        <TabLabel label="Produtos" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="caixa"
                options={{
                    title: "Caixa",
                    tabBarAccessibilityLabel: "Caixa",
                    tabBarIcon: ({ focused }) => <TabIcon symbol="🚛" focused={focused} />,
                    tabBarLabel: ({ focused, color }) => (
                        <TabLabel label="Caixa" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="vender"
                options={{
                    title: "Nota",
                    tabBarAccessibilityLabel: "Nota de Venda",
                    tabBarIcon: ({ focused }) => <TabIcon symbol="🧾" focused={focused} />,
                    tabBarLabel: ({ focused, color }) => (
                        <TabLabel label="Nota" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen name="fiado" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    bar: {
        borderTopWidth: 2,
        paddingTop: theme.spacing.sm,
    },
    item: {
        minHeight: theme.touch.min,
    },
    label: {
        fontSize: 13,
        lineHeight: 17,
        textAlign: "center",
    },
    iconWrapper: {
        width: 44,
        height: 30,
    },
    iconBox: {
        width: 44,
        height: 30,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        fontSize: 24,
        lineHeight: 29,
    },
});
