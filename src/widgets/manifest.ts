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

/** Stock ranges — only daily/weekly resolutions (Finnhub free tier). */
export const stockRanges: RangeOption[] = [
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
export type ParamType =
    | "select"
    | "datetime"
    | "date"
    | "text"
    | "buttons"
    | "urls";

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
    /**
     * Whether the widget may scale to fill its box (opt-in per embed via
     * `?fit=1`). `false` marks text-flow widgets (verses, quotes) that should
     * never scale — they fill the width and wrap at a readable size instead.
     */
    fit?: boolean;
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
        id: "ticker",
        title: "Crypto Ticker",
        description:
            "Live price + chart for any coin (set ?coin=ethereum&vs=usd).",
        width: 480,
        height: 280,
        params: [
            {
                key: "coin",
                label: "Coin",
                type: "text",
                placeholder: "e.g. ethereum, solana",
                default: "ethereum",
            },
            {
                key: "vs",
                label: "Currency",
                type: "text",
                placeholder: "usd",
                default: "usd",
            },
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
        id: "worldclock",
        title: "World Clock",
        description:
            "Several timezones at once (set ?tz=America/Sao_Paulo,Europe/London,Asia/Tokyo).",
        width: 360,
        height: 260,
        params: [
            {
                key: "tz",
                label: "Zones",
                type: "text",
                placeholder: "Area/City,Area/City,…",
                default: "",
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
            {
                key: "seconds",
                label: "Seconds",
                options: [
                    { id: "0", label: "Off" },
                    { id: "1", label: "On" },
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
        id: "counter",
        title: "Day Counter",
        description:
            "Counts the whole days since or until a date (set ?date=2026-01-01).",
        width: 360,
        height: 180,
        params: [
            {
                key: "mode",
                label: "Mode",
                options: [
                    { id: "auto", label: "Auto" },
                    { id: "until", label: "Until" },
                    { id: "since", label: "Since" },
                ],
                default: "auto",
            },
            {
                key: "date",
                label: "Date",
                type: "date",
                default: "",
            },
            {
                key: "label",
                label: "Label",
                type: "text",
                placeholder: "e.g. New Year",
                default: "",
            },
        ],
    },
    {
        id: "moon",
        title: "Moon Phase",
        description:
            "The current moon phase + illumination, computed from the date (no API).",
        width: 260,
        height: 280,
        params: [
            {
                key: "date",
                label: "Date",
                type: "date",
                default: "",
            },
        ],
    },
    {
        id: "nameday",
        title: "Name Day",
        description:
            "Today's name day(s) for a locale, from a bundled calendar (no API).",
        width: 360,
        height: 180,
        params: [
            {
                key: "lang",
                label: "Locale",
                options: [
                    { id: "cz", label: "CZ" },
                    { id: "sk", label: "SK" },
                    { id: "fr", label: "FR" },
                    { id: "it", label: "IT" },
                    { id: "es", label: "ES" },
                    { id: "en", label: "EN" },
                ],
                default: "cz",
            },
        ],
    },
    {
        id: "bible",
        title: "Bible Verse",
        description: "A random Bible verse in English or Portuguese.",
        width: 480,
        height: 260,
        fit: false,
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
                type: "urls",
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
        fit: false,
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
        fit: false,
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
    {
        id: "stocks",
        title: "Stocks Ticker",
        description:
            "Live prices for multiple stocks/ETFs with up/down indicators. Requires a free Finnhub API key (?symbols=NVDA,AAPL,MSFT,SPY&apikey=…).",
        width: 380,
        height: 220,
        params: [
            {
                key: "symbols",
                label: "Symbols",
                type: "text",
                placeholder: "e.g. NVDA,AAPL,MSFT,SPY",
                default: "NVDA,AAPL,MSFT,SPY",
            },
            {
                key: "apikey",
                label: "API Key",
                type: "text",
                placeholder: "finnhub.io free key",
                default: "",
            },
        ],
    },
    {
        id: "stock",
        title: "Stock Chart",
        description:
            "Live price chart for any stock or ETF with a configurable range. Tries Alpha Vantage then Twelve Data — set at least one key (?symbol=AAPL&avkey=…&tdkey=…).",
        width: 480,
        height: 280,
        params: [
            {
                key: "symbol",
                label: "Symbol",
                type: "text",
                placeholder: "e.g. AAPL, NVDA, SPY",
                default: "AAPL",
            },
            {
                key: "range",
                label: "Range",
                options: stockRanges.map((r) => ({ id: r.id, label: r.label })),
                default: "1m",
            },
            {
                key: "avkey",
                label: "AV Key",
                type: "text",
                placeholder: "alphavantage.co key",
                default: "",
            },
            {
                key: "tdkey",
                label: "TD Key",
                type: "text",
                placeholder: "twelvedata.com key",
                default: "",
            },
        ],
    },
];
