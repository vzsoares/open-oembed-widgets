import { defineConfig, devices } from "@playwright/test";

// Dedicated port (not Vite's default 5173) so the e2e server never collides
// with a dev server you may already have running.
const PORT = 5273;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL,
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                // Locally reuse the system Google Chrome so there's no ~130MB
                // Chromium download; CI installs bundled Chromium instead.
                ...(process.env.CI ? {} : { channel: "chrome" }),
            },
        },
    ],
    webServer: {
        command: `bun run dev --port ${PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
    },
});
