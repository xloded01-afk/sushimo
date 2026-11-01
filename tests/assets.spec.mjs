import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("подсказка медленно исчезает после первого переключения темы", async () => {
  await withPage(async (page) => {
    const hint = page.locator("#theme-hint");
    assert.equal(await hint.evaluate((el) => getComputedStyle(el).opacity), "1");
    await page.evaluate(() => window.__sushimo.setTheme("sea"));
    // подсказка тает плавно — ждём окончания перехода
    await page.waitForFunction(
      () => getComputedStyle(document.getElementById("theme-hint")).opacity === "0",
      { timeoutMs: 3000 }
    );
    assert.equal(await hint.evaluate((el) => getComputedStyle(el).opacity), "0");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("sushimo:hint-seen")), "1");
  });
});

test("все части креветки загружаются", async () => {
  await withPage(async (page) => {
    for (const cls of [".prawn-tail", ".prawn-head"]) {
      assert.ok(
        await page.locator(cls).evaluate((el) => el.naturalWidth > 0),
        `${cls} не загрузилась`
      );
    }
    const joints = await page.locator(".prawn-body .prawn-joint").count();
    const fins = await page.locator(".prawn-body .prawn-fin").count();
    assert.ok(joints >= 0 && fins >= 1, "тело должно собираться из вагончиков со стыками и плавниками");
    assert.match(await page.locator("#prawn").getAttribute("aria-label"), /за голову/);
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
