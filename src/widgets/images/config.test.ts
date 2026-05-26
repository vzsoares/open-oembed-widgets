import { describe, expect, test } from "bun:test";
import {
    clampEvery,
    nextIndex,
    parseImagesConfig,
    parseSrcList,
} from "./config";

describe("parseSrcList", () => {
    test("trims, drops empties, and handles missing input", () => {
        expect(parseSrcList("a.png, b.png ,,  c.png")).toEqual([
            "a.png",
            "b.png",
            "c.png",
        ]);
        expect(parseSrcList(null)).toEqual([]);
        expect(parseSrcList(",, ,")).toEqual([]);
    });
});

describe("clampEvery", () => {
    test("keeps sane values, defaults to 8 otherwise", () => {
        expect(clampEvery(4)).toBe(4);
        expect(clampEvery(0)).toBe(8);
        expect(clampEvery(Number.NaN)).toBe(8);
        expect(clampEvery(-3)).toBe(8);
        expect(clampEvery(0.5)).toBe(1);
        expect(clampEvery(100_000)).toBe(3600);
    });
});

describe("parseImagesConfig", () => {
    test("defaults", () => {
        expect(parseImagesConfig("")).toEqual({
            src: [],
            mode: "sequential",
            every: 8,
            fit: "cover",
        });
    });

    test("reads every option", () => {
        const c = parseImagesConfig(
            "?src=a.png,b.png&mode=random&every=5&fit=contain",
        );
        expect(c).toEqual({
            src: ["a.png", "b.png"],
            mode: "random",
            every: 5,
            fit: "contain",
        });
    });
});

describe("nextIndex", () => {
    test("sequential advances and wraps", () => {
        expect(nextIndex(0, 3, "sequential")).toBe(1);
        expect(nextIndex(2, 3, "sequential")).toBe(0);
    });

    test("single or empty list stays at 0", () => {
        expect(nextIndex(0, 1, "sequential")).toBe(0);
        expect(nextIndex(0, 0, "random")).toBe(0);
    });

    test("random never returns the current index", () => {
        // rand=0 would map to slot 0, but current=0 is skipped to slot 1.
        expect(nextIndex(0, 3, "random", () => 0)).toBe(1);
        // rand near 1 maps to the last "other" slot.
        expect(nextIndex(0, 3, "random", () => 0.99)).toBe(2);
        // From the middle, low rand picks the slot before it.
        expect(nextIndex(1, 3, "random", () => 0)).toBe(0);
        for (let r = 0; r < 1; r += 0.07) {
            expect(nextIndex(2, 4, "random", () => r)).not.toBe(2);
        }
    });
});
