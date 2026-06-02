import { describe, expect, test } from "vitest";
import {
    type FetchLike,
    fetchStockSeries,
    parseStockConfig,
    rangeToParams,
} from "./stock";

function jsonFetch(body: unknown, status = 200): FetchLike {
    return async () => new Response(JSON.stringify(body), { status });
}

const MOCK_QUOTE = {
    c: 214.32,
    d: -0.25,
    dp: -0.12,
    h: 215.5,
    l: 213.1,
    o: 213.9,
    pc: 214.57,
    t: 1717000000,
};

const MOCK_CANDLE = {
    s: "ok",
    c: [210.0, 211.5, 213.2, 214.32],
    h: [211.0, 212.0, 214.0, 215.5],
    l: [209.5, 210.5, 212.5, 213.1],
    o: [210.0, 211.0, 212.8, 213.9],
    t: [1716900000, 1716950000, 1716980000, 1717000000],
    v: [1000, 1200, 900, 1100],
};

describe("parseStockConfig", () => {
    test("defaults to AAPL and empty apikey", () => {
        const c = parseStockConfig("");
        expect(c.symbol).toBe("AAPL");
        expect(c.apikey).toBe("");
    });

    test("parses symbol and apikey", () => {
        const c = parseStockConfig("?symbol=NVDA&apikey=abc123");
        expect(c.symbol).toBe("NVDA");
        expect(c.apikey).toBe("abc123");
    });

    test("uppercases symbol", () => {
        expect(parseStockConfig("?symbol=msft").symbol).toBe("MSFT");
    });
});

describe("rangeToParams", () => {
    test("1d uses 5-minute resolution", () => {
        expect(rangeToParams("1d").resolution).toBe("5");
    });

    test("1w uses 60-minute resolution", () => {
        expect(rangeToParams("1w").resolution).toBe("60");
    });

    test("1m and 3m use daily resolution", () => {
        expect(rangeToParams("1m").resolution).toBe("D");
        expect(rangeToParams("3m").resolution).toBe("D");
    });

    test("1y uses weekly resolution", () => {
        expect(rangeToParams("1y").resolution).toBe("W");
    });

    test("unknown range falls back to 1m params", () => {
        const p = rangeToParams("bad");
        expect(p.resolution).toBe("D");
        expect(p.fromOffset).toBe(30 * 86400);
    });
});

describe("fetchStockSeries", () => {
    const mockFetch: FetchLike = async (url) => {
        const u = url.toString();
        if (u.includes("/stock/candle"))
            return new Response(JSON.stringify(MOCK_CANDLE), { status: 200 });
        return new Response(JSON.stringify(MOCK_QUOTE), { status: 200 });
    };

    test("returns sorted points and correct details", async () => {
        const s = await fetchStockSeries("AAPL", "1m", "key", {
            fetchImpl: mockFetch,
        });
        expect(s.source).toBe("Finnhub");
        expect(s.points).toHaveLength(4);
        const first = s.points[0];
        const second = s.points[1];
        if (first && second) expect(first.t).toBeLessThan(second.t);
        expect(s.details.price).toBe(214.32);
        expect(s.details.changePct).toBe(-0.12);
        expect(s.details.high).toBe(215.5);
        expect(s.details.low).toBe(213.1);
    });

    test("throws when candle status is not ok", async () => {
        await expect(
            fetchStockSeries("AAPL", "1m", "key", {
                fetchImpl: jsonFetch({ s: "no_data" }),
            }),
        ).rejects.toThrow("no candle data");
    });

    test("throws on HTTP error", async () => {
        await expect(
            fetchStockSeries("AAPL", "1m", "key", {
                fetchImpl: jsonFetch({}, 403),
            }),
        ).rejects.toThrow("HTTP 403");
    });

    test("throws when candle arrays are too short", async () => {
        const tinyCandle = {
            s: "ok",
            c: [210.0],
            t: [1717000000],
            h: [],
            l: [],
            o: [],
            v: [],
        };
        await expect(
            fetchStockSeries("AAPL", "1m", "key", {
                fetchImpl: async (url) => {
                    if (url.toString().includes("/stock/candle"))
                        return new Response(JSON.stringify(tinyCandle), {
                            status: 200,
                        });
                    return new Response(JSON.stringify(MOCK_QUOTE), {
                        status: 200,
                    });
                },
            }),
        ).rejects.toThrow("too few candle points");
    });
});
