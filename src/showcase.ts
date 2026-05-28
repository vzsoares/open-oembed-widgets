import Alpine from "alpinejs";
import {
    applyThemeFromQuery,
    getResolvedTheme,
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

/**
 * Curated query strings so each demo looks good on its own — the gallery's
 * defaults leave data-driven widgets (weather, github, links, images) empty.
 * Theme is appended live, so toggling re-renders every embed.
 */
const EXAMPLES: Record<string, string> = {
    btc: "range=1m",
    clock: "style=flip&show=both",
    timer: "mode=down&to=2027-01-01T00:00:00&units=dhm&label=New%20Year",
    counter: "mode=until&date=2027-01-01&label=New%20Year",
    bible: "lang=en",
    images: "src=https://picsum.photos/seed/oow1/480/270,https://picsum.photos/seed/oow2/480/270,https://picsum.photos/seed/oow3/480/270&every=4",
    progress: "mode=year",
    onthisday: "type=selected",
    weather: "city=Tokyo",
    github: "user=vzsoares",
    links: "btns=GitHub|https://github.com/vzsoares;Website|https://vzsoares.github.io/open-oembed-widgets/",
    quote: "collection=motivation",
};

interface Showcase {
    widgets: WidgetDef[];
    theme: Theme;
    toggle(): void;
    demoUrl(w: WidgetDef): string;
    dims(w: WidgetDef): Dimensions;
    readonly themeLabel: string;
}

Alpine.data(
    "showcase",
    (): Showcase => ({
        widgets,
        theme: getResolvedTheme(),

        toggle() {
            this.theme = toggleTheme();
        },

        // The live embed URL: curated example params + the current theme.
        demoUrl(w) {
            const example = EXAMPLES[w.id];
            const query = example
                ? `${example}&theme=${this.theme}`
                : `theme=${this.theme}`;
            return `../${w.id}/?${query}`;
        },

        dims(w) {
            return dimensionsFor(w);
        },

        get themeLabel() {
            return this.theme === "dark" ? "Light" : "Dark";
        },
    }),
);

Alpine.start();
