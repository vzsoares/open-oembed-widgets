export interface RangeOption {
    /** Query-param value and selector id. */
    id: string;
    /** Short label shown on the selector (e.g. "1M"). */
    label: string;
    /** History window in days. */
    days: number;
}

export const btcRanges: RangeOption[] = [
    { id: "1d", label: "1D", days: 1 },
    { id: "1w", label: "1W", days: 7 },
    { id: "1m", label: "1M", days: 30 },
    { id: "3m", label: "3M", days: 90 },
    { id: "1y", label: "1Y", days: 365 },
];

export interface ParamOption {
    id: string;
    label: string;
}

/**
 * How a param is rendered in the gallery: a row of option buttons (`select`,
 * the default), a `datetime-local` picker (`datetime`), a `date` picker
 * (`date`), a free `text` field (`text`), or an addable rows editor
 * (`buttons`, for the link-button list).
 */
export type ParamType = "select" | "datetime" | "date" | "text" | "buttons";

/** A configurable widget option surfaced as a query param + gallery selector. */
export interface WidgetParam {
    /** Query-param name, e.g. "range" or "lang". */
    key: string;
    /** Gallery label, e.g. "Range". */
    label: string;
    /** Defaults to "select". */
    type?: ParamType;
    /** Required for `select`; omitted for `datetime`/`text`. */
    options?: ParamOption[];
    /** Placeholder for a `text` input. */
    placeholder?: string;
    /** Default option id, or "" for an unset datetime/text (widget picks one). */
    default: string;
}

export interface WidgetDef {
    /** URL slug and output folder name (e.g. "btc" -> /btc/). */
    id: string;
    title: string;
    description: string;
    /** Default embed dimensions in px, advertised via oEmbed. */
    width: number;
    height: number;
    /** Configurable options (rendered as selectors in the gallery). */
    params?: WidgetParam[];
}

export interface Dimensions {
    width: number;
    height: number;
}

/**
 * A widget's embed dimensions. The widget fills whatever box it's given, so an
 * `orient=portrait` selection simply swaps width/height (e.g. 480×270 → 270×480).
 */
export function dimensionsFor(
    w: WidgetDef,
    params?: Record<string, string>,
): Dimensions {
    if (params?.orient === "portrait") {
        return { width: w.height, height: w.width };
    }
    return { width: w.width, height: w.height };
}

/** Single source of truth: the gallery, previews and oEmbed JSON all use it. */
export const widgets: WidgetDef[] = [
    {
        id: "btc",
        title: "Bitcoin Price",
        description:
            "Live BTC/USD price with a configurable price chart (1D–1Y).",
        width: 480,
        height: 280,
        params: [
            {
                key: "range",
                label: "Range",
                options: btcRanges.map((r) => ({ id: r.id, label: r.label })),
                default: "1m",
            },
        ],
    },
    {
        id: "clock",
        title: "Clock",
        description:
            "A flip-clock or analog clock showing the current time and date, with timezone and 24-hour options.",
        width: 360,
        height: 200,
        params: [
            {
                key: "style",
                label: "Style",
                options: [
                    { id: "flip", label: "Flip" },
                    { id: "analog", label: "Analog" },
                ],
                default: "flip",
            },
            {
                key: "show",
                label: "Show",
                options: [
                    { id: "both", label: "Both" },
                    { id: "time", label: "Time" },
                    { id: "date", label: "Date" },
                ],
                default: "both",
            },
            {
                key: "seconds",
                label: "Seconds",
                options: [
                    { id: "0", label: "Off" },
                    { id: "1", label: "On" },
                ],
                default: "0",
            },
            {
                key: "h24",
                label: "Hours",
                options: [
                    { id: "0", label: "12H" },
                    { id: "1", label: "24H" },
                ],
                default: "0",
            },
        ],
    },
    {
        id: "timer",
        title: "Timer",
        description:
            "A countdown or count-up in days/hours/minutes/seconds (set ?to= or ?from=).",
        width: 420,
        height: 160,
        params: [
            {
                key: "mode",
                label: "Mode",
                options: [
                    { id: "down", label: "Down" },
                    { id: "up", label: "Up" },
                ],
                default: "down",
            },
            {
                key: "date",
                label: "Date",
                type: "datetime",
                default: "",
            },
            {
                key: "units",
                label: "Units",
                options: [
                    { id: "dhms", label: "D H M S" },
                    { id: "dhm", label: "D H M" },
                ],
                default: "dhms",
            },
        ],
    },
    {
        id: "bible",
        title: "Bible Verse",
        description: "A random Bible verse in English or Portuguese.",
        width: 480,
        height: 260,
        params: [
            {
                key: "lang",
                label: "Language",
                options: [
                    { id: "en", label: "EN" },
                    { id: "pt", label: "PT" },
                ],
                default: "en",
            },
        ],
    },
    {
        id: "images",
        title: "Image Rotator",
        description:
            "Cross-fades through a list of images on a timer (set ?src= to a comma-separated list).",
        width: 480,
        height: 270,
        params: [
            {
                key: "src",
                label: "Images",
                type: "text",
                placeholder: "https://…/a.jpg, https://…/b.jpg",
                default: "",
            },
            {
                key: "orient",
                label: "Orientation",
                options: [
                    { id: "landscape", label: "Landscape" },
                    { id: "portrait", label: "Portrait" },
                ],
                default: "landscape",
            },
            {
                key: "mode",
                label: "Order",
                options: [
                    { id: "sequential", label: "Sequential" },
                    { id: "random", label: "Random" },
                ],
                default: "sequential",
            },
            {
                key: "every",
                label: "Every",
                options: [
                    { id: "4", label: "4s" },
                    { id: "8", label: "8s" },
                    { id: "12", label: "12s" },
                ],
                default: "8",
            },
            {
                key: "fit",
                label: "Fit",
                options: [
                    { id: "cover", label: "Cover" },
                    { id: "contain", label: "Contain" },
                ],
                default: "cover",
            },
        ],
    },
    {
        id: "progress",
        title: "Progress",
        description:
            "A progress bar for the day, week, year, or a custom value (?value=&max=) or range (?from=&to=).",
        width: 360,
        height: 120,
        params: [
            {
                key: "mode",
                label: "Mode",
                options: [
                    { id: "day", label: "Day" },
                    { id: "week", label: "Week" },
                    { id: "year", label: "Year" },
                    { id: "custom", label: "Custom" },
                ],
                default: "year",
            },
            {
                key: "from",
                label: "From / birthday",
                type: "date",
                default: "",
            },
            {
                key: "years",
                label: "Years",
                type: "text",
                placeholder: "lifespan, e.g. 80",
                default: "",
            },
            {
                key: "label",
                label: "Label",
                type: "text",
                placeholder: "e.g. 2026 goal",
                default: "",
            },
        ],
    },
    {
        id: "onthisday",
        title: "On This Day",
        description:
            "A notable historical event for today's date, sourced from Wikipedia.",
        width: 480,
        height: 220,
        params: [
            {
                key: "type",
                label: "Feed",
                options: [
                    { id: "selected", label: "Featured" },
                    { id: "events", label: "Events" },
                    { id: "births", label: "Births" },
                    { id: "deaths", label: "Deaths" },
                ],
                default: "selected",
            },
        ],
    },
    {
        id: "weather",
        title: "Weather",
        description:
            "Current weather + today's high/low for a place (?city= or ?lat=&lon=).",
        width: 360,
        height: 160,
        params: [
            {
                key: "city",
                label: "City",
                type: "text",
                placeholder: "e.g. Tokyo",
                default: "",
            },
            {
                key: "unit",
                label: "Unit",
                options: [
                    { id: "c", label: "°C" },
                    { id: "f", label: "°F" },
                ],
                default: "c",
            },
        ],
    },
    {
        id: "github",
        title: "GitHub Card",
        description:
            "A GitHub user or repository card with key stats (?user= or ?repo=owner/name).",
        width: 380,
        height: 110,
        params: [
            {
                key: "user",
                label: "User",
                type: "text",
                placeholder: "e.g. vzsoares",
                default: "",
            },
            {
                key: "repo",
                label: "Repo",
                type: "text",
                placeholder: "e.g. vzsoares/open-oembed-widgets",
                default: "",
            },
        ],
    },
    {
        id: "links",
        title: "Button List",
        description:
            "Link buttons that open in a new tab — set ?btns=Text|https://url|hex; separated by ';'.",
        width: 320,
        height: 200,
        params: [
            {
                key: "btns",
                label: "Buttons",
                type: "buttons",
                default: "",
            },
            {
                key: "layout",
                label: "Layout",
                options: [
                    { id: "list", label: "List" },
                    { id: "row", label: "Row" },
                ],
                default: "list",
            },
        ],
    },
    {
        id: "quote",
        title: "Quote",
        description:
            "A quote from a chosen collection (motivation, wisdom, stoic, tech).",
        width: 480,
        height: 220,
        params: [
            {
                key: "collection",
                label: "Collection",
                options: [
                    { id: "motivation", label: "Motivation" },
                    { id: "wisdom", label: "Wisdom" },
                    { id: "stoic", label: "Stoic" },
                    { id: "tech", label: "Tech" },
                ],
                default: "motivation",
            },
        ],
    },
];
