import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("removed progression tools are not mounted by the application", () => {
  const app = read("src/App.jsx");
  const header = read("src/components/Header.jsx");
  const settings = read("src/components/SettingsModal.jsx");

  for (const removed of [
    "ToolsHubModal",
    "FutureFeaturesModal",
    "ReadingHistoryPanel",
    "TajweedQuizPanel",
  ]) {
    assert.doesNotMatch(app, new RegExp(removed));
  }

  assert.doesNotMatch(header, /toolsHubOpen|Espace outils|Tools hub/);
  assert.doesNotMatch(settings, /toolsHubOpen|Espace Outils|Tools Hub/);
});

test("reader keeps only the resume position and records no progression metrics", () => {
  const readerData = read("src/components/QuranDisplay/useQuranDisplayData.js");
  const home = read("src/components/HomePage.jsx");

  assert.match(readerData, /savePosition/);
  assert.doesNotMatch(readerData, /logSession|markRead|addRecentVisit/);
  assert.doesNotMatch(home, /progressPct|Avancement|Progress/);
  assert.doesNotMatch(home, /<SessionCard|<DailyVerseCard/);
});
