import { expect, test } from "@playwright/test";

// These widgets render without any network calls, so they're deterministic.

test("clock renders one tile per time unit", async ({ page }) => {
    await page.goto("/clock/?show=time&seconds=0&h24=1");
    // Hours + minutes = two tiles, each with a single number element.
    await expect(page.locator(".clock-num")).toHaveCount(2);
});

test("timer counts down with day/hour/minute/second segments", async ({
    page,
}) => {
    await page.goto("/timer/?mode=down&to=2099-01-01T00:00:00Z&units=dhms");
    await expect(page.getByText("days", { exact: true })).toBeVisible();
    await expect(page.getByText("sec", { exact: true })).toBeVisible();
});

test("timer shows the done state once the target has passed", async ({
    page,
}) => {
    await page.goto("/timer/?mode=down&to=2000-01-01T00:00:00Z&done=Launched");
    await expect(page.getByText("Launched")).toBeVisible();
});

test("image rotator renders an image (demo fallback when no ?src)", async ({
    page,
}) => {
    await page.goto("/images/");
    await expect(page.locator("img").first()).toHaveAttribute("src", /demo/);
});
