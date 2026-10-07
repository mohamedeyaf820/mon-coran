import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// Regression guard for background playback of a continuous recitation: the
// verses must follow one another exactly once, with a single audio element
// playing at a time, whatever the page does while the user is elsewhere
// (hidden tab, locked screen, page frozen then resumed, bfcache round trip).
// Every audio file is a 1.4 s tone so the whole surah plays in a few seconds.
const TONE_MP3 = Buffer.from("SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYzLjEuMTAwAAAAAAAAAAAAAAD/83DAAAAAAAAAAAAASW5mbwAAAA8AAAA4AAAMJAATFxcbGyAgJCgoLS0xMTU1Oj4+QkJGRktPT1NTWFhcXGBlZWlpbW1xcXZ6en5+g4OHi4uQkJSUmJicoaGlpamprq6ytra7u7+/w8jIzMzQ0NXV2d3d4eHm5urq7vPz9/f7+/8AAAAATGF2YzYzLjEuAAAAAAAAAAAAAAAAJAMqAAAAAAAADCSbU2RvAAAAAAAAAAAAAAAAAP/zIMQACDhKeCFYAAERacuWim860AIIzGMwi+DT3/cty3/h+N09sAAAAAdmHh4AACyUCgT/8yLEBgpwetJZjTgCAoFAABkEFD9JIZMREUIEkC1H7whByC38eGw24lCXg0JTvqBqVtVtMP/zIMQECcA6UAHeAAEKAPGACgqAwZJ6RJjlCCmD0CKYFwDJgDgIGAaAUYCIAypupXbQCGn/8yDEBAjYOkAAx7IFaYEgGRg7hpmcw3mZwYaZg9AdGBaA+ZqJkGGTOW3igZUu8CAmFxgJ//MgxAcIODpEAMewBQG5gmhtGUo6gZQYaxgiAVlrlhQMI0TL4xYWcguWboGBiB2YSAdBof/zIsQNCOA6PADHsgWr0RoNB1GEmCKYGwExoLGamZmBZCHwOi7oNAYImAiBwYJAcJk9u8mT//MgxBEIMDpEAMewBUBtmCCBYW1WMBimmBeqKjJRiGAAMwGAHDBbCNMt5O0yzQjzBcAiMP/zIMQXCIg+SAB/sAQdARMZwAIC5THlmdUu8DAgGBgHAcmCKHMZLz0BknhwGB4BeXCWKCj/8yDEGwgwOkQAx7AFxqeXpiwtdQuOcGGBmBqYSwahoxuAGiMGsYTIH5gcASGgsZapkaFl//MixCEI4Do8AMeyBSHwNS/oNEAJmAaB0YIAdZkhvimRkHKYG4GBblXQOSa2F6oqMYHR8M7/8yDEJQgwOkQAx7AFEwIgHjBxCVM2hR0zVQlzBwAoMCUBUxSzAIAMaJ8sLEhi5oNAMMAY//MgxCsIuDpEAMeyBQzMDEM4x3m6j6LKMUClCcyUMEZjoiyJWnMLpnIxgbgWmE4F4aRLKP/zIMQvB+A6SAD3MCEaNgYBhPgcmBwBIZzBkqmJsDAIfA5IUucDADTAFAyMCwNMxw3Bz2j/8yLENgjwOjwAx7IFzTEoqQQr+DAmciI0hWpq4YA5lMDYCgwnwsTSYX1NH0LUwoANjA5AjP/zIMQ6B+A6SAD3MCHPZMZYw+QaDGAyMSQMQhMjAMCgJUweR9DO6+sM6EeowZggwqBANMn/8yDEQQjwOjwAx7IFziHlOCtV/ToyRZA1Z6MGDmCiYkglBv1y6G9wJcYkoNJg6AmGqeGd//MgxEQJcD4wANeyBXJluhhCjl0lcDoxBEw6AxkMwIwljBuH7M3v98zYB8TBdCGFAJSZ4//zIsRFCeBCLADPtAWgM9Ygd0xWevdqW8HIPZTBEAoML8LE1Yl7TVBC1ML4DgwRwKTJnzEH//MgxEUJkEYwANeyBIwscGhYYrkaMMowGTH4MBYIMwVRvjLQ4UMrsbYwRAdSqA8UKAcI6v/zIMRFCWA+OADHtAVcMpaFOrVZok8+CMEcCMwwAoDVzV0NU4KYwwQNTBEAoMkgMOfMBGD/8yDERgkoPjQAz7IFoEhupUowizBaMLkwEwhDBKHDMpPjkyfhuzA5B2GQIR5sHgnakGXN//MixEgJWD44AMe0BQZ5Wm2TMCLmEwFGPYsn12qny4umPQLGEoImGaDCgrOkfKC1MMoANmD/8yDESgkgPjQAz7IF8GAcEKYII5BkpcrGSCOAYFwPYgAkFnAkY7Dw61oU6spPkeeB8GCS//MgxEwH6DpEAMdyBQMmGIEAaxaPBqzBDGGGBaYIgEhkDxgz4EkCANDdSqoEAhUwGTmACP/zIMRTCRg+NADPsgUwGBEK2YyNjpjBCrmAqCwIQFxZYuk+gGrPbfVqXsiwGjMDAAYwkwT/8yLEVQlQPjgAx7QF80RjAzQrBTMJABYwLwFTFRBiAXzQblFVMEoCNgXowBAiTArHOMcjov/zIMRXCNA+PADPsAWMbscYwFgfQABQGQCZR3Ci1rUp1ZVJEmmG8MEkA0wxgXDWdNgNXgH/8yDEWgioOkAAx7IFiMMUCMwRAIDHHgChCkoUDROpUgIKFUgpiBQdDAYGVMU3NE6BjzAp//MgxF4JED40AM+yBbACIwwNjw5BRKGhE5t9Wk1ihIm8wPAADCtA9NO4m800QQzCqAWMDv/zIsRgCSg+OADHtAVAZMdcGMCH8dDmKgSIFEwvgFAdTANGWMQbN437kAYbTAQiBwcJh0EE//MgxGMIoD44AM+4AdHhC51EtUBpFIb4AglzDIA0NakiQ1hAPDDHAXMEIBwxR4EoRFKHA//zIMRnCMA6PADHsgVH7lQEChdIRYiEHQwABmTC5zpNYZMlNxgcSgoPlYeEicRCJzb6tVL/8yDEawioPjgAz7gB4iCTjDgZDCVAPNFgRM0PQFzCSAGMC0A8wURAkO5od5ipApAWbEfQ//MixG8I+D44AMe0BcBFhcdYwcuvDBrHOCoQZgIAYGsARnjbpNi1eiWVCARZ4pRFgszDoAH/8yDEcwiYPjgAz7gBDZ7CqNlABIw5QETBOAgMckCqkctFQZJblSoCEhdoY7LARQ6OuOdf//MgxHcIcDpAAMeyBYXHRMAYIQwFQMzXDGzCmMrZatRq1QUcHWjcRMGiGEPG7IF8Jc1mIf/zIMR8CJA+NADPsgUAIGC6BOZNaFGRLrJCcFXaVQSMIGyHoZCLAA6xg89eGeOgYVQphgb/8yLEgAkIPjQAz7QFRhgCCRPFjATDBq9EsgMaEXB8IYGkYhgDpuxjvm5kAaYg4A5gtASGQf/zIMSDCEg+NADPsgVghYkOodJQTcFm/RUKBiqRYxEQOxgEjMmF5nSa7yZhg4GFRWYTAYf/8yDEiAiQPjAAz7QFDwOJ5MI2zX1VASQOtCYjBoABMQ0D43XizDcvAuAxBhgtgQmPVijA//MgxIwIqD40AM+4AVNYwTgK7SoGjCjJB0CQizAaHUMTPqw5ZzjFqFMQDYw0CAgngouDwv/zIsSQCZg+MADPtATGp0V/lQEiCrgPCYNIBRiFAtm6udCblAJocQWYLADhjFQ6xEOgRkIB//MgxJEI4D44AM+4Aawt+tVASOgGDoE4MBiMBcWExIrPzjtdMSGAwqJTeMNgC/j13svqqv/zIMSUCRg+MADPtAVFIOKGiAQMphJgcGiYUkaGIGRWEcYE4AoJNKiApmgzKqoLgECIpcb/8yDElgkYRjQAz7gAACDqYFAyhjI5gGMQMcYG4OJgPAXGoQDvzmAGoHPvLS4oQ4HxMD0A//MixJgJkD4wAM+0BIMKgFc04zbzTCBPFhSjAuAGAiRIuIfBUKUlVU0SqAMKgOgQFIwHxLz/8yDEmQiIPjwA9zAhxXpvzq8rMUFAwmHTWEJAA3jT3svqqgMIFVP4DBIAVMMMHg1ikdDV//MgxJ0IMDpAAMeyBZwbggXkwOQCQKXHTgMkiAPDVWkvMWAEQsBcYBIOZgdDHGQTkof+xf/zIMSjCTg+OADPsgUZHOJiQYGsUAvzkKEoHPvLVUFEvBEA5hyLJkChZ2TCp3AXxisIQKH/8yDEpQiQOjwAx7IFAEAEGBQBGAgNLyfiwgAQnWJA0LBIKBhMkMsv4Ype6TThILmwxX5f//MixKkIiD5AAPcwIViMg9FRNRxanAsAwWDpYRuOENDvEg0mWESsuFz4+d4fAYgf/KDHHDX/8yDErgkAPjgAx7QFN4I8BmCREufl9FtFxcy+kJQlqQ5RQ1bGgvXoqEMCsRQUiGpMQU1F//MgxLEJCD44APcyITMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zIMSzCKg+UAFdAACqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/8yLEtxB4sqJZmjgAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zIMSdCKhZ8AHPAAGqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=", "base64");

const SETTINGS = {
  skipSplashAnimation: true,
  lang: "fr",
  theme: "light",
  riwaya: "hafs",
  reciter: "ar.alafasy",
  showHome: false,
  displayMode: "surah",
  mushafLayout: "list",
  currentSurah: 112,
  currentAyah: 1,
};

async function prepare(page) {
  await page.addInitScript((settings) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify(settings));
    window.__plays = [];
    const NativeAudio = window.Audio;
    const elements = [];
    window.Audio = function TrackedAudio(...args) {
      const audio = new NativeAudio(...args);
      elements.push(audio);
      audio.addEventListener("play", () => {
        window.__plays.push((audio.currentSrc || audio.src || "").split("/").pop());
      });
      return audio;
    };
    window.__playingElements = () => elements.filter((el) => !el.paused && !el.ended).length;
    window.__maxPlaying = 0;
    setInterval(() => {
      window.__maxPlaying = Math.max(window.__maxPlaying, window.__playingElements());
    }, 50);
  }, SETTINGS);
  await installQuranNetworkFixtures(page);
  await page.route(/\.mp3(\?.*)?$/, (route) =>
    route.fulfill({ status: 200, contentType: "audio/mpeg", body: TONE_MP3 }),
  );
  await page.goto("/surah/112");
  await expect(page.locator(".qc-list-card").first()).toBeVisible({ timeout: 30_000 });
}

// The verse files of surah 112, in the order they were started.
const verseFiles = (plays) => plays.filter((name) => /^112\d{3}\.mp3$/.test(name));

async function startRecitation(page) {
  await page.locator(".qc-list-card__start .ayah-action--play").first().click();
  await expect.poll(() => page.evaluate(() => window.__plays.length), { timeout: 15_000 }).toBeGreaterThan(0);
}

async function expectOrderedOnce(page) {
  await expect
    .poll(async () => verseFiles(await page.evaluate(() => window.__plays)).length, { timeout: 30_000 })
    .toBeGreaterThanOrEqual(4);
  const plays = verseFiles(await page.evaluate(() => window.__plays)).slice(0, 4);
  expect(plays).toEqual(["112001.mp3", "112002.mp3", "112003.mp3", "112004.mp3"]);
  expect(await page.evaluate(() => window.__maxPlaying)).toBeLessThanOrEqual(1);
}

const setHidden = (page, hidden) =>
  page.evaluate((isHidden) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (isHidden ? "hidden" : "visible") });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => isHidden });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);

test("verses follow one another once each, with no background event", async ({ page }) => {
  await prepare(page);
  await startRecitation(page);
  await expectOrderedOnce(page);
});

test("the tab goes to the background and comes back while a verse plays", async ({ page }) => {
  await prepare(page);
  await startRecitation(page);
  await page.waitForTimeout(1_200);
  await setHidden(page, true);
  await page.waitForTimeout(3_500);
  await setHidden(page, false);
  await expectOrderedOnce(page);
});

test("a locked screen: pagehide, freeze, resume and pageshow do not replay or skip verses", async ({ page }) => {
  await prepare(page);
  await startRecitation(page);
  await page.waitForTimeout(1_000);
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    document.dispatchEvent(new Event("freeze"));
  });
  await setHidden(page, true);
  await page.waitForTimeout(3_000);
  await page.evaluate(() => {
    document.dispatchEvent(new Event("resume"));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await setHidden(page, false);
  await expectOrderedOnce(page);
});

test("going offline and back online mid recitation does not restart the surah", async ({ page, context }) => {
  await prepare(page);
  await startRecitation(page);
  await page.waitForTimeout(800);
  await context.setOffline(true);
  await page.waitForTimeout(800);
  await context.setOffline(false);
  await expectOrderedOnce(page);
});
