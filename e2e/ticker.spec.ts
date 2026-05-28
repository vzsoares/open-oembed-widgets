import { expect, test } from "@playwright/test";

const sampleSeries = {
    prices: [
        [1_700_000_000_000, 2400],
        [1_700_003_600_000, 2450],
        [1_700_007_200_000, 2512.34],
    ],
};

test("renders any coin's price, chart and range selector", async ({ page }) => {
    await page.route(/api\.coingecko\.com/, (route) =>
        route.fulfill({ json: sampleSeries }),
    );

    await page.goto("/ticker/?coin=ethereum&vs=usd&range=1d");

    await expect(
        page.getByRole("heading", { name: "ETH / USD" }),
    ).toBeVisible();
    await expect(page.getByText(/\$2,512/)).toBeVisible();
    await expect(page.locator("svg path[stroke]")).toBeVisible();
    await expect(
        page.getByRole("button", { name: "1W", exact: true }),
    ).toBeVisible();
});

test("requests the coin id from CoinGecko", async ({ page }) => {
    let requested = "";
    await page.route(/api\.coingecko\.com/, (route) => {
        requested = route.request().url();
        return route.fulfill({ json: sampleSeries });
    });

    await page.goto("/ticker/?coin=solana&range=1d");
    await expect(
        page.getByRole("heading", { name: "SOL / USD" }),
    ).toBeVisible();
    expect(requested).toContain("/coins/solana/");
});

test("shows the error state when every provider fails", async ({ page }) => {
    await page.route(/api\.coingecko\.com/, (r) => r.abort());
    await page.route(/api\.binance\.com/, (r) => r.abort());
    await page.route(/api\.exchange\.coinbase\.com/, (r) => r.abort());

    await page.goto("/ticker/?coin=ethereum&range=1d");

    await expect(page.getByText(/Couldn't load the price/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});
