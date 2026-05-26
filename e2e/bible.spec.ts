import { expect, test } from "@playwright/test";

const sampleVerse = {
    translation: { name: "World English Bible" },
    random_verse: {
        book: "John",
        chapter: 3,
        verse: 16,
        text: "For God so loved the world.",
    },
};

test("renders a verse from the API", async ({ page }) => {
    await page.route(/bible-api\.com/, (route) =>
        route.fulfill({ json: sampleVerse }),
    );

    await page.goto("/bible/?lang=en");

    await expect(page.getByText("For God so loved the world.")).toBeVisible();
    await expect(page.getByText("John 3:16")).toBeVisible();
    await expect(page.getByText("World English Bible")).toBeVisible();
});

test("falls back to a bundled verse when the API is down", async ({ page }) => {
    await page.route(/bible-api\.com/, (route) => route.abort());

    await page.goto("/bible/?lang=en");

    // The offline fallback still renders a non-empty quote and reference.
    const quote = page.locator("blockquote");
    await expect(quote).toBeVisible();
    await expect(quote).not.toBeEmpty();
    await expect(page.locator("figcaption")).not.toBeEmpty();
});

test("language toggle re-fetches and keeps a verse visible", async ({
    page,
}) => {
    // Return a language-specific verse so the switch is observable.
    await page.route(/bible-api\.com/, (route) => {
        const pt = route.request().url().includes("almeida");
        route.fulfill({
            json: pt
                ? {
                      translation: { name: "João Ferreira de Almeida" },
                      random_verse: {
                          book: "João",
                          chapter: 3,
                          verse: 16,
                          text: "Porque Deus amou o mundo.",
                      },
                  }
                : sampleVerse,
        });
    });

    await page.goto("/bible/?lang=en");
    await expect(page.getByText("For God so loved the world.")).toBeVisible();

    await page.getByRole("button", { name: "PT", exact: true }).click();
    await expect(page.getByText("Porque Deus amou o mundo.")).toBeVisible();
});
