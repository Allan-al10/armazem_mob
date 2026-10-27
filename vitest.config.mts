import { defineConfig } from "vitest/config";

export default defineConfig({
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
