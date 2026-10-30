import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const pageURL = pathToFileURL(join(root, "index.html")).href;

export async function withPage(fn) {
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--allow-file-access-from-files"],
  });
  try {
    const page = await browser.newPage();
    await page.goto(pageURL);
    await fn(page);
  } finally {
    await browser.close();
  }
}
