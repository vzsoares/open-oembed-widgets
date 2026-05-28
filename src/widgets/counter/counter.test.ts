import { describe, expect, test } from "vitest";
import {
    counterView,
    dayDiff,
    defaultTarget,
    parseCounterConfig,
    parseDate,
} from "./counter";

// A fixed "now": 2026-05-28 13:30 local.
const now = new Date(2026, 4, 28, 13, 30).getTime();

describe("parseDate", () => {
    test("a bare YYYY-MM-DD is local midnight", () => {
        expect(parseDate("2026-01-01")).toBe(new Date(2026, 0, 1).getTime());
    });

    test("falls back to Date.parse for other strings", () => {
        expect(parseDate("2026-01-01T12:00:00Z")).toBe(
            Date.parse("2026-01-01T12:00:00Z"),
        );
    });

    test("returns null when absent or unparseable", () => {
        expect(parseDate(null)).toBeNull();
        expect(parseDate("")).toBeNull();
        expect(parseDate("not a date")).toBeNull();
    });
});

describe("dayDiff", () => {
    test("ignores the time of day on both sides", () => {
        const target = new Date(2026, 4, 30, 23, 0).getTime();
        expect(dayDiff(target, now)).toBe(2);
    });

    test("is negative for past dates", () => {
        const target = new Date(2026, 4, 25, 1, 0).getTime();
        expect(dayDiff(target, now)).toBe(-3);
    });

    test("is zero for the same calendar day", () => {
        const target = new Date(2026, 4, 28, 0, 1).getTime();
        expect(dayDiff(target, now)).toBe(0);
    });
});

describe("parseCounterConfig", () => {
    test("defaults to auto mode + next New Year", () => {
        const c = parseCounterConfig("", now);
        expect(c.mode).toBe("auto");
        expect(c.target).toBe(defaultTarget(now));
        expect(c.label).toBe("");
    });

    test("reads mode, date and label", () => {
        const c = parseCounterConfig(
            "?mode=since&date=2026-01-01&label=New%20Year",
            now,
        );
        expect(c.mode).toBe("since");
        expect(c.target).toBe(new Date(2026, 0, 1).getTime());
        expect(c.label).toBe("New Year");
    });

    test("an unknown mode falls back to auto", () => {
        expect(parseCounterConfig("?mode=sideways", now).mode).toBe("auto");
    });
});

describe("counterView", () => {
    test("auto counts down to a future date", () => {
        const v = counterView(
            { mode: "auto", target: new Date(2026, 5, 1).getTime(), label: "" },
            now,
        );
        expect(v).toMatchObject({
            days: 4,
            direction: "until",
            caption: "days until",
        });
    });

    test("auto counts up from a past date", () => {
        const v = counterView(
            {
                mode: "auto",
                target: new Date(2026, 4, 18).getTime(),
                label: "",
            },
            now,
        );
        expect(v).toMatchObject({
            days: 10,
            direction: "since",
            caption: "days since",
        });
    });

    test("auto shows 'today' on the day itself", () => {
        const v = counterView(
            {
                mode: "auto",
                target: new Date(2026, 4, 28).getTime(),
                label: "",
            },
            now,
        );
        expect(v).toMatchObject({
            days: 0,
            direction: "today",
            caption: "today",
        });
    });

    test("singular caption at one day", () => {
        const v = counterView(
            {
                mode: "until",
                target: new Date(2026, 4, 29).getTime(),
                label: "",
            },
            now,
        );
        expect(v).toMatchObject({ days: 1, caption: "day until" });
    });

    test("a fixed direction clamps to zero once the date has passed", () => {
        const v = counterView(
            {
                mode: "until",
                target: new Date(2026, 4, 1).getTime(),
                label: "",
            },
            now,
        );
        expect(v.days).toBe(0);
    });

    test("passes the label through", () => {
        const v = counterView(
            { mode: "auto", target: now, label: "Launch" },
            now,
        );
        expect(v.label).toBe("Launch");
    });
});
