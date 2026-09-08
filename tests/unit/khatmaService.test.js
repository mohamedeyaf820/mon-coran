import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateKhatmaStatus,
  getKhatmaPlan,
  saveKhatmaPlan,
  deleteKhatmaPlan,
  updateKhatmaCurrentPage,
} from "../../src/services/khatmaService.js";

// Mock localStorage for node environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

test("khatmaService: creates and retrieves a valid 30-day Khatma plan", () => {
  mockStorage.clear();
  const plan = saveKhatmaPlan({ targetDays: 30, startPage: 1, currentPage: 1 });
  assert.equal(plan.targetDays, 30);
  assert.equal(plan.startPage, 1);
  assert.equal(plan.currentPage, 1);
  assert.equal(plan.completed, false);

  const retrieved = getKhatmaPlan();
  assert.equal(retrieved.targetDays, 30);
  assert.equal(retrieved.startPage, 1);
  assert.equal(retrieved.currentPage, 1);
});

test("khatmaService: calculates accurate pacing and daily breakdown", () => {
  const plan = {
    targetDays: 30,
    startPage: 1,
    currentPage: 21,
    startDate: new Date().toISOString(),
    completed: false,
  };

  const status = calculateKhatmaStatus(plan, 21);
  assert.equal(status.targetDays, 30);
  assert.equal(status.dailyPages, Math.ceil(604 / 30)); // 21 pages/day
  assert.equal(status.pagesPerPrayer, Math.ceil(21 / 5)); // 5 pages/prayer
  assert.equal(status.currentDayNumber, 1);
  assert.equal(status.pagesRead, 21);
  assert.equal(status.isCompleted, false);
  assert.equal(status.pace, "onTrack");
});

test("khatmaService: correctly determines ahead and behind pacing", () => {
  const plan = {
    targetDays: 30,
    startPage: 1,
    currentPage: 50,
    startDate: new Date().toISOString(), // Day 1, expected ~20
    completed: false,
  };

  const aheadStatus = calculateKhatmaStatus(plan, 50);
  assert.equal(aheadStatus.pace, "ahead");
  assert.ok(aheadStatus.diff > 0);

  const behindStatus = calculateKhatmaStatus(plan, 5);
  assert.equal(behindStatus.pace, "behind");
  assert.ok(behindStatus.diff < 0);
});

test("khatmaService: marks completion when page 604 is reached", () => {
  const plan = {
    targetDays: 30,
    startPage: 1,
    currentPage: 604,
    startDate: new Date().toISOString(),
    completed: false,
  };

  const status = calculateKhatmaStatus(plan, 604);
  assert.equal(status.percentage, 100);
  assert.equal(status.isCompleted, true);
});

test("khatmaService: updates current page cleanly and deletes plan", () => {
  mockStorage.clear();
  saveKhatmaPlan({ targetDays: 60, startPage: 1, currentPage: 10 });
  const updated = updateKhatmaCurrentPage(35);
  assert.equal(updated.currentPage, 35);

  const deleted = deleteKhatmaPlan();
  assert.equal(deleted, true);
  assert.equal(getKhatmaPlan(), null);
});
