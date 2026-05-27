import { describe, expect, test } from "vitest";
import {
    normalizeColor,
    parseButton,
    parseLinksConfig,
    sanitizeUrl,
    textColorFor,
} from "./links";

describe("sanitizeUrl", () => {
    test("allows http/https/mailto", () => {
        expect(sanitizeUrl("https://x.com")).toBe("https://x.com");
        expect(sanitizeUrl("http://x.com")).toBe("http://x.com");
        expect(sanitizeUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    });

    test("rejects javascript:, data:, and relative URLs", () => {
        expect(sanitizeUrl("javascript:alert(1)")).toBe("");
        expect(sanitizeUrl("data:text/html,x")).toBe("");
        expect(sanitizeUrl("/relative")).toBe("");
        expect(sanitizeUrl("")).toBe("");
    });
});

describe("normalizeColor", () => {
    test("normalizes hex with/without # and expands shorthand", () => {
        expect(normalizeColor("#1D9BF0")).toBe("#1d9bf0");
        expect(normalizeColor("1d9bf0")).toBe("#1d9bf0");
        expect(normalizeColor("#abc")).toBe("#aabbcc");
    });

    test("rejects names and garbage", () => {
        expect(normalizeColor("red")).toBe("");
        expect(normalizeColor("")).toBe("");
    });
});

describe("textColorFor", () => {
    test("dark text on light bg, white text on dark bg", () => {
        expect(textColorFor("#ffffff")).toBe("#000000");
        expect(textColorFor("#000000")).toBe("#ffffff");
        expect(textColorFor("#1d9bf0")).toBe("#ffffff");
    });
});

describe("parseButton", () => {
    test("parses text|url|color with contrast", () => {
        expect(parseButton("GitHub|https://github.com/x|#1d9bf0")).toEqual({
            text: "GitHub",
            url: "https://github.com/x",
            color: "#1d9bf0",
            textColor: "#ffffff",
        });
    });

    test("color is optional", () => {
        const b = parseButton("Site|https://x.com");
        expect(b?.color).toBe("");
        expect(b?.textColor).toBe("");
    });

    test("drops buttons with no text or an unsafe URL", () => {
        expect(parseButton("|https://x.com")).toBeNull();
        expect(parseButton("Bad|javascript:alert(1)")).toBeNull();
    });
});

describe("parseLinksConfig", () => {
    test("falls back to demo buttons and list layout", () => {
        const c = parseLinksConfig("");
        expect(c.layout).toBe("list");
        expect(c.buttons.length).toBeGreaterThan(0);
    });

    test("parses multiple ;-separated buttons and row layout", () => {
        const c = parseLinksConfig(
            "?btns=A|https://a.com;B|https://b.com|000000&layout=row",
        );
        expect(c.layout).toBe("row");
        expect(c.buttons.map((b) => b.text)).toEqual(["A", "B"]);
        expect(c.buttons[1]?.color).toBe("#000000");
    });

    test("skips invalid entries but keeps valid ones", () => {
        const c = parseLinksConfig("?btns=Good|https://a.com;Bad|ftp://x;|y");
        expect(c.buttons.map((b) => b.text)).toEqual(["Good"]);
    });
});
