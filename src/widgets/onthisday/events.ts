const FEEDS = ["selected", "events", "births", "deaths", "holidays"] as const;
export type Feed = (typeof FEEDS)[number];

export interface HistEvent {
    /** Year of the event, or null (e.g. holidays have none). */
    year: number | null;
    text: string;
}

export interface OnThisDayConfig {
    feed: Feed;
    /** Wikipedia language subdomain, e.g. "en". */
    lang: string;
}

export type FetchLike = (
    input: string | URL | Request,
    init?: RequestInit,
) => Promise<Response>;

function isFeed(value: string | null): value is Feed {
    return value !== null && FEEDS.some((f) => f === value);
}

export function parseOnThisDayConfig(search: string): OnThisDayConfig {
    const p = new URLSearchParams(search);
    const feed = p.get("type");
    const lang = p.get("lang");
    return {
        feed: isFeed(feed) ? feed : "selected",
        lang: lang && /^[a-z]{2,3}$/.test(lang) ? lang : "en",
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Wikimedia "on this day" REST endpoint for a feed + month/day. */
export function feedUrl(lang: string, feed: Feed, date: Date): string {
    const mm = pad2(date.getMonth() + 1);
    const dd = pad2(date.getDate());
    return `https://${lang}.wikipedia.org/api/rest_v1/feed/onthisday/${feed}/${mm}/${dd}`;
}

/** Normalize the `{ [feed]: [{ text, year }] }` payload into events. */
export function parseOnThisDay(data: unknown, feed: Feed): HistEvent[] {
    if (!isRecord(data)) throw new Error("bad shape");
    const list = data[feed];
    if (!Array.isArray(list)) throw new Error(`missing ${feed}`);
    const events: HistEvent[] = [];
    for (const item of list) {
        if (!isRecord(item)) continue;
        const { text, year } = item;
        if (typeof text !== "string" || text.trim() === "") continue;
        events.push({
            year: typeof year === "number" ? year : null,
            text: text.replace(/\s+/g, " ").trim(),
        });
    }
    if (events.length === 0) throw new Error("no events");
    return events;
}

const DEFAULT_TIMEOUT_MS = 8000;

export interface FetchOptions {
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

/** Fetch the events for `date`, normalized; throws if none are usable. */
export async function fetchOnThisDay(
    lang: string,
    feed: Feed,
    date: Date,
    opts: FetchOptions = {},
): Promise<HistEvent[]> {
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetchImpl(feedUrl(lang, feed, date), {
            signal: controller.signal,
            headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return parseOnThisDay(await res.json(), feed);
    } finally {
        clearTimeout(timer);
    }
}
