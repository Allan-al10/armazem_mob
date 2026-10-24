export function onlyDigits(value: string): string {
    return value.replace(/\D/g, "");
}

export function normalizeSpaces(value: string): string {
    return value.trim().replace(/\s+/g, " ");
}

/** Normaliza para busca e comparação: minúsculas, sem acentos e com espaços simples. */
export function normalizeForSearch(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Máscara progressiva: 11222333000181 -> 11.222.333/0001-81 */
export function formatCnpj(value: string): string {
    const digits = onlyDigits(value).slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/** Valida os dois dígitos verificadores do CNPJ. */
export function isValidCnpj(value: string): boolean {
    const cnpj = onlyDigits(value);
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    const calculateDigit = (base: string, weights: number[]): number => {
        const sum = base
            .split("")
            .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
        const rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    };

    const first = calculateDigit(
        cnpj.slice(0, 12),
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    if (first !== Number(cnpj[12])) return false;

    const second = calculateDigit(
        cnpj.slice(0, 13),
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    return second === Number(cnpj[13]);
}

/** Máscara progressiva de telefone com DDD. */
export function formatPhone(value: string): string {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Aceita fixo (10 dígitos) e celular (11 dígitos, começando com 9). */
export function isValidPhone(value: string): boolean {
    const digits = onlyDigits(value);
    if (digits.length !== 10 && digits.length !== 11) return false;
    const ddd = Number(digits.slice(0, 2));
    if (ddd < 11 || ddd > 99) return false;
    if (digits.length === 11) return digits[2] === "9";
    return digits[2] !== "0" && digits[2] !== "1";
}

const UFS = new Set([
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
    "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

export function isValidUf(value: string): boolean {
    return UFS.has(value.trim().toUpperCase());
}

export function isValidPassword(value: string): boolean {
    return value.length >= 8;
}
