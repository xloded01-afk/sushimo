import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("setTheme меняет фон без перезагрузки", async () => {
  await withPage(async (page) => {
    const before = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim());
    await page.evaluate(() => window.__sushimo.setTheme("sea"));
    const after = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim());
    assert.notEqual(before, after);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");
    assert.equal(await page.evaluate(() => performance.getEntriesByType("navigation").length), 1);
  });
});
