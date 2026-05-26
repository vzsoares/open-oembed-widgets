import { describe, expect, test } from "vitest";
import { alignDelay, alignedInterval } from "./interval";

describe("alignDelay", () => {
    test("returns the gap to the next boundary", () => {
        expect(alignDelay(1000, 1200)).toBe(800);
        expect(alignDelay(60_000, 10_000)).toBe(50_000);
    });

    test("returns a full step exactly on a boundary (never 0)", () => {
        expect(alignDelay(1000, 5000)).toBe(1000);
        expect(alignDelay(1000, 0)).toBe(1000);
    });
});

describe("alignedInterval", () => {
    test("fires roughly on the boundary and stops cleanly", async () => {
        let ticks = 0;
        const stop = alignedInterval(50, () => {
            ticks += 1;
        });
        await new Promise((r) => setTimeout(r, 170));
        stop();
        const seen = ticks;
        expect(seen).toBeGreaterThanOrEqual(2);
        // No further ticks after stopping.
        await new Promise((r) => setTimeout(r, 120));
        expect(ticks).toBe(seen);
    });
});
