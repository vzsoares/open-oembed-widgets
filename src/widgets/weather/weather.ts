export type Unit = "c" | "f";
export type IconCat = "clear" | "clouds" | "rain" | "snow" | "storm" | "fog";

export interface WeatherConfig {
    lat: number | null;
    lon: number | null;
    /** City name to geocode; "" if not given. */
    city: string;
    unit: Unit;
    /** Place-name override for display. */
    label: string;
}

export interface Conditions {
    category: IconCat;
    label: string;
}

export interface Forecast {
    /** Current temperature in the requested unit, rounded. */
    temp: number;
    hi: number;
    lo: number;
    conditions: Conditions;
}

export interface Place {
    lat: number;
    lon: number;
    name: string;
}

export type FetchLike = (
    input: string | URL | Request,
    init?: RequestInit,
) => Promise<Response>;

function parseNumber(raw: string | null): number | null {
    if (raw === null || raw.trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

export function parseWeatherConfig(search: string): WeatherConfig {
    const p = new URLSearchParams(search);
    return {
        lat: parseNumber(p.get("lat")),
        lon: parseNumber(p.get("lon")),
        city: p.get("city")?.trim() ?? "",
        unit: p.get("unit") === "f" ? "f" : "c",
        label: p.get("label") ?? "",
    };
}

// WMO weather interpretation codes -> a monochrome icon category + label.
const CODES: Record<number, Conditions> = {
    0: { category: "clear", label: "Clear sky" },
    1: { category: "clear", label: "Mainly clear" },
    2: { category: "clouds", label: "Partly cloudy" },
    3: { category: "clouds", label: "Overcast" },
    45: { category: "fog", label: "Fog" },
    48: { category: "fog", label: "Rime fog" },
    51: { category: "rain", label: "Light drizzle" },
    53: { category: "rain", label: "Drizzle" },
    55: { category: "rain", label: "Dense drizzle" },
    56: { category: "rain", label: "Freezing drizzle" },
    57: { category: "rain", label: "Freezing drizzle" },
    61: { category: "rain", label: "Light rain" },
    63: { category: "rain", label: "Rain" },
    65: { category: "rain", label: "Heavy rain" },
    66: { category: "rain", label: "Freezing rain" },
    67: { category: "rain", label: "Freezing rain" },
    71: { category: "snow", label: "Light snow" },
    73: { category: "snow", label: "Snow" },
    75: { category: "snow", label: "Heavy snow" },
    77: { category: "snow", label: "Snow grains" },
    80: { category: "rain", label: "Rain showers" },
    81: { category: "rain", label: "Rain showers" },
    82: { category: "rain", label: "Violent showers" },
    85: { category: "snow", label: "Snow showers" },
    86: { category: "snow", label: "Snow showers" },
    95: { category: "storm", label: "Thunderstorm" },
    96: { category: "storm", label: "Thunderstorm, hail" },
    99: { category: "storm", label: "Thunderstorm, hail" },
};

export function weatherInfo(code: number): Conditions {
    return CODES[code] ?? { category: "clouds", label: "Unknown" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function num(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error("expected a finite number");
    }
    return value;
}

export function forecastUrl(lat: number, lon: number, unit: Unit): string {
    const u = unit === "f" ? "fahrenheit" : "celsius";
    return (
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min` +
        `&temperature_unit=${u}&timezone=auto&forecast_days=1`
    );
}

export function geocodeUrl(city: string): string {
    return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
}

export function parseForecast(data: unknown): Forecast {
    if (!isRecord(data)) throw new Error("bad shape");
    const current = data.current;
    const daily = data.daily;
    if (!isRecord(current) || !isRecord(daily)) {
        throw new Error("missing forecast");
    }
    const max = daily.temperature_2m_max;
    const min = daily.temperature_2m_min;
    if (!Array.isArray(max) || !Array.isArray(min)) {
        throw new Error("missing daily range");
    }
    return {
        temp: Math.round(num(current.temperature_2m)),
        hi: Math.round(num(max[0])),
        lo: Math.round(num(min[0])),
        conditions: weatherInfo(num(current.weather_code)),
    };
}

export function parseGeocode(data: unknown): Place {
    if (!isRecord(data)) throw new Error("bad shape");
    const results = data.results;
    if (!Array.isArray(results) || results.length === 0) {
        throw new Error("place not found");
    }
    const first = results[0];
    if (!isRecord(first)) throw new Error("bad result");
    const name = typeof first.name === "string" ? first.name : "";
    return { lat: num(first.latitude), lon: num(first.longitude), name };
}

const DEFAULT_TIMEOUT_MS = 8000;

export interface FetchOptions {
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

async function getJson(
    url: string,
    fetchImpl: FetchLike,
    timeoutMs: number,
): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetchImpl(url, {
            signal: controller.signal,
            headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

export interface WeatherResult {
    forecast: Forecast;
    place: string;
}

/**
 * Resolve a location (explicit lat/lon, else geocode the city) and fetch the
 * current forecast for it.
 */
export async function fetchWeather(
    config: WeatherConfig,
    opts: FetchOptions = {},
): Promise<WeatherResult> {
    const fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    let lat = config.lat;
    let lon = config.lon;
    let place = config.label;

    if (lat === null || lon === null) {
        const city = config.city || "London";
        const geo = parseGeocode(
            await getJson(geocodeUrl(city), fetchImpl, timeoutMs),
        );
        lat = geo.lat;
        lon = geo.lon;
        if (!place) place = geo.name || city;
    }

    const forecast = parseForecast(
        await getJson(forecastUrl(lat, lon, config.unit), fetchImpl, timeoutMs),
    );
    return { forecast, place: place || "Weather" };
}
