import { test, expect } from "@playwright/test";

test("topic flow: home → map → topic → quiz → dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /open the learning map/i }).first().click();
  await page.waitForURL(/\/map/);

  // Click the linear-algebra topic from the part list (avoids needing canvas hit-testing)
  await page.getByRole("link", { name: /linear algebra/i }).first().click();
  await page.waitForURL(/\/learn\/01-math\/01-linear-algebra/);

  // Topic header visible
  await expect(page.getByRole("heading", { name: /linear algebra/i }).first()).toBeVisible();

  // Scroll to quiz
  await page.getByText(/check your understanding/i).scrollIntoViewIfNeeded();
  await expect(page.getByText(/check your understanding/i)).toBeVisible();

  // Click first answer of the first question; whether it's correct or not is fine
  const firstAnswer = page.locator("button").filter({ hasText: /^A\s/ }).first();
  if (await firstAnswer.count()) {
    await firstAnswer.click();
  } else {
    // fallback: click first non-disabled button inside the quiz container
    const choice = page.getByText(/correct|wrong|saved for review/i);
    await page.locator("li button").first().click();
    await expect(choice.first()).toBeVisible({ timeout: 4000 }).catch(() => {});
  }

  // Should reveal explanation panel (heading "Why the right answer is right" or "Correct")
  await expect(page.getByText(/why the right answer is right|correct/i).first()).toBeVisible({ timeout: 6000 });

  // Go to dashboard
  await page.getByRole("link", { name: /dashboard/i }).first().click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText(/streak/i).first()).toBeVisible();
});

test("playground/gradient-descent renders interactive frame", async ({ page }) => {
  await page.goto("/playground/gradient-descent");
  await expect(page.getByText(/gradient descent playground/i)).toBeVisible({ timeout: 10000 });
  // Optimizer buttons present
  await expect(page.getByRole("button", { name: "ADAM" })).toBeVisible();
});
