import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// Outside the reader, the bottom bar follows the reader's gesture: scrolling a
// page down tucks it away, a tap on the page (or the keyboard) brings it back.

async function open(page, path, { width = 390, height = 700 } = {}) {
  await page.setViewportSize({ width, height });
  await installQuranNetworkFixtures(page);
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({ skipSplashAnimation: true, lang: "fr", riwaya: "hafs", sidebarOpen: false }),
    );
  });
  await page.goto(path);
  if (width <= 1024) await expect(page.locator(".mobile-navigation")).toBeVisible({ timeout: 30_000 });
  else await expect(page.locator(".legal-page, .app-view-home")).toBeVisible({ timeout: 30_000 });
}

const away = (page) => page.locator(".app-root").evaluate((node) => node.classList.contains("nav-away"));
const scrollMain = (page, top) =>
  page.locator("#main-content").evaluate((node, value) => { node.scrollTop = value; }, top);

// Scrolls down in two steps, like a thumb, until the bar steps away. Layout and
// the scroll listener may not be ready on the first attempt on a slow runner.
async function scrollDownUntilAway(page) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await scrollMain(page, 0);
    await page.waitForTimeout(120);
    await scrollMain(page, 120);
    await page.waitForTimeout(120);
    await scrollMain(page, 320);
    await page.waitForTimeout(250);
    if (await away(page)) return;
  }
}

for (const path of ["/privacy", "/duas", "/prieres", "/"]) {
  test(`the bottom bar steps away on scroll and returns on tap (${path})`, async ({ page }) => {
    // The prayers page without a city is a short card: a shorter phone keeps it scrollable.
    await open(page, path, { height: path === "/prieres" ? 520 : 700 });
    const nav = page.locator(".mobile-navigation");
    await expect(nav).toBeVisible();
    // The page must be tall enough to scroll; the test would prove nothing otherwise.
    expect(await page.locator("#main-content").evaluate((node) => node.scrollHeight - node.clientHeight)).toBeGreaterThan(100);

    expect(await away(page)).toBe(false);
    await scrollDownUntilAway(page);
    await expect.poll(() => away(page)).toBe(true);
    await expect(nav).toBeHidden();
    // Hidden means out of reach for assistive tech and the keyboard as well.
    expect(await nav.evaluate((node) => node.hasAttribute("inert"))).toBe(true);

    await page.locator("#main-content").click({ position: { x: 20, y: 120 } });
    await expect.poll(() => away(page)).toBe(false);
    await expect(nav).toBeVisible();
  });
}

test("the bar is never hidden at the top of a page", async ({ page }) => {
  await open(page, "/privacy");
  await scrollMain(page, 320);
  await expect.poll(() => away(page)).toBe(true);
  await scrollMain(page, 0);
  await expect.poll(() => away(page)).toBe(false);
});

test("a key press brings the bar back", async ({ page }) => {
  await open(page, "/privacy");
  await scrollDownUntilAway(page);
  await expect.poll(() => away(page)).toBe(true);
  await page.keyboard.press("Tab");
  await expect.poll(() => away(page)).toBe(false);
});

test("a desktop width keeps the header and never tucks anything away", async ({ page }) => {
  await open(page, "/privacy", { width: 1280, height: 900 });
  await expect(page.locator(".mp-header")).toBeVisible();
  await scrollMain(page, 400);
  await page.waitForTimeout(150);
  expect(await away(page)).toBe(false);
  await expect(page.locator(".mp-header")).toBeVisible();
});

test("a tap on a control that keeps its click to itself still brings the bar back", async ({ page }) => {
  // Cards, play buttons and menus stop the click from bubbling. The bar listens
  // while the click travels down to its target, so none of them can hold it back.
  await open(page, "/privacy");
  await scrollDownUntilAway(page);
  await expect.poll(() => away(page)).toBe(true);
  await page.locator("#main-content").evaluate((node) => {
    const button = document.createElement("button");
    button.id = "swallows-clicks";
    button.type = "button";
    button.textContent = "Test";
    button.style.cssText = "position:fixed;top:90px;inset-inline-start:20px;z-index:5;width:64px;height:64px";
    button.addEventListener("click", (event) => event.stopPropagation());
    node.appendChild(button);
  });
  await page.locator("#swallows-clicks").click();
  await expect.poll(() => away(page)).toBe(false);
  await expect(page.locator(".mobile-navigation")).toBeVisible();
});
