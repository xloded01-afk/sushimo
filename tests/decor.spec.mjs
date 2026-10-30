import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("декор виден только в морской теме и не ловит клики", async () => {
  await withPage(async (page) => {
    const decor = page.locator("#decor");
    assert.equal(await decor.getAttribute("aria-hidden"), "true");
    assert.equal(await decor.evaluate((el) => getComputedStyle(el).pointerEvents), "none");
    assert.equal(await decor.evaluate((el) => getComputedStyle(el).opacity), "0");
    await page.evaluate(() => window.__sushimo.setTheme("sea"));
    await page.waitForTimeout(900);
    assert.notEqual(await decor.evaluate((el) => getComputedStyle(el).opacity), "0");
  });
});
