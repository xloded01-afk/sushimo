import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("перетаскивание головы вправо включает море", async () => {
  await withPage(async (page) => {
    const box = await page.locator(".prawn-head").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 700, box.y + box.height / 2, { steps: 10 });
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

test("захват за хвост не начинает перетаскивание", async () => {
  await withPage(async (page) => {
    const headBefore = await page.locator(".prawn-head").evaluate((el) => el.style.transform);
    const box = await page.locator(".prawn-tail").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 500, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "asian");
    const headAfter = await page.locator(".prawn-head").evaluate((el) => el.style.transform);
    assert.equal(headAfter, headBefore, "голова не должна сдвинуться при захвате за хвост");
  });
});

test("голова доезжает до правого края страницы и не выходит за него", async () => {
  await withPage(async (page) => {
    const box = await page.locator(".prawn-head").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 2000, box.y + box.height / 2, { steps: 10 });
    const atEdge = await page.evaluate(() => {
      const r = document.querySelector(".prawn-head").getBoundingClientRect();
      return { right: Math.round(r.right), vw: window.innerWidth, theme: document.documentElement.dataset.theme };
    });
    assert.ok(atEdge.right <= atEdge.vw + 1, "голова не должна выходить за правый край");
    assert.ok(atEdge.right >= atEdge.vw - 40, "голова должна доезжать почти до края страницы");
    assert.equal(atEdge.theme, "sea");
    await page.mouse.up();

    const rest = await page.locator(".prawn-head").boundingBox();
    await page.mouse.move(rest.x + rest.width / 2, rest.y + 20);
    await page.mouse.down();
    await page.mouse.move(rest.x + rest.width / 2 - 6, rest.y + 20, { steps: 2 });
    const afterGrab = await page.evaluate(() =>
      Math.round(document.querySelector(".prawn-head").getBoundingClientRect().left)
    );
    assert.ok(afterGrab > atEdge.vw / 3, `повторный захват не должен телепортировать (осталась на ${afterGrab})`);

    await page.mouse.move(-500, rest.y + 20, { steps: 12 });
    const dragged = await page.locator(".prawn-head").evaluate((el) =>
      Math.round(el.getBoundingClientRect().left)
    );
    assert.ok(dragged >= 0, "голова не должна уходить за левый край экрана");
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "asian");
  });
});

test("отпускание в середине оставляет голову и микс на месте", async () => {
  await withPage(async (page) => {
    const box = await page.locator(".prawn-head").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 600, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");

    const rest1 = await page.evaluate(() => ({
      left: Math.round(document.querySelector(".prawn-head").getBoundingClientRect().left),
      sea: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sea")),
    }));
    await page.waitForTimeout(450);
    const settled1 = await page.evaluate(() => ({
      left: Math.round(document.querySelector(".prawn-head").getBoundingClientRect().left),
      sea: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sea")),
    }));
    assert.equal(settled1.left, rest1.left, "отпускание не должно двигать голову");
    assert.ok(settled1.sea > 0.4, `микс остаётся на месте отпускания: ${settled1.sea}`);

    const rest2 = await page.locator(".prawn-head").boundingBox();
    await page.mouse.move(rest2.x + rest2.width / 2, rest2.y + 20);
    await page.mouse.down();
    await page.mouse.move(rest2.x + rest2.width / 2 - 400, rest2.y + 20, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(450);
    const settled2 = await page.evaluate(() => ({
      left: Math.round(document.querySelector(".prawn-head").getBoundingClientRect().left),
      sea: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sea")),
      theme: document.documentElement.dataset.theme,
    }));
    assert.equal(settled2.theme, "asian");
    assert.ok(settled2.sea > 0.02 && settled2.sea < 0.5, `промежуточный микс не дотягивается до нуля: ${settled2.sea}`);
    assert.ok(settled2.left > 250 && settled2.left < 700, `голова стоит там, где отпущена: ${settled2.left}`);
  });
});

test("тело проявляется между хвостом и головой при вытягивании", async () => {
  await withPage(async (page) => {
    const bodyRest = await page.locator(".prawn-body").evaluate((el) => el.getBoundingClientRect().width);
    const box = await page.locator(".prawn-head").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 400, box.y + box.height / 2, { steps: 8 });
    const bodyStretched = await page.locator(".prawn-body").evaluate((el) => el.getBoundingClientRect().width);
    assert.ok(
      bodyStretched > bodyRest + 250,
      `тело должно проявиться между хвостом и головой: ${bodyStretched} против ${bodyRest}`
    );
    await page.mouse.up();
    await page.waitForTimeout(450);
    const bodyAfter = await page.locator(".prawn-body").evaluate((el) => el.getBoundingClientRect().width);
    assert.equal(Math.round(bodyAfter), Math.round(bodyStretched), "после отпускания тело остаётся проявленным");
  });
});

test("тач: pointerType touch переключает тему", async () => {
  await withPage(async (page) => {
    assert.equal(await page.locator("#prawn").evaluate((el) => getComputedStyle(el).touchAction), "none");
    await page.locator(".prawn-head").evaluate((el) => {
      const o = (x, y) => ({ bubbles: true, pointerId: 1, pointerType: "touch", clientX: x, clientY: y });
      el.dispatchEvent(new PointerEvent("pointerdown", o(100, 10)));
      el.dispatchEvent(new PointerEvent("pointermove", o(window.innerWidth + 300, 10)));
      el.dispatchEvent(new PointerEvent("pointerup", o(window.innerWidth + 300, 10)));
    });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "sea");
  });
});
