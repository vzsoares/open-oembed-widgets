import quotes from "./quotes.json";

const COLLECTIONS = ["motivation", "wisdom", "stoic", "tech"] as const;
export type Collection = (typeof COLLECTIONS)[number];

export interface Quote {
    text: string;
    author: string;
}

export interface QuoteConfig {
    collection: Collection;
}

function isCollection(value: string | null): value is Collection {
    return value !== null && COLLECTIONS.some((c) => c === value);
}

export function parseQuoteConfig(search: string): QuoteConfig {
    const collection = new URLSearchParams(search).get("collection");
    return { collection: isCollection(collection) ? collection : "motivation" };
}

/** Pick a quote from a bundled collection. `pick` is injectable for tests. */
export function pickQuote(
    collection: Collection,
    pick: () => number = Math.random,
): Quote {
    const list = quotes[collection];
    const item = list[Math.floor(pick() * list.length)] ?? list[0];
    if (!item) return { text: "", author: "" };
    return { text: item.text, author: item.author };
}
