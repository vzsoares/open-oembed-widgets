import { expect, test } from "@playwright/test";

test("renders a user card with stats", async ({ page }) => {
    await page.route(/api\.github\.com\/users\//, (route) =>
        route.fulfill({
            json: {
                login: "octocat",
                name: "The Octocat",
                avatar_url: "https://avatars.githubusercontent.com/u/583231",
                html_url: "https://github.com/octocat",
                followers: 1200,
                public_repos: 8,
            },
        }),
    );

    await page.goto("/github/?user=octocat");

    await expect(page.getByText("The Octocat")).toBeVisible();
    await expect(page.getByText("@octocat")).toBeVisible();
    await expect(page.getByText("1.2k")).toBeVisible();
    await expect(page.getByText("Followers")).toBeVisible();
});

test("renders a repo card with a language tag", async ({ page }) => {
    await page.route(/api\.github\.com\/repos\//, (route) =>
        route.fulfill({
            json: {
                full_name: "vzsoares/open-oembed-widgets",
                description: "Tiny monochrome widgets",
                language: "TypeScript",
                stargazers_count: 42,
                forks_count: 3,
                html_url: "https://github.com/vzsoares/open-oembed-widgets",
                owner: {
                    avatar_url: "https://avatars.githubusercontent.com/u/1",
                },
            },
        }),
    );

    await page.goto("/github/?repo=vzsoares/open-oembed-widgets");

    await expect(page.getByText("vzsoares/open-oembed-widgets")).toBeVisible();
    await expect(page.getByText("TypeScript")).toBeVisible();
    await expect(page.getByText("Stars")).toBeVisible();
});

test("shows the error state on a rate-limit / failure", async ({ page }) => {
    await page.route(/api\.github\.com/, (route) =>
        route.fulfill({ status: 403, body: "rate limited" }),
    );

    await page.goto("/github/?user=octocat");
    await expect(page.getByText(/Couldn't load from GitHub/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});
