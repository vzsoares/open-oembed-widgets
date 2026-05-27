/** What the clock renders: tiles only, caption only, or both. */
export type Show = "time" | "date" | "both";

export interface ClockConfig {
    show: Show;
    /** Include a seconds tile/hand (and tick every second). */
    seconds: boolean;
    /** IANA timezone (e.g. "America/Sao_Paulo"); undefined = viewer's local. */
    tz: string | undefined;
    /** Force a 24-hour clock; undefined = follow the locale. */
    h24: boolean | undefined;
    /** Visual style: flip-clock tiles (default) or an analog face. */
    style: "flip" | "analog";
}

export interface ClockHands {
    /** Degrees clockwise from 12 o'clock. */
    hour: number;
    minute: number;
    second: number;
}

export interface ClockParts {
    /** One zero-padded string per unit: [hh, mm] or [hh, mm, ss]. */
    tiles: string[];
    /** "AM"/"PM" in 12-hour mode, else "". */
    meridiem: string;
    /** Caption line, e.g. "Tuesday | May 26, 2026". */
    caption: string;
}

/** Read the widget config from a `location.search` string. */
export function parseClockConfig(search: string): ClockConfig {
    const p = new URLSearchParams(search);
    const show = p.get("show");
    const tz = p.get("tz");
    return {
        show: show === "time" || show === "date" ? show : "both",
        seconds: p.get("seconds") === "1",
        tz: tz ?? undefined,
        h24: p.get("h24") === "1" ? true : undefined,
        style: p.get("style") === "analog" ? "analog" : "flip",
    };
}

/**
 * Hand angles (degrees clockwise from 12) for an analog face, timezone-aware.
 * `locale` only affects the numeric extraction and defaults to a stable one.
 */
export function clockAngles(
    now: Date,
    config: ClockConfig,
    locale = "en-US",
): ClockHands {
    const tz = safeTimeZone(config.tz);
    const opts: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    };
    if (tz) opts.timeZone = tz;
    const parts = new Intl.DateTimeFormat(locale, opts).formatToParts(now);
    const h = Number(part(parts, "hour")) % 12;
    const m = Number(part(parts, "minute"));
    const s = Number(part(parts, "second"));
    return {
        hour: (h + m / 60) * 30,
        minute: (m + s / 60) * 6,
        second: s * 6,
    };
}

/** Return `tz` only if Intl accepts it, so a bad `?tz=` falls back to local. */
export function safeTimeZone(tz: string | undefined): string | undefined {
    if (!tz) return undefined;
    try {
        new Intl.DateTimeFormat([], { timeZone: tz });
        return tz;
    } catch {
        return undefined;
    }
}

function part(parts: Intl.DateTimeFormatPart[], type: string): string {
    return parts.find((p) => p.type === type)?.value ?? "";
}

const pad2 = (s: string): string => s.padStart(2, "0");

/**
 * Format `now` into the tiles + caption for the given config. `locale` is
 * exposed for deterministic tests; the widget uses the viewer's default.
 */
export function clockParts(
    now: Date,
    config: ClockConfig,
    locale?: string,
): ClockParts {
    const tz = safeTimeZone(config.tz);

    const timeOpts: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
    };
    if (config.seconds) timeOpts.second = "2-digit";
    if (config.h24) timeOpts.hour12 = false;
    if (tz) timeOpts.timeZone = tz;
    const time = new Intl.DateTimeFormat(locale, timeOpts).formatToParts(now);

    const tiles = [pad2(part(time, "hour")), pad2(part(time, "minute"))];
    if (config.seconds) tiles.push(pad2(part(time, "second")));

    const dateOpts: Intl.DateTimeFormatOptions = {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    };
    if (tz) dateOpts.timeZone = tz;
    const date = new Intl.DateTimeFormat(locale, dateOpts).formatToParts(now);
    const caption =
        `${part(date, "weekday")} | ${part(date, "month")} ` +
        `${part(date, "day")}, ${part(date, "year")}`;

    return { tiles, meridiem: part(time, "dayPeriod"), caption };
}
