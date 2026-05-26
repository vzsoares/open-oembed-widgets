import Alpine from "alpinejs";
import { applyThemeFromQuery } from "../../lib/theme";
import { btcRanges, type RangeOption } from "../manifest";
import { buildChartPaths, type ChartPaths } from "./chart";
import { type BtcSeries, fetchBtcSeries } from "./price";

applyThemeFromQuery();

const REFRESH_MS = 60_000;
const DEFAULT_RANGE = "1m";

type Direction = "up" | "down" | "flat";

const priceFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
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
    timer: ReturnType<typeof setInterval> | null;
    init(): void;
    destroy(): void;
    load(): Promise<void>;
    setRange(id: string): void;
    readonly priceText: string;
    readonly changePct: number;
    readonly changeText: string;
    readonly direction: Direction;
    readonly arrow: string;
    readonly chart: ChartPaths;
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
            void this.load();
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
