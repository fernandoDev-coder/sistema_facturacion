// Run against a local production build. Install playwright in FAKTUDASH_BROWSER_TOOLS.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const { chromium } = await import(pathToFileURL(path.join(process.env.FAKTUDASH_BROWSER_TOOLS, "node_modules/playwright/index.mjs")));
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3100";
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const out = "docs/evidence/2026-11-09";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const results = [];
try {
  for (const locale of ["es", "en"]) {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme, reducedMotion: "reduce" });
      await context.addCookies([{ name: "faktudash_locale", value: locale, url: base }]);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of ["/", "/pricing", "/demo", "/contact", "/register", "/not-a-real-route"]) {
          const response = await page.goto(base + route);
          await page.waitForLoadState("networkidle");
          assert.equal(response.status(), route === "/not-a-real-route" ? 404 : 200, `${route} status`);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
          assert.equal(overflow, false, `${locale}/${theme}/${width}/${route} overflow`);
          assert.equal(await page.locator("html").getAttribute("lang"), locale);
          assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
          if (width === 390 && ["/", "/demo", "/contact"].includes(route)) {
            await page.screenshot({ path: `${out}/${locale}-${theme}-${route.slice(1) || "home"}.png`, fullPage: true });
          }
          results.push({ locale, theme, width, route, status: response.status(), overflow });
        }
      }
      assert.deepEqual(errors, [], `${locale}/${theme} runtime errors`);
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(base + "/demo");
  await page.getByRole("button", { name: "Simular borradores" }).click();
  await page.getByRole("heading", { name: /2 borradores simulados/ }).waitFor();
  assert.match(await page.locator("#monthly-demo").innerText(), /363,00/);
  await page.getByRole("button", { name: "Reiniciar demo" }).click();
  assert.equal(await page.getByRole("heading", { name: /borradores simulados/ }).count(), 0);
  await page.goto(base + "/contact?secret=must-not-share");
  await page.locator('[name="name"]').fill("   ");
  await page.locator('[name="email"]').fill("fictional@example.test");
  await page.locator('[name="subject"]').fill("Test contact");
  await page.locator('[name="message"]').fill("A fictional message with enough characters.");
  await page.getByRole("button", { name: "Preparar correo", exact: true }).click();
  assert.equal(await page.locator('[name="name"]').evaluate((el) => el.validity.valid), false);
  await page.locator('[name="name"]').fill("Fictional user");
  await page.locator('[name="message"]').fill("line\n".repeat(60));
  await page.waitForTimeout(600);
  const tall = await page.locator("textarea").evaluate((el) => el.clientHeight);
  assert.ok(tall <= 384 && tall > 250);
  await page.reload();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('[name="name"]').inputValue(), "Fictional user");
  await page.locator('[name="message"]').fill("A fictional message with enough characters.");
  assert.ok(await page.locator("textarea").evaluate((el) => el.clientHeight) < tall);
  await page.locator('[name="message"]').press("Alt+h");
  assert.match(page.url(), /contact/);
  await page.locator("h1").click();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), "BUTTON");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))), true);
  await page.keyboard.press("Escape");
  assert.equal(await dialog.count(), 0);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text) => { window.__copied = text; } } });
  });
  await page.getByRole("button", { name: "Herramientas rápidas", exact: true }).click();
  await page.getByRole("button", { name: /Compartir/, exact: false }).last().click();
  const shared = await page.evaluate(() => window.__copied);
  assert.ok(shared && !shared.includes("secret="));
  assert.equal(new URL(shared).pathname, "/contact");
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("cancelled", "AbortError"); } }));
  await page.getByRole("button", { name: "Herramientas rápidas", exact: true }).click();
  await page.getByRole("button", { name: /Compartir/ }).last().click();
  assert.match(await page.locator(".tool-notice").innerText(), /cancelado/);
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new Error("synthetic failure"); } }));
  await page.getByRole("button", { name: "Herramientas rápidas", exact: true }).click();
  await page.getByRole("button", { name: /Compartir/ }).last().click();
  assert.match(await page.locator(".tool-notice").innerText(), /No se pudo/);
  results.push({ interactions: "demo reset/totals, trim validation, drafts, autosize, palette keyboard, shortcuts, share success/cancel/error" });
  await writeFile(`${out}/ui-results.json`, JSON.stringify(results, null, 2));
  console.log(`UI: ${results.length - 1} page checks and interaction checks passed.`);
} finally {
  await browser.close();
}
