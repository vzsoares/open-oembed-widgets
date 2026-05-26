import { describe, expect, test } from "vitest";
import {
    type FetchLike,
    fetchBtcSeries,
    SERIES_PROVIDERS,
    type SeriesProvider,
} from "./price";

function provider(name: string): SeriesProvider {
    const found = SERIES_PROVIDERS.find((p) => p.name === name);
    if (!found) throw new Error(`no provider named ${name}`);
    return found;
}

function jsonFetch(body: unknown): FetchLike {
    return async () => new Response(JSON.stringify(body), { status: 200 });
}

describe("series provider parsers", () => {
    test("CoinGecko maps [ms, price] pairs", () => {
        expect(
            provider("CoinGecko").parse({
                prices: [
                    [1000, 50],
                    [2000, 60],
                ],
            }),
        ).toEqual([
            { t: 1000, p: 50 },
            { t: 2000, p: 60 },
        ]);
    });

    test("Binance reads close (index 4)", () => {
        expect(
            provider("Binance").parse([
                [1000, "1", "2", "0", "55", "9"],
                [2000, "1", "2", "0", "66", "9"],
            ]),
        ).toEqual([
            { t: 1000, p: 55 },
            { t: 2000, p: 66 },
        ]);
    });

    test("Coinbase converts seconds to ms and reads close", () => {
        expect(provider("Coinbase").parse([[1, 1, 2, 3, 55, 9]])).toEqual([
            { t: 1000, p: 55 },
        ]);
    });

    test("a malformed payload throws", () => {
        expect(() => provider("CoinGecko").parse({})).toThrow();
    });
});

describe("fallback chain", () => {
    const failing: SeriesProvider = {
        name: "Failing",
        url: () => "https://example.test/a",
        parse() {
            throw new Error("nope");
        },
    };
    const working: SeriesProvider = {
        name: "Working",
        url: () => "https://example.test/b",
        parse() {
            return [
                { t: 2000, p: 60 },
                { t: 1000, p: 50 },
            ];
        },
    };

    test("falls through and returns points sorted by time", async () => {
        const series = await fetchBtcSeries(30, {
            providers: [failing, working],
            fetchImpl: jsonFetch({}),
        });
        expect(series.source).toBe("Working");
        expect(series.points.map((pt) => pt.t)).toEqual([1000, 2000]);
    });

    test("a single-point series is rejected", async () => {
        const onePoint: SeriesProvider = {
            name: "One",
            url: () => "https://example.test/c",
            parse: () => [{ t: 1000, p: 50 }],
        };
        await expect(
            fetchBtcSeries(30, {
                providers: [onePoint],
                fetchImpl: jsonFetch({}),
            }),
        ).rejects.toThrow(/all series providers failed/);
    });

    test("throws when every provider fails", async () => {
        await expect(
            fetchBtcSeries(30, {
                providers: [failing],
                fetchImpl: jsonFetch({}),
            }),
        ).rejects.toThrow(/all series providers failed/);
    });
});
