/** Advance through the list in order, or jump to a random other image. */
export type RotateMode = "sequential" | "random";
/** How each image fills the frame. */
export type Fit = "cover" | "contain";

export interface ImagesConfig {
    /** Parsed image URLs. May be empty — the widget supplies a demo fallback. */
    src: string[];
    mode: RotateMode;
    /** Seconds per image, clamped to a sane range. */
    every: number;
    fit: Fit;
}

const DEFAULT_EVERY = 8;

/** Split a `?src=a,b,c` value into trimmed, non-empty URLs. */
export function parseSrcList(raw: string | null): string[] {
    if (!raw) return [];
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Coerce `?every=` to a positive number of seconds (1s–1h), else the default. */
export function clampEvery(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return DEFAULT_EVERY;
    return Math.min(Math.max(value, 1), 3600);
}

export function parseImagesConfig(search: string): ImagesConfig {
    const p = new URLSearchParams(search);
    return {
        src: parseSrcList(p.get("src")),
        mode: p.get("mode") === "random" ? "random" : "sequential",
        every: clampEvery(Number(p.get("every"))),
        fit: p.get("fit") === "contain" ? "contain" : "cover",
    };
}

/**
 * The next index to show. Sequential wraps around; random returns a *different*
 * index than the current one (never repeats the image back-to-back).
 */
export function nextIndex(
    current: number,
    length: number,
    mode: RotateMode,
    rand: () => number = Math.random,
): number {
    if (length <= 1) return 0;
    if (mode === "sequential") return (current + 1) % length;
    // Pick uniformly among the other length-1 slots.
    let i = Math.floor(rand() * (length - 1));
    if (i >= current) i += 1;
    return i;
}
