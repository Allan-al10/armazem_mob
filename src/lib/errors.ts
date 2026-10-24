type ErrorWithData = {
    data?: unknown;
    message?: string;
};

function extractMessage(error: unknown): string {
    if (error && typeof error === "object") {
        const data = (error as ErrorWithData).data;
        if (typeof data === "string" && data.trim()) return data;
        if (data && typeof data === "object") {
            const message = (data as { message?: unknown }).message;
            if (typeof message === "string" && message.trim()) return message;
        }
        const message = (error as ErrorWithData).message;
        if (typeof message === "string" && message.trim()) return message;
    }
    if (typeof error === "string") return error;
    return "";
}

const AUTH_MESSAGES: { needles: string[]; message: string }[] = [
    {
        needles: ["invalid credentials", "invalid password", "invalid secret"],
        message: "E-mail ou senha incorretos. Confira e tente de novo.",
    },
    {
        needles: ["already exists", "account already exists"],
        message: "Já existe uma conta com este e-mail. Tente entrar.",
    },
    {
        needles: ["too many", "rate limit", "rate-limit"],
        message: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
    },
    {
        needles: ["missing `password`", "missing password"],
        message: "Digite sua senha para continuar.",
    },
    {
        needles: ["failed to fetch", "network", "websocket", "offline", "connection"],
        message: "Não foi possível conectar. Confira sua internet e tente de novo.",
    },
];

const PORTUGUESE_HINTS = [
    "cnpj", "estabelecimento", "senha", "telefone", "e-mail", "email",
    "endereço", "endereco", "nome", "conta", "digite", "confira",
];

/** Converte erros técnicos em mensagens claras em português. */
export function friendlyError(
    error: unknown,
    fallback = "Não foi possível concluir. Confira os dados e tente de novo.",
): string {
    const raw = extractMessage(error).trim();
    if (!raw) return fallback;

    const lower = raw.toLowerCase();
    for (const entry of AUTH_MESSAGES) {
        if (entry.needles.some((needle) => lower.includes(needle))) {
            return entry.message;
        }
    }

    const withoutPrefix = raw.replace(/^ConvexError:\s*/i, "").trim();
    const normalized = withoutPrefix.toLowerCase();
    if (/[ãáâàéêíóôõúç]/i.test(withoutPrefix)) return withoutPrefix;
    if (PORTUGUESE_HINTS.some((hint) => normalized.includes(hint))) return withoutPrefix;

    return fallback;
}
