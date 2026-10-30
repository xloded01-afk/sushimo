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

test("креветка-объект загружается и подписана по-человечески", async () => {
  await withPage(async (page) => {
    const img = page.locator("#prawn img");
    await img.waitFor();
    assert.ok(await img.evaluate((el) => el.naturalWidth > 0), "графика креветки не загрузилась");
    const alt = await img.getAttribute("alt");
    assert.ok(alt && alt.length > 0 && alt.toLowerCase() !== "image", "alt обязан быть осмысленным");
  });
});

test("битая графика не ломает вёрстку", async () => {
  await withPage(async (page) => {
    await page.locator("#prawn img").evaluate((el) => {
      el.src = "assets/prawn-missing.svg";
    });
    await page.waitForTimeout(300);
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    );
    const alt = await page.locator("#prawn img").getAttribute("alt");
    assert.ok(alt && alt.length > 0);
  });
});
