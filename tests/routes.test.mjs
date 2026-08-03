import assert from "node:assert/strict";
import test from "node:test";
import { parseRoutePath } from "../src/hooks/useUrlSync.js";

test("all 114 surah routes resolve without clamping or redirection", () => {
  for (let surah = 1; surah <= 114; surah += 1) {
    assert.deepEqual(parseRoutePath(`/surah/${surah}`), {
      showHome: false,
      showDuas: false,
      routeNotFound: false,
      displayMode: "surah",
      currentSurah: surah,
      currentAyah: 1,
    });
  }
});

test("invalid reading routes return a real not-found state", () => {
  for (const path of ["/surah/0", "/surah/115", "/surah/abc", "/page/0", "/page/605", "/juz/31", "/unknown"]) {
    assert.equal(parseRoutePath(path).routeNotFound, true, path);
  }
});

test("published transparency routes resolve explicitly", () => {
  for (const page of ["surahs", "about", "privacy", "legal", "sources"]) {
    assert.deepEqual(parseRoutePath(`/${page}`), {
      legalPage: page,
      showHome: false,
      showDuas: false,
    });
  }
});
