import Alpine from "alpinejs";
import "../../lib/fit";
import { durationSegments, type Segment } from "../../lib/duration";
import { alignedInterval } from "../../lib/interval";
import { applyThemeFromQuery } from "../../lib/theme";
import { isDone, parseTimerConfig, type TimerConfig, timerMs } from "./config";

applyThemeFromQuery();

const config = parseTimerConfig(window.location.search);

interface TimerWidget {
    config: TimerConfig;
    now: number;
    stop: (() => void) | null;
    init(): void;
    destroy(): void;
    readonly done: boolean;
    readonly segments: Segment[];
}

Alpine.data(
    "timerWidget",
    (): TimerWidget => ({
        config,
        now: Date.now(),
        stop: null,

        init() {
            const step = this.config.units === "dhms" ? 1000 : 60_000;
            this.stop = alignedInterval(step, () => {
                this.now = Date.now();
            });
        },

        destroy() {
            this.stop?.();
        },

        get done() {
            return isDone(this.config, this.now);
        },

        get segments() {
            return durationSegments(
                timerMs(this.config, this.now),
                this.config.units,
            );
        },
    }),
);

Alpine.start();
