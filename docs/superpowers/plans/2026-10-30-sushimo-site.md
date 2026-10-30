# Sushimo Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Одностраничный сайт ресторана Sushimo: меню из трёх позиций, часы, контакт, и механика «перетащи креветку вправо — сайт становится морским» без перезагрузки.

**Architecture:** Статический сайт без сборки: один `index.html`, CSS с двумя наборами токенов на `:root[data-theme]`, один JS-модуль, который переключает тему по перетаскиванию, свайпу и стрелкам. Сайт не зависит ни от чего; Playwright подключён только для проверок в разработке.

**Tech Stack:** HTML5, CSS (custom properties, `prefers-reduced-motion`), vanilla JS (ES modules, Pointer Events), Node 22, `playwright-core` + установленный Chrome для тестов.

**Spec:** `docs/superpowers/specs/2026-10-30-sushimo-design.md`

## Global Constraints

- Никаких runtime-зависимостей и сборки: сайт открывается как статические файлы.
- Цены ровно такие: `500 ₽ за порцию` (большие, 10–25 см), `300 ₽ за порцию` (маленькие, с рисом), `400 ₽ за 7 штук` (суши).
- Часы: `10:00–20:00`. Контакт: `smatvienko04062012@gmail.com`, ссылка подписана «написать нам».
- Два состояния темы: `data-theme="asian"` (по умолчанию) и `data-theme="sea"`. Текст и порядок блоков не меняются.
- Механика работает мышью, пальцем и клавиатурой; при `prefers-reduced-motion: reduce` переключение мгновенное.
- Декоративные слои: `aria-hidden="true"`, `pointer-events: none`.
- Запрещено: фонарики, иероглифы-обои, красно-золотое сочетание, фейковые фото блюд.
- Фото берутся из интернета; требования — от 2000 px, без водяных знаков, источник в подвале.
- Адрес и телефон отсутствуют: на сайте только «Москва».

## Review Focus

1. **Перетаскивание за пределы экрана / резкий флик** — тема должна переключиться ровно один раз и креветка не должна «улететь» за вьюпорт.
2. **Тач на телефоне** — свайп не должен скроллить страницу вместо перетаскивания (`touch-action`), и не должен ломаться при отпускании пальца вне элемента.
3. **`prefers-reduced-motion: reduce`** — никаких плавных переходов и «выезжающих» водорослей, тема меняется сразу.
4. **Клавиатура** — креветка достижима Tab, переключается стрелками, видимый фокус, состояние озвучивается через `aria-pressed`/`aria-live`.
5. **Медленная сеть и битое фото** — у изображений заданы размеры (нет скачков вёрстки), есть `alt`, при 404 страница не разваливается.

---

### Task 0: Выбрать визуальное направление

**Files:** нет изменений в коде; артефакты в `.taste-skill/`.

**Interfaces:**
- Produces: id выбранного направления, который Task 2–5 используют для палитры, шрифтов и композиции hero.

- [ ] **Step 1: Раздать три направления**

```bash
node "$HOME/.agents/skills/design-taste-frontend/scripts/draw.mjs" --sector restaurant --brief "Sushimo, морепродукты, Москва, королевские креветки 10-25 см" --sections intro,list,contact --tone bold --options 3
```

- [ ] **Step 2: Показать три варианта владельцу**

Собрать по каждому: палитра, шрифтовая пара, композиция первого экрана. Показать в панели просмотра и текстом. Задать один вопрос: какой берём.

- [ ] **Step 3: Зафиксировать выбор**

Записать id в `.taste-skill/direction.md` одной строкой. Ожидаемо: владелец назвал вариант.

---

### Task 1: Каркас страницы и контент

**Files:**
- Create: `index.html`
- Create: `styles/base.css`
- Test: `tests/content.spec.mjs`

**Interfaces:**
- Produces: `index.html` с секциями `#hero`, `#menu`, `#hours`, `#contact`; элементы `#prawn`, `#theme-hint`; корневой `<html data-theme="asian">`; тестовый хелпер `withPage(fn)`.

- [ ] **Step 1: Создать `package.json` и `tests/helpers.mjs`**

`package.json`: `"type": "module"`, devDependency `playwright-core`, скрипт `"test": "node --test tests/"`. `helpers.mjs` экспортирует `withPage(fn)`: запускает `chromium.launch({ channel: "chrome" })`, открывает `file://` на `index.html`, отдаёт `page`, закрывает браузер в `finally`. Если репозитория ещё нет — `git init` и `.gitignore` с `node_modules/`, `.taste-skill/shots/`.

- [ ] **Step 2: Написать падающий тест**

```js
// tests/content.spec.mjs
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
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `node --test tests/content.spec.mjs`
Expected: FAIL — `index.html` отсутствует / `withPage` не находит файл.

- [ ] **Step 4: Создать `index.html`**

Семантическая разметка: `<header>` с названием и часами, `<main>` с `#hero` (креветка `#prawn` + `#theme-hint` с текстом «потяни вправо»), `#menu` — три позиции в порядке «большие → маленькие → суши», `#hours`, `<footer id="contact">` с `mailto:`-ссылкой «написать нам» и строкой «Москва».

- [ ] **Step 5: Создать `styles/base.css`**

Сброс, типографика, сетка, размеры изображений. Палитра — только через переменные, значения придут в Task 2.

- [ ] **Step 6: Прогнать тест**

Run: `node --test tests/content.spec.mjs`
Expected: PASS.

- [ ] **Step 7: Коммит**

```bash
git add index.html styles/base.css tests/content.spec.mjs tests/helpers.mjs package.json
git commit -m "feat: page skeleton with menu, hours and contact"
```

---

### Task 2: Две темы через CSS-переменные

**Files:**
- Create: `styles/themes.css`
- Modify: `index.html` (подключение стилей)
- Test: `tests/theme.spec.mjs`

**Interfaces:**
- Consumes: `<html data-theme>` из Task 1.
- Produces: `setTheme(name: "asian" | "sea"): void` в `js/theme.js` — единственная точка смены темы; переменные `--bg`, `--ink`, `--accent`, `--field`.

- [ ] **Step 1: Написать падающий тест**

```js
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
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/theme.spec.mjs`
Expected: FAIL — `window.__sushimo` не определён.

- [ ] **Step 3: Создать `styles/themes.css` и `js/theme.js`**

Два блока `:root[data-theme="asian"]` и `:root[data-theme="sea"]` с одинаковым набором переменных. `setTheme` ставит атрибут и обновляет `aria-pressed` у креветки. Плавность — `transition: background-color 700ms` под `@media (prefers-reduced-motion: no-preference)`.

- [ ] **Step 4: Прогнать тест**

Run: `node --test tests/theme.spec.mjs`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add styles/themes.css js/theme.js index.html tests/theme.spec.mjs
git commit -m "feat: two themes via css variables"
```

---

### Task 3: Перетаскивание, свайп и клавиатура

**Files:**
- Create: `js/drag.js`
- Modify: `js/theme.js`, `index.html`
- Test: `tests/drag.spec.mjs`

**Interfaces:**
- Consumes: `setTheme` из Task 2.
- Produces: `initDrag(el: HTMLElement, opts: { threshold: number, onCross: () => void, onReturn: () => void }): void`; порог по умолчанию `0.66` ширины вьюпорта.

- [ ] **Step 1: Написать падающие тесты**

```js
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
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `node --test tests/drag.spec.mjs`
Expected: FAIL — тема не переключается.

- [ ] **Step 3: Реализовать `initDrag`**

Pointer Events (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`), `setPointerCapture`, `touch-action: none` на креветке, ограничение позиции пределами вьюпорта, порог `0.66 * innerWidth`, `keydown` на ArrowLeft/ArrowRight и Enter/Space. `setPointerCapture` вызывать в `try/catch`: на синтетических событиях из теста активного указателя нет. Повторный вызов `setTheme` с тем же значением — no-op.

- [ ] **Step 4: Прогнать тесты**

Run: `node --test tests/drag.spec.mjs`
Expected: PASS (4 теста).

- [ ] **Step 5: Коммит**

```bash
git add js/drag.js js/theme.js index.html tests/drag.spec.mjs
git commit -m "feat: drag, swipe and keyboard theme switch"
```

---

### Task 4: Морской декоративный слой

**Files:**
- Create: `assets/decor/` (водоросли, песок, камни — SVG или PNG)
- Create: `styles/decor.css`
- Modify: `index.html`
- Test: `tests/decor.spec.mjs`

**Interfaces:**
- Consumes: `data-theme` из Task 2.
- Produces: `<div id="decor" aria-hidden="true">` с классами `.decor-seaweed`, `.decor-sand`, `.decor-stones`.

- [ ] **Step 1: Написать падающий тест**

```js
test("декор виден только в морской теме и не ловит клики", async () => {
  await withPage(async (page) => {
    const decor = page.locator("#decor");
    assert.equal(await decor.getAttribute("aria-hidden"), "true");
    assert.equal(await decor.evaluate((el) => getComputedStyle(el).pointerEvents), "none");
    assert.equal(await decor.evaluate((el) => getComputedStyle(el).opacity), "0");
    await page.evaluate(() => window.__sushimo.setTheme("sea"));
    await page.waitForTimeout(900);
    assert.notEqual(await decor.evaluate((el) => getComputedStyle(el).opacity), "0");
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/decor.spec.mjs`
Expected: FAIL — `#decor` отсутствует.

- [ ] **Step 3: Добавить слой и стили**

Абсолютно позиционированный слой под текстом (`z-index` ниже контента), `opacity: 0` по умолчанию, `opacity: 1` при `[data-theme="sea"]` с задержкой; при `prefers-reduced-motion: reduce` — без перехода.

- [ ] **Step 4: Прогнать тест**

Run: `node --test tests/decor.spec.mjs`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add assets/decor styles/decor.css index.html tests/decor.spec.mjs
git commit -m "feat: sea decorative layer"
```

---

### Task 5: Фотографии и подсказка

**Files:**
- Create: `assets/prawn.*`, `assets/sea/*`
- Modify: `index.html`, `js/theme.js`
- Test: `tests/assets.spec.mjs`

**Interfaces:**
- Consumes: `#prawn`, `#theme-hint`.
- Produces: подсказка исчезает после первого переключения, факт хранится в `sessionStorage` под ключом `sushimo:hint-seen`.

- [ ] **Step 1: Написать падающий тест**

```js
test("фото загружается и подсказка исчезает после первого свайпа", async () => {
  await withPage(async (page) => {
    const img = page.locator("#prawn img");
    await img.waitFor();
    assert.ok(await img.evaluate((el) => el.naturalWidth > 0), "фото не загрузилось");
    assert.equal(await img.getAttribute("alt")?.length > 0, true);
    await page.evaluate(() => window.__sushimo.setTheme("sea"));
    assert.equal(await page.locator("#theme-hint").evaluate((el) => getComputedStyle(el).opacity), "0");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("sushimo:hint-seen")), "1");
  });
});

test("битое фото не ломает вёрстку", async () => {
  await withPage(async (page) => {
    await page.route("**/assets/prawn*", (route) => route.abort());
    await page.reload();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    assert.ok(await page.locator("#prawn img").evaluate((el) => el.alt.length > 0));
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test tests/assets.spec.mjs`
Expected: FAIL — изображения нет.

- [ ] **Step 3: Подобрать и положить фото**

Найти снимок креветки от 2000 px без водяных знаков, сохранить в `assets/`, указать источник в подвале. Задать `width`/`height` в разметке, `alt` — описание, не «image». Фоновые снимки моря — в `assets/sea/`, `loading="lazy"`, `decoding="async"`.

- [ ] **Step 4: Реализовать подсказку**

Скрытие по первому переключению, `sessionStorage`, `opacity` + `aria-hidden`.

- [ ] **Step 5: Прогнать тест**

Run: `node --test tests/assets.spec.mjs`
Expected: PASS.

- [ ] **Step 6: Коммит**

```bash
git add assets index.html js/theme.js tests/assets.spec.mjs
git commit -m "feat: prawn photo, sea imagery and dismissible hint"
```

---

### Task 6: Мобильная вёрстка, доступность и reduced motion

**Files:**
- Modify: `styles/base.css`, `styles/themes.css`, `js/theme.js`
- Test: `tests/responsive.spec.mjs`

**Interfaces:**
- Consumes: всё предыдущее.

- [ ] **Step 1: Написать падающие тесты**

```js
test("на трёх ширинах нет горизонтального скролла и виден фокус", async () => {
  for (const width of [360, 768, 1440]) {
    await withPage(async (page) => {
      await page.setViewportSize({ width, height: 800 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
      await page.locator("#prawn").focus();
      const outline = await page.locator("#prawn").evaluate((el) => getComputedStyle(el).outlineStyle);
      assert.notEqual(outline, "none");
    });
  }
});

test("при reduced motion тема меняется без перехода", async () => {
  await withPage(async (page) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const duration = await page.evaluate(() => getComputedStyle(document.documentElement).transitionDuration);
    assert.ok(duration === "0s" || duration.startsWith("0s"));
  });
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `node --test tests/responsive.spec.mjs`
Expected: FAIL хотя бы на одной ширине или на `transitionDuration`.

- [ ] **Step 3: Довести стили и JS**

Медиазапросы, размеры шрифтов через `clamp()`, `:focus-visible`, `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 4: Прогнать тесты**

Run: `node --test tests/responsive.spec.mjs`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add styles js tests/responsive.spec.mjs
git commit -m "fix: responsive layout, focus and reduced motion"
```

---

### Task 7: Проверка вкусом и скриншотами

**Files:**
- Modify: `index.html`, `styles/*.css` по итогам проверки
- Create: `.taste-skill/report.md`

**Interfaces:**
- Consumes: готовую страницу.

- [ ] **Step 1: Прогнать инспектор**

```bash
node "$HOME/.agents/skills/design-taste-frontend/scripts/inspect.mjs" --url "file:///$PWD/index.html"
```

Expected: отчёт без нарушений house style; нарушения записать.

- [ ] **Step 2: Снять скриншоты на трёх ширинах в обеих темах**

Expected: шесть файлов в `.taste-skill/shots/`.

- [ ] **Step 3: Посмотреть скриншоты и починить три главные проблемы**

Записать в `.taste-skill/report.md`, что было не так и что изменено. Максимум три раунда.

- [ ] **Step 4: Прогнать все тесты**

Run: `node --test tests/`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "polish: taste pass and screenshot fixes"
```
