import { expect, test } from "@playwright/test";

test("renders buttons that open their URL in a new tab", async ({ page }) => {
    await page.goto(
        "/links/?btns=GitHub|https://github.com/x;Docs|https://example.com",
    );

    const github = page.getByRole("link", { name: "GitHub" });
    await expect(github).toHaveAttribute("href", "https://github.com/x");
    await expect(github).toHaveAttribute("target", "_blank");
    await expect(github).toHaveAttribute("rel", /noopener/);
    await expect(page.getByRole("link", { name: "Docs" })).toBeVisible();
});

test("applies a custom button color", async ({ page }) => {
    await page.goto("/links/?btns=Brand|https://x.com|1d9bf0");
    const link = page.getByRole("link", { name: "Brand" });
    await expect(link).toBeVisible();
    const bg = await link.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
    );
    // #1d9bf0
    expect(bg).toBe("rgb(29, 155, 240)");
});

test("drops unsafe URLs", async ({ page }) => {
    await page.goto(
        "/links/?btns=Safe|https://ok.com;Evil|javascript:alert(1)",
    );
    await expect(page.getByRole("link", { name: "Safe" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Evil" })).toHaveCount(0);
});

test("default demo buttons render with no config", async ({ page }) => {
    await page.goto("/links/");
    await expect(page.getByRole("link").first()).toBeVisible();
});
