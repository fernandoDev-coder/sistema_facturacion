import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = (file) => pathToFileURL(path.join(process.env.FAKTUDASH_BROWSER_TOOLS, "node_modules", file));
const { default: lighthouse } = await import(moduleUrl("lighthouse/core/index.js"));
const { launch } = await import(moduleUrl("chrome-launcher/dist/index.js"));
const base = process.env.PERF_BASE_URL;
const label = process.env.PERF_LABEL;
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
assert.ok(["before", "after"].includes(label));
const output = "docs/evidence/2026-11-09";
await mkdir(output, { recursive: true });
const rows = [];
for (const route of ["/", "/pricing", "/demo"]) {
  // Warm the server; each measurement uses a fresh browser with cold client caches.
  await fetch(base + route);
  for (let run = 1; run <= 3; run++) {
    const chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"] });
    try {
      const result = await lighthouse(base + route, {
        port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance"],
        formFactor: "mobile", throttlingMethod: "simulate",
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false },
      });
      if (result.lhr.runtimeError) throw new Error(result.lhr.runtimeError.message);
      const audit = result.lhr.audits;
      const js = audit["resource-summary"].details.items.find((item) => item.resourceType === "script");
      rows.push({ route, run, LCP_ms: audit["largest-contentful-paint"].numericValue,
        CLS: audit["cumulative-layout-shift"].numericValue, TBT_ms: audit["total-blocking-time"].numericValue,
        JS_bytes: js?.transferSize ?? 0, score: result.lhr.categories.performance.score,
        lighthouse: result.lhr.lighthouseVersion, userAgent: result.lhr.userAgent, settings: result.lhr.configSettings.throttling });
      console.log(`${label} ${route} run ${run}: LCP ${Math.round(rows.at(-1).LCP_ms)}ms; CLS ${rows.at(-1).CLS.toFixed(3)}; TBT ${Math.round(rows.at(-1).TBT_ms)}ms; JS ${rows.at(-1).JS_bytes} bytes`);
    } finally { await chrome.kill(); }
  }
}
await writeFile(`${output}/performance-${label}.json`, JSON.stringify(rows, null, 2));
