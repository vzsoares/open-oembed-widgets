import Alpine from "alpinejs";
import {
    applyThemeFromQuery,
    getResolvedTheme,
    type Theme,
    toggleTheme,
} from "./lib/theme";
import { type WidgetDef, widgets } from "./widgets/manifest";

applyThemeFromQuery();

type RangeMap = Record<string, string>;

function defaultRanges(): RangeMap {
    const map: RangeMap = {};
    for (const w of widgets) {
        const fallback = w.defaultRange ?? w.ranges?.[0]?.id;
        if (fallback) map[w.id] = fallback;
    }
    return map;
}

interface Home {
    widgets: WidgetDef[];
    copiedId: string;
    theme: Theme;
    selected: RangeMap;
    query(w: WidgetDef): string;
    widgetUrl(w: WidgetDef): string;
    embedUrl(w: WidgetDef): string;
    setRange(w: WidgetDef, id: string): void;
    copy(w: WidgetDef): Promise<void>;
    toggle(): void;
    readonly themeLabel: string;
}

Alpine.data(
    "home",
    (): Home => ({
        widgets,
        copiedId: "",
        theme: getResolvedTheme(),
        selected: defaultRanges(),

        // The embed config (theme + range) baked into the URL. Reactive, so
        // toggling the theme or range updates the preview and copied link.
        query(w) {
            const q = new URLSearchParams({ theme: this.theme });
            if (w.ranges?.length) q.set("range", this.selected[w.id] ?? "");
            return q.toString();
        },

        widgetUrl(w) {
            return `${w.id}/?${this.query(w)}`;
        },

        embedUrl(w) {
            return new URL(this.widgetUrl(w), window.location.href).toString();
        },

        setRange(w, id) {
            this.selected[w.id] = id;
        },

        async copy(w) {
            try {
                await navigator.clipboard.writeText(this.embedUrl(w));
                this.copiedId = w.id;
                window.setTimeout(() => {
                    if (this.copiedId === w.id) this.copiedId = "";
                }, 1500);
            } catch {
                // Clipboard unavailable (e.g. non-secure context); ignore.
            }
        },

        toggle() {
            this.theme = toggleTheme();
        },

        get themeLabel() {
            return this.theme === "dark" ? "Light" : "Dark";
        },
    }),
);

Alpine.start();
