/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./*/index.html", "./src/**/*.{js,ts}"],
    theme: {
        extend: {
            // Monochrome palette driven by CSS variables so a single set of
            // utilities adapts to light/dark (see src/styles.css).
            colors: {
                bg: "var(--bg)",
                fg: "var(--fg)",
                muted: "var(--muted)",
                border: "var(--border)",
            },
            fontFamily: {
                sans: [
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "Segoe UI",
                    "Roboto",
                    "sans-serif",
                ],
                mono: [
                    "ui-monospace",
                    "SFMono-Regular",
                    "Menlo",
                    "Consolas",
                    "monospace",
                ],
            },
        },
    },
    plugins: [],
};
