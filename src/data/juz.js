/**
 * Juz / Hizb / Rub' reference data
 * Each juz starts at a specific surah:ayah.
 * Hizb = 60 (each juz has 2 hizbs), Rub' = 240 (each hizb has 4 rub').
 */

export const JUZ_DATA = [
  { juz:1,  start:{s:1,a:1},   name:"آلم" },
  { juz:2,  start:{s:2,a:142}, name:"سَيَقُولُ" },
  { juz:3,  start:{s:2,a:253}, name:"تِلْكَ ٱلرُّسُلُ" },
  { juz:4,  start:{s:3,a:93},  name:"لَن تَنَالُوا" },
  { juz:5,  start:{s:4,a:24},  name:"وَٱلْمُحْصَنَاتُ" },
  { juz:6,  start:{s:4,a:148}, name:"لَا يُحِبُّ ٱللَّهُ" },
  { juz:7,  start:{s:5,a:82},  name:"وَإِذَا سَمِعُوا" },
  { juz:8,  start:{s:6,a:111}, name:"وَلَوْ أَنَّنَا" },
  { juz:9,  start:{s:7,a:88},  name:"قَالَ ٱلْمَلَأُ" },
  { juz:10, start:{s:8,a:41},  name:"وَٱعْلَمُوا" },
  { juz:11, start:{s:9,a:93},  name:"يَعْتَذِرُونَ" },
  { juz:12, start:{s:11,a:6},  name:"وَمَا مِن دَابَّةٍ" },
  { juz:13, start:{s:12,a:53}, name:"وَمَا أُبَرِّئُ" },
  { juz:14, start:{s:15,a:1},  name:"رُبَمَا" },
  { juz:15, start:{s:17,a:1},  name:"سُبْحَانَ ٱلَّذِي" },
  { juz:16, start:{s:18,a:75}, name:"قَالَ أَلَمْ" },
  { juz:17, start:{s:21,a:1},  name:"ٱقْتَرَبَ" },
  { juz:18, start:{s:23,a:1},  name:"قَدْ أَفْلَحَ" },
  { juz:19, start:{s:25,a:21}, name:"وَقَالَ ٱلَّذِينَ" },
  { juz:20, start:{s:27,a:56}, name:"أَمَّن خَلَقَ" },
  { juz:21, start:{s:29,a:46}, name:"وَلَا تُجَادِلُوا" },
  { juz:22, start:{s:33,a:31}, name:"وَمَن يَقْنُتْ" },
  { juz:23, start:{s:36,a:28}, name:"وَمَا أَنزَلْنَا" },
  { juz:24, start:{s:39,a:32}, name:"فَمَنْ أَظْلَمُ" },
  { juz:25, start:{s:41,a:47}, name:"إِلَيْهِ يُرَدُّ" },
  { juz:26, start:{s:46,a:1},  name:"حم" },
  { juz:27, start:{s:51,a:31}, name:"قَالَ فَمَا خَطْبُكُمْ" },
  { juz:28, start:{s:58,a:1},  name:"قَدْ سَمِعَ" },
  { juz:29, start:{s:67,a:1},  name:"تَبَارَكَ" },
  { juz:30, start:{s:78,a:1},  name:"عَمَّ" },
];

/**
 * Hizb starting positions (60 hizbs = 2 per juz).
 * Each entry: { hizb, juz, start: {s, a} }
 */
export const HIZB_DATA = [
  {hizb:1,juz:1,start:{s:1,a:1}},{hizb:2,juz:1,start:{s:2,a:26}},
  {hizb:3,juz:2,start:{s:2,a:142}},{hizb:4,juz:2,start:{s:2,a:203}},
  {hizb:5,juz:3,start:{s:2,a:253}},{hizb:6,juz:3,start:{s:3,a:15}},
  {hizb:7,juz:4,start:{s:3,a:93}},{hizb:8,juz:4,start:{s:3,a:171}},
  {hizb:9,juz:5,start:{s:4,a:24}},{hizb:10,juz:5,start:{s:4,a:88}},
  {hizb:11,juz:6,start:{s:4,a:148}},{hizb:12,juz:6,start:{s:5,a:27}},
  {hizb:13,juz:7,start:{s:5,a:82}},{hizb:14,juz:7,start:{s:6,a:36}},
  {hizb:15,juz:8,start:{s:6,a:111}},{hizb:16,juz:8,start:{s:7,a:31}},
  {hizb:17,juz:9,start:{s:7,a:88}},{hizb:18,juz:9,start:{s:7,a:171}},
  {hizb:19,juz:10,start:{s:8,a:41}},{hizb:20,juz:10,start:{s:9,a:33}},
  {hizb:21,juz:11,start:{s:9,a:93}},{hizb:22,juz:11,start:{s:10,a:26}},
  {hizb:23,juz:12,start:{s:11,a:6}},{hizb:24,juz:12,start:{s:11,a:83}},
  {hizb:25,juz:13,start:{s:12,a:53}},{hizb:26,juz:13,start:{s:13,a:35}},
  {hizb:27,juz:14,start:{s:15,a:1}},{hizb:28,juz:14,start:{s:16,a:51}},
  {hizb:29,juz:15,start:{s:17,a:1}},{hizb:30,juz:15,start:{s:17,a:99}},
  {hizb:31,juz:16,start:{s:18,a:75}},{hizb:32,juz:16,start:{s:19,a:59}},
  {hizb:33,juz:17,start:{s:21,a:1}},{hizb:34,juz:17,start:{s:22,a:1}},
  {hizb:35,juz:18,start:{s:23,a:1}},{hizb:36,juz:18,start:{s:24,a:21}},
  {hizb:37,juz:19,start:{s:25,a:21}},{hizb:38,juz:19,start:{s:26,a:111}},
  {hizb:39,juz:20,start:{s:27,a:56}},{hizb:40,juz:20,start:{s:28,a:51}},
  {hizb:41,juz:21,start:{s:29,a:46}},{hizb:42,juz:21,start:{s:31,a:22}},
  {hizb:43,juz:22,start:{s:33,a:31}},{hizb:44,juz:22,start:{s:34,a:24}},
  {hizb:45,juz:23,start:{s:36,a:28}},{hizb:46,juz:23,start:{s:37,a:145}},
  {hizb:47,juz:24,start:{s:39,a:32}},{hizb:48,juz:24,start:{s:40,a:41}},
  {hizb:49,juz:25,start:{s:41,a:47}},{hizb:50,juz:25,start:{s:45,a:33}},
  {hizb:51,juz:26,start:{s:46,a:1}},{hizb:52,juz:26,start:{s:48,a:18}},
  {hizb:53,juz:27,start:{s:51,a:31}},{hizb:54,juz:27,start:{s:54,a:28}},
  {hizb:55,juz:28,start:{s:58,a:1}},{hizb:56,juz:28,start:{s:61,a:1}},
  {hizb:57,juz:29,start:{s:67,a:1}},{hizb:58,juz:29,start:{s:71,a:11}},
  {hizb:59,juz:30,start:{s:78,a:1}},{hizb:60,juz:30,start:{s:87,a:1}},
];

/**
 * Helper: find juz number for a given surah:ayah
 */
export function getJuzForAyah(surah, ayah) {
  for (let i = JUZ_DATA.length - 1; i >= 0; i--) {
    const j = JUZ_DATA[i];
    if (surah > j.start.s || (surah === j.start.s && ayah >= j.start.a)) {
      return j.juz;
    }
  }
  return 1;
}

/**
 * Helper: find hizb number for a given surah:ayah
 */
export function getHizbForAyah(surah, ayah) {
  for (let i = HIZB_DATA.length - 1; i >= 0; i--) {
    const h = HIZB_DATA[i];
    if (surah > h.start.s || (surah === h.start.s && ayah >= h.start.a)) {
      return h.hizb;
    }
  }
  return 1;
}

/**
 * Juz page ranges in the standard Mushaf (604 pages).
 * Each entry: { juz, startPage, endPage }
 */
export const JUZ_PAGE_RANGES = [
  { juz: 1,  startPage: 1,   endPage: 21  },
  { juz: 2,  startPage: 22,  endPage: 41  },
  { juz: 3,  startPage: 42,  endPage: 61  },
  { juz: 4,  startPage: 62,  endPage: 81  },
  { juz: 5,  startPage: 82,  endPage: 101 },
  { juz: 6,  startPage: 102, endPage: 121 },
  { juz: 7,  startPage: 122, endPage: 141 },
  { juz: 8,  startPage: 142, endPage: 161 },
  { juz: 9,  startPage: 162, endPage: 181 },
  { juz: 10, startPage: 182, endPage: 201 },
  { juz: 11, startPage: 202, endPage: 221 },
  { juz: 12, startPage: 222, endPage: 241 },
  { juz: 13, startPage: 242, endPage: 261 },
  { juz: 14, startPage: 262, endPage: 281 },
  { juz: 15, startPage: 282, endPage: 301 },
  { juz: 16, startPage: 302, endPage: 321 },
  { juz: 17, startPage: 322, endPage: 341 },
  { juz: 18, startPage: 342, endPage: 361 },
  { juz: 19, startPage: 362, endPage: 381 },
  { juz: 20, startPage: 382, endPage: 401 },
  { juz: 21, startPage: 402, endPage: 421 },
  { juz: 22, startPage: 422, endPage: 441 },
  { juz: 23, startPage: 442, endPage: 461 },
  { juz: 24, startPage: 462, endPage: 481 },
  { juz: 25, startPage: 482, endPage: 501 },
  { juz: 26, startPage: 502, endPage: 521 },
  { juz: 27, startPage: 522, endPage: 541 },
  { juz: 28, startPage: 542, endPage: 561 },
  { juz: 29, startPage: 562, endPage: 581 },
  { juz: 30, startPage: 582, endPage: 604 },
];

/**
 * Get juz number for a given page
 */
export function getJuzForPage(pageNum) {
  for (const range of JUZ_PAGE_RANGES) {
    if (pageNum >= range.startPage && pageNum <= range.endPage) {
      return range.juz;
    }
  }
  return 1;
}

/**
 * Ruku (Sajdah) positions - verses with obligatory prostration
 * Each entry: { surah, ayah, type: 'obligatory' | 'recommended' }
 */
export const SAJDAH_DATA = [
  { surah: 7, ayah: 206, type: 'obligatory' },
  { surah: 13, ayah: 15, type: 'obligatory' },
  { surah: 16, ayah: 49, type: 'obligatory' },
  { surah: 17, ayah: 107, type: 'obligatory' },
  { surah: 19, ayah: 58, type: 'obligatory' },
  { surah: 22, ayah: 18, type: 'obligatory' },
  { surah: 22, ayah: 77, type: 'obligatory' },
  { surah: 25, ayah: 60, type: 'obligatory' },
  { surah: 27, ayah: 25, type: 'obligatory' },
  { surah: 32, ayah: 15, type: 'obligatory' },
  { surah: 38, ayah: 24, type: 'obligatory' },
  { surah: 41, ayah: 37, type: 'obligatory' },
  { surah: 50, ayah: 40, type: 'obligatory' },
  { surah: 53, ayah: 62, type: 'obligatory' },
  { surah: 84, ayah: 21, type: 'obligatory' },
  { surah: 96, ayah: 19, type: 'obligatory' },
];

export const RUKU_DATA = SAJDAH_DATA;

/**
 * Check if a verse has obligatory sajdah
 */
export function hasSajdah(surah, ayah) {
  return RUKU_DATA.some(r => r.surah === surah && r.ayah === ayah);
}

/**
 * Get next sajdah position from current position
 */
export function getNextSajdah(surah, ayah) {
  for (const r of RUKU_DATA) {
    if (r.surah > surah || (r.surah === surah && r.ayah > ayah)) {
      return r;
    }
  }
  return null; // No more sajdah
}

/**
 * Get previous sajdah position from current position
 */
export function getPrevSajdah(surah, ayah) {
  for (let i = RUKU_DATA.length - 1; i >= 0; i--) {
    const r = RUKU_DATA[i];
    if (r.surah < surah || (r.surah === surah && r.ayah < ayah)) {
      return r;
    }
  }
  return null; // No previous sajdah
}

/**
 * Hizb page ranges
 */
export const HIZB_PAGE_RANGES = [
  { hizb: 1, startPage: 1, endPage: 10 },
  { hizb: 2, startPage: 11, endPage: 21 },
  { hizb: 3, startPage: 22, endPage: 31 },
  { hizb: 4, startPage: 32, endPage: 41 },
  { hizb: 5, startPage: 42, endPage: 51 },
  { hizb: 6, startPage: 52, endPage: 61 },
  { hizb: 7, startPage: 62, endPage: 71 },
  { hizb: 8, startPage: 72, endPage: 81 },
  { hizb: 9, startPage: 82, endPage: 91 },
  { hizb: 10, startPage: 92, endPage: 101 },
  { hizb: 11, startPage: 102, endPage: 111 },
  { hizb: 12, startPage: 112, endPage: 121 },
  { hizb: 13, startPage: 122, endPage: 131 },
  { hizb: 14, startPage: 132, endPage: 141 },
  { hizb: 15, startPage: 142, endPage: 151 },
  { hizb: 16, startPage: 152, endPage: 161 },
  { hizb: 17, startPage: 162, endPage: 171 },
  { hizb: 18, startPage: 172, endPage: 181 },
  { hizb: 19, startPage: 182, endPage: 191 },
  { hizb: 20, startPage: 192, endPage: 201 },
  { hizb: 21, startPage: 202, endPage: 211 },
  { hizb: 22, startPage: 212, endPage: 221 },
  { hizb: 23, startPage: 222, endPage: 231 },
  { hizb: 24, startPage: 232, endPage: 241 },
  { hizb: 25, startPage: 242, endPage: 251 },
  { hizb: 26, startPage: 252, endPage: 261 },
  { hizb: 27, startPage: 262, endPage: 271 },
  { hizb: 28, startPage: 272, endPage: 281 },
  { hizb: 29, startPage: 282, endPage: 291 },
  { hizb: 30, startPage: 292, endPage: 301 },
  { hizb: 31, startPage: 302, endPage: 311 },
  { hizb: 32, startPage: 312, endPage: 321 },
  { hizb: 33, startPage: 322, endPage: 331 },
  { hizb: 34, startPage: 332, endPage: 341 },
  { hizb: 35, startPage: 342, endPage: 351 },
  { hizb: 36, startPage: 352, endPage: 361 },
  { hizb: 37, startPage: 362, endPage: 371 },
  { hizb: 38, startPage: 372, endPage: 381 },
  { hizb: 39, startPage: 382, endPage: 391 },
  { hizb: 40, startPage: 392, endPage: 401 },
  { hizb: 41, startPage: 402, endPage: 411 },
  { hizb: 42, startPage: 412, endPage: 421 },
  { hizb: 43, startPage: 422, endPage: 431 },
  { hizb: 44, startPage: 432, endPage: 441 },
  { hizb: 45, startPage: 442, endPage: 451 },
  { hizb: 46, startPage: 452, endPage: 461 },
  { hizb: 47, startPage: 462, endPage: 471 },
  { hizb: 48, startPage: 472, endPage: 481 },
  { hizb: 49, startPage: 482, endPage: 491 },
  { hizb: 50, startPage: 492, endPage: 501 },
  { hizb: 51, startPage: 502, endPage: 511 },
  { hizb: 52, startPage: 512, endPage: 521 },
  { hizb: 53, startPage: 522, endPage: 531 },
  { hizb: 54, startPage: 532, endPage: 541 },
  { hizb: 55, startPage: 542, endPage: 551 },
  { hizb: 56, startPage: 552, endPage: 561 },
  { hizb: 57, startPage: 562, endPage: 571 },
  { hizb: 58, startPage: 572, endPage: 581 },
  { hizb: 59, startPage: 582, endPage: 591 },
  { hizb: 60, startPage: 592, endPage: 604 },
];

/**
 * Get hizb number for a given page
 */
export function getHizbForPage(pageNum) {
  for (const range of HIZB_PAGE_RANGES) {
    if (pageNum >= range.startPage && pageNum <= range.endPage) {
      return range.hizb;
    }
  }
  return 1;
}
