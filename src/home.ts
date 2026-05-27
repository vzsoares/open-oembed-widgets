import Alpine from "alpinejs";
import {
    applyThemeFromQuery,
    getResolvedTheme,
    setTheme,
    type Theme,
    toggleTheme,
} from "./lib/theme";
import {
    type Dimensions,
    dimensionsFor,
    type WidgetDef,
    widgets,
} from "./widgets/manifest";

applyThemeFromQuery();

/** widgetId -> { paramKey: selectedOptionId } */
type ParamMap = Record<string, Record<string, string>>;

interface ButtonRow {
    text: string;
    url: string;
    color: string;
}

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
    dims(w: WidgetDef): Dimensions;
    query(w: WidgetDef): string;
    widgetUrl(w: WidgetDef): string;
    embedUrl(w: WidgetDef): string;
    setParam(w: WidgetDef, key: string, id: string): void;
    copy(w: WidgetDef): Promise<void>;
    toggle(): void;
    pad: string;
    togglePad(): void;
    readonly padLabel: string;
    scale: string;
    toggleScale(): void;
    readonly scaleLabel: string;
    importError: boolean;
    importUrl(raw: string): void;
    buttonRows: ButtonRow[];
    addButtonRow(): void;
    removeButtonRow(index: number): void;
    serializeButtons(): string;
    imageRows: { url: string }[];
    addImageRow(): void;
    removeImageRow(index: number): void;
    serializeImages(): string;
    readonly themeLabel: string;
}

Alpine.data(
    "home",
    (): Home => ({
        widgets,
        copiedId: "",
        theme: getResolvedTheme(),
        selected: defaultParams(),
        pad: "",
        scale: "",
        importError: false,
        buttonRows: [
            { text: "GitHub", url: "https://github.com/vzsoares", color: "" },
            {
                text: "Website",
                url: "https://vzsoares.github.io/open-oembed-widgets/",
                color: "",
            },
        ],
        imageRows: [{ url: "" }],

        paramValue(w, key) {
            return this.selected[w.id]?.[key] ?? "";
        },

        // Preview/embed dimensions, honoring the orientation selection.
        dims(w) {
            return dimensionsFor(w, this.selected[w.id]);
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
            // Global padding / scaling choices apply to every widget.
            if (this.pad !== "") q.set("pad", this.pad);
            if (this.scale !== "") q.set("fit", this.scale);
            // The addable button editor feeds its own param (e.g. ?btns=).
            const buttonsParam = w.params?.find((p) => p.type === "buttons");
            if (buttonsParam) {
                const serialized = this.serializeButtons();
                if (serialized) q.set(buttonsParam.key, serialized);
                else q.delete(buttonsParam.key);
            }
            // The addable image-URL editor feeds its param (e.g. ?src=).
            const urlsParam = w.params?.find((p) => p.type === "urls");
            if (urlsParam) {
                const serialized = this.serializeImages();
                if (serialized) q.set(urlsParam.key, serialized);
                else q.delete(urlsParam.key);
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

        // Global padding: "" keeps each widget's default, "0" removes it.
        togglePad() {
            this.pad = this.pad === "0" ? "" : "0";
        },

        get padLabel() {
            return this.pad === "0" ? "Add padding" : "Remove padding";
        },

        // Global scaling: "" is natural size (default), "1" scales to fit
        // (?fit=1).
        toggleScale() {
            this.scale = this.scale === "1" ? "" : "1";
        },

        get scaleLabel() {
            return this.scale === "1" ? "Disable scaling" : "Enable scaling";
        },

        addButtonRow() {
            this.buttonRows.push({ text: "", url: "", color: "" });
        },

        removeButtonRow(index) {
            this.buttonRows.splice(index, 1);
        },

        // Build the `?btns=` value: `text|url|color` rows joined by ";",
        // skipping rows missing text or URL.
        serializeButtons() {
            return this.buttonRows
                .filter((r) => r.text.trim() !== "" && r.url.trim() !== "")
                .map((r) => {
                    const fields = [r.text.trim(), r.url.trim()];
                    if (r.color.trim() !== "") fields.push(r.color.trim());
                    return fields.join("|");
                })
                .join(";");
        },

        addImageRow() {
            this.imageRows.push({ url: "" });
        },

        removeImageRow(index) {
            this.imageRows.splice(index, 1);
        },

        // Build the `?src=` value: image URLs joined by "," (blanks skipped).
        serializeImages() {
            return this.imageRows
                .map((r) => r.url.trim())
                .filter((u) => u !== "")
                .join(",");
        },

        // Parse a previously-built widget URL back into the gallery: detect the
        // widget, apply its theme + params, and scroll to its card to edit.
        importUrl(raw) {
            this.importError = false;
            if (!raw.trim()) return;
            let url: URL;
            try {
                url = new URL(raw, window.location.href);
            } catch {
                this.importError = true;
                return;
            }
            const segments = url.pathname.split("/").filter(Boolean);
            const id = segments
                .reverse()
                .find((s) => this.widgets.some((w) => w.id === s));
            const widget = this.widgets.find((w) => w.id === id);
            if (!widget) {
                this.importError = true;
                return;
            }
            const q = url.searchParams;
            const theme = q.get("theme");
            if (theme === "light" || theme === "dark") {
                this.theme = theme;
                setTheme(theme);
            }
            const group = this.selected[widget.id];
            if (group && widget.params) {
                for (const p of widget.params) {
                    const value = q.get(p.key);
                    if (value !== null) group[p.key] = value;
                }
            }
            document
                .getElementById(`w-${widget.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        },

        get themeLabel() {
            return this.theme === "dark" ? "Light" : "Dark";
        },
    }),
);

Alpine.start();
