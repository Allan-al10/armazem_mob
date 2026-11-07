import { describe, expect, test } from "vitest";
import { resolveConvexUrl } from "./convexUrl";

describe("resolução do endereço do Convex em desenvolvimento", () => {
    test("troca 127.0.0.1 pelo IP da máquina no Expo Go", () => {
        expect(
            resolveConvexUrl(
                "http://127.0.0.1:3210",
                "192.168.1.10:8081",
                true,
            ),
        ).toBe("http://192.168.1.10:3210");
    });

    test("funciona com localhost e com o emulador Android", () => {
        expect(
            resolveConvexUrl("http://localhost:3210", "10.0.2.2:8081", true),
        ).toBe("http://10.0.2.2:3210");
    });

    test("mantém o endereço quando o Expo também está em loopback", () => {
        expect(
            resolveConvexUrl("http://127.0.0.1:3210", "localhost:8081", true),
        ).toBe("http://127.0.0.1:3210");
    });

    test("não altera endereços remotos", () => {
        expect(
            resolveConvexUrl(
                "https://exemplo.convex.cloud",
                "192.168.1.10:8081",
                true,
            ),
        ).toBe("https://exemplo.convex.cloud");
    });

    test("não aponta para o host de um túnel do Expo", () => {
        expect(
            resolveConvexUrl(
                "http://127.0.0.1:3210",
                "meu-projeto.exp.direct:80",
                true,
            ),
        ).toBe("http://127.0.0.1:3210");
    });

    test("não altera o endereço em produção", () => {
        expect(
            resolveConvexUrl(
                "https://exemplo.convex.cloud",
                "192.168.1.10:8081",
                false,
            ),
        ).toBe("https://exemplo.convex.cloud");
    });
});
