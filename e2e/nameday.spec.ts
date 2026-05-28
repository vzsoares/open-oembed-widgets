import { expect, test } from "@playwright/test";

test("shows the Czech name day for a pinned date", async ({ page }) => {
    await page.goto("/nameday/?lang=cz&date=2026-06-29");
    await expect(page.getByText("Petr · Pavel")).toBeVisible();
    await expect(page.getByText("Czech", { exact: true })).toBeVisible();
});

test("shows the Slovak name day for the same date", async ({ page }) => {
    await page.goto("/nameday/?lang=sk&date=2026-06-29");
    await expect(page.getByText(/Peter/)).toBeVisible();
    await expect(page.getByText("Slovak", { exact: true })).toBeVisible();
});

test("French name day (Pierre · Paul) for June 29", async ({ page }) => {
    await page.goto("/nameday/?lang=fr&date=2026-06-29");
    await expect(page.getByText("Pierre · Paul")).toBeVisible();
    await expect(page.getByText("French", { exact: true })).toBeVisible();
});

test("Spanish name day includes Pedro for June 29", async ({ page }) => {
    await page.goto("/nameday/?lang=es&date=2026-06-29");
    await expect(page.getByText(/Pedro/)).toBeVisible();
    await expect(page.getByText("Spanish", { exact: true })).toBeVisible();
});

test("days without a name day say so", async ({ page }) => {
    await page.goto("/nameday/?lang=cz&date=2026-01-01");
    await expect(page.getByText("No name day")).toBeVisible();
});
