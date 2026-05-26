/**
 * Tajwid rules – regex patterns and colour mapping
 * These patterns work on fully-vowelled (mutashakkil) Uthmani text.
 *
 * IMPORTANT: The AlQuran Cloud "quran-uthmani" edition uses:
 *   - U+06E1 (ۡ small high dotless head of khaa) as sukun
 *   - U+0652 (regular sukun) is rarely used
 *   - U+0670 (ٰ superscript alef) for dagger alef
 *   - U+0671 (ٱ alef wasla) for the definite article
 *
 * Each rule:
 *  - id: unique key matching CSS variable  --tajwid-{id}
 *  - nameAr / nameEn / nameFr: display labels
 *  - color: fallback hex colour (also defined in index.css)
 *  - patterns: array of RegExp that match relevant segments in Arabic text
 */

// Sukun in Uthmani can be U+0652 or U+06E1
const SK = "\\u0652\\u06E1";

// ══════════════════════════════════════════════════════════════
// HAFS TAJWEED RULES (default)
// ══════════════════════════════════════════════════════════════
const TAJWID_RULES = [
  {
    id: "ghunna",
    nameAr: "غنّة/إخفاء",
    nameEn: "Ghunna/Ikhfa'",
    nameFr: "Ghounna/Ikhfa",
    color: "#22bb44",
    description: "Nasalisation (ghunna) et dissimulation (ikhfa)",
    patterns: [
      // Shadda on noon or meem (ghunna)
      /([نم])\u0651/g,
      // Tanwin followed by ikhfa letters
      /[\u064B\u064C\u064D][\s\u200C]*[تثجدذزسشصضطظفقك]/g,
      // Noon sakin (sukun) + ikhfa letters
      new RegExp(`ن[${SK}][\\s\\u200C]*[تثجدذزسشصضطظفقك]`, "g"),
    ],
  },
  {
    id: "qalqala",
    nameAr: "قلقلة",
    nameEn: "Qalqala (echo)",
    nameFr: "Qalqala (écho)",
    color: "#00c8d4",
    description: "Rebondissement sur les lettres ق ط ب ج د en sukun",
    patterns: [new RegExp(`[قطبجد][${SK}]`, "g")],
  },
  {
    id: "idgham",
    nameAr: "إدغام",
    nameEn: "Idgham",
    nameFr: "Idgham",
    color: "#22bb44",
    description: "Assimilation du noun sakin ou tanwin dans ي ر م ل و ن",
    patterns: [
      // Tanwin + yarmaloon letters
      /[\u064B\u064C\u064D][\s\u200C]*[يرملون]/g,
      // Noon sakin + yarmaloon letters
      new RegExp(`ن[${SK}][\\s\\u200C]*[يرملون]`, "g"),
    ],
  },
  {
    id: "iqlab",
    nameAr: "إقلاب",
    nameEn: "Iqlab",
    nameFr: "Iqlab",
    color: "#22bb44",
    description: "Conversion du noon sakin ou tanwin en meem devant ب",
    patterns: [
      /[\u064B\u064C\u064D][\s\u200C]*ب/g,
      new RegExp(`ن[${SK}][\\s\\u200C]*ب`, "g"),
    ],
  },
  {
    id: "madd-normal",
    nameAr: "مدّ طبيعي",
    nameEn: "Normal madd (2)",
    nameFr: "Madd normal (2)",
    color: "#d580c8",
    description: "Madd tabii — prolongation de 2 temps",
    patterns: [
      // Fatha + alef (includes Uthmani superscript alef U+0670)
      /[\u064E][\u0627\u0670]/g,
      // Damma + waw not followed by sukun
      new RegExp(`[\\u064F]و(?![${SK}])`, "g"),
      // Kasra + yaa not followed by sukun
      new RegExp(`[\\u0650]ي(?![${SK}])`, "g"),
    ],
  },
  {
    id: "madd-separated",
    nameAr: "مدّ منفصل",
    nameEn: "Separated madd (2/4/6)",
    nameFr: "Madd séparé (2/4/6)",
    color: "#f0952a",
    description: "Madd munfasil — hamza suivi de lettre de madd entre 2 mots",
    patterns: [/[\u0627وي][\s][ءأإ]/g],
  },
  {
    id: "madd-connected",
    nameAr: "مدّ متصل",
    nameEn: "Connected madd (4/5)",
    nameFr: "Madd connecté (4/5)",
    color: "#e8409a",
    description: "Madd muttasil — hamza après lettre de madd dans le même mot",
    patterns: [/[ءأإؤئ][\u064E\u064F\u0650]?[\u0627وي]/g],
  },
  {
    id: "madd",
    nameAr: "مدّ لازم",
    nameEn: "Necessary madd (6)",
    nameFr: "Madd nécessaire (6)",
    color: "#d42020",
    description: "Madd lazim — prolongation obligatoire de 6 temps",
    patterns: [/[\u0627وي]\u0651/g],
  },
  {
    id: "lam-shamsiyya",
    nameAr: "حرف ساكن",
    nameEn: "Silent letter",
    nameFr: "Lettre muette",
    color: "#aaaaaa",
    description: "Lam de l'article assimilée (lam shamsiyya) / lettre muette",
    patterns: [
      // Matches both ٱل (alef wasla) and ال (regular alef)
      /[ٱا]ل[تثدذرزسشصضطظنل]/g,
    ],
  },
  {
    id: "tafkhim",
    nameAr: "تفخيم",
    nameEn: "Tafkhim (heavy)",
    nameFr: "Tafkhim (lourd)",
    color: "#4060d8",
    description: "Prononciation emphatique/lourde (lettres مستعلية)",
    patterns: [
      new RegExp(`[صضطظخغق][\\u064E\\u064F\\u0650${SK}\\u0651]?`, "g"),
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// WARSH TAJWEED RULES (specific to Warsh 'an Nafi')
// ══════════════════════════════════════════════════════════════
const WARSH_TAJWID_RULES = [
  // ─────────────── Warsh-specific rules ───────────────
  {
    id: "naql",
    nameAr: "نقل",
    nameEn: "Naql (Transfer)",
    nameFr: "Naql (Transfert)",
    color: "#ff7b00",
    description:
      "Transfert de la voyelle du hamza à la lettre précédente sakin",
    patterns: [
      // Pattern: letter + sukun + hamza (with or without vowels)
      // Common naql cases: ٱل + hamza-initial word
      /[ٱا]ل[اأإءؤئ]/g,
      // Lam-alif followed by hamza patterns
      new RegExp(`ل[${SK}][\\s]*[أإءؤئ]`, "g"),
      // Any consonant with sukun before hamza
      new RegExp(`[بتثجحخدذرزسشصضطظعغفقكلمنهوي][${SK}][\\s]*[ءأإؤئ]`, "g"),
    ],
  },
  {
    id: "tashil",
    nameAr: "تسهيل",
    nameEn: "Tashil (Softening)",
    nameFr: "Tashil (Adoucissement)",
    color: "#09b000",
    description: "Adoucissement du hamza entre deux voyelles",
    patterns: [
      // Hamza between two alifs (common tashil position)
      /[اآ][ءأإؤئ][اآ]/g,
      // Double hamza in same word
      /[أإ][ءأإؤئ]/g,
      // أَأَ, أُأُ type patterns
      /[ءأإؤئ][\u064E\u064F\u0650][ءأإؤئ]/g,
    ],
  },
  {
    id: "ibdal",
    nameAr: "إبدال",
    nameEn: "Ibdal (Substitution)",
    nameFr: "Ibdal (Substitution)",
    color: "#ff7b00",
    description: "Remplacement du hamza par alif/waw/ya",
    patterns: [
      // Hamza after fatha becoming alif
      /[\u064E][ءأ]/g,
      // Hamza after damma becoming waw-like
      /[\u064F][ءؤ]/g,
      // Hamza after kasra becoming ya-like
      /[\u0650][ءئ]/g,
      // ء after madd letter
      /[اوي][\u0670]?[ءأإؤئ]/g,
    ],
  },
  {
    id: "madd-badal",
    nameAr: "مد البدل",
    nameEn: "Madd Badal (Warsh 4-6)",
    nameFr: "Madd Badal (4-6 temps)",
    color: "#ff7b00",
    description: "Prolongation après hamza substitué (4 à 6 temps en Warsh)",
    patterns: [
      // Hamza followed by madd letter (typical badal)
      /[ءأإ][\u064E\u064F\u0650]?[اوي]/g,
      // آ (hamza-alif combination)
      /آ/g,
      // ءا sequence
      /ءا/g,
      // أو أي patterns
      /[أإء][وي]/g,
    ],
  },
  {
    id: "sila-kubra",
    nameAr: "صلة كبرى",
    nameEn: "Sila Kubra",
    nameFr: "Sila Kubra",
    color: "#ff7b00",
    description: "Prolongation du haa du pronom suivi de hamza",
    patterns: [
      // Pronoun haa (ـه) followed by hamza - elongated in Warsh
      /ه[\u064F\u0650][\\s]*[ءأإؤئ]/g,
      // له، به، منه etc. followed by hamza
      /[لبمنعف]ه[\u064F\u0650]?[\\s]+[ءأإؤئا]/g,
    ],
  },
  {
    id: "tarqiq-ra",
    nameAr: "ترقيق الراء",
    nameEn: "Tarqiq Ra (Warsh)",
    nameFr: "Tarqiq Ra (léger)",
    color: "#09b000",
    description: "Prononciation légère du ra en Warsh (cas spécifiques)",
    patterns: [
      // Ra with kasra
      /ر[\u0650]/g,
      // Ra sakin preceded by kasra
      new RegExp(`[\u0650]ر[${SK}]`, "g"),
      // Ra sakin preceded by ya sakin
      new RegExp(`ي[${SK}]ر[${SK}]`, "g"),
    ],
  },
  {
    id: "idgham-warsh",
    nameAr: "إدغام ورش",
    nameEn: "Idgham (Warsh)",
    nameFr: "Idgham (Warsh)",
    color: "#a5a5a5",
    description: "Assimilation spécifique à Warsh",
    patterns: [
      // Lam + Ra (some cases in Warsh)
      /ل\u0651?ر/g,
      // Additional idgham cases for Warsh
      new RegExp(`ن[${SK}][\\s\\u200C]*[يرملون]`, "g"),
      /[\u064B\u064C\u064D][\s\u200C]*[يرملون]/g,
    ],
  },
  // ─────────────── Common rules (also in Hafs but with Warsh variations) ───────────────
  {
    id: "ghunna",
    nameAr: "غنّة/إخفاء",
    nameEn: "Ghunna/Ikhfa'",
    nameFr: "Ghounna/Ikhfa",
    color: "#09b000",
    description: "Nasalisation (ghunna) et dissimulation (ikhfa)",
    patterns: [
      /([نم])\u0651/g,
      /[\u064B\u064C\u064D][\s\u200C]*[تثجدذزسشصضطظفقك]/g,
      new RegExp(`ن[${SK}][\\s\\u200C]*[تثجدذزسشصضطظفقك]`, "g"),
    ],
  },
  {
    id: "qalqala",
    nameAr: "قلقلة",
    nameEn: "Qalqala (echo)",
    nameFr: "Qalqala (écho)",
    color: "#00b4e0",
    description: "Rebondissement sur les lettres ق ط ب ج د en sukun",
    patterns: [new RegExp(`[قطبجد][${SK}]`, "g")],
  },
  {
    id: "iqlab",
    nameAr: "إقلاب",
    nameEn: "Iqlab",
    nameFr: "Iqlab",
    color: "#00b4e0",
    description: "Conversion du noon sakin ou tanwin en meem devant ب",
    patterns: [
      /[\u064B\u064C\u064D][\s\u200C]*ب/g,
      new RegExp(`ن[${SK}][\\s\\u200C]*ب`, "g"),
    ],
  },
  {
    id: "madd-normal",
    nameAr: "مدّ طبيعي",
    nameEn: "Normal madd (2)",
    nameFr: "Madd normal (2)",
    color: "#c09725",
    description: "Madd tabii — prolongation de 2 temps",
    patterns: [
      /[\u064E][\u0627\u0670]/g,
      new RegExp(`[\\u064F]و(?![${SK}])`, "g"),
      new RegExp(`[\\u0650]ي(?![${SK}])`, "g"),
    ],
  },
  {
    id: "madd-separated",
    nameAr: "مدّ منفصل",
    nameEn: "Separated madd (4-5 Warsh)",
    nameFr: "Madd séparé (4-5 temps)",
    color: "#e67b00",
    description:
      "Madd munfasil — prolongation 4-5 temps en Warsh (madd entre deux mots)",
    patterns: [/[اوي][\s\u200C]+[ءأإؤئ]/g],
  },
  {
    id: "madd-connected",
    nameAr: "مدّ متصل",
    nameEn: "Connected madd (4-6)",
    nameFr: "Madd connecté (4-6)",
    color: "#ff0000",
    description:
      "Madd muttasil — hamza après madd dans le même mot (4-6 temps en Warsh)",
    patterns: [/[ءأإؤئ][\u064E\u064F\u0650]?[\u0627وي]/g],
  },
  {
    id: "madd",
    nameAr: "مدّ لازم",
    nameEn: "Necessary madd (6)",
    nameFr: "Madd nécessaire (6)",
    color: "#b7001c",
    description: "Madd lazim — prolongation obligatoire de 6 temps",
    patterns: [/[\u0627وي]\u0651/g],
  },
  {
    id: "lam-shamsiyya",
    nameAr: "حرف ساكن",
    nameEn: "Silent letter",
    nameFr: "Lettre muette",
    color: "#ababab",
    description: "Lam de l'article assimilée (lam shamsiyya) / lettre muette",
    patterns: [/[ٱا]ل[تثدذرزسشصضطظنل]/g],
  },
  {
    id: "tafkhim",
    nameAr: "تفخيم",
    nameEn: "Tafkhim (heavy)",
    nameFr: "Tafkhim (lourd)",
    color: "#134fe1",
    description: "Prononciation emphatique/lourde (lettres مستعلية)",
    patterns: [
      new RegExp(`[صضطظخغق][\\u064E\\u064F\\u0650${SK}\\u0651]?`, "g"),
    ],
  },
];

export default TAJWID_RULES;
export { WARSH_TAJWID_RULES };

/**
 * Get the appropriate ruleset based on riwaya.
 * @param {string} riwaya - 'hafs' or 'warsh'
 * @returns {Array} The tajweed rules to use
 */
export function getRulesForRiwaya(riwaya) {
  return riwaya === "warsh" ? WARSH_TAJWID_RULES : TAJWID_RULES;
}

// ── Tajweed parsing cache ────────────────────
const _parseTajwidCache = new Map();
const _PARSE_CACHE_MAX = 2000;
const _perWordCache = new Map();
const _PER_WORD_CACHE_MAX = 2000;

function _cacheGet(cache, key) {
  return cache.get(key);
}
function _cacheSet(cache, maxSize, key, value) {
  if (cache.size >= maxSize) {
    // Evict oldest 25%
    const toDelete = Math.floor(maxSize / 4);
    const iter = cache.keys();
    for (let i = 0; i < toDelete; i++) {
      const k = iter.next().value;
      if (k !== undefined) cache.delete(k);
    }
  }
  cache.set(key, value);
}

/**
 * Apply all tajwid rules to a text string.
 * Returns an array of segments: { text, ruleId | null }
 * @param {string} text - Arabic text to parse
 * @param {string} riwaya - 'hafs' or 'warsh' (default: 'hafs')
 */
export function parseTajwid(text, riwaya = "hafs") {
  if (!text) return [{ text: "", ruleId: null }];

  const cacheKey = `${riwaya}:${text}`;
  const cached = _cacheGet(_parseTajwidCache, cacheKey);
  if (cached) return cached;

  const rules = getRulesForRiwaya(riwaya);

  // Collect all matches with positions
  const matches = [];
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      // Reset regex state
      const re = new RegExp(pattern.source, pattern.flags);
      let m;
      while ((m = re.exec(text)) !== null) {
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          ruleId: rule.id,
          text: m[0],
        });
      }
    }
  }

  if (matches.length === 0) {
    const result = [{ text, ruleId: null }];
    _cacheSet(_parseTajwidCache, _PARSE_CACHE_MAX, cacheKey, result);
    return result;
  }

  // Sort by position, longest match first for same position
  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  // Remove overlapping matches (keep first/longest)
  const cleaned = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      cleaned.push(m);
      lastEnd = m.end;
    }
  }

  // Build segments
  const segments = [];
  let pos = 0;
  for (const m of cleaned) {
    if (m.start > pos) {
      segments.push({ text: text.slice(pos, m.start), ruleId: null });
    }
    segments.push({ text: m.text, ruleId: m.ruleId });
    pos = m.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), ruleId: null });
  }

  _cacheSet(_parseTajwidCache, _PARSE_CACHE_MAX, cacheKey, segments);
  return segments;
}

/**
 * Get per-word tajweed rule IDs for use with QCF4 Warsh rendering.
 * Analyses an Arabic text string and returns an array of ruleId (or null) per word.
 * Each ruleId maps to a CSS variable --tajwid-{ruleId} for proper theming.
 * @param {string} text - Arabic text to analyse
 * @param {string} riwaya - 'hafs' or 'warsh' (default: 'hafs')
 * @returns {Array<string|null>} One ruleId per word
 */
export function getPerWordTajweedColors(text, riwaya = "hafs") {
  if (!text) return [];

  const cacheKey = `pw:${riwaya}:${text}`;
  const cached = _cacheGet(_perWordCache, cacheKey);
  if (cached) return cached;

  const rules = getRulesForRiwaya(riwaya);
  let segments;
  try {
    segments = parseTajwid(text, riwaya);
  } catch {
    return [];
  }
  if (!segments || segments.length === 0) return [];

  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];

  // Rebuild full text from segments for position alignment
  const fullText = segments.map((s) => s.text).join("");

  // Build character → ruleId map
  const charRules = new Array(fullText.length).fill(null);
  let cPos = 0;
  for (const seg of segments) {
    if (seg.ruleId) {
      for (let i = 0; i < seg.text.length; i++) {
        if (cPos + i < fullText.length) charRules[cPos + i] = seg.ruleId;
      }
    }
    cPos += seg.text.length;
  }

  // Map each word to its dominant tajweed rule
  const result = [];
  let charIdx = 0;
  for (const word of words) {
    // Skip whitespace
    while (charIdx < fullText.length && /\s/.test(fullText[charIdx])) charIdx++;
    const ruleCounts = {};
    for (let i = 0; i < word.length && charIdx + i < fullText.length; i++) {
      const rule = charRules[charIdx + i];
      if (rule) ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
    }
    charIdx += word.length;

    let dominant = null;
    let maxCount = 0;
    for (const [rule, count] of Object.entries(ruleCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = rule;
      }
    }

    // Fallback: direct per-word pattern detection when char-map found nothing
    if (!dominant) {
      for (const rule of rules) {
        let found = false;
        for (const pattern of rule.patterns) {
          const re = new RegExp(pattern.source, pattern.flags.replace("g", ""));
          if (re.test(word)) {
            dominant = rule.id;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    result.push(dominant);
  }
  _cacheSet(_perWordCache, _PER_WORD_CACHE_MAX, cacheKey, result);
  return result;
}
