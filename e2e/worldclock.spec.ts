import { expect, test } from "@playwright/test";

test("renders a labelled clock per timezone", async ({ page }) => {
    await page.goto(
        "/worldclock/?tz=America/Sao_Paulo,Europe/London,Asia/Tokyo",
    );
    for (const city of ["Sao Paulo", "London", "Tokyo"]) {
        await expect(page.getByText(city, { exact: true })).toBeVisible();
    }
});

test("shows three default zones when none are given", async ({ page }) => {
    await page.goto("/worldclock/");
    await expect(page.getByText("Tokyo", { exact: true })).toBeVisible();
});

test("flags an unknown zone instead of a wrong time", async ({ page }) => {
    await page.goto("/worldclock/?tz=Mars/Olympus");
    await expect(page.getByText("unknown zone")).toBeVisible();
});
