import { expect, test } from "@playwright/test";

test("counts down with day/hour/minute/second segments", async ({ page }) => {
    await page.goto("/timer/?mode=down&to=2099-01-01T00:00:00Z&units=dhms");
    for (const label of ["days", "hrs", "min", "sec"]) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
});

test("?units=dhm omits the seconds segment", async ({ page }) => {
    await page.goto("/timer/?mode=down&to=2099-01-01T00:00:00Z&units=dhm");
    await expect(page.getByText("min", { exact: true })).toBeVisible();
    await expect(page.getByText("sec", { exact: true })).toHaveCount(0);
});

test("counts up from a past start with ?mode=up", async ({ page }) => {
    await page.goto(
        "/timer/?mode=up&from=2000-01-01T00:00:00Z&label=Since%202000",
    );
    await expect(page.getByText("Since 2000")).toBeVisible();
    await expect(page.getByText("days", { exact: true })).toBeVisible();
});

test("shows the done state once a countdown target has passed", async ({
    page,
}) => {
    await page.goto("/timer/?mode=down&to=2000-01-01T00:00:00Z&done=Launched");
    await expect(page.getByText("Launched")).toBeVisible();
});
