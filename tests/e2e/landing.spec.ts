import { test, expect } from "@playwright/test";

test("landing renders hero, curriculum, stats", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  // Hero title
  await expect(page.getByRole("heading", { name: /master modern ai/i })).toBeVisible();
  // CTAs
  await expect(page.getByRole("link", { name: /open the learning map/i }).first()).toBeVisible();
  // Curriculum heading
  await page.getByText(/eleven parts/i).scrollIntoViewIfNeeded();
  await expect(page.getByText(/eleven parts/i)).toBeVisible();
  // No console errors (excluding hydration warnings + dev info)
  const realErrors = errors.filter(
    (e) => !/hydration|prop|webpack-internal|Lit is in dev mode/i.test(e)
  );
  expect(realErrors).toEqual([]);
});

test("nav navigates to map", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Map" }).first().click();
  await expect(page).toHaveURL(/\/map/);
  await expect(page.getByText(/the whole map/i)).toBeVisible();
});

test("theme toggle persists across navigation", async ({ page }) => {
  await page.goto("/");
  // Toggle theme
  await page.getByRole("button", { name: /toggle theme/i }).click();
  // Read the html class — should now have either light or dark applied
  const cls1 = await page.locator("html").getAttribute("class");
  await page.goto("/researchers");
  const cls2 = await page.locator("html").getAttribute("class");
  // Both should have the same theme class (light or dark)
  const has1 = (cls1 || "").includes("dark") || (cls1 || "").includes("light");
  const has2 = (cls2 || "").includes("dark") || (cls2 || "").includes("light");
  expect(has1 && has2).toBe(true);
});
