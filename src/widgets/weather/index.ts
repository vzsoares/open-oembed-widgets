import Alpine from "alpinejs";
import "../../lib/fit";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    type Forecast,
    fetchWeather,
    type IconCat,
    parseWeatherConfig,
    type WeatherConfig,
    type WeatherResult,
} from "./weather";

applyThemeFromQuery();

const config = parseWeatherConfig(window.location.search);

interface WeatherWidget {
    config: WeatherConfig;
    loading: boolean;
    failed: boolean;
    result: WeatherResult | null;
    init(): void;
    load(): Promise<void>;
    readonly forecast: Forecast | null;
    readonly place: string;
    readonly category: IconCat;
    readonly unitLabel: string;
}

Alpine.data(
    "weatherWidget",
    (): WeatherWidget => ({
        config,
        loading: true,
        failed: false,
        result: null,

        init() {
            void this.load();
        },

        async load() {
            this.loading = true;
            this.failed = false;
            try {
                this.result = await fetchWeather(this.config);
            } catch {
                this.failed = true;
            } finally {
                this.loading = false;
            }
        },

        get forecast() {
            return this.result?.forecast ?? null;
        },

        get place() {
            return this.result?.place ?? "";
        },

        get category() {
            return this.result?.forecast.conditions.category ?? "clouds";
        },

        get unitLabel() {
            return this.config.unit === "f" ? "F" : "C";
        },
    }),
);

Alpine.start();
