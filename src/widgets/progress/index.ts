import Alpine from "alpinejs";
import { alignedInterval } from "../../lib/interval";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    type ProgressConfig,
    type ProgressView,
    parseProgressConfig,
    progressView,
} from "./progress";

applyThemeFromQuery();

const config = parseProgressConfig(window.location.search);

interface ProgressWidget {
    config: ProgressConfig;
    now: number;
    stop: (() => void) | null;
    init(): void;
    destroy(): void;
    readonly view: ProgressView;
}

Alpine.data(
    "progressWidget",
    (): ProgressWidget => ({
        config,
        now: Date.now(),
        stop: null,

        // A minute tick is plenty — year/range progress moves slowly.
        init() {
            this.stop = alignedInterval(60_000, () => {
                this.now = Date.now();
            });
        },

        destroy() {
            this.stop?.();
        },

        get view() {
            return progressView(this.config, this.now);
        },
    }),
);

Alpine.start();
