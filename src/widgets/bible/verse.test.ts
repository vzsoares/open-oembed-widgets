import { describe, expect, test } from "vitest";
import {
    type FetchLike,
    fetchVerse,
    offlineVerse,
    parseRandomVerse,
} from "./verse";

describe("parseRandomVerse", () => {
    test("builds the reference and collapses whitespace", () => {
        const v = parseRandomVerse(
            {
                translation: { name: "World English Bible" },
                random_verse: {
                    book: "John",
                    chapter: 3,
                    verse: 16,
                    text: "For God so loved the world\n",
                },
            },
            "en",
        );
        expect(v.reference).toBe("John 3:16");
        expect(v.text).toBe("For God so loved the world");
        expect(v.translation).toBe("World English Bible");
        expect(v.lang).toBe("en");
        expect(v.source).toBe("bible-api");
    });

    test("throws on a malformed payload", () => {
        expect(() => parseRandomVerse({}, "en")).toThrow();
    });
});

describe("offlineVerse", () => {
    test("returns a bundled verse for the requested language", () => {
        const v = offlineVerse("pt", () => 0);
        expect(v.lang).toBe("pt");
        expect(v.source).toBe("offline");
        expect(v.reference.length).toBeGreaterThan(0);
        expect(v.text.length).toBeGreaterThan(0);
    });
});

describe("fetchVerse", () => {
    const jsonFetch =
        (body: unknown): FetchLike =>
        async () =>
            new Response(JSON.stringify(body), { status: 200 });
    const boom: FetchLike = async () => {
        throw new Error("network down");
    };

    test("uses the API response when it succeeds", async () => {
        const v = await fetchVerse("en", {
            fetchImpl: jsonFetch({
                translation: { name: "World English Bible" },
                random_verse: {
                    book: "Psalms",
                    chapter: 23,
                    verse: 1,
                    text: "Yahweh is my shepherd",
                },
            }),
        });
        expect(v.source).toBe("bible-api");
        expect(v.reference).toBe("Psalms 23:1");
    });

    test("falls back to an offline verse when the API fails", async () => {
        const v = await fetchVerse("pt", { fetchImpl: boom });
        expect(v.source).toBe("offline");
        expect(v.lang).toBe("pt");
    });
});
