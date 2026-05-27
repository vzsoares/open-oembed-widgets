import { expect, test } from "@playwright/test";

test("custom mode renders a value/max percentage and fills the bar", async ({
    page,
}) => {
    await page.goto("/progress/?mode=custom&value=1&max=4&label=Sprint");
    await expect(page.getByText("Sprint")).toBeVisible();
    await expect(page.getByText("25%")).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "25",
    );
});

test("defaults to year progress with the year as the label", async ({
    page,
}) => {
    await page.goto("/progress/");
    await expect(
        page.getByText(String(new Date().getFullYear())),
    ).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();
});

test("day mode labels 'Today'", async ({ page }) => {
    await page.goto("/progress/?mode=day");
    await expect(page.getByText("Today")).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();
});

test("custom life progress from a birth date + lifespan", async ({ page }) => {
    await page.goto(
        "/progress/?mode=custom&from=2000-01-01&years=120&label=Life",
    );
    const bar = page.getByRole("progressbar");
    await expect(bar).toBeVisible();
    await expect(page.getByText("Life")).toBeVisible();
    const pct = Number(await bar.getAttribute("aria-valuenow"));
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
});
