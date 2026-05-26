import Alpine from "alpinejs";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    type ClockConfig,
    type ClockParts,
    clockParts,
    parseClockConfig,
} from "./time";

applyThemeFromQuery();

const config = parseClockConfig(window.location.search);

interface ClockWidget {
    config: ClockConfig;
    now: Date;
    timer: ReturnType<typeof setTimeout> | null;
    init(): void;
    destroy(): void;
    tick(): void;
    readonly parts: ClockParts;
    readonly showTime: boolean;
    readonly showDate: boolean;
}

Alpine.data(
    "clockWidget",
    (): ClockWidget => ({
        config,
        now: new Date(),
        timer: null,

        init() {
            this.tick();
        },

        destroy() {
            if (this.timer !== null) clearTimeout(this.timer);
        },

        // Self-correcting: align the next tick to the upcoming second (or
        // minute) boundary so the display doesn't drift and survives tab
        // throttling instead of accumulating late timers.
        tick() {
            this.now = new Date();
            const step = this.config.seconds ? 1000 : 60_000;
            const delay = step - (Date.now() % step);
            this.timer = setTimeout(() => this.tick(), delay);
        },

        get parts() {
            return clockParts(this.now, this.config);
        },

        get showTime() {
            return this.config.show !== "date";
        },

        get showDate() {
            return this.config.show !== "time";
        },
    }),
);

Alpine.start();
