import assert from "node:assert/strict";
import test from "node:test";
import { cleanDuaArabic, plainDuaArabic } from "../src/utils/arabicDuaText.js";

test("verse stars, the full stop after the ornate bracket and tatweel are removed", () => {
  const out = plainDuaArabic("﴿قُلْ هُوَ اللَّهُ أَحَدٌ* اللَّهُ الصَّمَدُ﴾. اللَّهُـمَّ");
  assert.ok(!out.includes("*"));
  assert.ok(!out.includes("﴾."));
  assert.ok(!out.includes("\u0640"));
  assert.ok(out.includes("أَحَدٌ اللَّهُ"));
});

test("isolated presentation forms become ordinary letters", () => {
  assert.equal(plainDuaArabic("ﺗ"), "ت");
  assert.ok(!/[\uFE70-\uFEFF]/u.test(cleanDuaArabic("ﻟﻬ")));
});

test("the unvowelled basmala and salawat are written with their vowels", () => {
  assert.ok(plainDuaArabic("بسم الله الرحمن الرحيم").includes("الرَّحْمَٰنِ"));
  assert.ok(plainDuaArabic("محمد صلى الله عليه وسلم").includes("وَسَلَّمَ"));
});

test("a space follows a colon and brackets hug their words", () => {
  assert.equal(plainDuaArabic("قال:اللهم"), "قال: اللهم");
  assert.equal(plainDuaArabic("( ثلاثاً )"), "(ثلاثاً)");
});

test("the copied text carries no word joiner", () => {
  assert.ok(!plainDuaArabic("[وإذا أمسى]").includes("\u2060"));
  assert.ok(cleanDuaArabic("[وإذا أمسى]").includes("\u2060"));
});
