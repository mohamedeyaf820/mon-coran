// Align annotations to printed Warsh words without rewriting those words.
const MARK = /\p{M}/u;
const LETTER = /\p{L}/u;
const records = new Map();
export let warshArchiveMeta = null;
const listeners = new Set();
export function subscribeWarshArchive(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getWarshArchiveSnapshot() { return warshArchiveMeta; }

export function archiveClusters(word) {
  const clusters = [];
  for (let i = 0; i < word.length;) {
    const char = String.fromCodePoint(word.codePointAt(i));
    if (LETTER.test(char) && !/[\uFC00-\uFDFF]/u.test(char)) {
      clusters.push({ start: i, end: i + char.length, text: char });
    } else if (clusters.length && MARK.test(char)) {
      clusters.at(-1).text += char;
      clusters.at(-1).end = i + char.length;
    }
    i += char.length;
  }
  return clusters.map(cluster => {
    const decomposed = cluster.text.normalize("NFKD");
    const base = decomposed.replace(/\p{M}/gu, "").replace(/ٱ/g, "ا").replace(/ى/g, "ي");
    const hamza = [...decomposed].filter(char => /[\u0654\u0655]/u.test(char)).sort().join("");
    return { ...cluster, key: base + hamza };
  });
}

export function archiveWordKey(word) {
  return archiveClusters(word).map(cluster => cluster.key).join("");
}

export function projectArchiveRange(source, target, range) {
  const from = archiveClusters(source);
  const to = archiveClusters(target);
  if (from.length !== to.length || from.some((cluster, i) => cluster.key !== to[i].key)) return null;
  const affected = from.map((cluster, i) => ({ cluster, i }))
    .filter(({ cluster }) => cluster.start < range.end && cluster.end > range.start);
  if (!affected.length) return null;
  // Identical spelling preserves precise source offsets, including vowel-only madd.
  if (source === target) return { ...range };
  const first = affected[0].i;
  const last = affected.at(-1).i;
  return { start: to[first].start, end: to[last].end, ruleId: range.ruleId };
}

export function registerWarshArchive(rows, meta = null) {
  records.clear();
  warshArchiveMeta = meta;
  for (const [text, ranges] of rows) {
    const words = text.split(/\s+/u).filter(Boolean);
    const key = words.map(archiveWordKey).filter(Boolean).join(" ");
    const previous = records.get(key);
    if (previous === null) continue;
    // Repeated wording with different annotations needs verse identity; decline it.
    if (previous && JSON.stringify(previous.ranges) !== JSON.stringify(ranges)) records.set(key, null);
    else records.set(key, { words, ranges });
  }
  listeners.forEach(listener => listener());
}

export function getWarshArchiveRanges(words) {
  const indexed = words.map((word, i) => ({ word: String(word), key: archiveWordKey(String(word)), i })).filter(item => item.key);
  const record = records.get(indexed.map(item => item.key).join(" "));
  if (!record || record.words.length !== indexed.length) return null;
  const result = words.map(() => []);
  for (let index = 0; index < indexed.length; index++) {
    for (const range of record.ranges[index] || []) {
      const projected = projectArchiveRange(record.words[index], indexed[index].word, range);
      if (!projected) return null;
      const list = result[indexed[index].i];
      const start = Math.max(projected.start, list.at(-1)?.end || 0);
      if (projected.end > start) list.push({ ...projected, start });
    }
  }
  return result;
}
