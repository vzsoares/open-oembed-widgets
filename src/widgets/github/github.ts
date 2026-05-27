export type CardKind = "user" | "repo";

export interface GitHubConfig {
    kind: CardKind;
    /** A user login, or "owner/repo". */
    target: string;
}

export interface Stat {
    label: string;
    value: string;
}

export interface Card {
    title: string;
    subtitle: string;
    avatarUrl: string;
    url: string;
    stats: Stat[];
    /** e.g. a repo's primary language; "" if none. */
    tag: string;
}

export type FetchLike = (
    input: string | URL | Request,
    init?: RequestInit,
) => Promise<Response>;

const DEFAULT_USER = "vzsoares";

export function parseGitHubConfig(search: string): GitHubConfig {
    const p = new URLSearchParams(search);
    const repo = p.get("repo")?.trim();
    if (repo) return { kind: "repo", target: repo };
    const user = p.get("user")?.trim();
    return { kind: "user", target: user || DEFAULT_USER };
}

export function apiUrl(config: GitHubConfig): string {
    const path = config.kind === "repo" ? "repos" : "users";
    return `https://api.github.com/${path}/${config.target}`;
}

/** Compact a count: 1234 -> "1.2k", 1_500_000 -> "1.5M". */
export function formatCount(n: number): string {
    if (!Number.isFinite(n)) return "0";
    const abs = Math.abs(n);
    const trim = (v: number): string => String(Math.round(v * 10) / 10);
    if (abs < 1000) return String(Math.trunc(n));
    if (abs < 1_000_000) return `${trim(n / 1000)}k`;
    return `${trim(n / 1_000_000)}M`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function str(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function count(value: unknown): string {
    return formatCount(typeof value === "number" ? value : 0);
}

export function parseCard(data: unknown, kind: CardKind): Card {
    if (!isRecord(data)) throw new Error("bad shape");

    if (kind === "repo") {
        const full = str(data.full_name);
        if (!full) throw new Error("missing repo");
        const owner = isRecord(data.owner) ? data.owner : {};
        return {
            title: full,
            subtitle: str(data.description),
            avatarUrl: str(owner.avatar_url),
            url: str(data.html_url),
            stats: [
                { label: "Stars", value: count(data.stargazers_count) },
                { label: "Forks", value: count(data.forks_count) },
            ],
            tag: str(data.language),
        };
    }

    const login = str(data.login);
    if (!login) throw new Error("missing user");
    return {
        title: str(data.name) || login,
        subtitle: `@${login}`,
        avatarUrl: str(data.avatar_url),
        url: str(data.html_url),
        stats: [
            { label: "Followers", value: count(data.followers) },
            { label: "Repos", value: count(data.public_repos) },
        ],
        tag: "",
    };
}

const DEFAULT_TIMEOUT_MS = 8000;

export interface FetchOptions {
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

export async function fetchCard(
    config: GitHubConfig,
    opts: FetchOptions = {},
): Promise<Card> {
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetchImpl(apiUrl(config), {
            signal: controller.signal,
            headers: { accept: "application/vnd.github+json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return parseCard(await res.json(), config.kind);
    } finally {
        clearTimeout(timer);
    }
}
