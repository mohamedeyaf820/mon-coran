import assert from "node:assert/strict";
import test from "node:test";

import {
  getReadingAudioScopeKey,
  isPlaylistEndForActiveScope,
} from "../src/utils/audioNavigationScope.js";

test("audio navigation scopes identify surah, page and juz playlists", () => {
  assert.equal(
    getReadingAudioScopeKey({
      currentSurah: 2,
      currentPage: 2,
      currentJuz: 1,
      displayMode: "surah",
    }),
    "surah:2",
  );
  assert.equal(
    getReadingAudioScopeKey({
      currentSurah: 2,
      currentPage: 42,
      currentJuz: 3,
      displayMode: "page",
    }),
    "page:42",
  );
  assert.equal(
    getReadingAudioScopeKey({
      currentSurah: 2,
      currentPage: 42,
      currentJuz: 7,
      displayMode: "juz",
    }),
    "juz:7",
  );
});

test("a stale playlist end cannot navigate a newly selected reading scope", () => {
  assert.equal(isPlaylistEndForActiveScope("surah:2", "surah:2"), true);
  assert.equal(isPlaylistEndForActiveScope("surah:2", "surah:3"), false);
  assert.equal(isPlaylistEndForActiveScope("page:42", "juz:3"), false);
  assert.equal(isPlaylistEndForActiveScope(null, "surah:2"), false);
});
