import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const srcDirectory = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            "@": srcDirectory,
        },
    },
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    include: ["src/**/*.test.ts"],
                    environment: "node",
                },
            },
            {
                extends: true,
                test: {
                    name: "convex",
                    include: ["convex/**/*.test.ts"],
                    environment: "edge-runtime",
                },
            },
        ],
    },
});
