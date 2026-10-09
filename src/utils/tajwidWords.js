/** One shaped text node per word; separators and annotation offsets are exact. */
export function splitTajwidIntoWords(segments = []) {
  const words = [];
  let current = null;
  let prefix = "";
  const flush = () => {
    if (current?.text) {
      if (!words.length && prefix) current.prefix = prefix;
      words.push(current);
    }
    current = null;
  };
  for (const segment of segments) {
    for (const part of String(segment?.text ?? "").split(/(\s+)/u)) {
      if (!part) continue;
      if (/^\s+$/u.test(part)) {
        flush();
        if (words.length) words.at(-1).separator = (words.at(-1).separator || "") + part;
        else prefix += part;
      } else {
        current ||= { text: "", ranges: [] };
        const start = current.text.length;
        current.text += part;
        if (segment.ruleId) current.ranges.push({ start, end: current.text.length, ruleId: segment.ruleId });
      }
    }
  }
  flush();
  return { words, whitespaceOnly: words.length ? "" : prefix };
}
