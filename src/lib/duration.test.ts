import { describe, expect, test } from "vitest";
import { durationSegments, splitDuration } from "./duration";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("splitDuration", () => {
    test("breaks a span into d/h/m/s", () => {
        const ms = 2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND;
        expect(splitDuration(ms)).toEqual({
            days: 2,
            hours: 3,
            minutes: 4,
            seconds: 5,
        });
    });

    test("floors sub-second remainders", () => {
        expect(splitDuration(1500)).toEqual({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 1,
        });
    });

    test("clamps negative spans to zero", () => {
        expect(splitDuration(-5000)).toEqual({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        });
    });
});

describe("durationSegments", () => {
    test("pads h/m/s but not days, and labels them", () => {
        const segs = durationSegments(5 * DAY + 7 * HOUR + 2 * MINUTE, "dhms");
        expect(segs).toEqual([
            { value: "5", label: "days" },
            { value: "07", label: "hrs" },
            { value: "02", label: "min" },
            { value: "00", label: "sec" },
        ]);
    });

    test("dhm drops the seconds segment", () => {
        const segs = durationSegments(DAY + 9 * SECOND, "dhm");
        expect(segs.map((s) => s.label)).toEqual(["days", "hrs", "min"]);
    });

    test("large day counts are not padded", () => {
        expect(durationSegments(218 * DAY, "dhm")[0]?.value).toBe("218");
    });
});
