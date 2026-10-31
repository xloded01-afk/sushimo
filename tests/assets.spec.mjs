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

test("все три части креветки загружаются", async () => {
  await withPage(async (page) => {
    const widths = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".prawn-tail, .prawn-body, .prawn-head")).map(
        (el) => el.naturalWidth
      )
    );
    assert.equal(widths.length, 3);
    for (const w of widths) {
      assert.ok(w > 0, "часть креветки не загрузилась");
    }
    assert.match(
      await page.locator("#prawn").getAttribute("aria-label"),
      /за голову/
    );
  });
});

test("битая графика не ломает вёрстку", async () => {
  await withPage(async (page) => {
    await page.locator(".prawn-head").evaluate((el) => {
      el.src = "assets/prawn-missing.svg";
    });
    await page.waitForTimeout(300);
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    );
    assert.equal(await page.locator(".prawn-tail").evaluate((el) => el.naturalWidth > 0), true);
  });
});
