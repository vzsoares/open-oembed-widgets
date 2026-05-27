import { expect, test } from "@playwright/test";

const forecast = {
    current: { temperature_2m: 21.4, weather_code: 0 },
    daily: { temperature_2m_max: [25], temperature_2m_min: [14] },
};

test("renders temperature, condition and hi/lo for explicit coords", async ({
    page,
}) => {
    await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) =>
        route.fulfill({ json: forecast }),
    );

    await page.goto("/weather/?lat=51.5&lon=-0.12&label=London&unit=c");

    await expect(page.getByText("London")).toBeVisible();
    await expect(page.getByText("21°")).toBeVisible();
    await expect(page.getByText("Clear sky")).toBeVisible();
    await expect(page.getByText(/H 25° L 14°/)).toBeVisible();
});

test("geocodes a city name when no coordinates are given", async ({ page }) => {
    await page.route(/geocoding-api\.open-meteo\.com/, (route) =>
        route.fulfill({
            json: {
                results: [{ latitude: 35.7, longitude: 139.7, name: "Tokyo" }],
            },
        }),
    );
    await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) =>
        route.fulfill({ json: forecast }),
    );

    await page.goto("/weather/?city=Tokyo");
    await expect(page.getByText("Tokyo")).toBeVisible();
    await expect(page.getByText("21°")).toBeVisible();
});

test("shows the error state when the forecast fails", async ({ page }) => {
    await page.route(/open-meteo\.com/, (route) => route.abort());

    await page.goto("/weather/?lat=51.5&lon=-0.12");
    await expect(page.getByText("Couldn't load the weather.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});
