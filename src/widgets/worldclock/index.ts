import Alpine from "alpinejs";
import "../../lib/fit";
import { alignedInterval } from "../../lib/interval";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    parseWorldClockConfig,
    type WorldClockConfig,
    type ZoneClock,
    zoneClocks,
} from "./worldclock";

applyThemeFromQuery();

const config = parseWorldClockConfig(window.location.search);

interface WorldClockWidget {
    config: WorldClockConfig;
    now: Date;
    stop: (() => void) | null;
    init(): void;
    destroy(): void;
    readonly clocks: ZoneClock[];
}

Alpine.data(
    "worldClockWidget",
    (): WorldClockWidget => ({
        config,
        now: new Date(),
        stop: null,

        // Second boundary when seconds show, else the minute — aligned and
        // self-correcting (see lib/interval).
        init() {
            const step = this.config.seconds ? 1000 : 60_000;
            this.stop = alignedInterval(step, () => {
                this.now = new Date();
            });
        },

        destroy() {
            this.stop?.();
        },

        get clocks() {
            return zoneClocks(this.now, this.config);
        },
    }),
);

Alpine.start();
