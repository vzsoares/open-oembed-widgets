import { expect, test } from "@playwright/test";

// Mock the data providers so the widget is deterministic and offline-safe.
// CoinGecko is tried first; mocking it is enough for the happy path.
const sampleSeries = {
    prices: [
        [1_700_000_000_000, 69000],
        [1_700_003_600_000, 69500],
        [1_700_007_200_000, 70123.45],
    ],
};

test("renders the live price, chart and range selector", async ({ page }) => {
    await page.route(/api\.coingecko\.com/, (route) =>
        route.fulfill({ json: sampleSeries }),
    );

    await page.goto("/btc/?range=1d");

    await expect(
        page.getByRole("heading", { name: "BTC / USD" }),
    ).toBeVisible();
    await expect(page.getByText(/\$70,123/)).toBeVisible();
    // The chart line path is drawn from the series.
    await expect(page.locator("svg path[stroke]")).toBeVisible();
    // Range selector is interactive inside the embed.
    await expect(
        page.getByRole("button", { name: "1W", exact: true }),
    ).toBeVisible();
});

test("shows the error state when every provider fails", async ({ page }) => {
    await page.route(/api\.coingecko\.com/, (r) => r.abort());
    await page.route(/api\.binance\.com/, (r) => r.abort());
    await page.route(/api\.exchange\.coinbase\.com/, (r) => r.abort());

    await page.goto("/btc/?range=1d");

    await expect(
        page.getByText("Couldn't load the Bitcoin price."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});
