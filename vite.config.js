import { resolve } from "node:path";
import { defineConfig, searchForWorkspaceRoot } from "vite";

// Deployed under https://vzsoares.github.io/open-oembed-widgets/
const REPO_BASE = "/open-oembed-widgets/";

export default defineConfig(({ command }) => ({
    // Each widget is its own page, so dev/preview must serve real files
    // instead of falling back to index.html.
    appType: "mpa",
    // Dev stays at "/" for convenience; the GitHub Pages base is only
    // applied to the production build.
    base: command === "build" ? REPO_BASE : "/",
    build: {
        rollupOptions: {
            input: {
                home: resolve(process.cwd(), "index.html"),
                clock: resolve(process.cwd(), "clock/index.html"),
                timer: resolve(process.cwd(), "timer/index.html"),
                btc: resolve(process.cwd(), "btc/index.html"),
                bible: resolve(process.cwd(), "bible/index.html"),
            },
        },
    },
    server: {
        fs: {
            allow: [searchForWorkspaceRoot(process.cwd())],
            strict: false,
        },
    },
}));
