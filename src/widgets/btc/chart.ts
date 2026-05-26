export interface ChartPoint {
    x: number;
    y: number;
}

export interface ChartPaths {
    /** SVG path `d` for the line. */
    line: string;
    /** SVG path `d` for the area fill (line closed to the baseline). */
    area: string;
}

/**
 * Project values into `width` x `height` viewBox coordinates. The y axis is
 * inverted (min at the bottom); a flat series is centered.
 */
export function chartPoints(
    values: number[],
    width = 300,
    height = 96,
    padY = 3,
): ChartPoint[] {
    const first = values[0];
    if (values.length === 0 || first === undefined) return [];

    let min = first;
    let max = first;
    for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
    }

    const span = max - min;
    const usable = height - padY * 2;
    const n = values.length;
    return values.map((v, i) => ({
        x: n === 1 ? width / 2 : (i / (n - 1)) * width,
        y: span === 0 ? height / 2 : padY + (1 - (v - min) / span) * usable,
    }));
}

/**
 * Build line + area SVG paths for a sparkline. Pair with
 * `preserveAspectRatio="none"` + `vector-effect="non-scaling-stroke"` so it
 * stretches to any width while keeping a crisp 1px line.
 */
export function buildChartPaths(
    values: number[],
    width = 300,
    height = 96,
    padY = 3,
): ChartPaths {
    const pts = chartPoints(values, width, height, padY);
    if (pts.length === 0) return { line: "", area: "" };

    const coords = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
    const line = `M${coords.join(" L")}`;
    const area = `${line} L${width.toFixed(2)},${height} L0,${height} Z`;
    return { line, area };
}
