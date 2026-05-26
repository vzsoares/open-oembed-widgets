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

/** A configurable widget option surfaced as a query param + gallery selector. */
export interface WidgetParam {
    /** Query-param name, e.g. "range" or "lang". */
    key: string;
    /** Gallery label, e.g. "Range". */
    label: string;
    options: ParamOption[];
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
];
