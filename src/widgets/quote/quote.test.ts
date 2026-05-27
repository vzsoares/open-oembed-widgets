import { describe, expect, test } from "vitest";
import { parseQuoteConfig, pickQuote } from "./quote";

describe("parseQuoteConfig", () => {
    test("defaults to motivation", () => {
        expect(parseQuoteConfig("")).toEqual({ collection: "motivation" });
    });

    test("reads a valid collection", () => {
        expect(parseQuoteConfig("?collection=stoic").collection).toBe("stoic");
    });

    test("rejects an unknown collection", () => {
        expect(parseQuoteConfig("?collection=bogus").collection).toBe(
            "motivation",
        );
    });
});

describe("pickQuote", () => {
    test("returns a non-empty quote with an author", () => {
        const q = pickQuote("wisdom", () => 0);
        expect(q.text.length).toBeGreaterThan(0);
        expect(q.author.length).toBeGreaterThan(0);
    });

    test("the picker index selects within the collection", () => {
        const first = pickQuote("tech", () => 0);
        const last = pickQuote("tech", () => 0.99);
        expect(first.text).not.toBe(last.text);
    });
});
