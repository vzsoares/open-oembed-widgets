import { describe, expect, test } from "vitest";
import {
    type FetchLike,
    fetchWeather,
    parseForecast,
    parseGeocode,
    parseWeatherConfig,
    weatherInfo,
} from "./weather";

describe("parseWeatherConfig", () => {
    test("defaults", () => {
        expect(parseWeatherConfig("")).toEqual({
            lat: null,
            lon: null,
            city: "",
            unit: "c",
            label: "",
        });
    });

    test("reads coordinates, unit and label", () => {
        const c = parseWeatherConfig("?lat=40.7&lon=-74&unit=f&label=NYC");
        expect(c.lat).toBe(40.7);
        expect(c.lon).toBe(-74);
        expect(c.unit).toBe("f");
        expect(c.label).toBe("NYC");
    });
});

describe("weatherInfo", () => {
    test("maps WMO codes to category + label", () => {
        expect(weatherInfo(0).category).toBe("clear");
        expect(weatherInfo(3).category).toBe("clouds");
        expect(weatherInfo(63).category).toBe("rain");
        expect(weatherInfo(75).category).toBe("snow");
        expect(weatherInfo(95).category).toBe("storm");
        expect(weatherInfo(45).category).toBe("fog");
    });

    test("unknown code falls back to clouds", () => {
        expect(weatherInfo(123).category).toBe("clouds");
    });
});

describe("parseForecast", () => {
    test("rounds the current temp and daily hi/lo", () => {
        const f = parseForecast({
            current: { temperature_2m: 20.6, weather_code: 61 },
            daily: { temperature_2m_max: [25.4], temperature_2m_min: [13.9] },
        });
        expect(f).toEqual({
            temp: 21,
            hi: 25,
            lo: 14,
            conditions: { category: "rain", label: "Light rain" },
        });
    });

    test("throws on a malformed payload", () => {
        expect(() => parseForecast({ current: {} })).toThrow();
    });
});

describe("parseGeocode", () => {
    test("returns the first result", () => {
        expect(
            parseGeocode({
                results: [{ latitude: 51.5, longitude: -0.12, name: "London" }],
            }),
        ).toEqual({ lat: 51.5, lon: -0.12, name: "London" });
    });

    test("throws when there are no results", () => {
        expect(() => parseGeocode({ results: [] })).toThrow();
    });
});

describe("fetchWeather", () => {
    const forecastBody = {
        current: { temperature_2m: 18, weather_code: 0 },
        daily: { temperature_2m_max: [20], temperature_2m_min: [10] },
    };

    test("uses explicit lat/lon without geocoding", async () => {
        const calls: string[] = [];
        const fetchImpl: FetchLike = async (input) => {
            calls.push(String(input));
            return new Response(JSON.stringify(forecastBody), { status: 200 });
        };
        const res = await fetchWeather(
            { lat: 1, lon: 2, city: "", unit: "c", label: "Home" },
            { fetchImpl },
        );
        expect(res.place).toBe("Home");
        expect(res.forecast.temp).toBe(18);
        expect(calls).toHaveLength(1); // no geocode call
        expect(calls[0]).toContain("forecast");
    });

    test("geocodes the city when coordinates are missing", async () => {
        const fetchImpl: FetchLike = async (input) => {
            const url = String(input);
            if (url.includes("geocoding")) {
                return new Response(
                    JSON.stringify({
                        results: [
                            { latitude: 48.85, longitude: 2.35, name: "Paris" },
                        ],
                    }),
                    { status: 200 },
                );
            }
            return new Response(JSON.stringify(forecastBody), { status: 200 });
        };
        const res = await fetchWeather(
            { lat: null, lon: null, city: "Paris", unit: "c", label: "" },
            { fetchImpl },
        );
        expect(res.place).toBe("Paris");
        expect(res.forecast.conditions.category).toBe("clear");
    });
});
