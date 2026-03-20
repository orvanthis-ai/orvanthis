import { test, expect, Page } from "@playwright/test";

const TEST_USER = {
  name: "QA Button Tester",
  email: `qa_buttons_${Date.now()}@orvanthis.local`,
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

async function getMainContentButtonLabels(page: Page): Promise<string[]> {
  const labels = await page.locator("main section button:visible").evaluateAll((buttons) =>
    buttons
      .map((btn) => (btn.textContent || "").trim())
      .filter((text) => text.length > 0)
  );

  const unique = Array.from(new Set(labels));

  return unique.filter(
    (text) =>
      !/log out|logout|delete|remove|clear|close|x$/i.test(text)
  );
}

test.describe("Dead button audit", () => {
  test.setTimeout(120000);

  test("audit important page buttons for dead clicks", async ({ page, context }) => {
    await signupAndLogin(page);

    const pagesToAudit = [
      "/dashboard",
      "/workspace",
      "/assistant",
      "/signals",
      "/opportunities",
      "/account",
      "/billing",
    ];

    const suspiciousButtons: string[] = [];
    const workingButtons: string[] = [];

    for (const route of pagesToAudit) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace("/", "\\/")));

      const labels = await getMainContentButtonLabels(page);

      for (const label of labels) {
        // reopen page fresh for each button
        await page.goto(route);
        await expect(page).toHaveURL(new RegExp(route.replace("/", "\\/")));

        const beforeUrl = page.url();
        const beforeBody = await page.locator("body").innerText().catch(() => "");
        const beforePages = context.pages().length;

        const button = page
          .locator("main section button:visible")
          .filter({ hasText: label })
          .first();

        const exists = await button.count().catch(() => 0);
        if (!exists) continue;

        const disabled = await button.isDisabled().catch(() => true);
        if (disabled) continue;

        let clickWorked = true;
        let popupOpened = false;

        const popupPromise = page.waitForEvent("popup", { timeout: 1000 }).catch(() => null);

        try {
          await button.click({ timeout: 5000 });
        } catch {
          clickWorked = false;
        }

        const popup = await popupPromise;
        if (popup) {
          popupOpened = true;
          await popup.close().catch(() => {});
        }

        if (page.isClosed()) {
          workingButtons.push(`${route} -> "${label}" (closed page/tab)`);
          continue;
        }

        await page.waitForTimeout(1000).catch(() => {});

        const afterUrl = page.url();
        const afterBody = await page.locator("body").innerText().catch(() => beforeBody);
        const afterPages = context.pages().length;

        const urlChanged = beforeUrl !== afterUrl;
        const bodyChanged = beforeBody !== afterBody;
        const dialogVisible =
          (await page.locator('[role="dialog"]').count().catch(() => 0)) > 0 ||
          (await page.locator('[aria-modal="true"]').count().catch(() => 0)) > 0;
        const pageCountChanged = beforePages !== afterPages;

        const somethingHappened =
          clickWorked &&
          (urlChanged || bodyChanged || dialogVisible || popupOpened || pageCountChanged);

        if (somethingHappened) {
          workingButtons.push(`${route} -> "${label}"`);
        } else {
          suspiciousButtons.push(`${route} -> "${label}"`);
        }
      }
    }

    console.log("\nWorking buttons:");
    for (const item of workingButtons) {
      console.log(`+ ${item}`);
    }

    if (suspiciousButtons.length > 0) {
      console.log("\nSuspicious buttons found:");
      for (const item of suspiciousButtons) {
        console.log(`- ${item}`);
      }
    }

    expect(suspiciousButtons.length).toBeLessThan(8);
  });
});