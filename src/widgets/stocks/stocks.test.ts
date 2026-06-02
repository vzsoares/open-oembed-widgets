import { describe, expect, test } from "vitest";
import {
    type FetchLike,
    fetchQuote,
    fetchQuotes,
    parseStocksConfig,
} from "./stocks";

function jsonFetch(body: unknown, status = 200): FetchLike {
    return async () => new Response(JSON.stringify(body), { status });
}

const MOCK_QUOTE = {
    c: 134.52,
    d: 3.21,
    dp: 2.45,
    h: 136.0,
    l: 131.5,
    o: 131.8,
    pc: 131.31,
    t: 1717000000,
};

describe("parseStocksConfig", () => {
    test("defaults when empty", () => {
        const c = parseStocksConfig("");
        expect(c.symbols).toEqual(["NVDA", "AAPL", "MSFT", "SPY"]);
        expect(c.apikey).toBe("");
    });

    test("parses symbols and apikey", () => {
        const c = parseStocksConfig("?symbols=TSLA,AMZN&apikey=abc123");
        expect(c.symbols).toEqual(["TSLA", "AMZN"]);
        expect(c.apikey).toBe("abc123");
    });

    test("uppercases and trims symbols", () => {
        const c = parseStocksConfig("?symbols=nvda, aapl");
        expect(c.symbols).toEqual(["NVDA", "AAPL"]);
    });

    test("falls back to defaults on empty symbols param", () => {
        const c = parseStocksConfig("?symbols=");
        expect(c.symbols).toEqual(["NVDA", "AAPL", "MSFT", "SPY"]);
    });
});

describe("fetchQuote", () => {
    test("parses a valid quote response", async () => {
        const q = await fetchQuote("NVDA", "key", {
            fetchImpl: jsonFetch(MOCK_QUOTE),
        });
        expect(q.symbol).toBe("NVDA");
        expect(q.price).toBe(134.52);
        expect(q.changePct).toBe(2.45);
        expect(q.high).toBe(136.0);
        expect(q.low).toBe(131.5);
        expect(q.prevClose).toBe(131.31);
    });

    test("throws on HTTP error", async () => {
        await expect(
            fetchQuote("NVDA", "key", { fetchImpl: jsonFetch({}, 401) }),
        ).rejects.toThrow("HTTP 401");
    });

    test("throws on bad shape", async () => {
        await expect(
            fetchQuote("NVDA", "key", { fetchImpl: jsonFetch(null) }),
        ).rejects.toThrow();
    });

    test("throws on non-finite field", async () => {
        await expect(
            fetchQuote("NVDA", "key", {
                fetchImpl: jsonFetch({ ...MOCK_QUOTE, c: null }),
            }),
        ).rejects.toThrow("expected a finite number");
    });
});

describe("fetchQuotes", () => {
    test("returns successful quotes, skipping failed ones", async () => {
        let call = 0;
        const fetchImpl: FetchLike = async () => {
            call++;
            if (call === 2) return new Response("error", { status: 500 });
            return new Response(JSON.stringify(MOCK_QUOTE), { status: 200 });
        };
        const quotes = await fetchQuotes(["NVDA", "AAPL", "MSFT"], "key", {
            fetchImpl,
        });
        expect(quotes).toHaveLength(2);
    });

    test("throws when all fail", async () => {
        await expect(
            fetchQuotes(["NVDA"], "key", { fetchImpl: jsonFetch({}, 500) }),
        ).rejects.toThrow("all quote fetches failed");
    });
});
