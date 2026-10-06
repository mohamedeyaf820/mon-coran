import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { registerWarshArchive, getWarshArchiveRanges } from '../src/utils/warshArchiveRules.js';
import { getWarshTajwidAnnotatedSource, getWarshTajwidSourceStatus } from '../src/services/warshTajweedService.js';
import { WARSH_ARCHIVE_SHA256 } from '../src/data/warshArchiveManifest.js';
import { TAJWID_RULE_GROUPS } from '../src/data/tajwidPalette.js';
import { stripEmbeddedAyahMarkers } from '../src/data/fonts.js';

const raw = fs.readFileSync('public/data/warsh-tajweed-archive.json', 'utf8');
const pack = JSON.parse(raw);

test('aligned archive is pinned and uses only actual Warsh corpus text and known palette rules', () => {
  assert.equal(createHash('sha256').update(raw).digest('hex'), WARSH_ARCHIVE_SHA256);
  const corpus = JSON.parse(fs.readFileSync('public/data/warsh-page-source.json', 'utf8'));
  const verses = Array.isArray(corpus) ? corpus : corpus.verses;
  const texts = new Set(verses.map(v => stripEmbeddedAyahMarkers(v.aya_text.normalize('NFC'), { ayahNumber: v.aya_no }).trim()));
  assert.equal(pack.rows.length, 6207);
  assert.equal(pack.meta.validatedByScholar, false);
  registerWarshArchive(pack.rows, pack.meta);
  let matched = 0;
  for (const [text, perWord] of pack.rows) {
    assert.ok(texts.has(text), 'archive must never introduce source text into the reader');
    const words = text.split(/\s+/u);
    assert.equal(words.length, perWord.length);
    for (let i = 0; i < words.length; i++) {
      let end = 0;
      for (const range of perWord[i]) {
        assert.ok(range.start >= end && range.end > range.start && range.end <= words[i].length);
        assert.ok(TAJWID_RULE_GROUPS[range.ruleId], range.ruleId);
        end = range.end;
      }
    }
    if (getWarshArchiveRanges(words)) matched++;
    const annotation = getWarshTajwidAnnotatedSource(text);
    assert.equal(annotation.segments.map(s => s.text).join(''), text);
  }
  assert.ok(matched > 6150, `matched ${matched}`);
  assert.equal(getWarshTajwidSourceStatus().status, 'warsh-user-archive');
});

test('ambiguous or unrelated wording is declined; font mark projection preserves text', () => {
  registerWarshArchive([['مَا', [[{ start: 0, end: 1, ruleId: 'madd-normal' }]]], ['مَا', [[{ start: 0, end: 2, ruleId: 'madd' }]]]]);
  assert.equal(getWarshArchiveRanges(['مَا']), null);
  assert.equal(getWarshArchiveRanges(['مَنْ']), null);
  registerWarshArchive([['نَّ', [[{ start: 0, end: 2, ruleId: 'ghunna' }, { start: 2, end: 3, ruleId: 'madd-normal' }]]]]);
  const text = 'نَّ';
  const annotation = getWarshTajwidAnnotatedSource(text);
  assert.equal(annotation.segments.map(s => s.text).join(''), text);
  registerWarshArchive([]);
});

test('loader rejects a corrupt file, retries and registers only the pinned file', async () => {
  const { ensureWarshArchiveRules } = await import('../src/services/warshArchiveService.js');
  const original = globalThis.fetch;
  const originalNow = Date.now;
  const requests = [];
  try {
    globalThis.fetch = async url => { requests.push(url); return new Response('{}'); };
    assert.equal(await ensureWarshArchiveRules(), false);
    assert.equal(await ensureWarshArchiveRules(), false);
    assert.equal(requests.length, 1, 'failure is throttled during repeated rendering');
    Date.now = () => originalNow() + 31000;
    globalThis.fetch = async url => { requests.push(url); return new Response(raw); };
    assert.equal(await ensureWarshArchiveRules(), true);
    assert.deepEqual(requests, ['/data/warsh-tajweed-archive.json', '/data/warsh-tajweed-archive.json']);
    assert.equal(await ensureWarshArchiveRules(), true);
    assert.equal(requests.length, 2);
  } finally { Date.now = originalNow; globalThis.fetch = original; registerWarshArchive([]); }
});

test('a verse that opens a rub keeps its annotations: the standalone marker has no word to colour', () => {
  registerWarshArchive(pack.rows, pack.meta);
  const corpus = JSON.parse(fs.readFileSync('public/data/warsh-page-source.json', 'utf8'));
  const verses = Array.isArray(corpus) ? corpus : corpus.verses;
  const opening = verses.filter(v => stripEmbeddedAyahMarkers(v.aya_text.normalize('NFC'), { ayahNumber: v.aya_no }).split(/\s+/u).some(word => word === '\u06DE'));
  assert.ok(opening.length > 400, `${opening.length} verses carry the rub marker`);
  let annotated = 0;
  for (const verse of opening) {
    const words = stripEmbeddedAyahMarkers(verse.aya_text.normalize('NFC'), { ayahNumber: verse.aya_no }).split(/\s+/u).filter(Boolean);
    const ranges = getWarshArchiveRanges(words);
    if (!ranges) continue;
    assert.equal(ranges.length, words.length, 'one list per printed token');
    const marker = words.indexOf('\u06DE');
    assert.deepEqual(ranges[marker], [], 'the marker itself is never coloured');
    if (ranges.some(list => list.length)) annotated++;
  }
  // Before the fix every one of them fell back to the printed signs.
  assert.ok(annotated > 400, `${annotated} rub-opening verses annotated`);
  registerWarshArchive([]);
});
