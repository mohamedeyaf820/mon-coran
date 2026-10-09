// While reading, the compact chrome hides itself 2.8 s after load and only a
// touch or a scroll brings it back. A test that waits for the header or the
// bottom bar to be visible never produces either, so a slow run (load, WebKit)
// waited until the test timeout. Ask for the chrome the way the app's own
// commands do.
export async function revealReadingChrome(page) {
  await page.evaluate(() => window.dispatchEvent(new Event("mushafplus-reveal-reading-chrome")));
}

// Opens a command from the shell's secondary menu. Up to 1024px the header is
// replaced by the bottom navigation, whose "more" popover carries the same tools.
export async function openQuickMenuItem(page, key) {
  if ((page.viewportSize()?.width ?? 1280) <= 1024) {
    await revealReadingChrome(page);
    await page.locator('.mobile-navigation [data-destination="more"]').click();
    await page.locator(`.mobile-navigation-menu [data-tool="${key}"]`).click();
    return;
  }
  await page.locator(".mp-header__more").first().click();
  await page.locator(`.mp-header-menu__item[data-key="${key}"]`).click();
}
