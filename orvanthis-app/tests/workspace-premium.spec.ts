import { test, expect, Page } from "@playwright/test";

const TEST_USER = {
  name: "QA Workspace User",
  email: `qa_workspace_${Date.now()}@orvanthis.local`,
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

test.describe("Workspace and premium locks", () => {
  test("workspace loads and free user sees premium locks", async ({ page }) => {
    await signupAndLogin(page);

    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/workspace/);
    await expect(page.locator("body")).toContainText(/personalized templates/i);
    await expect(page.locator("body")).toContainText(/generate report/i);

    await page.goto("/assistant");
    await expect(page.locator("body")).toContainText(/premium/i);
    await page.getByRole("button", { name: /execution mode/i }).click();
    await expect(page.locator("body")).toContainText(/available on premium/i);

    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/unlock premium/i);
    await expect(page.locator("body")).toContainText(/premium insights/i);
  });
});