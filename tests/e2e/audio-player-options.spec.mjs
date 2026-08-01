import { test, expect } from "@playwright/test";

async function openReader(page) {
  await page.goto("/");
  const start = page.getByRole("button", {
    name: /Commencer la lecture|Reprendre la lecture|Continuer|Start reading|Continue|Resume reading/i,
  });
  await expect(start.first()).toBeVisible();
  await start.first().click();
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible();
}

async function ensureWarsh(page) {
  const toggle = page.locator(".mp-header__riwaya-toggle").first();
  const label = toggle.locator("span");

  if (await toggle.isVisible().catch(() => false)) {
    if ((await label.textContent())?.trim().toUpperCase() !== "WARSH") {
      await toggle.click();
    }
  } else {
    const more = page.locator(".mp-header__more").first();
    await expect(more).toBeVisible();
    await more.click();

    const warshChoice = page
      .locator(".mp-header-menu__riwaya-btns .mp-header__seg")
      .filter({ hasText: /^WARSH$/i });
    await expect(warshChoice).toBeVisible();
    await warshChoice.click();
  }

  await expect(page.locator(".app-root")).toHaveAttribute("data-riwaya", "warsh");
}

test("E2E: audio player minimized click restores panel and options modal opens", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {}
  });

  await openReader(page);

  const desktopPlayer = page.locator(".mp-audio-player--desktop").first();
  await expect(desktopPlayer).toBeVisible();

  const initialClass = (await desktopPlayer.getAttribute("class")) || "";
  const startsMinimized = initialClass.includes("is-minimized");

  if (!startsMinimized) {
    const minimizeBtn = desktopPlayer
      .locator("button[aria-label*='Réduire'], button[aria-label*='Minimize'], button[aria-label='تصغير']")
      .first();
    await expect(minimizeBtn).toBeVisible();
    await minimizeBtn.click();
    await expect(desktopPlayer).toHaveClass(/is-minimized/);
  }

  const reopenBtn = desktopPlayer.locator(".mp-player-minimized-open").first();
  await expect(reopenBtn).toBeVisible();
  await reopenBtn.click();

  await expect(desktopPlayer).not.toHaveClass(/is-minimized/);

  const optionsTrigger = desktopPlayer.locator(".mp-player-options-trigger").first();
  await expect(optionsTrigger).toBeVisible();
  await optionsTrigger.click();

  const optionsModal = page.locator(".audio-player-modal").first();
  await expect(optionsModal).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(optionsModal).toBeHidden();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("E2E mobile: minimized restore works and options modal toggles", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {}
    });

    await openReader(page);
    await ensureWarsh(page);

    const mobilePlayer = page.locator(".mp-audio-player--mobile").first();
    await expect(mobilePlayer).toBeVisible();

    const reopenFromMin = mobilePlayer.locator(".mp-player-minimized-open").first();
    if (await reopenFromMin.isVisible().catch(() => false)) {
      await reopenFromMin.click();
    }

    const dockPlayer = page.locator(".mp-audio-player--mobile.mp-audio-player--dock").first();
    await expect(dockPlayer).toBeVisible();

    const optionsTrigger = dockPlayer.locator(".mp-player-options-trigger").first();
    await expect(optionsTrigger).toBeVisible();
    await optionsTrigger.click();

    const optionsModal = page.locator(".audio-player-modal").first();
    await expect(optionsModal).toBeVisible();

    const reciterPanel = optionsModal.locator(".audio-reciter-options");
    const reciterCards = reciterPanel.locator(".audio-reciter-options__item");
    await expect(reciterPanel.locator(".audio-reciter-options__count")).toContainText("10 voix");
    await expect(reciterCards).toHaveCount(10);
    await expect(reciterPanel.locator('[data-state="selected"]')).toHaveCount(1);
    await expect(reciterPanel.locator('[data-state="selected"] .audio-reciter-options__check')).toBeVisible();
    await expect(reciterCards.first().locator(".audio-reciter-options__meta")).toContainText("Warsh");
    await expect(reciterCards.first().locator(".audio-reciter-options__photo")).toBeVisible();

    const layout = await reciterPanel.evaluate((panel) => {
      const grid = panel.querySelector(".audio-reciter-options__grid");
      const card = panel.querySelector(".audio-reciter-options__item");
      const selected = panel.querySelector('[data-state="selected"]');
      const idle = panel.querySelector('[data-state="idle"]');
      return {
        columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0,
        cardHeight: card?.getBoundingClientRect().height || 0,
        noHorizontalOverflow: panel.scrollWidth <= panel.clientWidth + 1,
        selectionIsDistinct:
          Boolean(selected && idle) &&
          getComputedStyle(selected).backgroundColor !== getComputedStyle(idle).backgroundColor,
      };
    });

    expect(layout.columns).toBe(1);
    expect(layout.cardHeight).toBeGreaterThanOrEqual(64);
    expect(layout.noHorizontalOverflow).toBe(true);
    expect(layout.selectionIsDistinct).toBe(true);

    await page.keyboard.press("Escape");
    await expect(optionsModal).toBeHidden();

    const minimizeBtn = dockPlayer
      .locator("button[aria-label*='Réduire'], button[aria-label*='Minimize'], button[aria-label='تصغير']")
      .first();
    await expect(minimizeBtn).toBeVisible();
    await minimizeBtn.click();

    const minimizedPlayer = page
      .locator(
        '.mp-audio-player--mobile.is-minimized[data-testid="audio-player-compact"]',
      )
      .first();
    await expect(minimizedPlayer).toBeVisible();

    const reopenBtn = minimizedPlayer.locator(".mp-player-minimized-open").first();
    await expect(reopenBtn).toBeVisible();
    await reopenBtn.click();

    await expect(
      page.locator(".mp-audio-player--mobile.simple-player--mobile-open").first(),
    ).toBeVisible();
  });

  test("E2E mobile: une fiche Warsh charge la biographie sourcée et le portrait", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {}
    });

    await page.goto("/");
    await ensureWarsh(page);

    const recitationsTab = page.getByRole("tab").nth(2);
    await recitationsTab.click();
    await expect(recitationsTab).toHaveAttribute("aria-selected", "true");

    const reciterButton = page.getByRole("button", {
      name: "Ibrahim Al-Dosari (Warsh)",
      exact: true,
    });
    await expect(reciterButton).toBeVisible();
    await reciterButton.click();

    const detail = page.locator(".reciter-detail");
    await expect(detail).toBeVisible();
    await expect(detail.locator("#reciter-modal-title")).toContainText("Ibrahim Al-Dosari");
    await expect(detail.locator(".reciter-detail__bio p")).toContainText(/Riyad/i);
    await expect(detail.locator(".reciter-detail__bio p")).toContainText(/doctorat/i);

    const biographyLink = detail.locator(
      '.reciter-detail__source-row a[href*="/ibrahim-al-dossari-206/"]',
    );
    await expect(biographyLink).toHaveText("Assabile");
    const portraitSourceLink = detail.locator(
      '.reciter-detail__source-row a[href*="way2quran.com/ar/reciters/ibrahim-al-dosari"]',
    );
    await expect(portraitSourceLink).toHaveText("Way2Quran");

    const portrait = detail.locator(".reciter-hero__avatar");
    await expect(portrait).toBeVisible();
    const portraitTag = await portrait.evaluate((element) => element.tagName);
    if (portraitTag === "IMG") {
      await expect(portrait).toHaveAttribute(
        "src",
        /storage\.googleapis\.com\/way2quran_storage\/imgs\/ibrahim-al-dosari\.png/,
      );
    } else {
      await expect(portrait).toHaveClass(/reciter-hero__avatar--fallback/);
      await expect(portrait).toContainText("IA");
    }

    const detailLayout = await detail.evaluate((dialog) => ({
      noHorizontalOverflow: dialog.scrollWidth <= dialog.clientWidth + 1,
      fitsViewport: dialog.getBoundingClientRect().width <= window.innerWidth,
    }));
    expect(detailLayout.noHorizontalOverflow).toBe(true);
    expect(detailLayout.fitsViewport).toBe(true);
  });
});
