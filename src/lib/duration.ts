/** Granularity of a duration readout: with or without a seconds segment. */
export type Units = "dhms" | "dhm";

export interface DurationParts {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/** One displayed unit: a (possibly padded) value and its short label. */
export interface Segment {
    value: string;
    label: string;
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Break a millisecond span into d/h/m/s. Negative spans clamp to zero. */
export function splitDuration(ms: number): DurationParts {
    const totalSec = Math.floor(Math.max(0, ms) / 1000);
    return {
        days: Math.floor(totalSec / 86_400),
        hours: Math.floor((totalSec % 86_400) / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
    };
}

/**
 * Render a duration as display segments. Days are never padded (they can grow
 * arbitrarily large); the rest are two-digit. `dhm` drops the seconds segment.
 */
export function durationSegments(ms: number, units: Units): Segment[] {
    const d = splitDuration(ms);
    const segments: Segment[] = [
        { value: String(d.days), label: "days" },
        { value: pad2(d.hours), label: "hrs" },
        { value: pad2(d.minutes), label: "min" },
    ];
    if (units === "dhms") {
        segments.push({ value: pad2(d.seconds), label: "sec" });
    }
    return segments;
}
