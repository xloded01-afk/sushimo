import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("подсказка исчезает после первого переключения темы", async () => {
  await withPage(async (page) => {
    const hint = page.locator("#theme-hint");
    assert.equal(await hint.evaluate((el) => getComputedStyle(el).opacity), "1");
    await page.evaluate(() => window.__sushimo.setTheme("sea"));
    assert.equal(await hint.evaluate((el) => getComputedStyle(el).opacity), "0");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("sushimo:hint-seen")), "1");
  });
});
