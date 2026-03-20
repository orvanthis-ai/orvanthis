import { test, expect, Page } from "@playwright/test";

const TEST_USER = {
  name: "QA Onboarding User",
  email: `qa_onboarding_${Date.now()}@orvanthis.local`,
  password: "Password123!",
};

async function signupAndLogin(page: Page) {
  await page.goto("/signup");
  await page.getByPlaceholder("Full name").fill(TEST_USER.name);
  await page.getByPlaceholder("Email").fill(TEST_USER.email);
  await page.getByPlaceholder("Password").fill(TEST_USER.password);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

test.describe("Onboarding personalization", () => {
  test("user can complete onboarding and see saved state", async ({ page }) => {
    await signupAndLogin(page);

    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/onboarding/);

    await page.getByRole("button", { name: /find better opportunities/i }).click();
    await page.getByRole("button", { name: /build a business/i }).click();

    // Market Style section
    const marketStyleSection = page
      .locator("div.rounded-\\[28px\\]")
      .filter({ hasText: "Market Style" });
    await marketStyleSection.getByRole("button", { name: /^growth$/i }).click();

    // Business Style section
    const businessStyleSection = page
      .locator("div.rounded-\\[28px\\]")
      .filter({ hasText: "Business Style" });
    await businessStyleSection.getByRole("button", { name: /^operator$/i }).click();

    // Preferred Sectors section
    const sectorsSection = page
      .locator("div.rounded-\\[28px\\]")
      .filter({ hasText: "Preferred Sectors" });
    await sectorsSection.getByRole("button", { name: /^AI Infrastructure$/i }).click();
    await sectorsSection.getByRole("button", { name: /^Macro$/i }).click();

    // Watchlist Presets section
    const watchlistsSection = page
      .locator("div.rounded-\\[28px\\]")
      .filter({ hasText: "Watchlist Presets" });
    await watchlistsSection.getByRole("button", { name: /^AI Leaders$/i }).click();
    await watchlistsSection.getByRole("button", { name: /^Execution Targets$/i }).click();

    // Default Assistant Mode section
    const assistantSection = page
      .locator("div.rounded-\\[28px\\]")
      .filter({ hasText: "Default Assistant Mode" });
    await assistantSection.getByRole("button", { name: /^intelligence$/i }).click();

    await page.getByRole("button", { name: /save personalization/i }).click();

    await expect(page.locator("body")).toContainText(/personalization saved/i);

    await page.goto("/account");
    await expect(page.locator("body")).toContainText(/AI Infrastructure/i);
    await expect(page.locator("body")).toContainText(/Operator/i);
    await expect(page.locator("body")).toContainText(/Growth/i);
  });
});