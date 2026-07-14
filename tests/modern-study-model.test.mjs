import test from "node:test";
import assert from "node:assert/strict";

import {
  buildQuizQuestions,
  getMemorizationSummary,
  getWirdProgress,
  summarizeStudyWeek,
} from "../src/modern/study/studyModel.js";

test("caps daily wird progress and preserves useful totals", () => {
  assert.deepEqual(getWirdProgress({ pagesRead: 7, ayahsRead: 18, completed: false }, 5), {
    current: 7,
    target: 5,
    percentage: 100,
    remaining: 0,
    ayahsRead: 18,
    completed: false,
  });
});

test("summarizes study activity without double counting active dates", () => {
  const wird = [
    { date: "2026-07-13", pagesRead: 4, ayahsRead: 12, completed: true },
    { date: "2026-07-12", pagesRead: 2, ayahsRead: 6, completed: false },
  ];
  const reading = [
    { date: "2026-07-13", sessions: 2 },
    { date: "2026-07-11", sessions: 1 },
  ];

  assert.deepEqual(summarizeStudyWeek(wird, reading), {
    pagesRead: 6,
    ayahsRead: 18,
    activeDays: 3,
    completedDays: 1,
    sessions: 3,
  });
});

test("summarizes memorization levels and average mastery", () => {
  assert.deepEqual(getMemorizationSummary([{ level: 5 }, { level: 3 }, { level: 1 }]), {
    verses: 3,
    mastered: 1,
    reviewing: 2,
    averageLevel: 3,
  });
});

test("builds quiz questions with one correct answer and unique choices", () => {
  const rules = [
    { id: "a", nameFr: "A", description: "Description A" },
    { id: "b", nameFr: "B", description: "Description B" },
    { id: "c", nameFr: "C", description: "Description C" },
    { id: "d", nameFr: "D", description: "Description D" },
  ];
  const questions = buildQuizQuestions(rules, 3);

  assert.equal(questions.length, 3);
  assert.equal(new Set(questions[0].choices).size, questions[0].choices.length);
  assert.ok(questions[0].choices.includes(questions[0].answer));
});
