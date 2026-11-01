import type { ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/theme";
import { useAppTheme } from "@/themeContext";

type ScreenProps = {
    children: ReactNode;
    contentContainerStyle?: StyleProp<ViewStyle>;
    scroll?: boolean;
};

export function Screen({ children, contentContainerStyle, scroll = true }: ScreenProps) {
    const insets = useSafeAreaInsets();
    const { revision } = useAppTheme();

    const content = (
        <View
            key={revision}
            style={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, theme.spacing.xl) + theme.spacing.xl },
                contentContainerStyle,
            ]}
        >
            {children}
        </View>
    );

    if (!scroll) {
        return <View style={styles.flex}>{content}</View>;
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {content}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    scrollContent: {
        flexGrow: 1,
        backgroundColor: theme.colors.bg,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.screen,
        paddingTop: theme.spacing.lg,
        gap: theme.spacing.lg,
        backgroundColor: theme.colors.bg,
    },
});
