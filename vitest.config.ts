import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // Unit tests live next to the code; the Playwright e2e specs in
        // `e2e/*.spec.ts` run separately via `bun run test:e2e`.
        include: ["src/**/*.test.ts"],
    },
});
