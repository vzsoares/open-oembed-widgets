import { expect, test } from "@playwright/test";

test("renders a live demo frame for every widget", async ({ page }) => {
    await page.goto("/showcase/");

    await expect(
        page.getByRole("heading", { name: "Showcase", exact: true }),
    ).toBeVisible();

    // One iframe per widget (18 widgets in the manifest).
    const frames = page.locator("iframe");
    await expect(frames).toHaveCount(18);

    // The Day Counter demo points at the counter widget with curated params.
    await expect(
        page.locator('iframe[title="Day Counter demo"]'),
    ).toHaveAttribute("src", /counter\/\?.*date=2027-01-01/);
});

test("the gallery links to the showcase", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Showcase" }).click();
    await expect(
        page.getByRole("heading", { name: "Showcase", exact: true }),
    ).toBeVisible();
});
