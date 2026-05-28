import Alpine from "alpinejs";
import "../../lib/fit";
import { alignedInterval } from "../../lib/interval";
import { applyThemeFromQuery } from "../../lib/theme";
import { litPath, type MoonView, moonView } from "./moon";

applyThemeFromQuery();

/** Radius of the moon disc within the 0 0 100 100 viewBox. */
const R = 40;

/** Optional `?date=YYYY-MM-DD` (local) pins the phase; otherwise it's "now". */
function initialNow(search: string): number {
    const value = new URLSearchParams(search).get("date");
    const ymd = value && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (ymd) {
        return new Date(
            Number(ymd[1]),
            Number(ymd[2]) - 1,
            Number(ymd[3]),
            12,
        ).getTime();
    }
    const ms = value ? Date.parse(value) : Number.NaN;
    return Number.isNaN(ms) ? Date.now() : ms;
}

const pinned = new URLSearchParams(window.location.search).has("date");
const start = initialNow(window.location.search);

interface MoonWidget {
    now: number;
    stop: (() => void) | null;
    init(): void;
    destroy(): void;
    readonly view: MoonView;
    readonly lit: string;
    readonly illumText: string;
}

Alpine.data(
    "moonWidget",
    (): MoonWidget => ({
        now: start,
        stop: null,

        // The phase drifts slowly; a minute tick keeps a live widget current
        // without busy-work. A pinned `?date` never ticks.
        init() {
            if (pinned) return;
            this.stop = alignedInterval(60_000, () => {
                this.now = Date.now();
            });
        },

        destroy() {
            this.stop?.();
        },

        get view() {
            return moonView(this.now);
        },

        get lit() {
            return litPath(this.view.fraction, R);
        },

        get illumText() {
            return `${Math.round(this.view.illumination * 100)}% lit`;
        },
    }),
);

Alpine.start();
