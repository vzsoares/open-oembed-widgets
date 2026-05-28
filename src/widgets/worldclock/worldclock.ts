import { safeTimeZone } from "../clock/time";

/** A passive multi-timezone clock — same Intl machinery as the single clock. */
export interface WorldClockConfig {
    /** IANA zone tokens (or "local"); falls back to a sensible default set. */
    zones: string[];
    seconds: boolean;
    /** Force 24-hour; undefined follows the locale. */
    h24: boolean | undefined;
}

export interface ZoneClock {
    label: string;
    /** "08:13" or "08:13:42". "—" when the zone string is invalid. */
    time: string;
    /** "AM"/"PM" in 12-hour mode, else "". */
    meridiem: string;
    /** Short date in that zone, e.g. "Tue, May 26". */
    caption: string;
    /** False when an explicit zone token was not a real IANA zone. */
    valid: boolean;
}

const DEFAULT_ZONES = ["America/Sao_Paulo", "Europe/London", "Asia/Tokyo"];

export function parseWorldClockConfig(search: string): WorldClockConfig {
    const p = new URLSearchParams(search);
    const raw = p.get("tz");
    const zones = raw
        ? raw
              .split(",")
              .map((z) => z.trim())
              .filter(Boolean)
        : [];
    return {
        zones: zones.length ? zones : DEFAULT_ZONES,
        seconds: p.get("seconds") === "1",
        h24: p.get("h24") === "1" ? true : undefined,
    };
}

/** Friendly label from a zone token: last path segment, underscores → spaces. */
export function zoneLabel(zone: string): string {
    if (zone.toLowerCase() === "local") return "Local";
    const seg = zone.split("/").pop() ?? zone;
    return seg.replace(/_/g, " ");
}

function part(parts: Intl.DateTimeFormatPart[], type: string): string {
    return parts.find((p) => p.type === type)?.value ?? "";
}

const pad2 = (s: string): string => s.padStart(2, "0");

/** Resolve a single zone's readout at `now`. */
export function zoneClock(
    now: Date,
    zone: string,
    config: WorldClockConfig,
    locale?: string,
): ZoneClock {
    const isLocal = zone.toLowerCase() === "local";
    const tz = isLocal ? undefined : safeTimeZone(zone);
    const label = zoneLabel(zone);

    // An explicit zone that Intl rejects: show the label but no bogus time.
    if (!isLocal && tz === undefined) {
        return {
            label,
            time: "—",
            meridiem: "",
            caption: "unknown zone",
            valid: false,
        };
    }

    const timeOpts: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
    };
    if (config.seconds) timeOpts.second = "2-digit";
    if (config.h24) timeOpts.hour12 = false;
    if (tz) timeOpts.timeZone = tz;
    const time = new Intl.DateTimeFormat(locale, timeOpts).formatToParts(now);

    const pieces = [pad2(part(time, "hour")), pad2(part(time, "minute"))];
    if (config.seconds) pieces.push(pad2(part(time, "second")));

    const dateOpts: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
    };
    if (tz) dateOpts.timeZone = tz;
    const date = new Intl.DateTimeFormat(locale, dateOpts).formatToParts(now);
    const caption = `${part(date, "weekday")}, ${part(date, "month")} ${part(date, "day")}`;

    return {
        label,
        time: pieces.join(":"),
        meridiem: part(time, "dayPeriod"),
        caption,
        valid: true,
    };
}

/** Resolve every configured zone at `now`. */
export function zoneClocks(
    now: Date,
    config: WorldClockConfig,
    locale?: string,
): ZoneClock[] {
    return config.zones.map((z) => zoneClock(now, z, config, locale));
}
