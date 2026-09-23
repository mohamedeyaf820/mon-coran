import fs from 'node:fs';
const raw = JSON.parse(fs.readFileSync('.scratch-diag/resp/raw-r7.json', 'utf8'));
const rows = [];
for (const r of raw) {
  for (const t of (r.tinyText || [])) {
    if (t.el.startsWith('span.') && !/\./.test(t.el.slice(5).split(' ')[0]) === false) {}
    rows.push({ p: r.profile, v: r.view, w: r.w, fs: t.fs, el: t.el });
  }
}
const anon = rows.filter((x) => /^span\.[^ ]* "/.test(x.el) === false ? false : true);
// print all span entries whose class list is empty (i.e. "span." followed by a quote)
const empty = rows.filter((x) => /^span\.\s?"/.test(x.el) || /^span\.$/.test(x.el));
console.log('total tiny', rows.length, 'empty-class spans', empty.length);
const g = new Map();
for (const x of empty) {
  const k = x.el;
  if (!g.has(k)) g.set(k, []);
  g.get(k).push(`${x.p}/${x.v}@${x.w} fs=${x.fs}`);
}
for (const [k, vs] of g) console.log(k, '->', vs.length, 'occurrences\n   ', vs.slice(0, 8).join('\n    '));
