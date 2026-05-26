import Alpine from "alpinejs";
import { applyThemeFromQuery } from "../../lib/theme";
import { type BtcQuote, fetchBtcPrice } from "./price";

applyThemeFromQuery();

const REFRESH_MS = 60_000;

type Status = "loading" | "ready" | "error";
type Direction = "up" | "down" | "flat";

interface BtcWidget {
    status: Status;
    quote: BtcQuote | null;
    timer: ReturnType<typeof setInterval> | null;
    init(): void;
    destroy(): void;
    load(): Promise<void>;
    readonly priceText: string;
    readonly changeText: string;
    readonly direction: Direction;
    readonly arrow: string;
    readonly updatedText: string;
}

const priceFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
});

Alpine.data(
    "btcWidget",
    (): BtcWidget => ({
        status: "loading",
        quote: null,
        timer: null,

        init() {
            void this.load();
            this.timer = setInterval(() => void this.load(), REFRESH_MS);
        },

        destroy() {
            if (this.timer !== null) clearInterval(this.timer);
        },

        async load() {
            try {
                this.quote = await fetchBtcPrice();
                this.status = "ready";
            } catch {
                // Keep showing the last good quote if we have one.
                if (this.quote === null) this.status = "error";
            }
        },

        get priceText() {
            return this.quote ? priceFmt.format(this.quote.priceUsd) : "—";
        },

        get changeText() {
            if (!this.quote) return "";
            const v = this.quote.change24hPct;
            const sign = v > 0 ? "+" : v < 0 ? "−" : "";
            return `${sign}${Math.abs(v).toFixed(2)}%`;
        },

        get direction() {
            if (!this.quote) return "flat";
            const v = this.quote.change24hPct;
            return v > 0 ? "up" : v < 0 ? "down" : "flat";
        },

        get arrow() {
            if (this.direction === "up") return "▲";
            if (this.direction === "down") return "▼";
            return "—";
        },

        get updatedText() {
            if (!this.quote) return "";
            const time = new Date(this.quote.fetchedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
            return `${this.quote.source} · ${time}`;
        },
    }),
);

Alpine.start();
