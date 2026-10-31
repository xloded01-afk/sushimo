import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("перетаскивание вправо включает море", async () => {
  await withPage(async (page) => {
    const box = await page.locator("#prawn").boundingBox();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(850, box.y + box.height / 2, { steps: 10 });
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
    await page.mouse.move(box.x + box.width * 0.7, box.y + 10);
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
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(1200, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");

    const rest = await page.locator("#prawn").boundingBox();
    await page.mouse.move(rest.x + rest.width * 0.7, rest.y + 20);
    await page.mouse.down();
    await page.mouse.move(rest.x + rest.width * 0.7 - 6, rest.y + 20, { steps: 2 });
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

test("отпускание в середине оставляет креветку и микс на месте", async () => {
  await withPage(async (page) => {
    const box = await page.locator("#prawn").boundingBox();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(850, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");

    const rest1 = await page.evaluate(() => ({
      left: Math.round(document.getElementById("prawn").getBoundingClientRect().left),
      sea: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sea")),
    }));
    await page.waitForTimeout(450);
    const settled1 = await page.evaluate(() => ({
      left: Math.round(document.getElementById("prawn").getBoundingClientRect().left),
      sea: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sea")),
    }));
    assert.equal(settled1.left, rest1.left, "отпускание не должно двигать креветку");
    assert.ok(settled1.sea > 0.4 && settled1.sea < 0.8, `микс остаётся на месте отпускания: ${settled1.sea}`);

    const rest2 = await page.locator("#prawn").boundingBox();
    await page.mouse.move(rest2.x + rest2.width * 0.7, rest2.y + 20);
    await page.mouse.down();
    await page.mouse.move(603, rest2.y + 20, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(450);
    const settled2 = await page.evaluate(() => ({
      left: Math.round(document.getElementById("prawn").getBoundingClientRect().left),
      sea: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sea")),
      theme: document.documentElement.dataset.theme,
    }));
    assert.equal(settled2.theme, "asian");
    assert.ok(settled2.sea > 0.02 && settled2.sea < 0.5, `промежуточный микс не дотягивается до нуля: ${settled2.sea}`);
    assert.ok(settled2.left > 150 && settled2.left < 500, `креветка стоит там, где отпущена: ${settled2.left}`);
  });
});

test("захват за хвост не начинает перетаскивание", async () => {
  await withPage(async (page) => {
    const box = await page.locator("#prawn").boundingBox();
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(900, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "asian");
    const left = await page.locator("#prawn").evaluate((el) => Math.round(el.getBoundingClientRect().left));
    assert.equal(left, Math.round(box.x), "креветка не должна сдвинуться при захвате за хвост");
  });
});

test("тач: pointerType touch переключает тему", async () => {
  await withPage(async (page) => {
    assert.equal(await page.locator("#prawn").evaluate((el) => getComputedStyle(el).touchAction), "none");
    await page.locator("#prawn").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const grabX = r.left + r.width * 0.7;
      const o = (x, y) => ({ bubbles: true, pointerId: 1, pointerType: "touch", clientX: x, clientY: y });
      el.dispatchEvent(new PointerEvent("pointerdown", o(grabX, r.y + 10)));
      el.dispatchEvent(new PointerEvent("pointermove", o(window.innerWidth - 20, r.y + 10)));
      el.dispatchEvent(new PointerEvent("pointerup", o(window.innerWidth - 20, r.y + 10)));
    });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");
  });
});
