import { expect, test } from "@playwright/test";

// Deterministic locale so the date caption is English.
test.use({ locale: "en-US" });

test("renders one tile per time unit", async ({ page }) => {
    await page.goto("/clock/?show=time&seconds=0&h24=1");
    // Hours + minutes = two tiles.
    await expect(page.locator(".clock-num")).toHaveCount(2);
});

test("adds a seconds tile with ?seconds=1", async ({ page }) => {
    await page.goto("/clock/?show=time&seconds=1&h24=1");
    await expect(page.locator(".clock-num")).toHaveCount(3);
});

test("?show=date hides the tiles and shows the caption", async ({ page }) => {
    await page.goto("/clock/?show=date");
    await expect(page.locator(".clock-num").first()).toBeHidden();
    // e.g. "Tuesday | May 26, 2026"
    await expect(page.getByText(/^\w+ \| \w+ \d+, \d{4}$/)).toBeVisible();
});
