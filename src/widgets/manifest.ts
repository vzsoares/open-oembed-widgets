export interface WidgetDef {
    /** URL slug and output folder name (e.g. "btc" -> /btc/). */
    id: string;
    title: string;
    description: string;
    /** Default embed dimensions in px, advertised via oEmbed. */
    width: number;
    height: number;
}

/** Single source of truth: the gallery, previews and oEmbed JSON all use it. */
export const widgets: WidgetDef[] = [
    {
        id: "btc",
        title: "Bitcoin Price",
        description:
            "Live BTC/USD price and 24h change. Refreshes every minute.",
        width: 420,
        height: 180,
    },
];
