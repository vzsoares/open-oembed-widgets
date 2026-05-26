export interface BtcQuote {
    priceUsd: number;
    change24hPct: number;
    /** Which provider answered. */
    source: string;
    /** Epoch ms when the quote was fetched. */
    fetchedAt: number;
}

export interface PriceProvider {
    name: string;
    url: string;
    /** Normalize a provider's JSON into a price + 24h change. */
    parse(data: unknown): { priceUsd: number; change24hPct: number };
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

function pctChange(last: number, open: number): number {
    return open === 0 ? 0 : ((last - open) / open) * 100;
}

/**
 * Providers are tried in order; the first success wins. All are public,
 * key-less and CORS-enabled so they work from a static page.
 */
export const PROVIDERS: PriceProvider[] = [
    {
        name: "CoinGecko",
        url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
        parse(data) {
            if (!isRecord(data)) throw new Error("bad shape");
            const b = data.bitcoin;
            if (!isRecord(b)) throw new Error("missing bitcoin");
            return {
                priceUsd: num(b.usd),
                change24hPct: num(b.usd_24h_change),
            };
        },
    },
    {
        name: "Binance",
        url: "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
        parse(data) {
            if (!isRecord(data)) throw new Error("bad shape");
            return {
                priceUsd: num(data.lastPrice),
                change24hPct: num(data.priceChangePercent),
            };
        },
    },
    {
        name: "Coinbase",
        url: "https://api.exchange.coinbase.com/products/BTC-USD/stats",
        parse(data) {
            if (!isRecord(data)) throw new Error("bad shape");
            const last = num(data.last);
            return {
                priceUsd: last,
                change24hPct: pctChange(last, num(data.open)),
            };
        },
    },
    {
        name: "Kraken",
        url: "https://api.kraken.com/0/public/Ticker?pair=XBTUSD",
        parse(data) {
            if (!isRecord(data)) throw new Error("bad shape");
            const result = data.result;
            if (!isRecord(result)) throw new Error("missing result");
            const ticker = Object.values(result)[0];
            if (!isRecord(ticker)) throw new Error("missing ticker");
            const close = ticker.c;
            const last = num(Array.isArray(close) ? close[0] : undefined);
            return {
                priceUsd: last,
                change24hPct: pctChange(last, num(ticker.o)),
            };
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
    providers?: PriceProvider[];
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

/**
 * Fetch the BTC/USD quote, walking the provider chain until one succeeds.
 * Throws only when every provider fails.
 */
export async function fetchBtcPrice(
    opts: FetchOptions = {},
): Promise<BtcQuote> {
    const providers = opts.providers ?? PROVIDERS;
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const failures: string[] = [];
    for (const provider of providers) {
        try {
            const data = await fetchJson(provider.url, timeoutMs, fetchImpl);
            const { priceUsd, change24hPct } = provider.parse(data);
            return {
                priceUsd,
                change24hPct,
                source: provider.name,
                fetchedAt: Date.now(),
            };
        } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            failures.push(`${provider.name}: ${reason}`);
        }
    }
    throw new Error(`all price providers failed — ${failures.join("; ")}`);
}
