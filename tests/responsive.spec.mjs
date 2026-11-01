import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("на трёх ширинах нет горизонтального скролла и виден фокус", async () => {
  for (const width of [360, 768, 1440]) {
    await withPage(async (page) => {
      await page.setViewportSize({ width, height: 800 });
      // даём обработчику resize пересчитать геометрию креветки
      await page
        .waitForFunction(
          () => {
            const r = document.querySelector(".prawn-head").getBoundingClientRect();
            return r.right <= window.innerWidth + 1;
          },
          { timeoutMs: 2000 }
        )
        .catch(() => {});
      const check = await page.evaluate(() => {
        const offenders = Array.from(document.querySelectorAll("*"))
          .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 6)
          .map(
            (el) =>
              el.tagName +
              "." +
              String(el.className.baseVal ?? el.className).split(" ")[0] +
              "→" +
              Math.round(el.getBoundingClientRect().right)
          );
        return {
          ok: document.documentElement.scrollWidth <= window.innerWidth + 1,
          offenders,
        };
      });
      assert.ok(
        check.ok,
        `горизонтальный скролл на ширине ${width}: ${JSON.stringify(check.offenders)}`
      );
      await page.locator("#prawn").focus();
      const outline = await page.locator("#prawn").evaluate((el) => getComputedStyle(el).outlineStyle);
      assert.notEqual(outline, "none", `фокус не виден на ширине ${width}`);
    });
  }
});

test("при reduced motion тема меняется без перехода", async () => {
  await withPage(async (page) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const duration = await page.evaluate(() =>
      getComputedStyle(document.documentElement).transitionDuration
    );
    assert.ok(duration === "0s" || duration.startsWith("0s"), `переход не отключён: ${duration}`);
  });
});
