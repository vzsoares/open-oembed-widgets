export interface ChartPaths {
    /** SVG path `d` for the line. */
    line: string;
    /** SVG path `d` for the area fill (line closed to the baseline). */
    area: string;
}

/**
 * Build line + area SVG paths for a sparkline in a `width` x `height` viewBox.
 * Pair with `preserveAspectRatio="none"` + `vector-effect="non-scaling-stroke"`
 * so it stretches to any width while keeping a crisp 1px line.
 */
export function buildChartPaths(
    values: number[],
    width = 300,
    height = 96,
    padY = 3,
): ChartPaths {
    const first = values[0];
    if (values.length === 0 || first === undefined) {
        return { line: "", area: "" };
    }

    let min = first;
    let max = first;
    for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
    }

    const span = max - min;
    const usable = height - padY * 2;
    const n = values.length;
    const x = (i: number) => (n === 1 ? width / 2 : (i / (n - 1)) * width);
    // A flat series (span 0) is centered vertically rather than pinned low.
    const y = (v: number) =>
        span === 0 ? height / 2 : padY + (1 - (v - min) / span) * usable;

    const coords = values.map(
        (v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`,
    );
    const line = `M${coords.join(" L")}`;
    const area = `${line} L${width.toFixed(2)},${height} L0,${height} Z`;
    return { line, area };
}
