import Alpine from "alpinejs";
import "../../lib/fit";
import { applyThemeFromQuery } from "../../lib/theme";
import type { StockQuote } from "./stocks";
import { fetchQuotes, parseStocksConfig } from "./stocks";

applyThemeFromQuery();

const config = parseStocksConfig(window.location.search);

const priceFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
});

Alpine.data("stocksWidget", () => ({
    hasKey: config.apikey.length > 0,
    quotes: null as StockQuote[] | null,
    loading: true,
    failed: false,
    timer: null as ReturnType<typeof setInterval> | null,

    init() {
        if (!this.hasKey) {
            this.loading = false;
            return;
        }
        void this.load();
        this.timer = setInterval(() => void this.load(), 60_000);
    },

    destroy() {
        if (this.timer !== null) clearInterval(this.timer);
    },

    async load() {
        this.loading = true;
        try {
            this.quotes = await fetchQuotes(config.symbols, config.apikey);
            this.failed = false;
        } catch {
            if (this.quotes === null) this.failed = true;
        } finally {
            this.loading = false;
        }
    },

    priceText(q: StockQuote): string {
        return priceFmt.format(q.price);
    },

    changeText(q: StockQuote): string {
        const sign = q.changePct > 0 ? "+" : q.changePct < 0 ? "−" : "";
        return `${sign}${Math.abs(q.changePct).toFixed(2)}%`;
    },

    direction(q: StockQuote): "up" | "down" | "flat" {
        return q.changePct > 0 ? "up" : q.changePct < 0 ? "down" : "flat";
    },

    arrow(q: StockQuote): string {
        const d = this.direction(q);
        return d === "up" ? "▲" : d === "down" ? "▼" : "—";
    },
}));

Alpine.start();
