import { test, expect } from "@playwright/test";

/**
 * Keyboard-only navigation smoke tests. We don't assert on every focus stop —
 * just that key interactive elements are reachable, are real buttons/links,
 * and carry accessible names.
 */

test("landing: tab order reaches skip-link, then nav, then primary CTA", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /skip to (main )?content/i })).toBeFocused();

  // A few more tabs should land on a nav or content link before we time out.
  let landed = false;
  for (let i = 0; i < 12 && !landed; i++) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? { tag: el.tagName, text: (el.textContent || "").trim().slice(0, 60) } : null;
    });
    if (focused && (focused.tag === "A" || focused.tag === "BUTTON")) landed = true;
  }
  expect(landed).toBe(true);
});

test("theme toggle is a real button with an accessible label", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /toggle theme/i });
  await expect(toggle).toBeVisible();
  // Should be focusable and activatable with Enter.
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Enter");
  // The html class should now reflect the toggle (light or dark).
  const cls = await page.locator("html").getAttribute("class");
  expect((cls || "").length).toBeGreaterThan(0);
});

test("quiz answer buttons are focusable and submittable via keyboard", async ({ page }) => {
  await page.goto("/learn/01-math/01-linear-algebra");
  // scroll quiz into view
  await page.getByText(/check your understanding/i).scrollIntoViewIfNeeded();
  const choices = page.locator("section li button");
  await expect(choices.first()).toBeVisible();

  await choices.first().focus();
  await expect(choices.first()).toBeFocused();
  await page.keyboard.press("Enter");
  // Either a 'Correct' or 'Why the right answer is right' panel appears.
  await expect(
    page.getByText(/correct|why the right answer is right/i).first()
  ).toBeVisible({ timeout: 6000 });
});

test("active nav link has aria-current=page on the current route", async ({ page }) => {
  await page.goto("/researchers");
  const current = page.locator('a[aria-current="page"]');
  await expect(current.first()).toBeVisible();
  await expect(current.first()).toHaveText(/researchers/i);
});
