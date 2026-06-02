import type { SeriesPoint } from "../btc/price";

export type { SeriesPoint };

export interface StockDetails {
    price: number;
    change: number;
    changePct: number;
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
    apikey: string;
}

export type FetchLike = (
    input: string | URL | Request,
    init?: RequestInit,
) => Promise<Response>;

export interface FetchOptions {
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

const BASE = "https://finnhub.io/api/v1";
const DEFAULT_TIMEOUT_MS = 8000;

export function parseStockConfig(search: string): StockConfig {
    const p = new URLSearchParams(search);
    return {
        symbol: (p.get("symbol") ?? "AAPL").trim().toUpperCase(),
        apikey: p.get("apikey")?.trim() ?? "",
    };
}

export function rangeToParams(range: string): {
    resolution: string;
    fromOffset: number;
} {
    switch (range) {
        case "1d":
            return { resolution: "5", fromOffset: 86400 };
        case "1w":
            return { resolution: "60", fromOffset: 7 * 86400 };
        case "1m":
            return { resolution: "D", fromOffset: 30 * 86400 };
        case "3m":
            return { resolution: "D", fromOffset: 90 * 86400 };
        case "1y":
            return { resolution: "W", fromOffset: 365 * 86400 };
        default:
            return { resolution: "D", fromOffset: 30 * 86400 };
    }
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function num(v: unknown): number {
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n !== "number" || !Number.isFinite(n))
        throw new Error("expected a finite number");
    return n;
}

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
    symbol: string,
    range: string,
    apikey: string,
    opts: FetchOptions = {},
): Promise<StockSeries> {
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const { resolution, fromOffset } = rangeToParams(range);
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = nowSec - fromOffset;

    const token = encodeURIComponent(apikey);
    const sym = encodeURIComponent(symbol);

    const [candleData, quoteData] = await Promise.all([
        fetchJson(
            `${BASE}/stock/candle?symbol=${sym}&resolution=${resolution}&from=${fromSec}&to=${nowSec}&token=${token}`,
            timeoutMs,
            fetchImpl,
        ),
        fetchJson(
            `${BASE}/quote?symbol=${sym}&token=${token}`,
            timeoutMs,
            fetchImpl,
        ),
    ]);

    if (!isRecord(candleData) || candleData.s !== "ok")
        throw new Error("no candle data for the requested range");
    if (!isRecord(quoteData)) throw new Error("bad quote shape");

    const closes = candleData.c;
    const times = candleData.t;
    if (!Array.isArray(closes) || !Array.isArray(times))
        throw new Error("bad candle shape");

    const points: SeriesPoint[] = closes
        .map((c, i) => {
            const t = times[i];
            if (t === undefined) throw new Error("mismatched candle arrays");
            return { t: num(t) * 1000, p: num(c) };
        })
        .sort((a, b) => a.t - b.t);

    if (points.length < 2) throw new Error("too few candle points");

    const details: StockDetails = {
        price: num(quoteData.c),
        change: num(quoteData.d),
        changePct: num(quoteData.dp),
        high: num(quoteData.h),
        low: num(quoteData.l),
        open: num(quoteData.o),
        prevClose: num(quoteData.pc),
    };

    return { points, source: "Finnhub", fetchedAt: Date.now(), details };
}
