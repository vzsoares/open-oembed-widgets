import Alpine from "alpinejs";
import "../../lib/fit";
import { alignedInterval } from "../../lib/interval";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    type CounterConfig,
    type CounterView,
    counterView,
    parseCounterConfig,
} from "./counter";

applyThemeFromQuery();

const config = parseCounterConfig(window.location.search);

interface CounterWidget {
    config: CounterConfig;
    now: number;
    stop: (() => void) | null;
    init(): void;
    destroy(): void;
    readonly view: CounterView;
}

Alpine.data(
    "counterWidget",
    (): CounterWidget => ({
        config,
        now: Date.now(),
        stop: null,

        // A minute tick is plenty — the day count only changes at midnight.
        init() {
            this.stop = alignedInterval(60_000, () => {
                this.now = Date.now();
            });
        },

        destroy() {
            this.stop?.();
        },

        get view() {
            return counterView(this.config, this.now);
        },
    }),
);

Alpine.start();
