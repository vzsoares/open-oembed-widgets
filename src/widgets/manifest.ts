export interface RangeOption {
    /** Query-param value and selector id. */
    id: string;
    /** Short label shown on the selector (e.g. "1M"). */
    label: string;
    /** History window in days. */
    days: number;
}

export interface WidgetDef {
    /** URL slug and output folder name (e.g. "btc" -> /btc/). */
    id: string;
    title: string;
    description: string;
    /** Default embed dimensions in px, advertised via oEmbed. */
    width: number;
    height: number;
    /** Optional time-range selector (chart widgets). */
    ranges?: RangeOption[];
    /** Default range id when none is given via `?range=`. */
    defaultRange?: string;
}

export const btcRanges: RangeOption[] = [
    { id: "1d", label: "1D", days: 1 },
    { id: "1w", label: "1W", days: 7 },
    { id: "1m", label: "1M", days: 30 },
    { id: "3m", label: "3M", days: 90 },
    { id: "1y", label: "1Y", days: 365 },
];

/** Single source of truth: the gallery, previews and oEmbed JSON all use it. */
export const widgets: WidgetDef[] = [
    {
        id: "btc",
        title: "Bitcoin Price",
        description:
            "Live BTC/USD price with a configurable price chart (1D–1Y).",
        width: 480,
        height: 280,
        ranges: btcRanges,
        defaultRange: "1m",
    },
];
