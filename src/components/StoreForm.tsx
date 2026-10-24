import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BigButton } from "@/components/BigButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { TextField } from "@/components/TextField";
import { friendlyError } from "@/lib/errors";
import { fieldHelp } from "@/lib/help";
import type { StoreAddress, StoreFormValues } from "@/lib/types";
import {
    formatCnpj,
    formatPhone,
    isValidCnpj,
    isValidPhone,
    isValidUf,
    normalizeSpaces,
    onlyDigits,
} from "@/lib/validation";
import { theme } from "@/theme";

type FormErrors = Partial<
    Record<"tradeName" | "cnpj" | "ownerName" | "phone" | keyof StoreAddress, string>
>;

type StoreFormProps = {
    initial?: StoreFormValues;
    submitLabel: string;
    onSubmit: (values: StoreFormValues) => Promise<void>;
};

const EMPTY_VALUES: StoreFormValues = {
    tradeName: "",
    cnpj: "",
    ownerName: "",
    phone: "",
    address: {
        street: "",
        number: "",
        district: "",
        city: "",
        state: "",
    },
};

function withMasks(initial?: StoreFormValues): StoreFormValues {
    if (!initial) return EMPTY_VALUES;
    return {
        ...initial,
        cnpj: formatCnpj(initial.cnpj),
        phone: formatPhone(initial.phone),
        address: { ...initial.address },
    };
}

function validate(values: StoreFormValues): FormErrors {
    const errors: FormErrors = {};

    if (!normalizeSpaces(values.tradeName)) {
        errors.tradeName = "Digite o nome do estabelecimento.";
    }
    if (!isValidCnpj(values.cnpj)) {
        errors.cnpj = "CNPJ inválido. Confira os 14 números.";
    }
    if (!normalizeSpaces(values.ownerName)) {
        errors.ownerName = "Digite o nome do proprietário.";
    }
    if (!isValidPhone(values.phone)) {
        errors.phone = "Digite um telefone com DDD. Exemplo: (11) 91234-5678.";
    }
    if (!normalizeSpaces(values.address.street)) {
        errors.street = "Digite a rua.";
    }
    if (!normalizeSpaces(values.address.number)) {
        errors.number = "Digite o número. Se não tiver, escreva S/N.";
    }
    if (!normalizeSpaces(values.address.district)) {
        errors.district = "Digite o bairro.";
    }
    if (!normalizeSpaces(values.address.city)) {
        errors.city = "Digite a cidade.";
    }
    if (!isValidUf(values.address.state)) {
        errors.state = "Digite a sigla do estado. Exemplo: SP.";
    }

    return errors;
}

export function StoreForm({ initial, submitLabel, onSubmit }: StoreFormProps) {
    const [values, setValues] = useState<StoreFormValues>(() => withMasks(initial));
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const updateValue = (
        key: "tradeName" | "cnpj" | "ownerName" | "phone",
        value: string,
    ) => {
        setValues((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined }));
        setSubmitError(null);
    };

    const updateAddress = (key: keyof StoreAddress, value: string) => {
        setValues((current) => ({
            ...current,
            address: { ...current.address, [key]: value },
        }));
        setErrors((current) => ({ ...current, [key]: undefined }));
        setSubmitError(null);
    };

    const handleSubmit = async () => {
        const nextErrors = validate(values);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setSubmitError("Confira os campos destacados em vermelho.");
            return;
        }

        setSubmitError(null);
        setSubmitting(true);
        try {
            await onSubmit({
                tradeName: normalizeSpaces(values.tradeName),
                cnpj: onlyDigits(values.cnpj),
                ownerName: normalizeSpaces(values.ownerName),
                phone: onlyDigits(values.phone),
                address: {
                    street: normalizeSpaces(values.address.street),
                    number: normalizeSpaces(values.address.number),
                    district: normalizeSpaces(values.address.district),
                    city: normalizeSpaces(values.address.city),
                    state: values.address.state.trim().toUpperCase(),
                },
            });
        } catch (error) {
            setSubmitError(
                friendlyError(error, "Não foi possível salvar os dados. Tente de novo."),
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.form}>
            <ErrorBanner message={submitError} />

            <Text style={styles.sectionTitle}>Estabelecimento</Text>

            <TextField
                label="Nome do estabelecimento"
                info={fieldHelp.tradeName}
                required
                value={values.tradeName}
                onChangeText={(text) => updateValue("tradeName", text)}
                error={errors.tradeName}
                placeholder="Ex.: Armazém São José"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={80}
                returnKeyType="next"
            />

            <TextField
                label="CNPJ"
                info={fieldHelp.cnpj}
                required
                value={values.cnpj}
                onChangeText={(text) => updateValue("cnpj", formatCnpj(text))}
                error={errors.cnpj}
                placeholder="00.000.000/0000-00"
                keyboardType="numeric"
                maxLength={18}
            />

            <TextField
                label="Nome do proprietário"
                info={fieldHelp.ownerName}
                required
                value={values.ownerName}
                onChangeText={(text) => updateValue("ownerName", text)}
                error={errors.ownerName}
                placeholder="Ex.: José da Silva"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={80}
            />

            <TextField
                label="Telefone"
                info={fieldHelp.phone}
                required
                value={values.phone}
                onChangeText={(text) => updateValue("phone", formatPhone(text))}
                error={errors.phone}
                placeholder="(11) 91234-5678"
                keyboardType="phone-pad"
                maxLength={15}
                autoComplete="tel"
            />

            <Text style={styles.sectionTitle}>Endereço</Text>

            <TextField
                label="Rua"
                info={fieldHelp.street}
                required
                value={values.address.street}
                onChangeText={(text) => updateAddress("street", text)}
                error={errors.street}
                placeholder="Ex.: Rua das Flores"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={120}
            />

            <TextField
                label="Número"
                info={fieldHelp.number}
                required
                value={values.address.number}
                onChangeText={(text) => updateAddress("number", text)}
                error={errors.number}
                placeholder="Ex.: 123 ou S/N"
                maxLength={20}
            />

            <TextField
                label="Bairro"
                info={fieldHelp.district}
                required
                value={values.address.district}
                onChangeText={(text) => updateAddress("district", text)}
                error={errors.district}
                placeholder="Ex.: Centro"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={80}
            />

            <TextField
                label="Cidade"
                info={fieldHelp.city}
                required
                value={values.address.city}
                onChangeText={(text) => updateAddress("city", text)}
                error={errors.city}
                placeholder="Ex.: São Paulo"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={80}
            />

            <TextField
                label="UF"
                info={fieldHelp.state}
                required
                value={values.address.state}
                onChangeText={(text) =>
                    updateAddress("state", text.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))
                }
                error={errors.state}
                placeholder="SP"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={2}
            />

            <BigButton
                label={submitLabel}
                onPress={handleSubmit}
                loading={submitting}
                icon="✓"
                style={styles.submit}
            />

            <Text style={styles.note}>
                Você pode corrigir esses dados depois em Meu cadastro.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    form: {
        gap: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
    },
    submit: {
        marginTop: theme.spacing.md,
    },
    note: {
        fontSize: theme.font.small,
        lineHeight: theme.lineHeight.small,
        color: theme.colors.textMuted,
        textAlign: "center",
    },
});
