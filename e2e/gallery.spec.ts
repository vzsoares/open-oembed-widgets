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
        "World Clock",
        "Timer",
        "Moon Phase",
        "Bible Verse",
        "Stocks Ticker",
        "Stock Chart",
    ]) {
        await expect(
            page.getByRole("heading", { name: title, exact: true }),
        ).toBeVisible();
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

    // The BTC card starts on the default 1M range. Scope to its card — the
    // ticker card carries an identical range selector.
    const btcCard = page.locator("#w-btc");
    await expect(page.getByText(/\/btc\/\?.*range=1m/)).toBeVisible();

    await btcCard.getByRole("button", { name: "1W", exact: true }).click();
    await expect(page.getByText(/\/btc\/\?.*range=1w/)).toBeVisible();
});

test("pasting a widget URL loads its theme + params for editing", async ({
    page,
}) => {
    await page.goto("/");

    const input = page.getByRole("textbox", {
        name: "Paste a widget URL to edit it",
    });
    await input.fill(
        "https://x.test/open-oembed-widgets/btc/?theme=dark&range=1w",
    );
    await input.blur();

    // Theme applied to the document, and the BTC card now reflects range=1w.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByText(/\/btc\/\?.*range=1w/)).toBeVisible();
});

test("the button-list editor serializes its rows into ?btns=", async ({
    page,
}) => {
    await page.goto("/");

    // The demo rows are baked into the Button List card's embed URL.
    await expect(page.getByText(/\/links\/\?.*btns=GitHub/)).toBeVisible();
    // And the list is addable.
    await expect(
        page.getByRole("button", { name: "+ Add button" }),
    ).toBeVisible();
});
