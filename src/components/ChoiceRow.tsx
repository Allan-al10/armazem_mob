import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

export type ChoiceColor = "primary" | "accent" | "yellow" | "success" | "danger";

export type ChoiceOption<T extends string> = {
    value: T;
    label: string;
    icon?: string;
    color?: ChoiceColor;
};

type ChoiceRowProps<T extends string> = {
    options: readonly ChoiceOption<T>[];
    value: T;
    onChange: (value: T) => void;
};

/** Botões grandes de escolha única (ex.: unidade, data, motivo). */
export function ChoiceRow<T extends string>({ options, value, onChange }: ChoiceRowProps<T>) {
    const { colors } = useAppTheme();

    const colorFor = (color: ChoiceColor | undefined): string => {
        if (color === "accent") return colors.accent;
        if (color === "yellow") return colors.yellow;
        if (color === "success") return colors.success;
        if (color === "danger") return colors.danger;
        return colors.primary;
    };

    return (
        <View style={styles.row}>
            {options.map((option) => {
                const active = option.value === value;
                const activeColor = colorFor(option.color);
                const activeTextColor =
                    option.color === "yellow" ? "#1D2733" : colors.onPrimary;

                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={({ pressed }) => [
                            styles.choice,
                            active
                                ? { backgroundColor: activeColor, borderColor: activeColor }
                                : { backgroundColor: colors.card, borderColor: colors.border },
                            pressed ? styles.pressed : null,
                        ]}
                    >
                        {option.icon ? (
                            <Text
                                style={[
                                    styles.icon,
                                    { color: active ? activeTextColor : colors.textMuted },
                                ]}
                                accessibilityElementsHidden
                                importantForAccessibility="no"
                            >
                                {option.icon}
                            </Text>
                        ) : null}
                        <Text
                            style={[
                                styles.text,
                                { color: active ? activeTextColor : colors.text },
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.sm,
    },
    choice: {
        minHeight: theme.touch.min,
        flexGrow: 1,
        flexBasis: 0,
        minWidth: 82,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderWidth: 2,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    pressed: {
        opacity: 0.72,
    },
    icon: {
        fontSize: 22,
        lineHeight: 26,
    },
    text: {
        fontSize: theme.font.label,
        fontWeight: "700",
        lineHeight: 20,
        textAlign: "center",
    },
});
