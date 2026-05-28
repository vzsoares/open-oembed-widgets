import { describe, expect, test } from "vitest";
import { moonAge, moonView } from "./moon";

// Known reference new moon: 2000-01-06 18:14 UTC.
const refNew = Date.UTC(2000, 0, 6, 18, 14, 0);
const day = 86_400_000;
const SYNODIC = 29.530588853;

describe("moonAge", () => {
    test("is ~0 at the reference new moon", () => {
        expect(moonAge(refNew)).toBeCloseTo(0, 3);
    });

    test("stays within one lunation", () => {
        const age = moonAge(refNew + 100 * day);
        expect(age).toBeGreaterThanOrEqual(0);
        expect(age).toBeLessThan(SYNODIC);
    });

    test("wraps to a new moon one full cycle later", () => {
        // A whole synodic month later lands back on a new moon (the age sits
        // at either end of [0, SYNODIC), so check the phase, not the raw age).
        const v = moonView(refNew + SYNODIC * day);
        expect(v.illumination).toBeCloseTo(0, 2);
        expect(v.name).toBe("New Moon");
    });
});

describe("moonView", () => {
    test("new moon: ~0 illumination", () => {
        const v = moonView(refNew);
        expect(v.illumination).toBeCloseTo(0, 2);
        expect(v.name).toBe("New Moon");
    });

    test("full moon: ~1 illumination, half a cycle later", () => {
        const v = moonView(refNew + (SYNODIC / 2) * day);
        expect(v.illumination).toBeCloseTo(1, 2);
        expect(v.name).toBe("Full Moon");
    });

    test("first quarter: half lit and waxing", () => {
        const v = moonView(refNew + (SYNODIC / 4) * day);
        expect(v.illumination).toBeCloseTo(0.5, 2);
        expect(v.name).toBe("First Quarter");
        expect(v.waxing).toBe(true);
    });

    test("last quarter: half lit and waning", () => {
        const v = moonView(refNew + SYNODIC * 0.75 * day);
        expect(v.illumination).toBeCloseTo(0.5, 2);
        expect(v.name).toBe("Last Quarter");
        expect(v.waxing).toBe(false);
    });

    test("waxing crescent a few days in", () => {
        const v = moonView(refNew + 4 * day);
        expect(v.waxing).toBe(true);
        expect(v.name).toBe("Waxing Crescent");
        expect(v.illumination).toBeGreaterThan(0);
        expect(v.illumination).toBeLessThan(0.5);
    });
});
