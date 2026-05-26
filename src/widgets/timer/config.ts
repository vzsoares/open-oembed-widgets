import type { Units } from "../../lib/duration";

/** Count `down` to a target, or `up` from a start instant. */
export type Mode = "up" | "down";

export interface TimerConfig {
    mode: Mode;
    /** Reference instant, ms since epoch (resolved target or start). */
    target: number;
    /** Optional caption shown under the segments. */
    label: string;
    units: Units;
    /** Text shown when a countdown reaches zero. */
    doneText: string;
}

/** Parse an ISO instant, or null if absent/unparseable. */
export function parseInstant(iso: string | null): number | null {
    if (!iso) return null;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? null : ms;
}

/**
 * Fallback instant when `?to`/`?from` is missing or invalid, so the widget
 * always shows something live: count *down* to next New Year, or count *up*
 * from the start of the current year (both local time).
 */
export function defaultTarget(mode: Mode, nowMs: number): number {
    const year = new Date(nowMs).getFullYear();
    return mode === "up"
        ? new Date(year, 0, 1).getTime()
        : new Date(year + 1, 0, 1).getTime();
}

/** Signed span vs. `nowMs`: remaining when counting down, elapsed when up. */
export function timerMs(config: TimerConfig, nowMs: number): number {
    return config.mode === "down"
        ? config.target - nowMs
        : nowMs - config.target;
}

/** Whether a countdown has reached (or passed) its target. */
export function isDone(config: TimerConfig, nowMs: number): boolean {
    return config.mode === "down" && timerMs(config, nowMs) <= 0;
}

export function parseTimerConfig(
    search: string,
    nowMs: number = Date.now(),
): TimerConfig {
    const p = new URLSearchParams(search);
    const mode: Mode = p.get("mode") === "up" ? "up" : "down";
    // Mode-specific `to`/`from` win; `date` is the mode-neutral key the gallery
    // emits (it doesn't know whether you're counting up or down).
    const iso = (mode === "up" ? p.get("from") : p.get("to")) ?? p.get("date");
    const units: Units = p.get("units") === "dhm" ? "dhm" : "dhms";
    return {
        mode,
        target: parseInstant(iso) ?? defaultTarget(mode, nowMs),
        label: p.get("label") ?? "",
        units,
        doneText: p.get("done") ?? "Done",
    };
}
