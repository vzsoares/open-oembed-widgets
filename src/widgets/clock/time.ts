/** What the clock renders: tiles only, caption only, or both. */
export type Show = "time" | "date" | "both";

export interface ClockConfig {
    show: Show;
    /** Include a seconds tile (and tick every second). */
    seconds: boolean;
    /** IANA timezone (e.g. "America/Sao_Paulo"); undefined = viewer's local. */
    tz: string | undefined;
    /** Force a 24-hour clock; undefined = follow the locale. */
    h24: boolean | undefined;
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
