import fs from "node:fs";

// Build curated blobs: HEAD content with ONLY the Warsh-flow hunks applied.

const bookPath = ".scratch-diag/curated/book-flow.css";
let book = fs.readFileSync(".scratch-diag/curated/book-base.css", "utf8");
const bookOld = `/* Warsh: natural flow with subtle per-line fit scale (NOT space-between). */
#root ~ .mfp-portal-root .mfp-book .qcm-lines[data-warsh="true"] {
  width: calc(var(--mfp-line-measure) / 0.96);
  font-size: calc(var(--mfp-font) * 0.96);
  line-height: 1;
}

#root ~ .mfp-portal-root .mfp-book .qcm-lines[data-warsh="true"] .qcm-line {
  flex-wrap: nowrap;
  align-items: center;
  /* Warsh uses a proportional font (not glyphs cut to fill), so short rows
     are centred like a printed Mushaf centres a short line; full rows fill
     the measure through the per-line fit scale. Never space-between. */
  justify-content: center;
  gap: 0;
  padding-inline: 0.05em;
  font-size: calc(1em * var(--qcm-line-fit, 1));
}`;
const bookNew = `/* Warsh prints as one continuous justified flow, like the Madinah mushaf:
   words wrap typographically inside .qcm-flow segments, and the renderer's
   fit loop scales --qcm-flow-fit (the glyph size) until the segments fill
   exactly the fifteen printed lines. The block is plain flow, not a 15-row
   grid: the surah openings (one .qcm-line each) and the wrapped body share
   the same constant row pitch, so the sheet never drifts off the grid. */
#root ~ .mfp-portal-root .mfp-book .qcm-lines[data-warsh="true"] {
  display: block;
  width: var(--mfp-line-measure);
  font-size: var(--mfp-font);
  line-height: var(--mfp-line-pitch);
}

#root ~ .mfp-portal-root .mfp-book .qcm-lines[data-warsh="true"] .qcm-line {
  /* A title band or basmala occupies exactly one printed line. */
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--mfp-line-pitch);
}

#root ~ .mfp-portal-root .mfp-book .qcm-flow {
  /* Glyphs scale with the fit; the line-height divides the same factor out
     so every wrapped row keeps the page's constant pitch. Full rows are
     justified to the measure, the last row of a segment is centred —
     exactly how the printed sheet sets continuous ayahs. */
  font-size: calc(1em * var(--qcm-flow-fit, 1));
  line-height: calc(var(--mfp-line-pitch) / var(--qcm-flow-fit, 1));
  direction: rtl;
  text-align: justify;
  text-align-last: center;
}`;
if (!book.includes(bookOld)) throw new Error("book old block not found");
book = book.replace(bookOld, bookNew);
fs.writeFileSync(bookPath, book);

const contractPath = ".scratch-diag/curated/contract-flow.mjs";
let contract = fs.readFileSync(".scratch-diag/curated/contract-base.mjs", "utf8");
const contractOld = `  // The portal rule keeps Warsh words at the line measure; the renderer
  // repeats 1em/inherit inline so the per-line fit scale is never defeated.
  assert.match(mushafBook, /\\.qcm-word--warsh \\{[\\s\\S]*?font-size: 1em;[\\s\\S]*?line-height: inherit;/);
  assert.match(mushafPage, /fontSize: '1em'/);
  assert.match(mushafPage, /lineHeight: 'inherit'/);
  assert.match(mushafPage, /wordSpacing: 0/);
  assert.match(mushafPage, /unicodeBidi: 'isolate'/);
  assert.match(mushafPage, /marginInlineEnd: '0\\.035em'/);
  assert.doesNotMatch(mushafPage, /wordSpacing: '0\\.05em'/);`;
const contractNew = `  // The portal rule keeps Warsh words at the flow's own size; the renderer
  // repeats 1em/inherit inline so the continuous-flow fit scale is never
  // defeated by per-word overrides. Gaps between words come from the flow's
  // justification, not from hardcoded inline spacing.
  assert.match(mushafBook, /\\.qcm-word--warsh \\{[\\s\\S]*?font-size: 1em;[\\s\\S]*?line-height: inherit;/);
  assert.match(mushafBook, /\\.qcm-flow \\{[\\s\\S]*?text-align: justify;[\\s\\S]*?text-align-last: center;/);
  assert.match(mushafBook, /--qcm-flow-fit/);
  assert.match(mushafPage, /fontSize: '1em'/);
  assert.match(mushafPage, /lineHeight: 'inherit'/);
  assert.match(mushafPage, /unicodeBidi: 'isolate'/);
  assert.doesNotMatch(mushafPage, /marginInlineEnd|wordSpacing/);`;
if (!contract.includes(contractOld)) throw new Error("contract old block not found");
contract = contract.replace(contractOld, contractNew);
fs.writeFileSync(contractPath, contract);
console.log("curated blobs written");
