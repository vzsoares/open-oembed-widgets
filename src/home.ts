import Alpine from "alpinejs";
import {
    applyThemeFromQuery,
    getResolvedTheme,
    type Theme,
    toggleTheme,
} from "./lib/theme";
import { type WidgetDef, widgets } from "./widgets/manifest";

applyThemeFromQuery();

/** widgetId -> { paramKey: selectedOptionId } */
type ParamMap = Record<string, Record<string, string>>;

function defaultParams(): ParamMap {
    const map: ParamMap = {};
    for (const w of widgets) {
        if (!w.params?.length) continue;
        const group: Record<string, string> = {};
        for (const p of w.params) group[p.key] = p.default;
        map[w.id] = group;
    }
    return map;
}

interface Home {
    widgets: WidgetDef[];
    copiedId: string;
    theme: Theme;
    selected: ParamMap;
    paramValue(w: WidgetDef, key: string): string;
    query(w: WidgetDef): string;
    widgetUrl(w: WidgetDef): string;
    embedUrl(w: WidgetDef): string;
    setParam(w: WidgetDef, key: string, id: string): void;
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
        selected: defaultParams(),

        paramValue(w, key) {
            return this.selected[w.id]?.[key] ?? "";
        },

        // The embed config (theme + each param) baked into the URL. Reactive,
        // so changing the theme or a param updates the preview and copied link.
        query(w) {
            const q = new URLSearchParams({ theme: this.theme });
            const group = this.selected[w.id];
            if (group) {
                for (const [key, value] of Object.entries(group)) {
                    // Skip blanks (e.g. an unset datetime) so the widget keeps
                    // its own default rather than receiving an empty param.
                    if (value !== "") q.set(key, value);
                }
            }
            return q.toString();
        },

        widgetUrl(w) {
            return `${w.id}/?${this.query(w)}`;
        },

        embedUrl(w) {
            return new URL(this.widgetUrl(w), window.location.href).toString();
        },

        setParam(w, key, id) {
            const group = this.selected[w.id];
            if (group) group[key] = id;
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
