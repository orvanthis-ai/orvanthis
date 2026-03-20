import { test, expect, Page } from "@playwright/test";

const TEST_USER = {
  name: "QA Account Tester",
  email: `qa_account_${Date.now()}@orvanthis.local`,
  password: "Password123!",
};

async function signupAndLogin(page: Page) {
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/signup/);

  await page.getByPlaceholder("Full name").fill(TEST_USER.name);
  await page.getByPlaceholder("Email").fill(TEST_USER.email);
  await page.getByPlaceholder("Password").fill(TEST_USER.password);
  await page.getByRole("button", { name: /create account/i }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

test.describe("Account page", () => {
  test("shows real logged-in user information", async ({ page }) => {
    await signupAndLogin(page);

    await page.goto("/account");
    await expect(page).toHaveURL(/\/account/);

    await expect(page.locator("body")).toContainText(TEST_USER.name);
    await expect(page.locator("body")).toContainText(TEST_USER.email);

    // Loose checks for account/plan content so the test still works
    // while you refine the UI wording.
    await expect(page.locator("body")).toContainText(/account|profile|plan|membership|subscription/i);
    await expect(page.locator("body")).toContainText(/free|premium|premium plus|plan/i);
  });
});