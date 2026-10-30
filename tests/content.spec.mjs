import { test } from "node:test";
import assert from "node:assert/strict";
import { withPage } from "./helpers.mjs";

test("страница содержит меню, часы и контакт", async () => {
  await withPage(async (page) => {
    const text = await page.locator("body").innerText();
    assert.match(text, /Sushimo/);
    assert.match(text, /500\s*₽/);
    assert.match(text, /300\s*₽/);
    assert.match(text, /400\s*₽/);
    assert.match(text, /10:00\s*[–-]\s*20:00/);
    assert.match(text, /smatvienko04062012@gmail\.com/);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "asian");
    assert.equal(await page.locator("#prawn").count(), 1);
  });
});

test("каркас содержит секции, подсказку и меню в нужном порядке", async () => {
  await withPage(async (page) => {
    for (const id of ["hero", "menu", "hours", "contact", "prawn", "theme-hint"]) {
      assert.equal(await page.locator(`#${id}`).count(), 1, `#${id} должен быть один`);
    }
    assert.equal(await page.locator("#theme-hint").innerText(), "потяни вправо");
    assert.deepEqual(await page.locator("#menu h3").allInnerTexts(), [
      "Большие королевские креветки",
      "Маленькие креветки с рисом",
      "Суши",
    ]);
    assert.match(await page.locator("#menu .menu-note").first().innerText(), /10–25 см/);
    const contactLink = page.locator('#contact a[href^="mailto:"]');
    assert.equal(await contactLink.count(), 1);
    assert.equal(await contactLink.innerText(), "написать нам");
  });
});
