import { test, expect, Page } from "@playwright/test";

const TEST_USER = {
  name: "QA Dev Admin User",
  email: `qa_dev_admin_${Date.now()}@orvanthis.local`,
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

test.describe("Dev Admin tools", () => {
  test("seed demo data, switch plans, and clear local state", async ({ page }) => {
    await signupAndLogin(page);

    // Open Dev Admin
    await page.goto("/dev-admin");
    await expect(page).toHaveURL(/\/dev-admin/);
    await expect(page.locator("body")).toContainText(/developer plan controls/i);
    await expect(page.locator("body")).toContainText(/seed demo data/i);

    // Seed demo data
    await page.getByRole("button", { name: /seed demo data/i }).click();
    await expect(page.locator("body")).toContainText(/demo data seeded successfully/i);

    // Dashboard should now feel populated
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/AI Infrastructure/i);

    // Workspace should now show seeded saved reports/execution plans
    await page.goto("/workspace");
    await expect(page.locator("body")).toContainText(/saved reports/i);
    await expect(page.locator("body")).toContainText(/execution plans/i);
    await expect(page.locator("body")).toContainText(/AI infrastructure/i);

    // Calendar should show seeded event
    await page.goto("/calendar");
    await expect(page.locator("body")).toContainText(/AI Infrastructure Review/i);

    // Set Free plan and verify premium lock still visible
    await page.goto("/dev-admin");
    await page.getByRole("button", { name: /^set free$/i }).click();
    await expect(page.locator("body")).toContainText(/dev plan override set to free/i);

    await page.goto("/assistant");
    await page.getByRole("button", { name: /execution mode/i }).click();
    await expect(page.locator("body")).toContainText(/available on premium/i);

    // Set Premium and verify premium lock behavior changes
    await page.goto("/dev-admin");
    await page.getByRole("button", { name: /^set premium$/i }).click();
    await expect(page.locator("body")).toContainText(/dev plan override set to premium/i);

    await page.goto("/assistant");
    await page.getByRole("button", { name: /execution mode/i }).click();
    await expect(page.locator("body")).not.toContainText(/available on premium/i);
    await expect(page.locator("body")).toContainText(/action planning/i);

    // Set Premium Plus and verify account/dashboard reflects it
    await page.goto("/dev-admin");
    await page.getByRole("button", { name: /^set premium plus$/i }).click();
    await expect(page.locator("body")).toContainText(/dev plan override set to premium_plus/i);

    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/Premium Plus/i);

    // Clear override
    await page.goto("/dev-admin");
    await page.getByRole("button", { name: /clear override/i }).click();
    await expect(page.locator("body")).toContainText(/dev plan override cleared/i);

    // Reset personalization/watchlists
    await page.getByRole("button", { name: /reset personalization \+ watchlists/i }).click();
    await expect(page.locator("body")).toContainText(/personalization and smart watchlists reset/i);

    // Clear all local dev data
    await page.getByRole("button", { name: /clear all local dev data/i }).click();
    await expect(page.locator("body")).toContainText(/all orvanthis local dev data cleared/i);

    // Verify workspace is empty again after clearing local state
    await page.goto("/workspace");
    await expect(page.locator("body")).toContainText(/no saved reports yet/i);

    // Verify calendar is back to starter/default style state
    await page.goto("/calendar");
    await expect(page.locator("body")).not.toContainText(/AI Infrastructure Review/i);
  });
});