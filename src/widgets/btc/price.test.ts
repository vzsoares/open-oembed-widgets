import { describe, expect, test } from "bun:test";
import {
    type FetchLike,
    fetchBtcPrice,
    PROVIDERS,
    type PriceProvider,
} from "./price";

function provider(name: string): PriceProvider {
    const found = PROVIDERS.find((p) => p.name === name);
    if (!found) throw new Error(`no provider named ${name}`);
    return found;
}

function jsonFetch(body: unknown): FetchLike {
    return async () => new Response(JSON.stringify(body), { status: 200 });
}

describe("provider parsers", () => {
    test("CoinGecko reads price and 24h change", () => {
        expect(
            provider("CoinGecko").parse({
                bitcoin: { usd: 67000, usd_24h_change: 2.5 },
            }),
        ).toEqual({ priceUsd: 67000, change24hPct: 2.5 });
    });

    test("Binance coerces string fields", () => {
        expect(
            provider("Binance").parse({
                lastPrice: "67000.50",
                priceChangePercent: "-1.25",
            }),
        ).toEqual({ priceUsd: 67000.5, change24hPct: -1.25 });
    });

    test("Coinbase derives change from open/last", () => {
        expect(
            provider("Coinbase").parse({ last: "110", open: "100" }),
        ).toEqual({ priceUsd: 110, change24hPct: 10 });
    });

    test("Kraken reads close array and open", () => {
        const result = provider("Kraken").parse({
            result: { XXBTZUSD: { c: ["110.0", "1.0"], o: "100.0" } },
        });
        expect(result.priceUsd).toBe(110);
        expect(result.change24hPct).toBeCloseTo(10);
    });

    test("a malformed payload throws", () => {
        expect(() => provider("CoinGecko").parse({})).toThrow();
    });
});

describe("fallback chain", () => {
    const failing: PriceProvider = {
        name: "Failing",
        url: "https://example.test/a",
        parse() {
            throw new Error("nope");
        },
    };
    const working: PriceProvider = {
        name: "Working",
        url: "https://example.test/b",
        parse() {
            return { priceUsd: 100, change24hPct: 1 };
        },
    };

    test("falls through to the next provider on failure", async () => {
        const quote = await fetchBtcPrice({
            providers: [failing, working],
            fetchImpl: jsonFetch({}),
        });
        expect(quote.source).toBe("Working");
        expect(quote.priceUsd).toBe(100);
    });

    test("throws when every provider fails", async () => {
        await expect(
            fetchBtcPrice({
                providers: [failing],
                fetchImpl: jsonFetch({}),
            }),
        ).rejects.toThrow(/all price providers failed/);
    });
});
