import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("перетаскивание вправо включает море", async () => {
  await withPage(async (page) => {
    const box = await page.locator("#prawn").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(900, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");
  });
});

test("стрелка вправо переключает тему с клавиатуры", async () => {
  await withPage(async (page) => {
    await page.locator("#prawn").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "asian");
  });
});

test("флик за пределы экрана не ломает состояние", async () => {
  await withPage(async (page) => {
    const box = await page.locator("#prawn").boundingBox();
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(5000, -5000, { steps: 5 });
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");
    const left = await page.locator("#prawn").evaluate((el) => el.getBoundingClientRect().left);
    assert.ok(left >= 0, "креветка не должна улететь за левый край");
  });
});

test("повторный захват с правой позиции не телепортирует и не выпускает за экран", async () => {
  await withPage(async (page) => {
    const box = await page.locator("#prawn").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(1200, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");

    const rest = await page.locator("#prawn").boundingBox();
    await page.mouse.move(rest.x + 20, rest.y + 20);
    await page.mouse.down();
    await page.mouse.move(rest.x + 14, rest.y + 20, { steps: 2 });
    const afterGrab = await page.evaluate(() => ({
      left: Math.round(document.getElementById("prawn").getBoundingClientRect().left),
      vw: window.innerWidth,
    }));
    assert.ok(
      afterGrab.left > afterGrab.vw / 2,
      `захват не должен телепортировать креветку домой (осталась на ${afterGrab.left})`
    );

    await page.mouse.move(-500, rest.y + 20, { steps: 12 });
    const dragged = await page.locator("#prawn").evaluate((el) => Math.round(el.getBoundingClientRect().left));
    assert.ok(dragged >= 0, "креветка не должна уходить за левый край экрана");
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "asian");
  });
});

test("тач: pointerType touch переключает тему", async () => {
  await withPage(async (page) => {
    assert.equal(await page.locator("#prawn").evaluate((el) => getComputedStyle(el).touchAction), "none");
    await page.locator("#prawn").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const o = (x, y) => ({ bubbles: true, pointerId: 1, pointerType: "touch", clientX: x, clientY: y });
      el.dispatchEvent(new PointerEvent("pointerdown", o(r.x + 10, r.y + 10)));
      el.dispatchEvent(new PointerEvent("pointermove", o(window.innerWidth - 20, r.y + 10)));
      el.dispatchEvent(new PointerEvent("pointerup", o(window.innerWidth - 20, r.y + 10)));
    });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");
  });
});
