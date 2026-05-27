import { describe, expect, test } from "vitest";
import {
    type FetchLike,
    feedUrl,
    fetchOnThisDay,
    parseOnThisDay,
    parseOnThisDayConfig,
} from "./events";

describe("parseOnThisDayConfig", () => {
    test("defaults to selected/en", () => {
        expect(parseOnThisDayConfig("")).toEqual({
            feed: "selected",
            lang: "en",
        });
    });

    test("reads a valid feed and language", () => {
        expect(parseOnThisDayConfig("?type=births&lang=pt")).toEqual({
            feed: "births",
            lang: "pt",
        });
    });

    test("rejects unknown feed/lang", () => {
        expect(parseOnThisDayConfig("?type=bogus&lang=zzzz")).toEqual({
            feed: "selected",
            lang: "en",
        });
    });
});

describe("feedUrl", () => {
    test("zero-pads month and day", () => {
        expect(feedUrl("en", "events", new Date(2026, 4, 9))).toBe(
            "https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/05/09",
        );
    });
});

describe("parseOnThisDay", () => {
    test("extracts year + text and collapses whitespace", () => {
        const events = parseOnThisDay(
            {
                selected: [
                    { year: 1969, text: "Apollo 10  launched.\n" },
                    { text: "Some holiday" }, // no year
                    { year: 1900 }, // no text -> skipped
                ],
            },
            "selected",
        );
        expect(events).toEqual([
            { year: 1969, text: "Apollo 10 launched." },
            { year: null, text: "Some holiday" },
        ]);
    });

    test("throws on a malformed or empty payload", () => {
        expect(() => parseOnThisDay({}, "selected")).toThrow();
        expect(() => parseOnThisDay({ selected: [] }, "selected")).toThrow();
    });
});

describe("fetchOnThisDay", () => {
    const ok: FetchLike = async () =>
        new Response(JSON.stringify({ events: [{ year: 1, text: "X" }] }), {
            status: 200,
        });
    const boom: FetchLike = async () => new Response("nope", { status: 500 });

    test("returns parsed events on success", async () => {
        const events = await fetchOnThisDay("en", "events", new Date(), {
            fetchImpl: ok,
        });
        expect(events).toEqual([{ year: 1, text: "X" }]);
    });

    test("throws on a non-ok response", async () => {
        await expect(
            fetchOnThisDay("en", "events", new Date(), { fetchImpl: boom }),
        ).rejects.toThrow();
    });
});
