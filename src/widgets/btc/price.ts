export interface SeriesPoint {
    /** Epoch ms. */
    t: number;
    /** Price in the requested vs-currency. */
    p: number;
}

export interface BtcSeries {
    /** Ascending by time; current price is the last point. */
    points: SeriesPoint[];
    /** Which provider answered. */
    source: string;
    /** Epoch ms when fetched. */
    fetchedAt: number;
}

/** Alias used by the generalized ticker; same shape as a BTC series. */
export type CoinSeries = BtcSeries;

/** A coin to chart: a CoinGecko id plus the ticker symbol used by fallbacks. */
export interface Coin {
    /** CoinGecko coin id, e.g. "bitcoin", "ethereum". */
    id: string;
    /** Ticker symbol, e.g. "BTC" — drives the Binance/Coinbase pair. */
    symbol: string;
}

export const BITCOIN: Coin = { id: "bitcoin", symbol: "BTC" };

/**
 * Known coins get reliable Binance/Coinbase fallbacks (their symbols are
 * curated). Any other CoinGecko id still works — it just relies on CoinGecko
 * alone, since we can't be sure the derived symbol matches the exchanges.
 */
export const COINS: Record<string, Coin> = {
    bitcoin: BITCOIN,
    ethereum: { id: "ethereum", symbol: "ETH" },
    solana: { id: "solana", symbol: "SOL" },
    dogecoin: { id: "dogecoin", symbol: "DOGE" },
    cardano: { id: "cardano", symbol: "ADA" },
    ripple: { id: "ripple", symbol: "XRP" },
    litecoin: { id: "litecoin", symbol: "LTC" },
    polkadot: { id: "polkadot", symbol: "DOT" },
    chainlink: { id: "chainlink", symbol: "LINK" },
    binancecoin: { id: "binancecoin", symbol: "BNB" },
    "avalanche-2": { id: "avalanche-2", symbol: "AVAX" },
    tron: { id: "tron", symbol: "TRX" },
};

/** Resolve a coin id to its metadata, falling back to a CoinGecko-only coin. */
export function coinFor(id: string): Coin {
    const key = id.trim().toLowerCase();
    return COINS[key] ?? { id: key, symbol: key.toUpperCase() };
}

export interface SeriesProvider {
    name: string;
    /** Build the request URL for a coin, vs-currency and history window. */
    url(days: number, coin: Coin, vs: string): string;
    /** Normalize a provider's JSON into time/price points. */
    parse(data: unknown): SeriesPoint[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/** Coerce a JSON value to a finite number, or throw. */
function num(value: unknown): number {
    const n = typeof value === "string" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n)) {
        throw new Error("expected a finite number");
    }
    return n;
}

/** Map a window to Binance kline interval/limit (~80–365 points). */
function binanceParams(days: number): { interval: string; limit: number } {
    if (days <= 1) return { interval: "15m", limit: 96 };
    if (days <= 7) return { interval: "2h", limit: days * 12 };
    if (days <= 30) return { interval: "8h", limit: days * 3 };
    if (days <= 90) return { interval: "1d", limit: days };
    return { interval: "1d", limit: Math.min(days, 1000) };
}

/** Map a window to a valid Coinbase candle granularity (seconds). */
function coinbaseGranularity(days: number): number {
    if (days <= 1) return 900;
    if (days <= 7) return 3600;
    if (days <= 30) return 21600;
    return 86400;
}

/** Binance quotes USD markets in USDT; other vs-currencies pass through. */
function binancePair(coin: Coin, vs: string): string {
    const quote = vs === "usd" ? "USDT" : vs.toUpperCase();
    return `${coin.symbol}${quote}`;
}

/**
 * Providers are tried in order; the first success wins. All are public,
 * key-less and CORS-enabled so they work from a static page. Only CoinGecko
 * is guaranteed for arbitrary coins; the exchange fallbacks rely on the
 * curated symbol and quietly fail through for unknown coins.
 */
export const SERIES_PROVIDERS: SeriesProvider[] = [
    {
        name: "CoinGecko",
        url: (days, coin, vs) =>
            `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=${vs}&days=${days}`,
        parse(data) {
            if (!isRecord(data)) throw new Error("bad shape");
            const prices = data.prices;
            if (!Array.isArray(prices)) throw new Error("missing prices");
            return prices.map((row) => {
                if (!Array.isArray(row)) throw new Error("bad row");
                return { t: num(row[0]), p: num(row[1]) };
            });
        },
    },
    {
        name: "Binance",
        url: (days, coin, vs) => {
            const { interval, limit } = binanceParams(days);
            return `https://api.binance.com/api/v3/klines?symbol=${binancePair(coin, vs)}&interval=${interval}&limit=${limit}`;
        },
        parse(data) {
            if (!Array.isArray(data)) throw new Error("bad shape");
            // [openTime, open, high, low, close, ...]
            return data.map((row) => {
                if (!Array.isArray(row)) throw new Error("bad row");
                return { t: num(row[0]), p: num(row[4]) };
            });
        },
    },
    {
        name: "Coinbase",
        url: (days, coin, vs) =>
            `https://api.exchange.coinbase.com/products/${coin.symbol}-${vs.toUpperCase()}/candles?granularity=${coinbaseGranularity(days)}`,
        parse(data) {
            if (!Array.isArray(data)) throw new Error("bad shape");
            // [time(seconds), low, high, open, close, volume]
            return data.map((row) => {
                if (!Array.isArray(row)) throw new Error("bad row");
                return { t: num(row[0]) * 1000, p: num(row[4]) };
            });
        },
    },
];

const DEFAULT_TIMEOUT_MS = 8000;

/** The slice of `fetch` we use — kept minimal so it's trivial to stub. */
export type FetchLike = (
    input: string | URL | Request,
    init?: RequestInit,
) => Promise<Response>;

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

export interface FetchOptions {
    providers?: SeriesProvider[];
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

export interface CoinFetchOptions extends FetchOptions {
    coin: Coin;
    /** vs-currency, e.g. "usd" (default), "eur". */
    vs?: string;
    days: number;
}

/**
 * Fetch a coin's price series for a window, walking the provider chain until
 * one returns a usable series. Points are returned ascending by time.
 */
export async function fetchCoinSeries(
    opts: CoinFetchOptions,
): Promise<CoinSeries> {
    const { coin, days } = opts;
    const vs = (opts.vs ?? "usd").toLowerCase();
    const providers = opts.providers ?? SERIES_PROVIDERS;
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const failures: string[] = [];
    for (const provider of providers) {
        try {
            const data = await fetchJson(
                provider.url(days, coin, vs),
                timeoutMs,
                fetchImpl,
            );
            const points = provider.parse(data).sort((a, b) => a.t - b.t);
            if (points.length < 2) throw new Error("too few points");
            return { points, source: provider.name, fetchedAt: Date.now() };
        } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            failures.push(`${provider.name}: ${reason}`);
        }
    }
    throw new Error(`all series providers failed — ${failures.join("; ")}`);
}

/**
 * Fetch the BTC/USD price series — a thin wrapper over {@link fetchCoinSeries}
 * kept for the bitcoin widget and its tests.
 */
export function fetchBtcSeries(
    days: number,
    opts: FetchOptions = {},
): Promise<BtcSeries> {
    return fetchCoinSeries({ ...opts, coin: BITCOIN, vs: "usd", days });
}
