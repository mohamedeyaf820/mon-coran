// Opens a command from the shell's secondary menu. Up to 1024px the header is
// replaced by the bottom navigation, whose "more" popover carries the same tools.
export async function openQuickMenuItem(page, key) {
  if ((page.viewportSize()?.width ?? 1280) <= 1024) {
    await page.locator('.mobile-navigation [data-destination="more"]').click();
    await page.locator(`.mobile-navigation-menu [data-tool="${key}"]`).click();
    return;
  }
  await page.locator(".mp-header__more").first().click();
  await page.locator(`.mp-header-menu__item[data-key="${key}"]`).click();
}
