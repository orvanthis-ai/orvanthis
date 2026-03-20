import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "QA Tester",
  email: `qa_${Date.now()}@orvanthis.local`,
  password: "Password123!",
};

test.describe("Orvanthis smoke tests", () => {
  test("signup, login, dashboard, account, billing CTA, assistant flow", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/signup/);

    await page.getByPlaceholder("Full name").fill(TEST_USER.name);
    await page.getByPlaceholder("Email").fill(TEST_USER.email);
    await page.getByPlaceholder("Password").fill(TEST_USER.password);
    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    await expect(page.locator("body")).toContainText(/strategic opportunity intelligence|dashboard/i);

    await page.goto("/account");
    await expect(page).toHaveURL(/\/account/);
    await expect(page.locator("body")).toContainText(TEST_USER.name);

    await page.goto("/billing");
    await expect(page).toHaveURL(/\/billing/);

    const upgradeButtons = page.getByRole("button", {
      name: /upgrade|premium|premium plus|pro/i,
    });
    const upgradeCount = await upgradeButtons.count();

    if (upgradeCount > 0) {
      await upgradeButtons.first().click();
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toContainText(/billing|premium|upgrade|plan|checkout/i);
    }

    await page.goto("/assistant");
    await expect(page).toHaveURL(/\/assistant/);
    await expect(page.locator("body")).toContainText(/executive ai assistant|assistant mode|orvanthis ai assistant/i);

    const input = page.locator('input[placeholder*="Ask"], input[placeholder*="ask"], input[placeholder*="anything"]');
    await expect(input.first()).toBeVisible({ timeout: 10000 });
    await input.first().fill("What is FOMC?");

    await page.getByRole("button", { name: /^send$/i }).click();

    await expect(page.locator("body")).toContainText("What is FOMC?", { timeout: 10000 });
    await expect(page.locator("body")).toContainText(/fomc|federal open market committee|interest rates/i, {
      timeout: 20000,
    });
  });

  test("main navigation pages load", async ({ page }) => {
    const routes = [
      "/dashboard",
      "/workspace",
      "/assistant",
      "/signals",
      "/opportunities",
      "/account",
      "/billing",
      "/login",
      "/signup",
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace("/", "\\/")));
    }
  });
});