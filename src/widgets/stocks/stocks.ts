export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePct: number;
    high: number;
    low: number;
    prevClose: number;
}

export type FetchLike = (
    input: string | URL | Request,
    init?: RequestInit,
) => Promise<Response>;

export interface FetchOptions {
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

export interface StocksConfig {
    symbols: string[];
    apikey: string;
}

const BASE = "https://finnhub.io/api/v1";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_SYMBOLS = ["VOO", "EWZ", "NVDA", "AAPL"];

export function parseStocksConfig(search: string): StocksConfig {
    const p = new URLSearchParams(search);
    const raw = p.get("symbols") ?? "";
    const parsed = raw
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    return {
        symbols: parsed.length > 0 ? parsed : DEFAULT_SYMBOLS,
        apikey: p.get("apikey")?.trim() ?? "",
    };
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

export async function fetchQuote(
    symbol: string,
    apikey: string,
    opts: FetchOptions = {},
): Promise<StockQuote> {
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apikey)}`;
    const data = await fetchJson(url, timeoutMs, fetchImpl);
    if (!isRecord(data)) throw new Error("bad shape");
    return {
        symbol,
        price: num(data.c),
        change: num(data.d),
        changePct: num(data.dp),
        high: num(data.h),
        low: num(data.l),
        prevClose: num(data.pc),
    };
}

export async function fetchQuotes(
    symbols: string[],
    apikey: string,
    opts: FetchOptions = {},
): Promise<StockQuote[]> {
    const results = await Promise.allSettled(
        symbols.map((s) => fetchQuote(s, apikey, opts)),
    );
    const quotes = results
        .filter(
            (r): r is PromiseFulfilledResult<StockQuote> =>
                r.status === "fulfilled",
        )
        .map((r) => r.value);
    if (quotes.length === 0) throw new Error("all quote fetches failed");
    return quotes;
}
