import { describe, expect, test } from "vitest";
import {
    type FetchLike,
    fetchStockSeries,
    parseStockConfig,
    STOCK_PROVIDERS,
    type StockProvider,
} from "./stock";

function jsonFetch(body: unknown, status = 200): FetchLike {
    return async () => new Response(JSON.stringify(body), { status });
}

function provider(name: string): StockProvider {
    const found = STOCK_PROVIDERS.find((p) => p.name === name);
    if (!found) throw new Error(`no provider named ${name}`);
    return found;
}

const AV_SERIES = {
    "Meta Data": { "1. Information": "Daily", "2. Symbol": "AAPL" },
    "Time Series (Daily)": {
        "2024-05-30": {
            "1. open": "213.9",
            "2. high": "215.5",
            "3. low": "213.1",
            "4. close": "214.32",
            "5. volume": "1100",
        },
        "2024-05-29": {
            "1. open": "211.0",
            "2. high": "212.0",
            "3. low": "210.5",
            "4. close": "211.5",
            "5. volume": "1200",
        },
        "2024-05-28": {
            "1. open": "209.5",
            "2. high": "211.0",
            "3. low": "209.0",
            "4. close": "210.0",
            "5. volume": "1000",
        },
    },
};

const TD_SERIES = {
    meta: { symbol: "AAPL", interval: "1day", currency: "USD" },
    values: [
        {
            datetime: "2024-05-30",
            open: "213.9",
            high: "215.5",
            low: "213.1",
            close: "214.32",
            volume: "1100",
        },
        {
            datetime: "2024-05-29",
            open: "211.0",
            high: "212.0",
            low: "210.5",
            close: "211.5",
            volume: "1200",
        },
        {
            datetime: "2024-05-28",
            open: "209.5",
            high: "211.0",
            low: "209.0",
            close: "210.0",
            volume: "1000",
        },
    ],
    status: "ok",
};

describe("parseStockConfig", () => {
    test("defaults to AAPL and empty keys", () => {
        const c = parseStockConfig("");
        expect(c.symbol).toBe("AAPL");
        expect(c.avkey).toBe("");
        expect(c.tdkey).toBe("");
    });

    test("parses symbol and both keys", () => {
        const c = parseStockConfig("?symbol=NVDA&avkey=av123&tdkey=td456");
        expect(c.symbol).toBe("NVDA");
        expect(c.avkey).toBe("av123");
        expect(c.tdkey).toBe("td456");
    });

    test("uppercases symbol", () => {
        expect(parseStockConfig("?symbol=msft").symbol).toBe("MSFT");
    });
});

describe("Alpha Vantage provider", () => {
    const av = provider("Alpha Vantage");

    test("parses daily series with ascending points", () => {
        const { points, details } = av.parse(AV_SERIES, "1m");
        expect(points).toHaveLength(3);
        const first = points[0];
        const last = points[points.length - 1];
        if (first && last) expect(first.t).toBeLessThan(last.t);
        expect(details.price).toBe(214.32);
        expect(details.high).toBe(215.5);
        expect(details.prevClose).toBe(211.5);
    });

    test("slices to the requested range size", () => {
        const { points } = av.parse(AV_SERIES, "1w");
        expect(points.length).toBeLessThanOrEqual(7);
    });

    test("throws on rate-limit Note", () => {
        expect(() =>
            av.parse({ Note: "API call frequency limit reached." }, "1m"),
        ).toThrow("API call frequency limit");
    });

    test("throws on Information key (invalid key)", () => {
        expect(() =>
            av.parse({ Information: "Invalid API key." }, "1m"),
        ).toThrow("Invalid API key");
    });
});

describe("Twelve Data provider", () => {
    const td = provider("Twelve Data");

    test("parses time series with ascending points", () => {
        const { points, details } = td.parse(TD_SERIES, "1m");
        expect(points).toHaveLength(3);
        const first = points[0];
        const last = points[points.length - 1];
        if (first && last) expect(first.t).toBeLessThan(last.t);
        expect(details.price).toBe(214.32);
        expect(details.prevClose).toBe(211.5);
    });

    test("throws when status is not ok", () => {
        expect(() =>
            td.parse({ status: "error", message: "Invalid API key." }, "1m"),
        ).toThrow("Invalid API key");
    });
});

describe("fetchStockSeries fallback chain", () => {
    const avConfig = {
        symbol: "AAPL",
        avkey: "avkey",
        tdkey: "",
    };
    const tdConfig = { symbol: "AAPL", avkey: "", tdkey: "tdkey" };
    const bothConfig = { symbol: "AAPL", avkey: "avkey", tdkey: "tdkey" };

    test("uses Alpha Vantage when only avkey is set", async () => {
        const s = await fetchStockSeries(avConfig, "1m", {
            fetchImpl: jsonFetch(AV_SERIES),
        });
        expect(s.source).toBe("Alpha Vantage");
    });

    test("uses Twelve Data when only tdkey is set", async () => {
        const s = await fetchStockSeries(tdConfig, "1m", {
            fetchImpl: jsonFetch(TD_SERIES),
        });
        expect(s.source).toBe("Twelve Data");
    });

    test("falls through to Twelve Data when Alpha Vantage fails", async () => {
        let call = 0;
        const fetchImpl: FetchLike = async () => {
            call++;
            if (call === 1)
                return new Response(
                    JSON.stringify({ Note: "rate limit reached" }),
                    { status: 200 },
                );
            return new Response(JSON.stringify(TD_SERIES), { status: 200 });
        };
        const s = await fetchStockSeries(bothConfig, "1m", { fetchImpl });
        expect(s.source).toBe("Twelve Data");
    });

    test("throws when all providers fail", async () => {
        await expect(
            fetchStockSeries(bothConfig, "1m", {
                fetchImpl: jsonFetch({}, 500),
            }),
        ).rejects.toThrow("all providers failed");
    });

    test("throws when no keys are configured", async () => {
        await expect(
            fetchStockSeries({ symbol: "AAPL", avkey: "", tdkey: "" }, "1m", {
                fetchImpl: jsonFetch({}),
            }),
        ).rejects.toThrow("no API key configured");
    });
});
