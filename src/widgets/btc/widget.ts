import type { RangeOption } from "../manifest";
import { buildChartPaths, type ChartPaths, chartPoints } from "./chart";
import { type Coin, type CoinSeries, fetchCoinSeries } from "./price";

/** Shared price-ticker widget powering both `/btc/` and the general `/ticker/`. */

const VIEW_W = 300;
const VIEW_H = 96;

type Direction = "up" | "down" | "flat";

interface HoverInfo {
    /** Position on the chart, as a percentage of its box. */
    xPct: number;
    yPct: number;
    priceText: string;
    dateText: string;
}

export interface TickerConfig {
    coin: Coin;
    /** vs-currency, e.g. "usd". */
    vs: string;
    /** Header label, e.g. "BTC / USD". */
    label: string;
    ranges: RangeOption[];
    initialRange: string;
    refreshMs: number;
}

export interface TickerWidget {
    label: string;
    ranges: RangeOption[];
    range: string;
    series: CoinSeries | null;
    loading: boolean;
    failed: boolean;
    hoverIndex: number | null;
    timer: ReturnType<typeof setInterval> | null;
    init(): void;
    destroy(): void;
    load(): Promise<void>;
    setRange(id: string): void;
    onHover(event: MouseEvent): void;
    readonly priceText: string;
    readonly changePct: number;
    readonly changeText: string;
    readonly direction: Direction;
    readonly arrow: string;
    readonly chart: ChartPaths;
    readonly hover: HoverInfo | null;
    readonly updatedText: string;
}

/** The selected range's window in days (defaults to 30). */
export function daysFor(ranges: RangeOption[], id: string): number {
    return ranges.find((r) => r.id === id)?.days ?? 30;
}

/** Resolve the initial range from `?range=`, falling back to the default. */
export function initialRange(
    search: string,
    ranges: RangeOption[],
    fallback: string,
): string {
    const param = new URLSearchParams(search).get("range");
    if (param && ranges.some((r) => r.id === param)) return param;
    return fallback;
}

/**
 * Build a currency formatter for the vs-currency. Falls back to a plain decimal
 * with the code appended when the currency isn't a valid ISO 4217 code (e.g. a
 * crypto vs-currency like `btc`), so we never throw on an exotic `?vs=`.
 */
function makePriceFmt(vs: string): (n: number) => string {
    try {
        const fmt = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: vs.toUpperCase(),
            maximumFractionDigits: 2,
        });
        return (n) => fmt.format(n);
    } catch {
        const fmt = new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 8,
        });
        return (n) => `${fmt.format(n)} ${vs.toUpperCase()}`;
    }
}

const dateFmt = new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

/** Build the Alpine data object for a price ticker. */
export function createTicker(config: TickerConfig): TickerWidget {
    const priceFmt = makePriceFmt(config.vs);

    return {
        label: config.label,
        ranges: config.ranges,
        range: config.initialRange,
        series: null,
        loading: true,
        failed: false,
        hoverIndex: null,
        timer: null,

        init() {
            void this.load();
            this.timer = setInterval(() => void this.load(), config.refreshMs);
        },

        destroy() {
            if (this.timer !== null) clearInterval(this.timer);
        },

        async load() {
            this.loading = true;
            try {
                this.series = await fetchCoinSeries({
                    coin: config.coin,
                    vs: config.vs,
                    days: daysFor(this.ranges, this.range),
                });
                this.failed = false;
            } catch {
                if (this.series === null) this.failed = true;
            } finally {
                this.loading = false;
            }
        },

        setRange(id) {
            if (id === this.range) return;
            this.range = id;
            this.series = null; // show the skeleton while the new window loads
            this.failed = false;
            this.hoverIndex = null;
            void this.load();
        },

        onHover(event) {
            const pts = this.series?.points;
            const target = event.currentTarget;
            if (!pts || pts.length === 0 || !(target instanceof HTMLElement)) {
                return;
            }
            const rect = target.getBoundingClientRect();
            const frac =
                rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
            const clamped = Math.min(1, Math.max(0, frac));
            this.hoverIndex = Math.round(clamped * (pts.length - 1));
        },

        get priceText() {
            const pts = this.series?.points ?? [];
            const last = pts[pts.length - 1];
            return last ? priceFmt(last.p) : "—";
        },

        get changePct() {
            const pts = this.series?.points ?? [];
            const first = pts[0];
            const last = pts[pts.length - 1];
            if (!first || !last || first.p === 0) return 0;
            return ((last.p - first.p) / first.p) * 100;
        },

        get changeText() {
            const v = this.changePct;
            const sign = v > 0 ? "+" : v < 0 ? "−" : "";
            return `${sign}${Math.abs(v).toFixed(2)}%`;
        },

        get direction() {
            const v = this.changePct;
            return v > 0 ? "up" : v < 0 ? "down" : "flat";
        },

        get arrow() {
            if (this.direction === "up") return "▲";
            if (this.direction === "down") return "▼";
            return "—";
        },

        get chart() {
            const pts = this.series?.points;
            if (!pts) return { line: "", area: "" };
            return buildChartPaths(pts.map((pt) => pt.p));
        },

        get hover() {
            const pts = this.series?.points;
            if (!pts || this.hoverIndex === null) return null;
            const i = Math.min(Math.max(this.hoverIndex, 0), pts.length - 1);
            const point = pts[i];
            const coord = chartPoints(
                pts.map((pt) => pt.p),
                VIEW_W,
                VIEW_H,
            )[i];
            if (!point || !coord) return null;
            return {
                xPct: (coord.x / VIEW_W) * 100,
                yPct: (coord.y / VIEW_H) * 100,
                priceText: priceFmt(point.p),
                dateText: dateFmt.format(new Date(point.t)),
            };
        },

        get updatedText() {
            if (this.series && this.loading) return "updating…";
            if (!this.series) return "";
            const time = new Date(this.series.fetchedAt).toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit",
                },
            );
            return `${this.series.source} · ${time}`;
        },
    };
}
