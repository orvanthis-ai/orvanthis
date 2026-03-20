import { test, expect, Page } from "@playwright/test";

const TEST_USER = {
  name: "QA Calendar User",
  email: `qa_calendar_${Date.now()}@orvanthis.local`,
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

test.describe("Calendar and signals", () => {
  test("calendar can add event and signals page loads", async ({ page }) => {
    await signupAndLogin(page);

    await page.goto("/calendar");
    await expect(page).toHaveURL(/\/calendar/);

    await page.getByPlaceholder(/event title/i).fill("QA Event");
    await page.locator('input[type="date"]').fill("2026-03-25");
    await page.getByPlaceholder(/watchlist tag/i).fill("QA Tag");
    await page.getByPlaceholder(/reminder note/i).fill("Calendar test note");
    await page.getByRole("button", { name: /add event/i }).click();

    await expect(page.locator("body")).toContainText("QA Event");
    await expect(page.locator("body")).toContainText("QA Tag");

    await page.goto("/signals");
    await expect(page).toHaveURL(/\/signals/);
    await expect(page.locator("body")).toContainText(/smart signals/i);
    await expect(page.locator("body")).toContainText(/open in assistant/i);
    await expect(page.locator("body")).toContainText(/send to workspace/i);
  });
});