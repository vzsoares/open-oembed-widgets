export interface ButtonDef {
    text: string;
    /** Sanitized absolute URL (http/https/mailto only). */
    url: string;
    /** Normalized "#rrggbb", or "" for the default monochrome style. */
    color: string;
    /** Contrasting text color for `color`, or "". */
    textColor: string;
}

export type Layout = "list" | "row";

export interface LinksConfig {
    buttons: ButtonDef[];
    layout: Layout;
}

/** Allow only safe, absolute link schemes — never javascript:, data:, etc. */
export function sanitizeUrl(url: string): string {
    if (!url) return "";
    try {
        const u = new URL(url);
        if (
            u.protocol === "http:" ||
            u.protocol === "https:" ||
            u.protocol === "mailto:"
        ) {
            return url;
        }
    } catch {
        // not an absolute URL
    }
    return "";
}

/** Accept #rgb / #rrggbb (with or without #); reject names so contrast works. */
export function normalizeColor(color: string): string {
    if (!color) return "";
    let hex = color.startsWith("#") ? color.slice(1) : color;
    if (/^[0-9a-f]{3}$/i.test(hex)) {
        hex = hex
            .split("")
            .map((c) => c + c)
            .join("");
    }
    return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : "";
}

/** Black or white, whichever contrasts better with `bgHex` ("#rrggbb"). */
export function textColorFor(bgHex: string): string {
    const r = Number.parseInt(bgHex.slice(1, 3), 16);
    const g = Number.parseInt(bgHex.slice(3, 5), 16);
    const b = Number.parseInt(bgHex.slice(5, 7), 16);
    // Perceived luminance (YIQ); >0.6 is "light" -> dark text.
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? "#000000" : "#ffffff";
}

/** Parse one `text|url|color` button spec, or null if text/url are unusable. */
export function parseButton(raw: string): ButtonDef | null {
    const parts = raw.split("|");
    const text = (parts[0] ?? "").trim();
    const url = sanitizeUrl((parts[1] ?? "").trim());
    if (!text || !url) return null;
    const color = normalizeColor((parts[2] ?? "").trim());
    return { text, url, color, textColor: color ? textColorFor(color) : "" };
}

const DEMO: ButtonDef[] = [
    {
        text: "GitHub",
        url: "https://github.com/vzsoares",
        color: "",
        textColor: "",
    },
    {
        text: "Website",
        url: "https://vzsoares.github.io/open-oembed-widgets/",
        color: "",
        textColor: "",
    },
];

/**
 * Buttons come from a single `?btns=` value: `text|url|color` specs separated
 * by `;`. With none provided, a small demo set renders (so the gallery preview
 * shows something).
 */
export function parseLinksConfig(search: string): LinksConfig {
    const p = new URLSearchParams(search);
    const raw = p.get("btns") ?? "";
    const buttons = raw
        .split(";")
        .map((s) => parseButton(s.trim()))
        .filter((b): b is ButtonDef => b !== null);
    return {
        buttons: buttons.length > 0 ? buttons : DEMO,
        layout: p.get("layout") === "row" ? "row" : "list",
    };
}
