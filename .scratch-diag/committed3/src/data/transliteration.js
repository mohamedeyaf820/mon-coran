/**
 * Transliteration module for phonetic Quran search.
 *
 * Provides Latin → Arabic conversion so users can search
 * by typing romanized Arabic (e.g., "bismillah" → "بسم الله").
 *
 * Strategy:
 *  1. Check common Quranic terms dictionary first
 *  2. Fall back to character-by-character conversion
 *  3. Also provide Arabic → Latin for potential client-side matching
 */

/* ─── Common Quranic terms dictionary ─── */
const COMMON_TERMS = {
  'bismillah': 'بسم الله',
  'bismillahi': 'بسم الله',
  'alhamdulillah': 'الحمد لله',
  'alhamdu': 'الحمد',
  'lillah': 'لله',
  'rahman': 'رحمن',
  'rahim': 'رحيم',
  'allah': 'الله',
  'allahou': 'الله',
  'allahu': 'الله',
  'rabb': 'رب',
  'rabbi': 'ربي',
  'quran': 'قرآن',
  'kitab': 'كتاب',
  'iman': 'إيمان',
  'islam': 'إسلام',
  'muslim': 'مسلم',
  'salat': 'صلاة',
  'salah': 'صلاة',
  'zakat': 'زكاة',
  'hajj': 'حج',
  'sawm': 'صوم',
  'jannah': 'جنة',
  'jahannam': 'جهنم',
  'nar': 'نار',
  'nabi': 'نبي',
  'rasul': 'رسول',
  'rasoul': 'رسول',
  'malaika': 'ملائكة',
  'shaytan': 'شيطان',
  'iblis': 'إبليس',
  'jinn': 'جن',
  'tawba': 'توبة',
  'tawbah': 'توبة',
  'hidaya': 'هداية',
  'hidayah': 'هداية',
  'sabr': 'صبر',
  'shukr': 'شكر',
  'taqwa': 'تقوى',
  'akhira': 'آخرة',
  'dunya': 'دنيا',
  'yaum': 'يوم',
  'yawm': 'يوم',
  'qiyama': 'قيامة',
  'qiyamah': 'قيامة',
  'muhammad': 'محمد',
  'musa': 'موسى',
  'isa': 'عيسى',
  'ibrahim': 'إبراهيم',
  'adam': 'آدم',
  'nuh': 'نوح',
  'maryam': 'مريم',
  'dawud': 'داود',
  'sulayman': 'سليمان',
  'yusuf': 'يوسف',
  'ayyub': 'أيوب',
  'ilyas': 'إلياس',
  'yunus': 'يونس',
  'hud': 'هود',
  'lut': 'لوط',
  'ismail': 'إسماعيل',
  'ishaq': 'إسحاق',
  'yaqub': 'يعقوب',
  'harun': 'هارون',
  'zakariya': 'زكريا',
  'yahya': 'يحيى',
  'idris': 'إدريس',
  'dhulkifl': 'ذو الكفل',
  'shuayb': 'شعيب',
  'salih': 'صالح',
  'ilah': 'إله',
  'samawat': 'سماوات',
  'ard': 'أرض',
  'insan': 'إنسان',
  'nas': 'ناس',
  'qul': 'قل',
  'inna': 'إن',
  'alladhi': 'الذي',
  'alladhina': 'الذين',
  'amanu': 'آمنوا',
  'kafaru': 'كفروا',
  'tawakkul': 'توكل',
  'dhikr': 'ذكر',
  'subhan': 'سبحان',
  'subhanallah': 'سبحان الله',
  'la ilaha illa': 'لا إله إلا',
  'la ilaha illallah': 'لا إله إلا الله',
  'allahu akbar': 'الله أكبر',
  'kafir': 'كافر',
  'kafirun': 'كافرون',
  'munafiq': 'منافق',
  'munafiqun': 'منافقون',
  'ayah': 'آية',
  'ayat': 'آيات',
  'haqq': 'حق',
  'batil': 'باطل',
  'nur': 'نور',
  'zulm': 'ظلم',
  'adl': 'عدل',
  'rizq': 'رزق',
  'barakah': 'بركة',
  'rahma': 'رحمة',
  'maghfira': 'مغفرة',
  'shifa': 'شفاء',
  'jibrail': 'جبريل',
  'jibril': 'جبريل',
  'mikail': 'ميكائيل',
  'israfil': 'إسرافيل',
  'malak': 'ملك',
  'malik': 'مالك',
  'firdaws': 'فردوس',
  'kursi': 'كرسي',
  'arsh': 'عرش',
  'sirat': 'صراط',
  'mustaqim': 'مستقيم',
  'ikhlas': 'إخلاص',
  'falaq': 'فلق',
  'kawthar': 'كوثر',
  'fatiha': 'فاتحة',
  'baqara': 'بقرة',
  'imran': 'عمران',
  'anfal': 'أنفال',
  'kahf': 'كهف',
  'yasin': 'يس',
  'waqia': 'واقعة',
  'mulk': 'ملك',
  'muzammil': 'مزمل',
  'mudathir': 'مدثر',
};

/* ─── Digraph and character mapping (Latin → Arabic) ─── */
const DIGRAPHS = [
  ['sh', 'ش'],
  ['th', 'ث'],
  ['kh', 'خ'],
  ['dh', 'ذ'],
  ['gh', 'غ'],
  ['ch', 'ش'],  // French-style "ch" → ش
];

const CHAR_MAP = {
  'a': 'ا',
  'b': 'ب',
  't': 'ت',
  'j': 'ج',
  'h': 'ح',
  'd': 'د',
  'r': 'ر',
  'z': 'ز',
  's': 'س',
  'p': 'ب',  // French "p" approximation
  'f': 'ف',
  'q': 'ق',
  'k': 'ك',
  'l': 'ل',
  'm': 'م',
  'n': 'ن',
  'w': 'و',
  'y': 'ي',
  'i': 'ي',
  'u': 'و',
  'o': 'و',
  'e': 'ا',
  // Special
  "'": 'ع',
  '`': 'ع',
};

/* ─── Arabic → Latin character map (for Arabic→Latin transliteration) ─── */
const AR_TO_LAT = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ء': "'",
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
  'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't',
  'ظ': 'z', 'ع': "'", 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h',
  'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h',
  'ئ': 'y', 'ؤ': 'w', 'ٱ': 'a',
  // Diacritics → simplified
  '\u064E': 'a',  // fatha
  '\u064F': 'u',  // damma
  '\u0650': 'i',  // kasra
  '\u064B': 'an', // tanwin fatha
  '\u064C': 'un', // tanwin damma
  '\u064D': 'in', // tanwin kasra
  '\u0651': '',   // shadda (doubling handled separately)
  '\u0652': '',   // sukun
  '\u0653': '',   // maddah
  '\u0654': '',   // hamza above
  '\u0670': 'a',  // superscript alif
  ' ': ' ',
};

/**
 * Convert Latin text to Arabic script (best-effort).
 * Checks dictionary first, then converts character by character.
 */
export function latinToArabic(text) {
  if (!text) return '';
  const lower = text.toLowerCase().trim();

  // Check dictionary first (exact match or multi-word)
  if (COMMON_TERMS[lower]) return COMMON_TERMS[lower];

  // Try dictionary for individual words
  const words = lower.split(/\s+/);
  const converted = words.map(word => {
    if (COMMON_TERMS[word]) return COMMON_TERMS[word];
    return convertWordToArabic(word);
  });

  return converted.join(' ');
}

function convertWordToArabic(word) {
  let result = '';
  let i = 0;
  while (i < word.length) {
    // Try digraphs first
    let matched = false;
    if (i < word.length - 1) {
      const di = word.slice(i, i + 2);
      for (const [lat, ar] of DIGRAPHS) {
        if (di === lat) {
          result += ar;
          i += 2;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      const ch = word[i];
      result += CHAR_MAP[ch] || ch;
      i++;
    }
  }
  return result;
}

/**
 * Convert Arabic text to simplified Latin (phonetic).
 * Strips diacritics and produces a plain romanization.
 *
 * @param {string} text - Arabic text to transliterate
 * @param {string} riwaya - 'hafs' or 'warsh'
 */
export function arabicToLatin(text, riwaya = 'hafs') {
  if (!text) return '';

  let processedText = text;

  // ─── Riwaya-Specific Phonetic Pre-processing ───
  if (riwaya === 'warsh') {
    // 1. Naql (Vowel Transfer) - Simplified regex for common cases like "al-ard" -> "al-ard" (vowel stays)
    // but word combinations like "man amana" -> "man-amana" (but pronounced manamana)
    // Most Warsh-specific Naql is already in the spelling of Warsh Mushafs.

    // 2. Imala (Softening 'a' -> 'ey')
    // Common in Warsh for words ending in Alif Maqsura (ى) preceded by certain letters
    // and for specific words.
    processedText = processedText.replace(/ى\b/g, 'EY'); // Mark for later conversion
    processedText = processedText.replace(/ىٰ\b/g, 'EY');
  }

  let result = '';
  for (let i = 0; i < processedText.length; i++) {
    const ch = processedText[i];

    // Custom marker for Imala
    if (ch === 'E' && processedText[i + 1] === 'Y') {
      result += 'ey';
      i++;
      continue;
    }

    if (AR_TO_LAT[ch] !== undefined) {
      // Check for shadda (doubling the previous consonant)
      if (ch === '\u0651' && i > 0) {
        // Find previous meaningful char (skip other diacritics if any)
        let prevIdx = i - 1;
        while (prevIdx >= 0 && !AR_TO_LAT[processedText[prevIdx]] && !/[\u0600-\u06FF]/.test(processedText[prevIdx])) {
          prevIdx--;
        }
        if (prevIdx >= 0) {
          const prevLat = AR_TO_LAT[processedText[prevIdx]];
          if (prevLat && prevLat.length === 1) {
            result += prevLat;
          }
        }
      } else {
        result += AR_TO_LAT[ch];
      }
    } else if (/[\u0600-\u06FF\u0750-\u077F]/.test(ch)) {
      // Unknown Arabic char — skip
    } else {
      result += ch;
    }
  }

  // Final cleanup and formatting
  return result
    .replace(/\s+/g, ' ')
    .replace(/(.)\1+/g, '$1$1') // Max double letters
    .replace(/aey/g, 'ey')       // Clean up Imala overlap
    .trim()
    .toLowerCase();
}

/**
 * Check if a Latin query matches Arabic text (fuzzy phonetic match).
 * Converts the Arabic text to Latin and checks if the query appears within it.
 */
export function phoneticMatch(latinQuery, arabicText) {
  if (!latinQuery || !arabicText) return false;
  const normalized = arabicToLatin(arabicText);
  const query = latinQuery.toLowerCase().replace(/\s+/g, ' ').trim();
  return normalized.includes(query);
}

/**
 * Get the common terms dictionary (useful for autocomplete).
 */
export function getCommonTerms() {
  return { ...COMMON_TERMS };
}
