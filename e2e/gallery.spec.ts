import { expect, test } from "@playwright/test";

// Start from a known light baseline so the theme toggle is deterministic.
test.use({ colorScheme: "light" });

test("gallery lists every widget", async ({ page }) => {
    await page.goto("/");

    await expect(
        page.getByRole("heading", { name: "Open oEmbed Widgets" }),
    ).toBeVisible();

    for (const title of [
        "Bitcoin Price",
        "Clock",
        "Timer",
        "Image Rotator",
        "Bible Verse",
    ]) {
        await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
});

test("theme toggle flips the document theme and its label", async ({
    page,
}) => {
    await page.goto("/");

    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: "Toggle theme" });

    // Light baseline: the button advertises the *next* theme.
    await expect(toggle).toHaveText("Dark");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveText("Light");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveText("Dark");
});

test("a param selector is baked into the embed URL", async ({ page }) => {
    await page.goto("/");

    // The BTC card starts on the default 1M range.
    await expect(page.getByText(/\/btc\/\?.*range=1m/)).toBeVisible();

    await page.getByRole("button", { name: "1W", exact: true }).click();
    await expect(page.getByText(/\/btc\/\?.*range=1w/)).toBeVisible();
});
