import { expect, test } from "@playwright/test";

const feed = {
    selected: [
        { year: 1969, text: "A historic launch happened." },
        { year: 1801, text: "Another notable event." },
    ],
};

test("renders an event (year + text) from the feed", async ({ page }) => {
    await page.route(/wikipedia\.org\/api\/rest_v1\/feed\/onthisday/, (route) =>
        route.fulfill({ json: feed }),
    );

    await page.goto("/onthisday/?type=selected");

    await expect(page.getByText(/On this day/)).toBeVisible();
    // One of the two mocked events is shown (random pick).
    await expect(
        page.locator("blockquote", {
            hasText: /historic launch|notable event/,
        }),
    ).toBeVisible();
});

test("shows the error state when the feed fails", async ({ page }) => {
    await page.route(/wikipedia\.org\/api\/rest_v1\/feed\/onthisday/, (route) =>
        route.abort(),
    );

    await page.goto("/onthisday/");

    await expect(page.getByText("Couldn't load today's events.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});
