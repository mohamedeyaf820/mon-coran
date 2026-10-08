import assert from "node:assert/strict";
import test from "node:test";
import { parseRoutePath } from "../src/hooks/useUrlSync.js";

test("all 114 surah routes resolve without clamping or redirection", () => {
  for (let surah = 1; surah <= 114; surah += 1) {
    assert.deepEqual(parseRoutePath(`/surah/${surah}`), {
      showHome: false,
      showDuas: false,
      showPrayers: false,
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
      showPrayers: false,
    });
  }
});

test("prayer tracking and duas routes resolve explicitly", () => {
  const expectedPrayers = {
    showHome: false,
    showDuas: false,
    showPrayers: true,
  };
  assert.deepEqual(parseRoutePath("/prieres"), expectedPrayers);
  assert.deepEqual(parseRoutePath("/prires"), expectedPrayers);
  assert.deepEqual(parseRoutePath("/duas"), {
    showHome: false,
    showDuas: true,
    showPrayers: false,
    duasRoute: "",
  });
});

test("invocation sub-pages resolve to a duas route and reject unknown ones", () => {
  const duas = (duasRoute) => ({ showHome: false, showDuas: true, showPrayers: false, duasRoute });
  assert.deepEqual(parseRoutePath("/duas/hisn"), duas("/hisn"));
  assert.deepEqual(parseRoutePath("/duas/hisn/27"), duas("/hisn/27"));
  assert.deepEqual(parseRoutePath("/duas/hisn/27/"), duas("/hisn/27"));
  assert.deepEqual(parseRoutePath("/duas/coran"), duas("/coran"));
  for (const path of ["/duas/unknown", "/duas/hisn/abc", "/duas/hisn/27/extra", "/duas/hisn/12345"]) {
    assert.equal(parseRoutePath(path).routeNotFound, true, path);
  }
});
