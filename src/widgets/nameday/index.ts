import Alpine from "alpinejs";
import "../../lib/fit";
import { alignedInterval } from "../../lib/interval";
import { applyThemeFromQuery } from "../../lib/theme";
import { type Lang, type NameDayView, nameDayView, parseLang } from "./nameday";

applyThemeFromQuery();

const params = new URLSearchParams(window.location.search);
const lang: Lang = parseLang(params.get("lang"));

/** Optional `?date=YYYY-MM-DD` (local) pins the day; otherwise it's "today". */
function initialNow(value: string | null): number {
    const ymd = value && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (ymd) {
        return new Date(
            Number(ymd[1]),
            Number(ymd[2]) - 1,
            Number(ymd[3]),
            12,
        ).getTime();
    }
    return Date.now();
}

const pinned = params.has("date");
const start = initialNow(params.get("date"));

interface NameDayWidget {
    now: number;
    stop: (() => void) | null;
    init(): void;
    destroy(): void;
    readonly view: NameDayView;
}

Alpine.data(
    "nameDayWidget",
    (): NameDayWidget => ({
        now: start,
        stop: null,

        // The name day only changes at midnight; a minute tick keeps a live
        // widget current. A pinned `?date` never ticks.
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
            return nameDayView(lang, new Date(this.now));
        },
    }),
);

Alpine.start();
