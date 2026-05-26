/**
 * Milliseconds from `nowMs` to the next `stepMs` boundary, always in the range
 * `(0, stepMs]`. Exactly on a boundary it returns a full `stepMs` rather than
 * `0`, so a tick loop never spins.
 */
export function alignDelay(stepMs: number, nowMs: number): number {
    const remainder = nowMs % stepMs;
    return remainder === 0 ? stepMs : stepMs - remainder;
}

/**
 * A self-correcting tick aligned to wall-clock boundaries: it fires on each
 * `stepMs` boundary instead of drifting, and re-aligns after the tab is
 * throttled (rather than firing a burst of backlogged timers). Returns a
 * function that stops the loop.
 */
export function alignedInterval(
    stepMs: number,
    onTick: () => void,
): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (): void => {
        timer = setTimeout(
            () => {
                onTick();
                schedule();
            },
            alignDelay(stepMs, Date.now()),
        );
    };
    schedule();
    return () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };
}
