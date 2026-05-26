export type Theme = "light" | "dark";

function prefersDark(): boolean {
    return (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
}

/** The theme currently in effect: an explicit override if set, else the OS. */
export function getResolvedTheme(): Theme {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") return attr;
    return prefersDark() ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme;
}

export function toggleTheme(): Theme {
    const next: Theme = getResolvedTheme() === "dark" ? "light" : "dark";
    setTheme(next);
    return next;
}

/**
 * Apply a `?theme=light|dark` override. Notion iframes don't reliably inherit
 * the page color scheme, so the embed URL can pin one explicitly.
 */
export function applyThemeFromQuery(): void {
    const param = new URLSearchParams(window.location.search).get("theme");
    if (param === "light" || param === "dark") setTheme(param);
}
