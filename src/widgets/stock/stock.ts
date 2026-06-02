import type { SeriesPoint } from "../btc/price";

export type { SeriesPoint };

export interface StockDetails {
    price: number;
    high: number;
    low: number;
    open: number;
    prevClose: number;
}

export interface StockSeries {
    points: SeriesPoint[];
    source: string;
    fetchedAt: number;
    details: StockDetails;
}

export interface StockConfig {
    symbol: string;
    /** Alpha Vantage key (25 req/day free). */
    avkey: string;
    /** Twelve Data key (800 credits/day free). */
    tdkey: string;
}

export type FetchLike = (
    input: string | URL | Request,
    init?: RequestInit,
) => Promise<Response>;

export interface FetchOptions {
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

interface ParseResult {
    points: SeriesPoint[];
    details: StockDetails;
}

export interface StockProvider {
    name: string;
    url(symbol: string, range: string, apikey: string): string;
    parse(data: unknown, range: string): ParseResult;
}

const DEFAULT_TIMEOUT_MS = 8000;

export function parseStockConfig(search: string): StockConfig {
    const p = new URLSearchParams(search);
    return {
        symbol: (p.get("symbol") ?? "AAPL").trim().toUpperCase(),
        avkey: p.get("avkey")?.trim() ?? "",
        tdkey: p.get("tdkey")?.trim() ?? "",
    };
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function str(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function parseNum(v: unknown): number {
    const n = parseFloat(str(v));
    if (!Number.isFinite(n)) throw new Error("expected a finite number");
    return n;
}

// ── Alpha Vantage ─────────────────────────────────────────────────────────────

function avRangeParams(range: string): {
    func: string;
    seriesKey: string;
    sliceSize: number;
} {
    switch (range) {
        case "1w":
            return {
                func: "TIME_SERIES_DAILY",
                seriesKey: "Time Series (Daily)",
                sliceSize: 7,
            };
        case "1m":
            return {
                func: "TIME_SERIES_DAILY",
                seriesKey: "Time Series (Daily)",
                sliceSize: 30,
            };
        case "3m":
            return {
                func: "TIME_SERIES_DAILY",
                seriesKey: "Time Series (Daily)",
                sliceSize: 90,
            };
        case "1y":
            return {
                func: "TIME_SERIES_WEEKLY",
                seriesKey: "Weekly Time Series",
                sliceSize: 52,
            };
        default:
            return {
                func: "TIME_SERIES_DAILY",
                seriesKey: "Time Series (Daily)",
                sliceSize: 30,
            };
    }
}

const alphaVantage: StockProvider = {
    name: "Alpha Vantage",

    url(symbol, range, apikey) {
        const { func } = avRangeParams(range);
        const outputsize =
            func === "TIME_SERIES_DAILY" ? "&outputsize=compact" : "";
        return `https://www.alphavantage.co/query?function=${func}&symbol=${encodeURIComponent(symbol)}${outputsize}&apikey=${encodeURIComponent(apikey)}`;
    },

    parse(data, range) {
        if (!isRecord(data)) throw new Error("bad shape");
        if (typeof data.Note === "string") throw new Error(data.Note);
        if (typeof data.Information === "string")
            throw new Error(data.Information);

        const { seriesKey, sliceSize } = avRangeParams(range);
        const series = data[seriesKey];
        if (!isRecord(series)) throw new Error(`missing "${seriesKey}"`);

        const dates = Object.keys(series)
            .sort((a, b) => b.localeCompare(a))
            .slice(0, sliceSize);
        if (dates.length < 2) throw new Error("too few data points");

        const points: SeriesPoint[] = dates
            .slice()
            .reverse()
            .map((date) => {
                const entry = series[date];
                if (!isRecord(entry)) throw new Error("bad entry shape");
                return {
                    t: new Date(date).getTime(),
                    p: parseNum(entry["4. close"]),
                };
            });

        const latestDate = dates[0];
        const prevDate = dates[1];
        if (!latestDate || !prevDate) throw new Error("too few data points");
        const latest = series[latestDate];
        const prev = series[prevDate];
        if (!isRecord(latest) || !isRecord(prev))
            throw new Error("bad entry shape");

        return {
            points,
            details: {
                price: parseNum(latest["4. close"]),
                high: parseNum(latest["2. high"]),
                low: parseNum(latest["3. low"]),
                open: parseNum(latest["1. open"]),
                prevClose: parseNum(prev["4. close"]),
            },
        };
    },
};

// ── Twelve Data ───────────────────────────────────────────────────────────────

function tdRangeParams(range: string): {
    interval: string;
    outputsize: number;
} {
    switch (range) {
        case "1w":
            return { interval: "1day", outputsize: 7 };
        case "1m":
            return { interval: "1day", outputsize: 30 };
        case "3m":
            return { interval: "1day", outputsize: 90 };
        case "1y":
            return { interval: "1week", outputsize: 52 };
        default:
            return { interval: "1day", outputsize: 30 };
    }
}

const twelveData: StockProvider = {
    name: "Twelve Data",

    url(symbol, range, apikey) {
        const { interval, outputsize } = tdRangeParams(range);
        return `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${encodeURIComponent(apikey)}`;
    },

    parse(data) {
        if (!isRecord(data)) throw new Error("bad shape");
        if (data.status !== "ok")
            throw new Error(
                typeof data.message === "string" ? data.message : "no data",
            );

        const values = data.values;
        if (!Array.isArray(values) || values.length < 2)
            throw new Error("too few data points");

        const ascending = [...values].reverse();

        const points: SeriesPoint[] = ascending.map((v) => {
            if (!isRecord(v)) throw new Error("bad value shape");
            return {
                t: new Date(str(v.datetime)).getTime(),
                p: parseNum(v.close),
            };
        });

        const latest = values[0];
        const prev = values[1];
        if (!isRecord(latest) || !isRecord(prev))
            throw new Error("bad value shape");

        return {
            points,
            details: {
                price: parseNum(latest.close),
                high: parseNum(latest.high),
                low: parseNum(latest.low),
                open: parseNum(latest.open),
                prevClose: parseNum(prev.close),
            },
        };
    },
};

export const STOCK_PROVIDERS: StockProvider[] = [alphaVantage, twelveData];

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchJson(
    url: string,
    timeoutMs: number,
    fetchImpl: FetchLike,
): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetchImpl(url, {
            signal: controller.signal,
            headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

export async function fetchStockSeries(
    config: StockConfig,
    range: string,
    opts: FetchOptions = {},
): Promise<StockSeries> {
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const keyed: Array<{ provider: StockProvider; apikey: string }> = [
        { provider: alphaVantage, apikey: config.avkey },
        { provider: twelveData, apikey: config.tdkey },
    ].filter((p) => p.apikey.length > 0);

    if (keyed.length === 0) throw new Error("no API key configured");

    const failures: string[] = [];
    for (const { provider, apikey } of keyed) {
        try {
            const data = await fetchJson(
                provider.url(config.symbol, range, apikey),
                timeoutMs,
                fetchImpl,
            );
            const { points, details } = provider.parse(data, range);
            return {
                points,
                details,
                source: provider.name,
                fetchedAt: Date.now(),
            };
        } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            failures.push(`${provider.name}: ${reason}`);
        }
    }

    throw new Error(`all providers failed — ${failures.join("; ")}`);
}
