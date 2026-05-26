import { describe, expect, test } from "bun:test";
import {
    defaultTarget,
    isDone,
    parseInstant,
    parseTimerConfig,
    timerMs,
} from "./config";

const NOW = Date.parse("2026-05-26T12:00:00Z");

describe("parseInstant", () => {
    test("parses an ISO instant", () => {
        expect(parseInstant("2026-12-31T23:59:59Z")).toBe(
            Date.parse("2026-12-31T23:59:59Z"),
        );
    });

    test("returns null for missing or garbage input", () => {
        expect(parseInstant(null)).toBeNull();
        expect(parseInstant("not-a-date")).toBeNull();
    });
});

describe("parseTimerConfig", () => {
    test("defaults to a down-counter to next New Year", () => {
        const c = parseTimerConfig("", NOW);
        expect(c.mode).toBe("down");
        expect(c.units).toBe("dhms");
        expect(c.doneText).toBe("Done");
        expect(c.label).toBe("");
        // Default target is strictly in the future.
        expect(c.target).toBeGreaterThan(NOW);
    });

    test("reads ?to in down mode", () => {
        const c = parseTimerConfig(
            "?to=2026-12-31T23:59:59Z&label=New%20Year",
            NOW,
        );
        expect(c.target).toBe(Date.parse("2026-12-31T23:59:59Z"));
        expect(c.label).toBe("New Year");
    });

    test("up mode reads ?from and ignores ?to", () => {
        const c = parseTimerConfig(
            "?mode=up&from=2026-01-01T00:00:00Z&to=2030-01-01T00:00:00Z",
            NOW,
        );
        expect(c.mode).toBe("up");
        expect(c.target).toBe(Date.parse("2026-01-01T00:00:00Z"));
    });

    test("falls back to the default when ?to is unparseable", () => {
        const c = parseTimerConfig("?to=whenever", NOW);
        expect(c.target).toBe(defaultTarget("down", NOW));
    });

    test("uses the mode-neutral ?date (the gallery's key) in both modes", () => {
        const date = "2026-12-31T23:59:59Z";
        const down = parseTimerConfig(`?date=${date}`, NOW);
        const up = parseTimerConfig(`?mode=up&date=${date}`, NOW);
        expect(down.target).toBe(Date.parse(date));
        expect(up.target).toBe(Date.parse(date));
    });

    test("mode-specific ?to wins over ?date", () => {
        const c = parseTimerConfig(
            "?to=2027-01-01T00:00:00Z&date=2026-06-01T00:00:00Z",
            NOW,
        );
        expect(c.target).toBe(Date.parse("2027-01-01T00:00:00Z"));
    });

    test("honors ?units=dhm and ?done", () => {
        const c = parseTimerConfig("?units=dhm&done=Launched", NOW);
        expect(c.units).toBe("dhm");
        expect(c.doneText).toBe("Launched");
    });
});

describe("defaultTarget", () => {
    test("down is in the future, up is in the past", () => {
        expect(defaultTarget("down", NOW)).toBeGreaterThan(NOW);
        expect(defaultTarget("up", NOW)).toBeLessThanOrEqual(NOW);
    });
});

describe("timerMs / isDone", () => {
    const down = parseTimerConfig("?to=2026-05-26T12:00:10Z", NOW);
    const up = parseTimerConfig("?mode=up&from=2026-05-26T11:59:50Z", NOW);

    test("down counts remaining, up counts elapsed", () => {
        expect(timerMs(down, NOW)).toBe(10_000);
        expect(timerMs(up, NOW)).toBe(10_000);
    });

    test("isDone trips only for a down-counter at/after the target", () => {
        expect(isDone(down, NOW)).toBe(false);
        expect(isDone(down, NOW + 10_000)).toBe(true);
        expect(isDone(up, NOW + 10_000)).toBe(false);
    });
});
