import { describe, expect, test } from "bun:test";
import { buildChartPaths } from "./chart";

describe("buildChartPaths", () => {
    test("maps values into the viewBox, inverting the y axis", () => {
        // min -> bottom, max -> top; padY 0 for exact coordinates.
        const { line, area } = buildChartPaths([10, 20, 30], 300, 100, 0);
        expect(line).toBe("M0.00,100.00 L150.00,50.00 L300.00,0.00");
        expect(area).toBe(
            "M0.00,100.00 L150.00,50.00 L300.00,0.00 L300.00,100 L0,100 Z",
        );
    });

    test("a flat series is centered vertically", () => {
        const { line } = buildChartPaths([5, 5, 5], 300, 100, 3);
        expect(line).toBe("M0.00,50.00 L150.00,50.00 L300.00,50.00");
    });

    test("empty input yields empty paths", () => {
        expect(buildChartPaths([])).toEqual({ line: "", area: "" });
    });
});
