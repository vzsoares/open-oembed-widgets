import Alpine from "alpinejs";
import {
    applyThemeFromQuery,
    getResolvedTheme,
    type Theme,
    toggleTheme,
} from "./lib/theme";

applyThemeFromQuery();

interface HelpPage {
    theme: Theme;
    toggle(): void;
    readonly themeLabel: string;
}

Alpine.data(
    "help",
    (): HelpPage => ({
        theme: getResolvedTheme(),
        toggle() {
            this.theme = toggleTheme();
        },
        get themeLabel() {
            return this.theme === "dark" ? "Light" : "Dark";
        },
    }),
);

Alpine.start();
