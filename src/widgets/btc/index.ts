import Alpine from "alpinejs";
import "../../lib/fit";
import { applyThemeFromQuery } from "../../lib/theme";
import { btcRanges, type RangeOption } from "../manifest";
import { buildChartPaths, type ChartPaths, chartPoints } from "./chart";
import { type BtcSeries, fetchBtcSeries } from "./price";

applyThemeFromQuery();

const REFRESH_MS = 60_000;
const DEFAULT_RANGE = "1m";
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

const priceFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
});

const dateFmt = new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

function initialRange(): string {
    const param = new URLSearchParams(window.location.search).get("range");
    if (param && btcRanges.some((r) => r.id === param)) return param;
    return DEFAULT_RANGE;
}

function daysFor(range: string): number {
    return btcRanges.find((r) => r.id === range)?.days ?? 30;
}

interface BtcWidget {
    ranges: RangeOption[];
    range: string;
    series: BtcSeries | null;
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

Alpine.data(
    "btcWidget",
    (): BtcWidget => ({
        ranges: btcRanges,
        range: initialRange(),
        series: null,
        loading: true,
        failed: false,
        hoverIndex: null,
        timer: null,

        init() {
            void this.load();
            this.timer = setInterval(() => void this.load(), REFRESH_MS);
        },

        destroy() {
            if (this.timer !== null) clearInterval(this.timer);
        },

        async load() {
            this.loading = true;
            try {
                this.series = await fetchBtcSeries(daysFor(this.range));
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
            return last ? priceFmt.format(last.p) : "—";
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
                priceText: priceFmt.format(point.p),
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
    }),
);

Alpine.start();
