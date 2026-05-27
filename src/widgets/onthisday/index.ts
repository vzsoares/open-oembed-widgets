import Alpine from "alpinejs";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    fetchOnThisDay,
    type HistEvent,
    type OnThisDayConfig,
    parseOnThisDayConfig,
} from "./events";

applyThemeFromQuery();

const config = parseOnThisDayConfig(window.location.search);

const dateFmt = new Intl.DateTimeFormat([], { month: "long", day: "numeric" });

interface OnThisDayWidget {
    config: OnThisDayConfig;
    events: HistEvent[];
    index: number;
    loading: boolean;
    failed: boolean;
    init(): void;
    load(): Promise<void>;
    shuffle(): void;
    readonly current: HistEvent | null;
    readonly yearText: string;
    readonly dateText: string;
}

Alpine.data(
    "onThisDayWidget",
    (): OnThisDayWidget => ({
        config,
        events: [],
        index: 0,
        loading: true,
        failed: false,

        init() {
            void this.load();
        },

        async load() {
            this.loading = true;
            this.failed = false;
            try {
                this.events = await fetchOnThisDay(
                    this.config.lang,
                    this.config.feed,
                    new Date(),
                );
                this.index = Math.floor(Math.random() * this.events.length);
            } catch {
                this.failed = true;
            } finally {
                this.loading = false;
            }
        },

        // Step to another event from today's list.
        shuffle() {
            if (this.events.length < 2) return;
            let next = Math.floor(Math.random() * (this.events.length - 1));
            if (next >= this.index) next += 1;
            this.index = next;
        },

        get current() {
            return this.events[this.index] ?? null;
        },

        get yearText() {
            const year = this.current?.year;
            return typeof year === "number" ? String(year) : "";
        },

        get dateText() {
            return dateFmt.format(new Date());
        },
    }),
);

Alpine.start();
