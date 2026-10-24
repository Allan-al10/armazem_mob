import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { isValidEmail, isValidPhone, onlyDigits } from "../src/lib/validation";
import type { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [
        Password<DataModel>({
            profile(params) {
                const email = String(params.email ?? "").trim().toLowerCase();

                // O profile também é chamado no login; nesse caso só o e-mail existe.
                if (params.flow !== "signUp") {
                    return { email };
                }

                const name = String(params.name ?? "").trim();
                const phone = onlyDigits(String(params.phone ?? ""));

                if (!name || !isValidEmail(email)) {
                    throw new ConvexError("Digite seu nome completo e um e-mail válido.");
                }
                if (!isValidPhone(phone)) {
                    throw new ConvexError("Digite um telefone com DDD. Exemplo: (11) 91234-5678.");
                }

                return { email, name, phone };
            },
            validatePasswordRequirements(password) {
                if (password.length < 8) {
                    throw new ConvexError("A senha precisa ter pelo menos 8 caracteres.");
                }
            },
        }),
    ],
});
