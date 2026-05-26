import fallback from "./fallback.json";

export type Lang = "en" | "pt";

export interface Verse {
    reference: string;
    text: string;
    translation: string;
    lang: Lang;
    source: "bible-api" | "offline";
}

interface RawVerse {
    reference: string;
    text: string;
    translation: string;
}

/** bible-api.com translation ids: World English Bible / João Ferreira de Almeida. */
const TRANSLATION: Record<Lang, string> = { en: "web", pt: "almeida" };

/** Last-resort verse if the bundled list is somehow empty (shouldn't happen). */
const LAST_RESORT: Record<Lang, RawVerse> = {
    en: {
        reference: "John 3:16",
        text: "For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.",
        translation: "World English Bible",
    },
    pt: {
        reference: "João 3:16",
        text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
        translation: "João Ferreira de Almeida",
    },
};

export type FetchLike = (
    input: string | URL | Request,
    init?: RequestInit,
) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function str(value: unknown): string {
    if (typeof value !== "string") throw new Error("expected a string");
    return value;
}

function num(value: unknown): number {
    const n = typeof value === "string" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n)) {
        throw new Error("expected a finite number");
    }
    return n;
}

const DEFAULT_TIMEOUT_MS = 8000;

async function fetchJson(
    url: string,
    timeoutMs: number,
    fetchImpl: FetchLike,
): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetchImpl(url, {
            signal: controller.signal,
            headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

/** Normalize bible-api.com's `/data/{translation}/random` response. */
export function parseRandomVerse(data: unknown, lang: Lang): Verse {
    if (!isRecord(data)) throw new Error("bad shape");
    const verse = data.random_verse;
    const translation = data.translation;
    if (!isRecord(verse) || !isRecord(translation)) {
        throw new Error("missing verse");
    }
    return {
        reference: `${str(verse.book)} ${num(verse.chapter)}:${num(verse.verse)}`,
        text: str(verse.text).replace(/\s+/g, " ").trim(),
        translation: str(translation.name),
        lang,
        source: "bible-api",
    };
}

/** Pick a verse from the bundled offline list (used when the API is down). */
export function offlineVerse(
    lang: Lang,
    pick: () => number = Math.random,
): Verse {
    const list = fallback[lang];
    const item = list[Math.floor(pick() * list.length)] ?? LAST_RESORT[lang];
    return {
        reference: item.reference,
        text: item.text,
        translation: item.translation,
        lang,
        source: "offline",
    };
}

export interface FetchVerseOptions {
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

/**
 * Fetch a random verse for the language. Falls back to a bundled verse if the
 * API is unreachable/rate-limited, so the widget always renders something.
 */
export async function fetchVerse(
    lang: Lang,
    opts: FetchVerseOptions = {},
): Promise<Verse> {
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    try {
        const url = `https://bible-api.com/data/${TRANSLATION[lang]}/random`;
        return parseRandomVerse(
            await fetchJson(url, timeoutMs, fetchImpl),
            lang,
        );
    } catch {
        return offlineVerse(lang);
    }
}
