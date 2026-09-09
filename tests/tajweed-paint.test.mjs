import assert from 'node:assert/strict';
import test from 'node:test';
import { expandArabicPaintRange } from '../src/utils/tajweedHighlights.js';

test('Al-Baqara 2:13 madd paint covers the complete Lam-Alef without the initial hamza', () => {
  const text = 'أَلَآ';
  assert.deepEqual(expandArabicPaintRange(text, 4, 6), [2, 6]);
  assert.equal(text, 'أَلَآ');
});

test('Lam-Alef paint includes intervening harakat and attached marks in longer words', () => {
  for (const alef of ['ا', 'أ', 'إ', 'آ', 'ٱ']) {
    const text = `بِلَّ${alef}ٓه`;
    assert.deepEqual(expandArabicPaintRange(text, 5, 6), [2, 7]);
  }
});

test('paint respects grapheme boundaries without crossing a space or colouring the next letter', () => {
  assert.deepEqual(expandArabicPaintRange('إِنَّهُمْ', 2, 3), [2, 5]);
  assert.deepEqual(expandArabicPaintRange('لَ آ', 3, 4), [3, 5]);
  assert.deepEqual(expandArabicPaintRange('لَا', 2, 2), [2, 2]);
});
