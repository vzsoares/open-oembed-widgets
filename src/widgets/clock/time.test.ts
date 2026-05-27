import { describe, expect, test } from "vitest";
import {
    type ClockConfig,
    clockAngles,
    clockParts,
    parseClockConfig,
    safeTimeZone,
} from "./time";

const cfg = (over: Partial<ClockConfig>): ClockConfig => ({
    show: "both",
    seconds: false,
    tz: "UTC",
    h24: true,
    style: "flip",
    ...over,
});

describe("parseClockConfig", () => {
    test("defaults when nothing is set", () => {
        expect(parseClockConfig("")).toEqual({
            show: "both",
            seconds: false,
            tz: undefined,
            h24: undefined,
            style: "flip",
        });
    });

    test("reads every option", () => {
        expect(
            parseClockConfig(
                "?show=time&seconds=1&tz=America/Sao_Paulo&h24=1&style=analog",
            ),
        ).toEqual({
            show: "time",
            seconds: true,
            tz: "America/Sao_Paulo",
            h24: true,
            style: "analog",
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
        const p = clockParts(at, cfg({}), "en-US");
        expect(p.tiles).toEqual(["09", "05"]);
        expect(p.meridiem).toBe("");
        expect(p.caption).toBe("Tuesday | May 26, 2026");
    });

    test("adds a zero-padded seconds tile", () => {
        const p = clockParts(at, cfg({ show: "time", seconds: true }), "en-US");
        expect(p.tiles).toEqual(["09", "05", "07"]);
    });

    test("12-hour mode reports a meridiem", () => {
        const morning = clockParts(at, cfg({ h24: undefined }), "en-US");
        expect(morning.tiles[0]).toBe("09");
        expect(morning.meridiem).toBe("AM");

        const afternoon = clockParts(
            new Date("2026-05-26T13:00:00Z"),
            cfg({ h24: undefined }),
            "en-US",
        );
        expect(afternoon.tiles[0]).toBe("01");
        expect(afternoon.meridiem).toBe("PM");
    });

    test("the timezone shifts the rendered hour", () => {
        const p = clockParts(at, cfg({ tz: "America/Sao_Paulo" }), "en-US");
        // UTC-3: 09:05Z -> 06:05 local.
        expect(p.tiles).toEqual(["06", "05"]);
    });

    test("a bad timezone falls back to a local render", () => {
        const p = clockParts(at, cfg({ tz: "Mars/Olympus" }), "en-US");
        expect(p.tiles).toHaveLength(2);
        expect(p.tiles[0]).toMatch(/^\d{2}$/);
    });
});

describe("clockAngles", () => {
    test("computes hand angles in the timezone", () => {
        const a = clockAngles(
            new Date("2026-05-26T03:15:30Z"),
            cfg({ seconds: true }),
        );
        expect(a.hour).toBeCloseTo(97.5, 5); // (3 + 15/60) * 30
        expect(a.minute).toBeCloseTo(93, 5); // (15 + 30/60) * 6
        expect(a.second).toBe(180); // 30 * 6
    });

    test("12:00 is 0°, and the timezone shifts it", () => {
        const noonUtc = new Date("2026-05-26T12:00:00Z");
        expect(clockAngles(noonUtc, cfg({})).hour).toBe(0);
        // São Paulo (UTC-3): 12:00Z -> 09:00 -> 9 * 30 = 270°.
        expect(
            clockAngles(noonUtc, cfg({ tz: "America/Sao_Paulo" })).hour,
        ).toBe(270);
    });
});
