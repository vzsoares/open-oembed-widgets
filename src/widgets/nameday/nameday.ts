import rawData from "./data.json";

/**
 * Name days for a given date, from a bundled per-locale calendar (no API).
 * Datasets (MIT-licensed):
 *   cz          — github.com/OzzyCzech/namedays-cs (names only)
 *   sk          — github.com/peterknezek/name-day-calendar (names only)
 *   fr/it/es/en — nameday.abalin.net via github.com/xnekv03/nameday-api
 * All keyed "MM-DD" → list of names; days without a name day are omitted. The
 * fr/it/es calendars are sanctorale-based (a few days carry a feast name rather
 * than personal names); `en` is abalin's loose anglicized set.
 */

export const LOCALES = {
    cz: "Czech",
    sk: "Slovak",
    fr: "French",
    it: "Italian",
    es: "Spanish",
    en: "English",
} as const;
export type Lang = keyof typeof LOCALES;

/** The bundled calendar: locale → "MM-DD" → names. */
const data: Record<Lang, Record<string, string[]>> = rawData;

/** Intl locale used to render the date in the calendar's own language. */
const INTL_LOCALE: Record<Lang, string> = {
    cz: "cs-CZ",
    sk: "sk-SK",
    fr: "fr-FR",
    it: "it-IT",
    es: "es-ES",
    en: "en-US",
};

export interface NameDayView {
    names: string[];
    /** The date in the locale's language, e.g. "29. června". */
    dateText: string;
    lang: Lang;
    localeName: string;
}

/** Resolve `?lang=`; defaults to Czech. */
export function parseLang(value: string | null): Lang {
    const v = (value ?? "").trim().toLowerCase();
    return v in LOCALES ? (v as Lang) : "cz";
}

/** Local month-day key, e.g. "06-29". */
export function mmdd(date: Date): string {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${m}-${d}`;
}

/** Name(s) celebrated on `date` in `lang` (empty when the day has none). */
export function namesFor(lang: Lang, date: Date): string[] {
    return data[lang]?.[mmdd(date)] ?? [];
}

/** Render the date in the locale's own language. */
export function dateText(lang: Lang, date: Date): string {
    return new Intl.DateTimeFormat(INTL_LOCALE[lang], {
        day: "numeric",
        month: "long",
    }).format(date);
}

/** Build the full view for `date` in `lang`. */
export function nameDayView(lang: Lang, date: Date): NameDayView {
    return {
        names: namesFor(lang, date),
        dateText: dateText(lang, date),
        lang,
        localeName: LOCALES[lang],
    };
}
