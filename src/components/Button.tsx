import { StyleSheet, Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";
import { theme } from "@/theme";

type ButtonProps = TouchableOpacityProps & {
    label: string;
};

export function Button({ label, ...rest }: ButtonProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            accessibilityRole="button"
            accessibilityLabel={label}
            {...rest}
        >
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        minHeight: theme.touch.button,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    label: {
        color: theme.colors.onPrimary,
        fontSize: theme.font.button,
        fontWeight: "700",
    },
});
