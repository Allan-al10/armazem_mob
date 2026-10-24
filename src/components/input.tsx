import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { theme } from "@/theme";

export function Input({ style, ...rest }: TextInputProps) {
    return (
        <TextInput
            style={[styles.input, style]}
            placeholderTextColor={theme.colors.placeholder}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        width: "100%",
        minHeight: theme.touch.input,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.inputBackground,
        fontSize: theme.font.body,
        color: theme.colors.text,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
});
