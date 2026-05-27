import { describe, expect, test } from "vitest";
import {
    apiUrl,
    type FetchLike,
    fetchCard,
    formatCount,
    parseCard,
    parseGitHubConfig,
} from "./github";

describe("parseGitHubConfig", () => {
    test("defaults to the fallback user", () => {
        expect(parseGitHubConfig("")).toEqual({
            kind: "user",
            target: "vzsoares",
        });
    });

    test("?repo wins over ?user", () => {
        expect(parseGitHubConfig("?user=foo&repo=bar/baz")).toEqual({
            kind: "repo",
            target: "bar/baz",
        });
    });
});

describe("apiUrl", () => {
    test("builds user and repo endpoints", () => {
        expect(apiUrl({ kind: "user", target: "octocat" })).toBe(
            "https://api.github.com/users/octocat",
        );
        expect(apiUrl({ kind: "repo", target: "a/b" })).toBe(
            "https://api.github.com/repos/a/b",
        );
    });
});

describe("formatCount", () => {
    test("compacts thousands and millions", () => {
        expect(formatCount(999)).toBe("999");
        expect(formatCount(1000)).toBe("1k");
        expect(formatCount(1200)).toBe("1.2k");
        expect(formatCount(12000)).toBe("12k");
        expect(formatCount(1_500_000)).toBe("1.5M");
        expect(formatCount(Number.NaN)).toBe("0");
    });
});

describe("parseCard", () => {
    test("user card", () => {
        const card = parseCard(
            {
                login: "octocat",
                name: "The Octocat",
                avatar_url: "https://x/a.png",
                html_url: "https://github.com/octocat",
                followers: 1200,
                public_repos: 8,
            },
            "user",
        );
        expect(card.title).toBe("The Octocat");
        expect(card.subtitle).toBe("@octocat");
        expect(card.stats).toEqual([
            { label: "Followers", value: "1.2k" },
            { label: "Repos", value: "8" },
        ]);
        expect(card.tag).toBe("");
    });

    test("repo card with language tag", () => {
        const card = parseCard(
            {
                full_name: "vzsoares/open-oembed-widgets",
                description: "Tiny widgets",
                language: "TypeScript",
                stargazers_count: 42,
                forks_count: 3,
                html_url: "https://github.com/vzsoares/open-oembed-widgets",
                owner: { avatar_url: "https://x/o.png" },
            },
            "repo",
        );
        expect(card.title).toBe("vzsoares/open-oembed-widgets");
        expect(card.subtitle).toBe("Tiny widgets");
        expect(card.tag).toBe("TypeScript");
        expect(card.stats[0]).toEqual({ label: "Stars", value: "42" });
    });

    test("throws on a malformed payload", () => {
        expect(() => parseCard({}, "user")).toThrow();
        expect(() => parseCard({}, "repo")).toThrow();
    });
});

describe("fetchCard", () => {
    test("parses a successful response", async () => {
        const fetchImpl: FetchLike = async () =>
            new Response(JSON.stringify({ login: "octocat", followers: 1 }), {
                status: 200,
            });
        const card = await fetchCard(
            { kind: "user", target: "octocat" },
            { fetchImpl },
        );
        expect(card.subtitle).toBe("@octocat");
    });

    test("throws on rate-limit / error responses", async () => {
        const fetchImpl: FetchLike = async () =>
            new Response("rate limited", { status: 403 });
        await expect(
            fetchCard({ kind: "user", target: "octocat" }, { fetchImpl }),
        ).rejects.toThrow();
    });
});
