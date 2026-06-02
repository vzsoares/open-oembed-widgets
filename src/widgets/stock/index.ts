import Alpine from "alpinejs";
import "../../lib/fit";
import { applyThemeFromQuery } from "../../lib/theme";
import { buildChartPaths, type ChartPaths, chartPoints } from "../btc/chart";
import { type RangeOption, stockRanges } from "../manifest";
import type { SeriesPoint, StockSeries } from "./stock";
import { fetchStockSeries, parseStockConfig } from "./stock";

applyThemeFromQuery();

const config = parseStockConfig(window.location.search);
const rangeParam =
    new URLSearchParams(window.location.search).get("range") ?? "1m";
const initialRange = stockRanges.some((r) => r.id === rangeParam)
    ? rangeParam
    : "1m";

const VIEW_W = 300;
const VIEW_H = 96;

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

Alpine.data("stockWidget", () => ({
    hasKey: config.avkey.length > 0 || config.tdkey.length > 0,
    symbol: config.symbol,
    ranges: stockRanges as RangeOption[],
    range: initialRange,
    series: null as StockSeries | null,
    loading: true,
    failed: false,
    hoverIndex: null as number | null,
    timer: null as ReturnType<typeof setInterval> | null,

    init() {
        if (!this.hasKey) {
            this.loading = false;
            return;
        }
        void this.load();
        this.timer = setInterval(() => void this.load(), 3_600_000);
    },

    destroy() {
        if (this.timer !== null) clearInterval(this.timer);
    },

    async load() {
        this.loading = true;
        try {
            this.series = await fetchStockSeries(config, this.range);
            this.failed = false;
        } catch {
            if (this.series === null) this.failed = true;
        } finally {
            this.loading = false;
        }
    },

    setRange(id: string) {
        if (id === this.range) return;
        this.range = id;
        this.series = null;
        this.failed = false;
        this.hoverIndex = null;
        void this.load();
    },

    onHover(event: MouseEvent) {
        const pts = this.series?.points;
        const target = event.currentTarget;
        if (!pts || pts.length === 0 || !(target instanceof HTMLElement))
            return;
        const rect = target.getBoundingClientRect();
        const frac =
            rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
        this.hoverIndex = Math.round(
            Math.min(1, Math.max(0, frac)) * (pts.length - 1),
        );
    },

    get priceText(): string {
        const d = this.series?.details;
        return d ? priceFmt.format(d.price) : "—";
    },

    get changePct(): number {
        const pts = this.series?.points ?? [];
        const first = pts[0];
        const last = pts[pts.length - 1];
        if (!first || !last || first.p === 0) return 0;
        return ((last.p - first.p) / first.p) * 100;
    },

    get changeText(): string {
        const v = this.changePct;
        const sign = v > 0 ? "+" : v < 0 ? "−" : "";
        return `${sign}${Math.abs(v).toFixed(2)}%`;
    },

    get direction(): "up" | "down" | "flat" {
        const v = this.changePct;
        return v > 0 ? "up" : v < 0 ? "down" : "flat";
    },

    get arrow(): string {
        if (this.direction === "up") return "▲";
        if (this.direction === "down") return "▼";
        return "—";
    },

    get highLowText(): string {
        const d = this.series?.details;
        if (!d) return "";
        return `H ${priceFmt.format(d.high)}  ·  L ${priceFmt.format(d.low)}`;
    },

    get chart(): ChartPaths {
        const pts = this.series?.points;
        if (!pts) return { line: "", area: "" };
        return buildChartPaths(pts.map((pt: SeriesPoint) => pt.p));
    },

    get hover(): {
        xPct: number;
        yPct: number;
        priceText: string;
        dateText: string;
    } | null {
        const pts = this.series?.points;
        if (!pts || this.hoverIndex === null) return null;
        const i = Math.min(Math.max(this.hoverIndex, 0), pts.length - 1);
        const point = pts[i];
        const coords = chartPoints(
            pts.map((pt: SeriesPoint) => pt.p),
            VIEW_W,
            VIEW_H,
        );
        const coord = coords[i];
        if (!point || !coord) return null;
        return {
            xPct: (coord.x / VIEW_W) * 100,
            yPct: (coord.y / VIEW_H) * 100,
            priceText: priceFmt.format(point.p),
            dateText: dateFmt.format(new Date(point.t)),
        };
    },

    get updatedText(): string {
        if (this.series && this.loading) return "updating…";
        if (!this.series) return "";
        const time = new Date(this.series.fetchedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${this.series.source} · ${time}`;
    },
}));

Alpine.start();
