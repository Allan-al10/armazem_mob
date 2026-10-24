import { useAuthActions } from "@convex-dev/auth/react";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StepIndicator } from "@/components/StepIndicator";
import { TextField } from "@/components/TextField";
import { friendlyError } from "@/lib/errors";
import { fieldHelp } from "@/lib/help";
import {
    formatPhone,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    normalizeSpaces,
    onlyDigits,
} from "@/lib/validation";
import { theme } from "@/theme";

type FieldErrors = {
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
};

export default function SignupScreen() {
    const { signIn } = useAuthActions();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const clearError = (key: keyof FieldErrors) => {
        setErrors((current) => ({ ...current, [key]: undefined }));
        setFormError(null);
    };

    const handleSubmit = async () => {
        const nextErrors: FieldErrors = {};

        if (!normalizeSpaces(name)) {
            nextErrors.name = "Digite seu nome completo.";
        }
        if (!isValidPhone(phone)) {
            nextErrors.phone = "Digite um telefone com DDD. Exemplo: (11) 91234-5678.";
        }
        if (!isValidEmail(email)) {
            nextErrors.email = "Digite um e-mail válido. Exemplo: nome@email.com.";
        }
        if (!isValidPassword(password)) {
            nextErrors.password = "A senha precisa ter pelo menos 8 caracteres.";
        }
        if (confirmPassword !== password) {
            nextErrors.confirmPassword = "As duas senhas precisam ser iguais.";
        }

        setErrors(nextErrors);
        setFormError(null);
        if (Object.keys(nextErrors).length > 0) {
            setFormError("Confira os campos destacados em vermelho.");
            return;
        }

        setLoading(true);
        try {
            await signIn("password", {
                email: email.trim().toLowerCase(),
                password,
                flow: "signUp",
                name: normalizeSpaces(name),
                phone: onlyDigits(phone),
            });
        } catch (error) {
            setFormError(
                friendlyError(error, "Não foi possível criar a conta. Confira os dados e tente de novo."),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ScreenHeader
                title="Criar conta"
                subtitle="Vamos começar com os seus dados"
                helpKey="signup"
                showBack
                onBack={() => router.replace("/login")}
            />
            <Screen>
                <StepIndicator current={1} total={2} label="Seus dados" />

                <Text style={styles.intro}>
                    Preencha os campos abaixo. Depois você cadastra os dados do estabelecimento.
                </Text>

                <ErrorBanner message={formError} />

                <TextField
                    label="Nome completo"
                    info={fieldHelp.name}
                    required
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        clearError("name");
                    }}
                    error={errors.name}
                    placeholder="Ex.: Maria Souza"
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="name"
                    textContentType="name"
                    maxLength={80}
                />

                <TextField
                    label="Telefone"
                    info={fieldHelp.phone}
                    required
                    value={phone}
                    onChangeText={(text) => {
                        setPhone(formatPhone(text));
                        clearError("phone");
                    }}
                    error={errors.phone}
                    placeholder="(11) 91234-5678"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={15}
                />

                <TextField
                    label="E-mail"
                    info={fieldHelp.email}
                    required
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        clearError("email");
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
                        clearError("password");
                    }}
                    error={errors.password}
                    placeholder="Pelo menos 8 caracteres"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                />

                <TextField
                    label="Repita a senha"
                    required
                    value={confirmPassword}
                    onChangeText={(text) => {
                        setConfirmPassword(text);
                        clearError("confirmPassword");
                    }}
                    error={errors.confirmPassword}
                    placeholder="Digite a mesma senha"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                        void handleSubmit();
                    }}
                />

                <BigButton
                    label="Continuar"
                    icon="→"
                    onPress={handleSubmit}
                    loading={loading}
                />

                <Text style={styles.privacy}>
                    Ao continuar, você concorda que os dados do seu negócio e dos seus clientes
                    sejam guardados apenas na sua conta. Nada é compartilhado com outras lojas.
                </Text>

                <BigButton
                    label="Já tenho uma conta"
                    onPress={() => router.replace("/login")}
                    variant="secondary"
                />
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    intro: {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
        color: theme.colors.text,
    },
    privacy: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
});
