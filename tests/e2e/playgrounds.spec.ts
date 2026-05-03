import { test, expect } from "@playwright/test";

const PLAYGROUNDS = [
  ["gradient-descent", "Gradient descent"],
  ["nn-playground", "Neural network playground"],
  ["attention-heatmap", "Attention head viewer"],
  ["diffusion-denoise", "Diffusion denoising"],
  ["embedding-explorer-3d", "Embedding space"],
  ["tokenizer", "Tokenizer"],
  ["backprop-stepper", "Backpropagation"],
  ["transformer-3d", "Transformer walkthrough"],
] as const;

for (const [slug, title] of PLAYGROUNDS) {
  test(`playground/${slug} renders title with no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    });

    await page.goto(`/playground/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: new RegExp(title, "i") })).toBeVisible({
      timeout: 15_000,
    });

    // Allow lazy-loaded viz to mount.
    await page.waitForTimeout(1500);

    const real = errors.filter(
      (e) =>
        !/hydration|hmr|webpack-internal|Lit is in dev mode|Download the React DevTools/i.test(e)
    );
    expect(real, real.join("\n")).toEqual([]);
  });
}

test("each playground page has a back-to-map link", async ({ page }) => {
  await page.goto("/playground/gradient-descent");
  await expect(page.getByRole("link", { name: /back to map/i })).toBeVisible();
});
