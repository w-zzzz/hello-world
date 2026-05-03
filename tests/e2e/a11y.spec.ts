import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated axe-core accessibility scan over the major routes. We assert that
 * there are no `serious` or `critical` violations; `moderate`/`minor` issues
 * (mostly color-contrast in the brand palette) are reported but not fatal.
 *
 * The tag set follows the WCAG 2.1 AA recommendations.
 */

const ROUTES = [
  "/",
  "/map",
  "/learn/03-deep-learning/04-attention",
  "/dashboard",
  "/researchers",
];

for (const route of ROUTES) {
  test(`a11y: ${route} has no serious/critical axe violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    // Give client components (theme, lazy viz) a beat to mount.
    await page.waitForTimeout(500);

    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules([
        // Three.js / canvas-rendered viz can't satisfy this and we provide
        // text equivalents alongside.
        "canvas",
      ])
      .analyze();

    const blocking = result.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    if (blocking.length) {
      const summary = blocking
        .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`)
        .join("\n");
      throw new Error(`axe found blocking violations on ${route}:\n${summary}`);
    }
    expect(blocking).toEqual([]);
  });
}

test("a11y: skip-to-content link is the first focusable element", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: /skip to (main )?content/i });
  await expect(skip).toBeFocused();
});

test("a11y: main landmark is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main#main")).toHaveCount(1);
});
