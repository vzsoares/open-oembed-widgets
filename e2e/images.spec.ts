import { expect, test } from "@playwright/test";

test("renders the bundled demo fallback when no ?src is given", async ({
    page,
}) => {
    await page.goto("/images/");
    await expect(page.locator("img").first()).toHaveAttribute("src", /demo/);
});

test("renders the image from ?src", async ({ page }) => {
    await page.goto("/images/?src=/demo/3.svg");
    await expect(page.locator("img").first()).toHaveAttribute(
        "src",
        /demo\/3\.svg/,
    );
});

test("portrait orientation fills a tall frame", async ({ page }) => {
    await page.setViewportSize({ width: 270, height: 480 });
    await page.goto("/images/?orient=portrait");
    const img = page.locator("img").first();
    await expect(img).toBeVisible();
    const box = await img.boundingBox();
    expect(box?.height).toBeGreaterThan(box?.width ?? 0);
});
