import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Read as data: importing an untrusted config would execute it before the assertion.
// Only line endings and the final newline may differ from this reviewed allowlist.
const approvedConfig = `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;`;

test("PostCSS config contains only the reviewed Tailwind plugin declaration", () => {
  const source = readFileSync(new URL("../postcss.config.mjs", import.meta.url), "utf8");
  assert.equal(source.replaceAll("\r\n", "\n").replace(/\n$/, ""), approvedConfig);
});
