import { describe, expect, test } from "vitest";
import {
    parseWorldClockConfig,
    zoneClock,
    zoneClocks,
    zoneLabel,
} from "./worldclock";

// A fixed instant: 2026-05-26 12:00:00 UTC.
const now = new Date(Date.UTC(2026, 4, 26, 12, 0, 0));

describe("parseWorldClockConfig", () => {
    test("defaults to three zones when ?tz is absent", () => {
        const c = parseWorldClockConfig("");
        expect(c.zones).toHaveLength(3);
        expect(c.h24).toBeUndefined();
        expect(c.seconds).toBe(false);
    });

    test("splits a comma list and trims blanks", () => {
        const c = parseWorldClockConfig("?tz=Asia/Tokyo,%20Europe/London%20,");
        expect(c.zones).toEqual(["Asia/Tokyo", "Europe/London"]);
    });

    test("reads seconds and h24 flags", () => {
        const c = parseWorldClockConfig("?seconds=1&h24=1");
        expect(c.seconds).toBe(true);
        expect(c.h24).toBe(true);
    });
});

describe("zoneLabel", () => {
    test("uses the city segment with spaces", () => {
        expect(zoneLabel("America/Sao_Paulo")).toBe("Sao Paulo");
        expect(zoneLabel("Europe/London")).toBe("London");
        expect(zoneLabel("local")).toBe("Local");
    });
});

describe("zoneClock", () => {
    const cfg = { zones: [], seconds: false, h24: true as const };

    test("renders the correct 24h time for a zone", () => {
        // 12:00 UTC is 21:00 in Tokyo (UTC+9).
        const c = zoneClock(now, "Asia/Tokyo", cfg, "en-GB");
        expect(c.time).toBe("21:00");
        expect(c.valid).toBe(true);
        expect(c.label).toBe("Tokyo");
    });

    test("includes a seconds segment when enabled", () => {
        const c = zoneClock(
            new Date(Date.UTC(2026, 4, 26, 12, 0, 5)),
            "Europe/London",
            { zones: [], seconds: true, h24: true },
            "en-GB",
        );
        // 12:00:05 UTC = 13:00:05 BST.
        expect(c.time).toBe("13:00:05");
    });

    test("flags an unknown zone instead of inventing a time", () => {
        const c = zoneClock(now, "Mars/Olympus", cfg, "en-GB");
        expect(c.valid).toBe(false);
        expect(c.time).toBe("—");
    });

    test("emits a meridiem in 12-hour mode", () => {
        const c = zoneClock(
            now,
            "Asia/Tokyo",
            { zones: [], seconds: false, h24: undefined },
            "en-US",
        );
        expect(c.meridiem).toBe("PM");
    });
});

describe("zoneClocks", () => {
    test("maps every configured zone", () => {
        const clocks = zoneClocks(
            now,
            {
                zones: ["Asia/Tokyo", "Europe/London"],
                seconds: false,
                h24: true,
            },
            "en-GB",
        );
        expect(clocks.map((c) => c.label)).toEqual(["Tokyo", "London"]);
    });
});
