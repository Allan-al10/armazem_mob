import { useAuthActions } from "@convex-dev/auth/react";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { friendlyError } from "@/lib/errors";
import { fieldHelp } from "@/lib/help";
import { isValidEmail } from "@/lib/validation";
import { theme } from "@/theme";

type FieldErrors = {
    email?: string;
    password?: string;
};

export default function LoginScreen() {
    const { signIn } = useAuthActions();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        const nextErrors: FieldErrors = {};
        if (!isValidEmail(email)) {
            nextErrors.email = "Digite um e-mail válido. Exemplo: nome@email.com.";
        }
        if (!password) {
            nextErrors.password = "Digite sua senha.";
        }

        setErrors(nextErrors);
        setFormError(null);
        if (Object.keys(nextErrors).length > 0) return;

        setLoading(true);
        try {
            await signIn("password", {
                email: email.trim().toLowerCase(),
                password,
                flow: "signIn",
            });
        } catch (error) {
            setFormError(
                friendlyError(error, "Não foi possível entrar. Confira o e-mail e a senha."),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ScreenHeader
                title="Meu Armazém"
                subtitle="Entre para cuidar do seu negócio"
                helpKey="login"
            />
            <Screen>
                <Image
                    source={require("@/assets/img1.png")}
                    style={styles.illustration}
                    resizeMode="contain"
                    accessibilityLabel="Ilustração de um armazém"
                />

                <ErrorBanner message={formError} />

                <TextField
                    label="E-mail"
                    info={fieldHelp.email}
                    required
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        setErrors((current) => ({ ...current, email: undefined }));
                        setFormError(null);
                    }}
                    error={errors.email}
                    placeholder="nome@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    maxLength={120}
                />

                <TextField
                    label="Senha"
                    info={fieldHelp.password}
                    required
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setErrors((current) => ({ ...current, password: undefined }));
                        setFormError(null);
                    }}
                    error={errors.password}
                    placeholder="Digite sua senha"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                        void handleSubmit();
                    }}
                />

                <BigButton
                    label="Entrar"
                    icon="→"
                    onPress={handleSubmit}
                    loading={loading}
                />

                <View style={styles.divider} />

                <Text style={styles.question}>Ainda não tem uma conta?</Text>
                <BigButton
                    label="Criar minha conta"
                    onPress={() => router.push("/signup")}
                    variant="secondary"
                />

                <Text style={styles.privacy}>
                    Seus dados ficam só na sua conta e não são compartilhados com outras lojas.
                </Text>
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    illustration: {
        width: "100%",
        height: 170,
        marginVertical: theme.spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.borderLight,
        marginVertical: theme.spacing.sm,
    },
    question: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.text,
        textAlign: "center",
        fontWeight: "600",
    },
    privacy: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
});
