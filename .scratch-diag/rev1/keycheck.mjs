import fs from 'fs';
import path from 'path';
import fr from '../../src/i18n/fr.js';
import en from '../../src/i18n/en.js';
import ar from '../../src/i18n/ar.js';

function flat(obj, pre = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = pre ? pre + '.' + k : k;
    if (v && typeof v === 'object') Object.assign(out, flat(v, key));
    else out[key] = v;
  }
  return out;
}
const F = flat(fr), E = flat(en), A = flat(ar);

// collect t("key") usages across src
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); }
    else if (/\.(jsx?|mjs)$/.test(e.name) && !p.includes('src\\i18n') && !p.includes('src/i18n')) files.push(p);
  }
})('src');
const used = new Map(); // key -> [file:line]
const dyn = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  src.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/\bi18nT?\(\s*["'`]([\w.]+)["'`]/g)) {
      if (!used.has(m[1])) used.set(m[1], []);
      used.get(m[1]).push(`${f}:${i + 1}`);
    }
    for (const m of l.matchAll(/\bi18nT?\(\s*`([\w.$ {].*?)`\s*[,)]/g)) {
      dyn.push([m[1], `${f}:${i + 1}`]);
    }
    for (const m of l.matchAll(/\bi18nT?\(\s*[\w"'.: ?()]+lang[^,)]*\)?\s*,\s*lang/g)) {
      // conditional key calls: capture literals inside
      const lits = [...l.matchAll(/["'`]([\w]+\.[\w.]+)["'`]/g)].map(x => x[1]);
      for (const k of lits) if (!used.has(k)) used.set(k, [`(cond) ${f}:${i + 1}`]);
    }
  });
}
const missingFr = [...used.keys()].filter(k => !(k in F));
console.log('distinct t() keys used:', used.size);
console.log('keys used but missing in fr.js:');
for (const k of missingFr) console.log('  ', k, used.get(k).slice(0, 2).join(' | '));
const unused = Object.keys(F).filter(k => !used.has(k));
console.log('fr keys never referenced:', unused.length);
console.log(unused.join('\n'));
console.log('template-literal keys (manual check):');
for (const [k, loc] of dyn) console.log('  ', k, loc);
// plural check for resultsCount-like keys used with count arg
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  src.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/\bi18nT?\(\s*["'`]([\w.]+)["'`]\s*,\s*[\w.]+\s*,\s*[^)\s]/g)) {
      const key = m[1];
      const v = F[key];
      console.log('count-call:', key, '->', typeof v === 'object' ? 'PLURAL ' + JSON.stringify(v) : 'NOT-PLURAL: ' + JSON.stringify(v), `${f}:${i + 1}`);
    }
  });
}
