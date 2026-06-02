import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, searchForWorkspaceRoot } from "vite";
import pkg from "./package.json" with { type: "json" };

// Deployed under https://vzsoares.github.io/open-oembed-widgets/
const REPO_BASE = "/open-oembed-widgets/";

export default defineConfig(({ command }) => ({
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [tailwindcss()],
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
                help: resolve(process.cwd(), "help/index.html"),
                showcase: resolve(process.cwd(), "showcase/index.html"),
                clock: resolve(process.cwd(), "clock/index.html"),
                worldclock: resolve(process.cwd(), "worldclock/index.html"),
                timer: resolve(process.cwd(), "timer/index.html"),
                counter: resolve(process.cwd(), "counter/index.html"),
                moon: resolve(process.cwd(), "moon/index.html"),
                images: resolve(process.cwd(), "images/index.html"),
                progress: resolve(process.cwd(), "progress/index.html"),
                onthisday: resolve(process.cwd(), "onthisday/index.html"),
                weather: resolve(process.cwd(), "weather/index.html"),
                github: resolve(process.cwd(), "github/index.html"),
                links: resolve(process.cwd(), "links/index.html"),
                quote: resolve(process.cwd(), "quote/index.html"),
                btc: resolve(process.cwd(), "btc/index.html"),
                ticker: resolve(process.cwd(), "ticker/index.html"),
                stocks: resolve(process.cwd(), "stocks/index.html"),
                stock: resolve(process.cwd(), "stock/index.html"),
                nameday: resolve(process.cwd(), "nameday/index.html"),
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
