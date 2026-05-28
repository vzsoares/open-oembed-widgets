/**
 * Day counter: a passive "days since / days until a date" readout. Unlike the
 * timer (which splits a span into d/h/m/s), this counts *whole calendar days*
 * in local time, so it never shows a confusing fraction at midnight.
 */

/**
 * `until` always counts toward a (future) date, `since` always counts from a
 * (past) one, and `auto` picks the right direction from the date itself.
 */
export type CounterMode = "auto" | "until" | "since";

export interface CounterConfig {
    mode: CounterMode;
    /** Target instant at local midnight, ms since epoch. */
    target: number;
    /** Optional caption shown under the count. */
    label: string;
}

/** Which way the count runs, after resolving `auto`. */
export type Direction = "until" | "since" | "today";

export interface CounterView {
    /** Whole days, always non-negative. */
    days: number;
    direction: Direction;
    /** Human caption: "days until", "days since", or "today". */
    caption: string;
    label: string;
}

/** Local midnight (start of day) for a given instant. */
function startOfDay(ms: number): number {
    const d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Signed whole-day difference `target - now`, both snapped to local midnight.
 * Positive means the target is in the future (days until); negative, the past.
 */
export function dayDiff(targetMs: number, nowMs: number): number {
    const ms = startOfDay(targetMs) - startOfDay(nowMs);
    return Math.round(ms / 86_400_000);
}

/**
 * Parse a date param. Accepts a bare `YYYY-MM-DD` (interpreted as *local*
 * midnight, so the count matches the user's calendar) or any other
 * `Date`-parseable string. Returns null when absent/unparseable.
 */
export function parseDate(value: string | null): number | null {
    if (!value) return null;
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (ymd) {
        return new Date(
            Number(ymd[1]),
            Number(ymd[2]) - 1,
            Number(ymd[3]),
        ).getTime();
    }
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
}

/**
 * Fallback target when `?date` is missing or invalid: next New Year (local), so
 * the default `auto`/`until` widget always counts down to something live.
 */
export function defaultTarget(nowMs: number): number {
    return new Date(new Date(nowMs).getFullYear() + 1, 0, 1).getTime();
}

export function parseCounterConfig(
    search: string,
    nowMs: number = Date.now(),
): CounterConfig {
    const p = new URLSearchParams(search);
    const raw = p.get("mode");
    const mode: CounterMode = raw === "until" || raw === "since" ? raw : "auto";
    return {
        mode,
        target: parseDate(p.get("date") ?? p.get("to")) ?? defaultTarget(nowMs),
        label: p.get("label") ?? "",
    };
}

/** Resolve the live view for `nowMs`. */
export function counterView(config: CounterConfig, nowMs: number): CounterView {
    const diff = dayDiff(config.target, nowMs);

    let direction: Direction;
    if (config.mode === "until") direction = "until";
    else if (config.mode === "since") direction = "since";
    else direction = diff > 0 ? "until" : diff < 0 ? "since" : "today";

    // In a fixed direction the count clamps at zero once the date has passed
    // (or not yet arrived); `auto` always shows the absolute distance.
    const days =
        direction === "until"
            ? Math.max(0, diff)
            : direction === "since"
              ? Math.max(0, -diff)
              : 0;

    const caption =
        direction === "until"
            ? days === 1
                ? "day until"
                : "days until"
            : direction === "since"
              ? days === 1
                  ? "day since"
                  : "days since"
              : "today";

    return { days, direction, caption, label: config.label };
}
