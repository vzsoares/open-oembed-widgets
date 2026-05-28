import { expect, test } from "@playwright/test";

test("counts down the days until a future date", async ({ page }) => {
    await page.goto("/counter/?mode=until&date=2099-01-01&label=Future");
    await expect(page.getByText("days until", { exact: true })).toBeVisible();
    await expect(page.getByText("Future")).toBeVisible();
});

test("counts up the days since a past date", async ({ page }) => {
    await page.goto("/counter/?mode=since&date=2000-01-01");
    await expect(page.getByText("days since", { exact: true })).toBeVisible();
});

test("auto mode picks the direction from the date", async ({ page }) => {
    await page.goto("/counter/?date=2099-01-01");
    await expect(page.getByText("days until", { exact: true })).toBeVisible();
});
