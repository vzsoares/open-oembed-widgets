const MODES = ["day", "week", "year", "custom"] as const;
export type ProgressMode = (typeof MODES)[number];

export interface ProgressConfig {
    mode: ProgressMode;
    /** Custom-mode numerator/denominator (wins over a date range). */
    value: number | null;
    max: number | null;
    /** Custom-mode date-range bounds in ms since epoch. */
    from: number | null;
    to: number | null;
    /** Custom-mode lifespan in years (pairs with `from` as a birth date). */
    years: number | null;
    /** Optional caption; defaults per mode. */
    label: string;
}

export interface ProgressView {
    /** 0–100, rounded. */
    percent: number;
    label: string;
}

const DAY_MS = 86_400_000;

function isMode(value: string | null): value is ProgressMode {
    return value !== null && MODES.some((m) => m === value);
}

function parseInstant(iso: string | null): number | null {
    if (!iso) return null;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? null : ms;
}

function parseNumber(raw: string | null): number | null {
    if (raw === null || raw.trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

export function parseProgressConfig(search: string): ProgressConfig {
    const p = new URLSearchParams(search);
    const mode = p.get("mode");
    return {
        mode: isMode(mode) ? mode : "year",
        value: parseNumber(p.get("value")),
        max: parseNumber(p.get("max")),
        from: parseInstant(p.get("from")),
        to: parseInstant(p.get("to")),
        years: parseNumber(p.get("years")),
        label: p.get("label") ?? "",
    };
}

/** Add `years` calendar years to an instant (handles leap years sanely). */
function addYears(ms: number, years: number): number {
    const d = new Date(ms);
    d.setFullYear(d.getFullYear() + years);
    return d.getTime();
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Local midnight at the start of `date`'s day. */
function startOfDay(date: Date): number {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    ).getTime();
}

/** Local midnight at the start of `date`'s week (Monday). */
function startOfWeek(date: Date): number {
    const day = startOfDay(date);
    // getDay(): 0=Sun..6=Sat; shift so Monday is 0.
    const offset = (new Date(day).getDay() + 6) % 7;
    return day - offset * DAY_MS;
}

function startOfYear(date: Date): number {
    return new Date(date.getFullYear(), 0, 1).getTime();
}

/** Resolve the progress fraction in [0,1] for the configured mode. */
export function fraction(config: ProgressConfig, nowMs: number): number {
    const now = new Date(nowMs);
    switch (config.mode) {
        case "day":
            return clamp01((nowMs - startOfDay(now)) / DAY_MS);
        case "week":
            return clamp01((nowMs - startOfWeek(now)) / (7 * DAY_MS));
        case "custom": {
            if (
                config.value !== null &&
                config.max !== null &&
                config.max > 0
            ) {
                return clamp01(config.value / config.max);
            }
            // Birth date + lifespan (life progress), or an explicit end date.
            if (config.from !== null) {
                let end = config.to;
                if (end === null && config.years !== null && config.years > 0) {
                    end = addYears(config.from, config.years);
                }
                if (end !== null && end > config.from) {
                    return clamp01((nowMs - config.from) / (end - config.from));
                }
            }
            return 0;
        }
        default: {
            const start = startOfYear(now);
            const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
            return clamp01((nowMs - start) / (end - start));
        }
    }
}

function defaultLabel(config: ProgressConfig, nowMs: number): string {
    switch (config.mode) {
        case "day":
            return "Today";
        case "week":
            return "This week";
        case "custom":
            return "";
        default:
            return String(new Date(nowMs).getFullYear());
    }
}

export function progressView(
    config: ProgressConfig,
    nowMs: number,
): ProgressView {
    return {
        percent: Math.round(fraction(config, nowMs) * 100),
        label: config.label || defaultLabel(config, nowMs),
    };
}
