import { expect, test } from "@playwright/test";

test("renders a quote with an author from the collection", async ({ page }) => {
    await page.goto("/quote/?collection=stoic");

    await expect(page.getByText("stoic")).toBeVisible();
    const quote = page.locator("blockquote");
    await expect(quote).toBeVisible();
    await expect(quote).not.toBeEmpty();
    await expect(page.locator("figcaption")).toContainText("—");
});

test("the shuffle button keeps a quote visible", async ({ page }) => {
    await page.goto("/quote/?collection=tech");
    await page.getByRole("button", { name: "Another quote" }).click();
    await expect(page.locator("blockquote")).not.toBeEmpty();
});
