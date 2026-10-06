/** Source categories retain their meaning independently of their visual group. */
import { TAJWID_RULE_GROUPS } from "./tajwidPalette.js";
import { WARSH_TAJWID_RULE_IDS } from "./warshTajwidSigns.js";
import { WARSH_ARCHIVE_RULE_IDS } from "./warshArchiveManifest.js";

const LABELS = {
  "madd-badal": ["Madd badal", "Substitution madd", "مد بدل"],
  "madd-arid": ["Madd à l’arrêt", "Stopping madd", "مد عارض للسكون"],
  "madd-lin": ["Madd līn", "Soft madd", "مد لين"],
  silent: ["Lettre non prononcée", "Silent letter", "حرف غير منطوق"],
  "ham-wasl": ["Hamzat al-wasl", "Connecting hamza", "همزة الوصل"],
  "lam-shamsiyya": ["Lām solaire", "Solar lām", "لام شمسية"],
  ghunna: ["Ghounna", "Ghunnah", "غنة"],
  ikhfa: ["Ikhfāʾ", "Ikhfāʾ", "إخفاء"],
  "ikhfa-shafawi": ["Ikhfāʾ du mīm", "Labial ikhfa", "إخفاء شفوي"],
  iqlab: ["Iqlāb", "Iqlāb", "إقلاب"],
  idgham: ["Idghām", "Idghām", "إدغام"],
  "idgham-ghunnah": ["Idghām avec ghounna", "Idghām with ghunnah", "إدغام بغنة"],
  "idgham-without-ghunnah": ["Idghām sans ghounna", "Idghām without ghunnah", "إدغام بغير غنة"],
  "idgham-shafawi": ["Idghām du mīm", "Labial idghām", "إدغام شفوي"],
  "idgham-mutamathilayn": ["Idghām de lettres identiques", "Identical-letter idghām", "إدغام المتماثلين"],
  "idgham-mutajanisayn": ["Idghām de lettres homogènes", "Homogeneous-letter idghām", "إدغام المتجانسين"],
  "idgham-mutaqaribayn": ["Idghām de lettres proches", "Similar-letter idghām", "إدغام المتقاربين"],
  qalqala: ["Qalqala", "Qalqalah", "قلقلة"],
  tafkhim: ["Tafkhīm", "Tafkhīm", "تفخيم"],
  "madd-normal": ["Madd naturel", "Natural madd", "مد طبيعي"],
  "madd-permissible": ["Madd permis", "Permissible madd", "مد جائز"],
  "madd-obligatory": ["Madd obligatoire", "Obligatory madd", "مد واجب"],
  "madd-obligatory-separated": ["Madd obligatoire séparé", "Obligatory separated madd", "مد واجب منفصل"],
  "madd-separated": ["Madd permis", "Permissible madd", "مد جائز"],
  "madd-connected": ["Madd obligatoire", "Obligatory madd", "مد واجب"],
  madd: ["Madd nécessaire", "Necessary madd", "مد لازم"],
};
const TAJWID_RULES = Object.freeze(Object.entries(LABELS).map(([id, names]) => Object.freeze({
  id, nameFr: names[0], nameEn: names[1], nameAr: names[2],
  visualGroup: TAJWID_RULE_GROUPS[id], color: `var(--tajwid-${id})`,
  patterns: Object.freeze([]),
})));
// Warsh paints only the rules its own pinned edition prints, so its metadata is
// the Hafs metadata restricted to those ids: a Warsh tooltip can only ever name
// a rule the Warsh source actually marks.
export const WARSH_TAJWID_RULES = Object.freeze(
  TAJWID_RULES.filter((rule) => WARSH_TAJWID_RULE_IDS.includes(rule.id) || WARSH_ARCHIVE_RULE_IDS.includes(rule.id)),
);
export default TAJWID_RULES;
export function getRulesForRiwaya(riwaya) {
  return riwaya === "hafs" ? TAJWID_RULES : WARSH_TAJWID_RULES;
}
const _parseTajwidCache = new Map();
const _PARSE_CACHE_MAX = 2000;

/** Merge adjacent annotations without changing any Unicode code point. */
export function stabilizeTajwidSegments(segments = []) {
  const result = [];
  for (const segment of segments) {
    const text = String(segment?.text ?? "");
    if (!text) continue;
    const ruleId = segment?.ruleId || null;
    if (result.at(-1)?.ruleId === ruleId) result.at(-1).text += text;
    else result.push({ text, ruleId });
  }
  return result;
}

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

// Rewritten as annotation-only. The single entry point every rendering mode
// goes through, so gating the invented patterns here is what actually removes
// them from the app.
import {
  ANNOTATED_RIWAYAS,
  parseTajweedAnnotation,
  stripTajweedMarkup,
} from "../utils/tajwidAnnotation.js";

/**
 * Apply the provider's Tajweed annotation to a text string.
 *
 * Colour comes only from the annotation the API returns
 * (`text_uthmani_tajweed`), never from letter patterns: a recitation rule
 * depends on how the verse is read, so inferring one from the characters alone
 * is guessing, and guessing a Quran reading rule is not acceptable here.
 *
 * Consequences that are intentional:
 *  - Warsh renders uncoloured when the toggle is off, and paints only the
 *    rules its own edition prints (see src/data/warshTajwidSigns.js).
 *  - Hafs renders uncoloured when the annotation is missing, which is what
 *    offline looks like until the payload is cached.
 *  - The Quran text itself is never altered in any of those cases.
 *
 * @param {string} text - annotated or plain Arabic text
 * @param {string} riwaya - 'hafs' or 'warsh' (default: 'hafs')
 * @returns {Array<{ text: string, ruleId: string|null }>}
 */
export function parseTajwid(text, riwaya = "hafs") {
  if (!text) return [{ text: "", ruleId: null }];
  const source = String(text);

  if (!ANNOTATED_RIWAYAS.includes(riwaya)) {
    // Strip any markup rather than pass it through: a Warsh segment must never
    // be able to render `<rule …>` as literal Quran text.
    return stabilizeTajwidSegments([
      { text: stripTajweedMarkup(source), ruleId: null },
    ]);
  }

  const cacheKey = `${riwaya}:${source}`;
  const cached = _cacheGet(_parseTajwidCache, cacheKey);
  if (cached) return cached;

  const parsed = parseTajweedAnnotation(source);
  const result = stabilizeTajwidSegments(
    parsed || [{ text: stripTajweedMarkup(source), ruleId: null }],
  );
  _cacheSet(_parseTajwidCache, _PARSE_CACHE_MAX, cacheKey, result);
  return result;
}

/** UTF-16 rule ranges for each word, preserving the complete Arabic text run. */
export function getPerWordTajweedRanges(words, riwaya = "hafs") {
  if (!Array.isArray(words) || words.length === 0) return [];
  const annotated = words.join(" ");
  const segments = parseTajwid(annotated, riwaya);
  // Segments are expressed in the markup-free text, so every offset below is
  // computed on it. The parser only assigns rules to characters; it never
  // rewrites them, which the equality check re-proves before any colour is
  // allowed to reach a Quranic letter.
  const plain = segments.map((segment) => segment.text).join("");
  if (plain !== stripTajweedMarkup(annotated)) {
    return words.map(() => []);
  }
  // Word boundaries must come from the text the renderer actually paints.
  const plainWords = plain.split(/\s+/).filter((word) => word.length > 0);
  if (plainWords.length !== words.length) return words.map(() => []);
  words = plainWords;
  const ranges = words.map(() => []);
  const positions = [];
  let cursor = 0;
  for (const word of words) {
    positions.push({ start: cursor, end: cursor + word.length });
    cursor += word.length + 1;
  }
  let segmentStart = 0;
  for (const segment of segments) {
    const segmentEnd = segmentStart + segment.text.length;
    if (segment.ruleId) {
      positions.forEach((position, index) => {
        const start = Math.max(segmentStart, position.start);
        const end = Math.min(segmentEnd, position.end);
        if (end > start) {
          ranges[index].push({
            start: start - position.start,
            end: end - position.start,
            ruleId: segment.ruleId,
          });
        }
      });
    }
    segmentStart = segmentEnd;
  }
  return ranges;
}

export const TAJWID_RULE_DESCRIPTIONS = {
    ghunna: {

        desc: {
            fr: "Nasalisation produite par la cavité nasale pendant 2 temps.",
            en: "Nasalization produced from the nose, lasting for 2 beats.",
            ar: "صوت يخرج من الخيشوم بمقدار حركتين."
        }
    },
    ikhfa: {

        desc: {
            fr: "Dissimulation de la lettre Nūn ou Tanwīn devant les lettres de l'Ikhfā'.",
            en: "Hiding the sound of Nūn or Tanwīn when followed by an Ikhfā' letter.",
            ar: "نطق الحرف بصفة بين الإظهار والإدغام مع الغنة."
        }
    },
    idgham: {

        desc: {
            fr: "Assimilation ou fusion de la lettre Nūn ou Tanwīn avec la lettre suivante.",
            en: "Merging the sound of Nūn or Tanwīn into the following letter.",
            ar: "إدخل حرف ساكن في حرف متحرك بحيث يصيران حرفاً واحداً مشدداً."
        }
    },
    iqlab: {

        desc: {
            fr: "Conversion du Nūn ou Tanwīn en un Mīm léger avec Ghunnah.",
            en: "Converting the sound of Nūn or Tanwīn into a light Mīm with Ghunnah.",
            ar: "قلب النون الساكنة أو التنوين ميماً مخفاة مع الغنة."
        }
    },
    qalqala: {

        desc: {
            fr: "Rebondissement ou écho de la consonne lorsqu'elle est calme (Sākīnah).",
            en: "Echoing or bouncing sound of the consonant when silent (Sākīnah).",
            ar: "اضطراب الحرف في مخرجه عند النطق به ساكناً."
        }
    },
    "madd-connected": {

        desc: {
            fr: "Allongement lié : la lettre de Madd et la hamza sont dans le même mot. La durée dépend de la récitation.",
            en: "Connected elongation: the madd letter and hamza are in the same word. Duration depends on the recitation.",
            ar: "أن يأتي حرف المد والهمزة في كلمة واحدة، ويختلف المقدار بحسب الرواية."
        }
    },
    "madd-separated": {

        desc: {
            fr: "Allongement permis : la durée dépend de la règle et du contexte de lecture.",
            en: "Permissible elongation: duration depends on the rule and reading context.",
            ar: "مد يختلف مقداره بحسب الحكم وسياق القراءة."
        }
    },
    madd: {

        desc: {
            fr: "Allongement nécessaire ou obligatoire (6 temps).",
            en: "Necessary/obligatory elongation (6 beats).",
            ar: "أن يأتي بعد حرف المد حرف ساكن سكوناً أصلياً بمقدار ٦ حركات."
        }
    },
    "madd-normal": {

        desc: {
            fr: "Allongement naturel ou normal (2 temps).",
            en: "Natural or normal elongation (2 beats).",
            ar: "المد الطبيعي الذي لا تقوم ذات الحرف إلا به بمقدار حركتين."
        }
    },
    silent: {

        desc: {
            fr: "Lettre écrite mais non prononcée (ex: Hamzat al-Wasl ou Alif muet).",
            en: "Written but unpronounced letter (e.g., Hamzat al-Wasl or silent Alif).",
            ar: "حرف يكتب ولا ينطق في القراءة."
        }
    },
    "lam-shamsiyya": {

        desc: {
            fr: "Lām solaire assimilé dans la lettre suivante (non prononcé).",
            en: "Solar Lām merged into the following letter (unpronounced).",
            ar: "اللام التي تكتب ولا تلفظ ويشدد الحرف بعدها."
        }
    }
};

Object.assign(TAJWID_RULE_DESCRIPTIONS, {
  "madd-badal": { desc: { fr: "Allongement badal signalé par le fichier Warsh.", en: "Substitution madd marked by the Warsh file.", ar: "مد بدل يحدده ملف ورش." } },
  "madd-arid": { desc: { fr: "Allongement lié au sukūn lors de l’arrêt.", en: "Elongation associated with the sukūn when stopping.", ar: "مد بسبب السكون العارض عند الوقف." } },
  "madd-lin": { desc: { fr: "Allongement d’une lettre de līn signalé par la source.", en: "Elongation of a soft letter marked by the source.", ar: "مد حرف لين يحدده المصدر." } },
  "madd-permissible": { desc: { fr: "Allongement permis : la durée dépend de la règle et du contexte de lecture.", en: "Permissible elongation: duration depends on the rule and reading context.", ar: "مد يختلف مقداره بحسب الحكم وسياق القراءة." } },
  "madd-obligatory": { desc: { fr: "Allongement signalé comme obligatoire par la source.", en: "Elongation marked obligatory by the source.", ar: "مد يصفه المصدر بأنه واجب." } },
  "madd-obligatory-separated": { desc: { fr: "Allongement séparé signalé comme obligatoire par la source.", en: "Separated elongation marked obligatory by the source.", ar: "مد منفصل يصفه المصدر بأنه واجب." } },
  "ham-wasl": { desc: { fr: "Hamza prononcée au début de la lecture et omise en liaison.", en: "Hamza pronounced at the start of reading and omitted in connected reading.", ar: "همزة تثبت عند الابتداء وتسقط عند الوصل." } },
  "ikhfa-shafawi": { desc: { fr: "Dissimulation du mīm sākin devant le bāʾ, avec ghounna.", en: "Concealment of a silent mīm before bāʾ, with ghunnah.", ar: "إخفاء الميم الساكنة عند الباء مع الغنة." } },
  "idgham-ghunnah": { desc: { fr: "Assimilation avec nasalisation.", en: "Assimilation with nasalisation.", ar: "إدغام مصحوب بالغنة." } },
  "idgham-without-ghunnah": { desc: { fr: "Assimilation sans nasalisation.", en: "Assimilation without nasalisation.", ar: "إدغام دون غنة." } },
  "idgham-shafawi": { desc: { fr: "Assimilation du mīm sākin dans un mīm, avec ghounna.", en: "Assimilation of a silent mīm into mīm, with ghunnah.", ar: "إدغام الميم الساكنة في الميم مع الغنة." } },
  "idgham-mutamathilayn": { desc: { fr: "Assimilation de deux lettres identiques.", en: "Assimilation of two identical letters.", ar: "إدغام حرفين متماثلين." } },
  "idgham-mutajanisayn": { desc: { fr: "Assimilation de lettres de même point d’articulation.", en: "Assimilation of letters sharing an articulation point.", ar: "إدغام حرفين متجانسين في المخرج." } },
  "idgham-mutaqaribayn": { desc: { fr: "Assimilation de lettres proches dans leur articulation.", en: "Assimilation of letters close in articulation.", ar: "إدغام حرفين متقاربين." } },
});
