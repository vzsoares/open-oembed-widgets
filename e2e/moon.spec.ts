import { expect, test } from "@playwright/test";

test("renders the full moon phase for a known date", async ({ page }) => {
    // 2026-06-29 is a full moon.
    await page.goto("/moon/?date=2026-06-29&theme=light");
    await expect(page.getByText("Full Moon")).toBeVisible();
    await expect(page.getByText("100% lit")).toBeVisible();
    // The lit-area path is drawn.
    await expect(page.locator("svg path")).toBeVisible();
});

test("a new moon reads ~0% lit", async ({ page }) => {
    // 2026-01-18 is a new moon.
    await page.goto("/moon/?date=2026-01-18&theme=dark");
    await expect(page.getByText("New Moon")).toBeVisible();
});
