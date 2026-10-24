import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

type ChoiceOption<T extends string> = {
    value: T;
    label: string;
};

type ChoiceRowProps<T extends string> = {
    options: readonly ChoiceOption<T>[];
    value: T;
    onChange: (value: T) => void;
};

/** Botões grandes de escolha única (ex.: unidade, data, motivo). */
export function ChoiceRow<T extends string>({ options, value, onChange }: ChoiceRowProps<T>) {
    return (
        <View style={styles.row}>
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={({ pressed }) => [
                            styles.choice,
                            active ? styles.choiceActive : null,
                            pressed ? styles.pressed : null,
                        ]}
                    >
                        <Text style={[styles.text, active ? styles.textActive : null]}>
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
        gap: theme.spacing.md,
    },
    choice: {
        minHeight: theme.touch.min,
        paddingHorizontal: theme.spacing.lg,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
    },
    choiceActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surface,
    },
    pressed: {
        opacity: 0.7,
    },
    text: {
        fontSize: theme.font.label,
        fontWeight: "700",
        color: theme.colors.text,
    },
    textActive: {
        color: theme.colors.primary,
    },
});
