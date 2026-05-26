import Alpine from "alpinejs";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    type Fit,
    nextIndex,
    parseImagesConfig,
    type RotateMode,
} from "./config";

applyThemeFromQuery();

const config = parseImagesConfig(window.location.search);

// Bundled monochrome placeholders so the widget (and the gallery preview) shows
// something when no `?src=` is provided. BASE_URL keeps the path correct under
// the GitHub Pages sub-path.
const DEMO = [1, 2, 3].map((n) => `${import.meta.env.BASE_URL}demo/${n}.svg`);

interface ImagesWidget {
    list: string[];
    mode: RotateMode;
    fit: Fit;
    every: number;
    /** The two stacked <img> layers; one is faded in at a time. */
    slots: [string, string];
    /** Which slot is currently visible (0 or 1). */
    front: number;
    index: number;
    timer: ReturnType<typeof setInterval> | null;
    init(): void;
    destroy(): void;
    start(): void;
    pause(): void;
    advance(): void;
    layerClass(slot: number): string[];
}

Alpine.data(
    "imagesWidget",
    (): ImagesWidget => ({
        list: config.src.length > 0 ? config.src : DEMO,
        mode: config.mode,
        fit: config.fit,
        every: config.every,
        slots: ["", ""],
        front: 0,
        index: 0,
        timer: null,

        init() {
            // Seed both layers with the first image (no empty `src`, so no
            // broken-image flash); only the front one is visible.
            const first = this.list[0] ?? "";
            this.slots = [first, first];
            this.start();
        },

        destroy() {
            this.pause();
        },

        start() {
            if (this.timer !== null || this.list.length < 2) return;
            this.timer = setInterval(() => this.advance(), this.every * 1000);
        },

        pause() {
            if (this.timer !== null) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },

        // Preload the next image, then cross-fade by flipping which layer is on
        // top. Swapping on error too keeps a broken URL from freezing rotation.
        advance() {
            if (this.list.length < 2) return;
            const next = nextIndex(this.index, this.list.length, this.mode);
            const url = this.list[next] ?? "";
            const back = this.front === 0 ? 1 : 0;
            const swap = () => {
                this.slots[back] = url;
                this.front = back;
                this.index = next;
            };
            const img = new Image();
            img.onload = swap;
            img.onerror = swap;
            img.src = url;
        },

        layerClass(slot) {
            return [
                this.front === slot ? "opacity-100" : "opacity-0",
                this.fit === "contain" ? "object-contain" : "object-cover",
            ];
        },
    }),
);

Alpine.start();
