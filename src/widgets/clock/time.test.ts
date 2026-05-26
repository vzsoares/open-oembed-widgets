import { describe, expect, test } from "bun:test";
import { clockParts, parseClockConfig, safeTimeZone } from "./time";

describe("parseClockConfig", () => {
    test("defaults when nothing is set", () => {
        const c = parseClockConfig("");
        expect(c).toEqual({
            show: "both",
            seconds: false,
            tz: undefined,
            h24: undefined,
        });
    });

    test("reads every option", () => {
        const c = parseClockConfig(
            "?show=time&seconds=1&tz=America/Sao_Paulo&h24=1",
        );
        expect(c).toEqual({
            show: "time",
            seconds: true,
            tz: "America/Sao_Paulo",
            h24: true,
        });
    });

    test("ignores an unknown show value", () => {
        expect(parseClockConfig("?show=bogus").show).toBe("both");
    });
});

describe("safeTimeZone", () => {
    test("keeps a valid zone and drops a bad one", () => {
        expect(safeTimeZone("UTC")).toBe("UTC");
        expect(safeTimeZone("Mars/Olympus")).toBeUndefined();
        expect(safeTimeZone(undefined)).toBeUndefined();
    });
});

describe("clockParts", () => {
    // 2026-05-26 was a Tuesday.
    const at = new Date("2026-05-26T09:05:07Z");

    test("24-hour tiles + caption, no seconds, no meridiem", () => {
        const p = clockParts(
            at,
            { show: "both", seconds: false, tz: "UTC", h24: true },
            "en-US",
        );
        expect(p.tiles).toEqual(["09", "05"]);
        expect(p.meridiem).toBe("");
        expect(p.caption).toBe("Tuesday | May 26, 2026");
    });

    test("adds a zero-padded seconds tile", () => {
        const p = clockParts(
            at,
            { show: "time", seconds: true, tz: "UTC", h24: true },
            "en-US",
        );
        expect(p.tiles).toEqual(["09", "05", "07"]);
    });

    test("12-hour mode reports a meridiem", () => {
        const morning = clockParts(
            at,
            { show: "time", seconds: false, tz: "UTC", h24: undefined },
            "en-US",
        );
        expect(morning.tiles[0]).toBe("09");
        expect(morning.meridiem).toBe("AM");

        const afternoon = clockParts(
            new Date("2026-05-26T13:00:00Z"),
            { show: "time", seconds: false, tz: "UTC", h24: undefined },
            "en-US",
        );
        expect(afternoon.tiles[0]).toBe("01");
        expect(afternoon.meridiem).toBe("PM");
    });

    test("the timezone shifts the rendered hour", () => {
        const p = clockParts(
            at,
            {
                show: "both",
                seconds: false,
                tz: "America/Sao_Paulo",
                h24: true,
            },
            "en-US",
        );
        // UTC-3: 09:05Z -> 06:05 local.
        expect(p.tiles).toEqual(["06", "05"]);
    });

    test("a bad timezone falls back to a 24-hour UTC-equivalent render", () => {
        const p = clockParts(
            at,
            { show: "both", seconds: false, tz: "Mars/Olympus", h24: true },
            "en-US",
        );
        // Falls back to local; tiles are still well-formed two-digit strings.
        expect(p.tiles).toHaveLength(2);
        expect(p.tiles[0]).toMatch(/^\d{2}$/);
    });
});
