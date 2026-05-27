import { describe, expect, test } from "vitest";
import { fraction, parseProgressConfig, progressView } from "./progress";

describe("parseProgressConfig", () => {
    test("defaults to year mode with empty fields", () => {
        expect(parseProgressConfig("")).toEqual({
            mode: "year",
            value: null,
            max: null,
            from: null,
            to: null,
            years: null,
            label: "",
        });
    });

    test("reads mode, value/max, range and label", () => {
        const c = parseProgressConfig(
            "?mode=custom&value=3&max=8&from=2026-01-01T00:00:00Z&to=2026-12-31T00:00:00Z&label=Sprint",
        );
        expect(c.mode).toBe("custom");
        expect(c.value).toBe(3);
        expect(c.max).toBe(8);
        expect(c.label).toBe("Sprint");
    });

    test("rejects an unknown mode", () => {
        expect(parseProgressConfig("?mode=bogus").mode).toBe("year");
    });
});

describe("fraction", () => {
    const base = {
        value: null,
        max: null,
        from: null,
        to: null,
        years: null,
        label: "",
    } as const;

    test("day mode: noon is ~50% of the day", () => {
        // Use a local-noon timestamp by constructing a local Date.
        const noon = new Date(2026, 5, 2, 12, 0, 0).getTime();
        expect(fraction({ ...base, mode: "day" }, noon)).toBeCloseTo(0.5, 2);
    });

    test("week mode: Monday 00:00 is ~0, and grows toward Sunday", () => {
        // 2026-06-01 is a Monday.
        const monday = new Date(2026, 5, 1, 0, 0, 0).getTime();
        expect(fraction({ ...base, mode: "week" }, monday)).toBeCloseTo(0, 2);
        const thursdayNoon = new Date(2026, 5, 4, 12, 0, 0).getTime();
        const f = fraction({ ...base, mode: "week" }, thursdayNoon);
        expect(f).toBeGreaterThan(0.4);
        expect(f).toBeLessThan(0.6);
    });

    test("year mode: mid-year is ~50%", () => {
        const mid = Date.parse("2026-07-02T12:00:00Z");
        expect(fraction({ ...base, mode: "year" }, mid)).toBeGreaterThan(0.45);
    });

    test("custom mode: value/max wins, then range, else 0", () => {
        const now = Date.now();
        expect(
            fraction({ ...base, mode: "custom", value: 1, max: 4 }, now),
        ).toBe(0.25);
        const from = Date.parse("2026-01-01T00:00:00Z");
        const to = Date.parse("2026-01-11T00:00:00Z");
        const mid = Date.parse("2026-01-06T00:00:00Z");
        expect(
            fraction({ ...base, mode: "custom", from, to }, mid),
        ).toBeCloseTo(0.5, 5);
        expect(fraction({ ...base, mode: "custom" }, now)).toBe(0);
    });

    test("custom mode: birth date + lifespan gives life progress", () => {
        const birth = Date.parse("2000-01-01T00:00:00Z");
        // 20 years into an 80-year span -> 25%.
        const twentyYears = Date.parse("2020-01-01T00:00:00Z");
        const f = fraction(
            { ...base, mode: "custom", from: birth, years: 80 },
            twentyYears,
        );
        expect(f).toBeCloseTo(0.25, 2);
    });
});

describe("progressView", () => {
    const base = {
        value: null,
        max: null,
        from: null,
        to: null,
        years: null,
        label: "",
    } as const;

    test("default labels per mode", () => {
        const now = Date.parse("2026-07-02T12:00:00Z");
        expect(progressView({ ...base, mode: "year" }, now).label).toBe("2026");
        expect(progressView({ ...base, mode: "day" }, now).label).toBe("Today");
        expect(progressView({ ...base, mode: "week" }, now).label).toBe(
            "This week",
        );
        expect(progressView({ ...base, mode: "custom" }, now).label).toBe("");
    });

    test("explicit label wins and percent is rounded", () => {
        const v = progressView(
            { ...base, mode: "custom", value: 1, max: 3, label: "Goal" },
            Date.now(),
        );
        expect(v.label).toBe("Goal");
        expect(v.percent).toBe(33);
    });
});
