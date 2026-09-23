import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file:///C:/Users/amirou/Documents/Quran App/.scratch-diag/captures/clip-leaf2.png");
const img = page.locator("img");
const box = await img.boundingBox();
await page.screenshot({ path: ".scratch-diag/captures/clip-zoom.png", clip: { x: box.x + box.width * 0.55, y: box.y + 60, width: box.width * 0.45, height: 220 } });
await browser.close();
