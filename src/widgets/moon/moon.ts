/**
 * Moon phase, computed deterministically from a date — no API. We model the
 * lunation as a uniform synodic cycle anchored to a known new moon, which is
 * accurate to within a few hours for display purposes.
 */

/** Mean length of a synodic month (new moon → new moon), in days. */
const SYNODIC_DAYS = 29.530588853;

/** A reference new moon: 2000-01-06 18:14 UTC. */
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

const PHASE_NAMES = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
] as const;

export type PhaseName = (typeof PHASE_NAMES)[number];

export interface MoonView {
    /** Days into the current lunation, [0, SYNODIC_DAYS). */
    age: number;
    /** Position in the cycle, [0, 1): 0 new, 0.25 first quarter, 0.5 full. */
    fraction: number;
    /** Lit disc fraction, 0 (new) → 1 (full). */
    illumination: number;
    name: PhaseName;
    /** True while the Moon is growing (new → full). */
    waxing: boolean;
}

/** Days into the current lunation for an instant. Always in [0, SYNODIC_DAYS). */
export function moonAge(nowMs: number): number {
    const days = (nowMs - REFERENCE_NEW_MOON) / 86_400_000;
    return ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
}

/** Resolve the full view (age, illumination, name) for an instant. */
export function moonView(nowMs: number): MoonView {
    const age = moonAge(nowMs);
    const fraction = age / SYNODIC_DAYS;
    const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;
    // Round to the nearest eighth so each named phase owns an equal slice.
    const name = PHASE_NAMES[Math.round(fraction * 8) % 8] ?? "New Moon";
    return { age, fraction, illumination, name, waxing: fraction < 0.5 };
}

/**
 * SVG path for the lit portion of a unit moon disc (radius `r`, centred at the
 * origin). Combines the fully-lit limb (a semicircle) with the terminator (a
 * half-ellipse whose width shrinks to zero at the quarters). Northern-hemisphere
 * convention: waxing lights the right limb, waning the left.
 */
export function litPath(fraction: number, r: number): string {
    const f = ((fraction % 1) + 1) % 1;
    const waxing = f < 0.5;
    const gibbous = f > 0.25 && f < 0.75;
    // Terminator ellipse half-width: r at new/full, 0 at the quarters.
    const rx = r * Math.abs(Math.cos(2 * Math.PI * f));

    // Outer limb sweep: right side (clockwise) when waxing, left when waning.
    const outer = waxing ? 1 : 0;
    // The terminator bows the same way as the limb for a gibbous moon, the
    // opposite way for a crescent.
    const inner = gibbous ? outer : 1 - outer;

    const top = `0 ${-r}`;
    const bottom = `0 ${r}`;
    return (
        `M ${top} ` +
        `A ${r} ${r} 0 0 ${outer} ${bottom} ` +
        `A ${rx} ${r} 0 0 ${inner} ${top} Z`
    );
}
