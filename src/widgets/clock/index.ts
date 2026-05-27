import Alpine from "alpinejs";
import "../../lib/fit";
import { alignedInterval } from "../../lib/interval";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    type ClockConfig,
    type ClockHands,
    type ClockParts,
    clockAngles,
    clockParts,
    parseClockConfig,
} from "./time";

applyThemeFromQuery();

const config = parseClockConfig(window.location.search);

interface ClockWidget {
    config: ClockConfig;
    now: Date;
    stop: (() => void) | null;
    init(): void;
    destroy(): void;
    readonly parts: ClockParts;
    readonly angles: ClockHands;
    readonly showTime: boolean;
    readonly showDate: boolean;
}

Alpine.data(
    "clockWidget",
    (): ClockWidget => ({
        config,
        now: new Date(),
        stop: null,

        // Tick on the second boundary when seconds show, else the minute
        // boundary — aligned and self-correcting (see lib/interval).
        init() {
            const step = this.config.seconds ? 1000 : 60_000;
            this.stop = alignedInterval(step, () => {
                this.now = new Date();
            });
        },

        destroy() {
            this.stop?.();
        },

        get parts() {
            return clockParts(this.now, this.config);
        },

        get angles() {
            return clockAngles(this.now, this.config);
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
