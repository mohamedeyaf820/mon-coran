/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HomePage â€” Design Ã©purÃ©, inspirÃ© de Quran.com
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
import React, {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "../context/AppContext";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getAllBookmarks, getAllNotes } from "../services/storageService";
import { getRecentVisits } from "../services/recentHistoryService";
import { cn } from "../lib/utils";
import audioService from "../services/audioService";
import {
  getReciter,
  ensureReciterForRiwaya,
  isWarshVerifiedReciter,
} from "../data/reciters";
import PlatformLogo from "./PlatformLogo";
import Footer from "./Footer";
import { buildSurahAudioPlaylist } from "../utils/audioPlaylist";

const HOME_INITIAL_SURAHS = SURAHS.length;
const HOME_SURAHS_BATCH = 18;
const HOME_DEFERRED_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "1px 360px",
};
const HOME_FOOTER_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "1px 280px",
};

function runWhenIdle(callback, timeout = 160) {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(
    () =>
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      }),
    timeout,
  );

  return () => window.clearTimeout(timeoutId);
}

/* â”€â”€â”€ Sourates d'accÃ¨s rapide â”€â”€â”€ */
const QUICK_ACCESS = [
  { n: 1, icon: "fa-mosque", label_fr: "Al-Fatiha", label_en: "The Opening" },
  { n: 18, icon: "fa-mountain-sun", label_fr: "Al-Kahf", label_en: "The Cave" },
  {
    n: 36,
    icon: "fa-star-and-crescent",
    label_fr: "Ya-Sin",
    label_en: "Ya-Sin",
  },
  { n: 55, icon: "fa-leaf", label_fr: "Ar-Rahman", label_en: "The Merciful" },
  { n: 67, icon: "fa-moon", label_fr: "Al-Mulk", label_en: "Sovereignty" },
  { n: 112, icon: "fa-infinity", label_fr: "Al-Ikhlas", label_en: "Sincerity" },
  { n: 113, icon: "fa-sun", label_fr: "Al-Falaq", label_en: "The Dawn" },
  { n: 114, icon: "fa-shield-halved", label_fr: "An-Nas", label_en: "Mankind" },
];

/* â”€â”€â”€ Versets du jour â€” cycle de 30 jours â”€â”€â”€ */
const DAILY_VERSES = [
  {
    text: "Ø¥ÙÙ†ÙŽÙ‘ Ù…ÙŽØ¹ÙŽ Ø§Ù„Ù’Ø¹ÙØ³Ù’Ø±Ù ÙŠÙØ³Ù’Ø±Ù‹Ø§",
    ref: "Al-Inshirah Â· 94:6",
    trans_fr: "Certes, avec la difficultÃ© vient la facilitÃ©",
  },
  {
    text: "ÙˆÙŽÙ…ÙŽÙ† ÙŠÙŽØªÙŽÙ‘Ù‚Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ ÙŠÙŽØ¬Ù’Ø¹ÙŽÙ„ Ù„ÙŽÙ‘Ù‡Ù Ù…ÙŽØ®Ù’Ø±ÙŽØ¬Ù‹Ø§",
    ref: "At-Talaq Â· 65:2",
    trans_fr: "Qui craint Allah, Il lui accordera une issue",
  },
  {
    text: "ÙˆÙŽØ§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙŠÙØ­ÙØ¨ÙÙ‘ Ø§Ù„ØµÙŽÙ‘Ø§Ø¨ÙØ±ÙÙŠÙ†ÙŽ",
    ref: "Ã‚l-ImrÃ¢n Â· 3:146",
    trans_fr: "Allah aime ceux qui font preuve de patience",
  },
  {
    text: "Ø£ÙŽÙ„ÙŽØ§ Ø¨ÙØ°ÙÙƒÙ’Ø±Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ØªÙŽØ·Ù’Ù…ÙŽØ¦ÙÙ†ÙÙ‘ Ø§Ù„Ù’Ù‚ÙÙ„ÙÙˆØ¨Ù",
    ref: "Ar-Ra'd Â· 13:28",
    trans_fr: "C'est par le rappel d'Allah que les cÅ“urs trouvent la quiÃ©tude",
  },
  {
    text: "ÙˆÙŽØªÙŽÙˆÙŽÙƒÙŽÙ‘Ù„Ù’ Ø¹ÙŽÙ„ÙŽÙ‰ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ûš ÙˆÙŽÙƒÙŽÙÙŽÙ‰Ù° Ø¨ÙØ§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙˆÙŽÙƒÙÙŠÙ„Ù‹Ø§",
    ref: "Al-Ahzab Â· 33:3",
    trans_fr: "Confie-toi Ã  Allah â€” Il suffit comme garant",
  },
  {
    text: "ÙˆÙŽÙ‚ÙÙ„ Ø±ÙŽÙ‘Ø¨ÙÙ‘ Ø²ÙØ¯Ù’Ù†ÙÙŠ Ø¹ÙÙ„Ù’Ù…Ù‹Ø§",
    ref: "Ta-Ha Â· 20:114",
    trans_fr: "Dis : Seigneur, accroÃ®s mes connaissances",
  },
  {
    text: "Ø¥ÙÙ†ÙŽÙ‘ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ Ù…ÙŽØ¹ÙŽ Ø§Ù„ØµÙŽÙ‘Ø§Ø¨ÙØ±ÙÙŠÙ†ÙŽ",
    ref: "Al-Baqara Â· 2:153",
    trans_fr: "Certes, Allah est avec ceux qui endurent",
  },
  {
    text: "ÙˆÙŽÙ‡ÙÙˆÙŽ Ù…ÙŽØ¹ÙŽÙƒÙÙ…Ù’ Ø£ÙŽÙŠÙ’Ù†ÙŽ Ù…ÙŽØ§ ÙƒÙÙ†ØªÙÙ…Ù’",
    ref: "Al-Hadid Â· 57:4",
    trans_fr: "Il est avec vous oÃ¹ que vous soyez",
  },
  {
    text: "ÙˆÙŽØ¹ÙŽØ³ÙŽÙ‰Ù° Ø£ÙŽÙ† ØªÙŽÙƒÙ’Ø±ÙŽÙ‡ÙÙˆØ§ Ø´ÙŽÙŠÙ’Ø¦Ù‹Ø§ ÙˆÙŽÙ‡ÙÙˆÙŽ Ø®ÙŽÙŠÙ’Ø±ÙŒ Ù„ÙŽÙ‘ÙƒÙÙ…Ù’",
    ref: "Al-Baqara Â· 2:216",
    trans_fr: "Il se peut que vous dÃ©testiez une chose qui est bonne pour vous",
  },
  {
    text: "Ø¥ÙÙ†ÙŽÙ‘ Ø±ÙŽØ­Ù’Ù…ÙŽØªÙŽ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ù‚ÙŽØ±ÙÙŠØ¨ÙŒ Ù…ÙÙ‘Ù†ÙŽ Ø§Ù„Ù’Ù…ÙØ­Ù’Ø³ÙÙ†ÙÙŠÙ†ÙŽ",
    ref: "Al-A'raf Â· 7:56",
    trans_fr: "La misÃ©ricorde d'Allah est proche des bienfaisants",
  },
  {
    text: "ÙˆÙŽÙ„ÙŽØ§ ØªÙŽÙŠÙ’Ø£ÙŽØ³ÙÙˆØ§ Ù…ÙÙ† Ø±ÙŽÙ‘ÙˆÙ’Ø­Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù",
    ref: "Yusuf Â· 12:87",
    trans_fr: "Ne dÃ©sespÃ©rez jamais de la grÃ¢ce d'Allah",
  },
  {
    text: "ÙÙŽÙÙØ±ÙÙ‘ÙˆØ§ Ø¥ÙÙ„ÙŽÙ‰ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù",
    ref: "Adh-Dhariyat Â· 51:50",
    trans_fr: "Fuyez donc vers Allah",
  },
  {
    text: "Ø±ÙŽØ¨ÙŽÙ‘Ù†ÙŽØ§ Ø¢ØªÙÙ†ÙŽØ§ ÙÙÙŠ Ø§Ù„Ø¯ÙÙ‘Ù†Ù’ÙŠÙŽØ§ Ø­ÙŽØ³ÙŽÙ†ÙŽØ©Ù‹ ÙˆÙŽÙÙÙŠ Ø§Ù„Ù’Ø¢Ø®ÙØ±ÙŽØ©Ù Ø­ÙŽØ³ÙŽÙ†ÙŽØ©Ù‹",
    ref: "Al-Baqara Â· 2:201",
    trans_fr:
      "Notre Seigneur, accorde-nous ce qui est bon ici-bas et dans l'au-delÃ ",
  },
  {
    text: "ÙˆÙŽÙ…ÙŽÙ† ÙŠÙŽØªÙŽÙˆÙŽÙƒÙŽÙ‘Ù„Ù’ Ø¹ÙŽÙ„ÙŽÙ‰ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙÙŽÙ‡ÙÙˆÙŽ Ø­ÙŽØ³Ù’Ø¨ÙÙ‡Ù",
    ref: "At-Talaq Â· 65:3",
    trans_fr: "Celui qui se confie en Allah, Il lui suffit",
  },
  {
    text: "Ø¥ÙÙ†ÙŽÙ‘ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ Ù„ÙŽØ·ÙÙŠÙÙŒ Ø¨ÙØ¹ÙØ¨ÙŽØ§Ø¯ÙÙ‡Ù",
    ref: "Ash-Shura Â· 42:19",
    trans_fr: "Allah est plein de mansuÃ©tude envers Ses serviteurs",
  },
  {
    text: "ÙˆÙŽØ§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙŠÙŽØ¹Ù’Ù„ÙŽÙ…Ù ÙˆÙŽØ£ÙŽÙ†ØªÙÙ…Ù’ Ù„ÙŽØ§ ØªÙŽØ¹Ù’Ù„ÙŽÙ…ÙÙˆÙ†ÙŽ",
    ref: "Al-Baqara Â· 2:232",
    trans_fr: "Allah sait et vous ne savez pas",
  },
  {
    text: "ÙˆÙŽÙ…ÙŽØ§ Ø¹ÙÙ†Ø¯ÙŽ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø®ÙŽÙŠÙ’Ø±ÙŒ ÙˆÙŽØ£ÙŽØ¨Ù’Ù‚ÙŽÙ‰Ù°",
    ref: "Ash-Shura Â· 42:36",
    trans_fr: "Ce qui est auprÃ¨s d'Allah est meilleur et plus durable",
  },
  {
    text: "Ø±ÙŽØ¨ÙÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ù„ÙÙ…ÙŽØ§ Ø£ÙŽÙ†Ø²ÙŽÙ„Ù’ØªÙŽ Ø¥ÙÙ„ÙŽÙŠÙŽÙ‘ Ù…ÙÙ†Ù’ Ø®ÙŽÙŠÙ’Ø±Ù ÙÙŽÙ‚ÙÙŠØ±ÙŒ",
    ref: "Al-Qasas Â· 28:24",
    trans_fr:
      "Seigneur, j'ai grand besoin du bien que Tu fais descendre sur moi",
  },
  {
    text: "ÙˆÙŽØ°ÙŽÙƒÙÙ‘Ø±Ù’ ÙÙŽØ¥ÙÙ†ÙŽÙ‘ Ø§Ù„Ø°ÙÙ‘ÙƒÙ’Ø±ÙŽÙ‰Ù° ØªÙŽÙ†ÙÙŽØ¹Ù Ø§Ù„Ù’Ù…ÙØ¤Ù’Ù…ÙÙ†ÙÙŠÙ†ÙŽ",
    ref: "Adh-Dhariyat Â· 51:55",
    trans_fr: "Rappelle, car le rappel profite aux croyants",
  },
  {
    text: "ÙÙŽØ¥ÙÙ†ÙŽÙ‘ Ù…ÙŽØ¹ÙŽ Ø§Ù„Ù’Ø¹ÙØ³Ù’Ø±Ù ÙŠÙØ³Ù’Ø±Ù‹Ø§",
    ref: "Al-Inshirah Â· 94:5",
    trans_fr: "En vÃ©ritÃ©, avec la difficultÃ© vient la facilitÃ©",
  },
  {
    text: "Ø¥ÙÙ† ØªÙŽÙ†ØµÙØ±ÙÙˆØ§ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ ÙŠÙŽÙ†ØµÙØ±Ù’ÙƒÙÙ…Ù’",
    ref: "Muhammad Â· 47:7",
    trans_fr:
      "Si vous dÃ©fendez la cause d'Allah, Il vous accordera Sa victoire",
  },
  {
    text: "ÙˆÙŽØªÙŽØ²ÙŽÙˆÙŽÙ‘Ø¯ÙÙˆØ§ ÙÙŽØ¥ÙÙ†ÙŽÙ‘ Ø®ÙŽÙŠÙ’Ø±ÙŽ Ø§Ù„Ø²ÙŽÙ‘Ø§Ø¯Ù Ø§Ù„ØªÙŽÙ‘Ù‚Ù’ÙˆÙŽÙ‰Ù°",
    ref: "Al-Baqara Â· 2:197",
    trans_fr: "Prenez des provisions â€” la meilleure provision est la piÃ©tÃ©",
  },
  {
    text: "ÙˆÙŽØ§ØªÙŽÙ‘Ù‚ÙÙˆØ§ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ ÙˆÙŽÙŠÙØ¹ÙŽÙ„ÙÙ‘Ù…ÙÙƒÙÙ…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù",
    ref: "Al-Baqara Â· 2:282",
    trans_fr: "Craignez Allah, et Allah vous enseignera",
  },
  {
    text: "Ø§Ù„ÙŽÙ‘Ø°ÙÙŠÙ†ÙŽ ÙŠÙŽØ°Ù’ÙƒÙØ±ÙÙˆÙ†ÙŽ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙŽ Ù‚ÙÙŠÙŽØ§Ù…Ù‹Ø§ ÙˆÙŽÙ‚ÙØ¹ÙÙˆØ¯Ù‹Ø§ ÙˆÙŽØ¹ÙŽÙ„ÙŽÙ‰Ù° Ø¬ÙÙ†ÙÙˆØ¨ÙÙ‡ÙÙ…Ù’",
    ref: "Ã‚l-ImrÃ¢n Â· 3:191",
    trans_fr: "Ceux qui invoquent Allah debout, assis et couchÃ©s sur le cÃ´tÃ©",
  },
  {
    text: "ÙˆÙŽØ§Ù„Ø³ÙŽÙ‘Ù„ÙŽØ§Ù…Ù Ø¹ÙŽÙ„ÙŽÙ‰Ù° Ù…ÙŽÙ†Ù Ø§ØªÙŽÙ‘Ø¨ÙŽØ¹ÙŽ Ø§Ù„Ù’Ù‡ÙØ¯ÙŽÙ‰Ù°",
    ref: "Ta-Ha Â· 20:47",
    trans_fr: "Et la paix soit sur celui qui suit le droit chemin",
  },
  {
    text: "Ø³ÙŽÙ†ÙØ±ÙÙŠÙ‡ÙÙ…Ù’ Ø¢ÙŠÙŽØ§ØªÙÙ†ÙŽØ§ ÙÙÙŠ Ø§Ù„Ù’Ø¢ÙÙŽØ§Ù‚Ù ÙˆÙŽÙÙÙŠ Ø£ÙŽÙ†ÙÙØ³ÙÙ‡ÙÙ…Ù’",
    ref: "Fussilat Â· 41:53",
    trans_fr: "Nous leur montrerons Nos signes dans l'univers et en eux-mÃªmes",
  },
  {
    text: "ÙˆÙŽÙ„ÙŽÙ‚ÙŽØ¯Ù’ ÙŠÙŽØ³ÙŽÙ‘Ø±Ù’Ù†ÙŽØ§ Ø§Ù„Ù’Ù‚ÙØ±Ù’Ø¢Ù†ÙŽ Ù„ÙÙ„Ø°ÙÙ‘ÙƒÙ’Ø±Ù ÙÙŽÙ‡ÙŽÙ„Ù’ Ù…ÙÙ† Ù…ÙÙ‘Ø¯ÙŽÙ‘ÙƒÙØ±Ù",
    ref: "Al-Qamar Â· 54:17",
    trans_fr:
      "Nous avons facilitÃ© le Coran â€” y a-t-il des gens pour rÃ©flÃ©chir ?",
  },
  {
    text: "Ù‚ÙÙ„Ù’ Ù‡ÙÙˆÙŽ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø£ÙŽØ­ÙŽØ¯ÙŒ",
    ref: "Al-Ikhlas Â· 112:1",
    trans_fr: "Dis : Il est Allah, Unique",
  },
  {
    text: "ÙˆÙŽÙ„ÙŽÙ‚ÙŽØ¯Ù’ ÙƒÙŽØ±ÙŽÙ‘Ù…Ù’Ù†ÙŽØ§ Ø¨ÙŽÙ†ÙÙŠ Ø¢Ø¯ÙŽÙ…ÙŽ",
    ref: "Al-Isra Â· 17:70",
    trans_fr: "Nous avons certes accordÃ© de la dignitÃ© aux fils d'Adam",
  },
  {
    text: "Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø§Ù„Ø±ÙŽÙ‘Ø­Ù’Ù…ÙŽÙ°Ù†Ù Ø§Ù„Ø±ÙŽÙ‘Ø­ÙÙŠÙ…Ù",
    ref: "Al-Fatiha Â· 1:1",
    trans_fr: "Au nom d'Allah, le Tout MisÃ©ricordieux, le TrÃ¨s MisÃ©ricordieux",
  },
];

/* Retourne l'index du verset selon le jour de l'annÃ©e (change Ã  minuit) */
function getDailyVerseIndex(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return dayOfYear % DAILY_VERSES.length;
}

/* â”€â”€â”€ Suggestions contextuelles selon heure / jour de la semaine â”€â”€â”€ */
function getSuggestedSurahs(date = new Date()) {
  const h = date.getHours();
  const day = date.getDay(); // 0=Dim, 5=Ven

  if (day === 5)
    return {
      period: {
        fr: "Sunna du vendredi",
        en: "Friday Sunnah",
        ar: "Ø³Ù†Ø© Ø§Ù„Ø¬Ù…Ø¹Ø©",
      },
      icon: "fa-star-and-crescent",
      surahs: [
        {
          n: 18,
          fr: "â€¢ Sunna du vendredi",
          en: "â€¢ Friday Sunnah",
          ar: "Ø³Ù†Ø© Ø§Ù„Ø¬Ù…Ø¹Ø©",
        },
        { n: 1, fr: "L'Ouverture", en: "The Opening", ar: "Ø§Ù„ÙØ§ØªØ­Ø©" },
        { n: 36, fr: "CÅ“ur du Coran", en: "Heart of Quran", ar: "Ù‚Ù„Ø¨ Ø§Ù„Ù‚Ø±Ø¢Ù†" },
        { n: 55, fr: "Ar-Rahman", en: "The Merciful", ar: "Ø§Ù„Ø±Ø­Ù…Ù†" },
        { n: 67, fr: "Al-Mulk", en: "Sovereignty", ar: "Ø§Ù„Ù…Ù„Ùƒ" },
      ],
    };

  if (h >= 4 && h < 12)
    return {
      period: {
        fr: "Lecture du matin",
        en: "Morning Reading",
        ar: "ÙˆØ±Ø¯ Ø§Ù„ØµØ¨Ø§Ø­",
      },
      icon: "fa-sun",
      surahs: [
        { n: 1, fr: "L'Ouverture", en: "The Opening", ar: "Ø§Ù„ÙØ§ØªØ­Ø©" },
        { n: 112, fr: "SincÃ©ritÃ© pure", en: "Pure Sincerity", ar: "Ø§Ù„Ø¥Ø®Ù„Ø§Øµ" },
        { n: 113, fr: "Protection de l'aube", en: "Dawn Guard", ar: "Ø§Ù„ÙÙ„Ù‚" },
        { n: 114, fr: "Protection du mal", en: "Against Evil", ar: "Ø§Ù„Ù†Ø§Ø³" },
        { n: 36, fr: "CÅ“ur du Coran", en: "Heart of Quran", ar: "Ù‚Ù„Ø¨ Ø§Ù„Ù‚Ø±Ø¢Ù†" },
      ],
    };

  if (h >= 12 && h < 17)
    return {
      period: {
        fr: "Lecture du midi",
        en: "Midday Reading",
        ar: "Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø¸Ù‡Ø±",
      },
      icon: "fa-cloud-sun",
      surahs: [
        {
          n: 55,
          fr: "Ar-Rahman â€” La GrÃ¢ce",
          en: "Ar-Rahman â€” Grace",
          ar: "Ø§Ù„Ø±Ø­Ù…Ù†",
        },
        { n: 25, fr: "Le CritÃ¨re", en: "The Criterion", ar: "Ø§Ù„ÙØ±Ù‚Ø§Ù†" },
        { n: 18, fr: "Al-Kahf", en: "The Cave", ar: "Ø§Ù„ÙƒÙ‡Ù" },
        { n: 56, fr: "L'Ã‰vÃ©nement", en: "The Event", ar: "Ø§Ù„ÙˆØ§Ù‚Ø¹Ø©" },
        { n: 2, fr: "Al-Baqara", en: "The Cow", ar: "Ø§Ù„Ø¨Ù‚Ø±Ø©" },
      ],
    };

  if (h >= 17 && h < 21)
    return {
      period: {
        fr: "Lecture du soir",
        en: "Evening Reading",
        ar: "ÙˆØ±Ø¯ Ø§Ù„Ù…Ø³Ø§Ø¡",
      },
      icon: "fa-cloud-moon",
      surahs: [
        { n: 36, fr: "CÅ“ur du Coran", en: "Heart of Quran", ar: "Ù‚Ù„Ø¨ Ø§Ù„Ù‚Ø±Ø¢Ù†" },
        { n: 67, fr: "Rappel du soir", en: "Evening Reminder", ar: "Ø§Ù„Ù…Ù„Ùƒ" },
        { n: 55, fr: "Ar-Rahman", en: "The Merciful", ar: "Ø§Ù„Ø±Ø­Ù…Ù†" },
        { n: 59, fr: "Al-Hashr", en: "The Gathering", ar: "Ø§Ù„Ø­Ø´Ø±" },
        { n: 103, fr: "Le Temps", en: "Time", ar: "Ø§Ù„Ø¹ØµØ±" },
      ],
    };

  return {
    period: { fr: "Lecture de nuit", en: "Night Reading", ar: "ÙˆØ±Ø¯ Ø§Ù„Ù„ÙŠÙ„" },
    icon: "fa-moon",
    surahs: [
      {
        n: 67,
        fr: "Al-Mulk â€” Avant le sommeil",
        en: "Al-Mulk â€” Before Sleep",
        ar: "Ø§Ù„Ù…Ù„Ùƒ",
      },
      { n: 32, fr: "As-Sajda", en: "The Prostration", ar: "Ø§Ù„Ø³Ø¬Ø¯Ø©" },
      { n: 36, fr: "Ya-Sin du soir", en: "Ya-Sin at Night", ar: "ÙŠØ³" },
      { n: 112, fr: "Al-Ikhlas", en: "Sincerity", ar: "Ø§Ù„Ø¥Ø®Ù„Ø§Øµ" },
      { n: 113, fr: "Al-Falaq", en: "The Dawn", ar: "Ø§Ù„ÙÙ„Ù‚" },
    ],
  };
}

/*  Type info  */
const TYPE_INFO = {
  Meccan: { fr: "Mecquoise", en: "Meccan", ar: "Ù…ÙƒÙŠØ©" },
  Medinan: { fr: "MÃ©dinoise", en: "Medinan", ar: "Ù…Ø¯Ù†ÙŠØ©" },
};

function PercentBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="block h-full w-full">
      <defs>
        <linearGradient id="home-progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="8" rx="4" className="fill-black/5 dark:fill-white/10" />
      <rect x="0" y="0" width={pct} height="8" rx="4" fill="url(#home-progress-gradient)" />
    </svg>
  );
}

/*  Carte sourate (grille)  */
const SurahCard = memo(function SurahCard({
  surah,
  onClick,
  onPlay,
  isActive,
  lang,
  isPlaying,
  viewMode,
  animIndex = 0,
}) {
  const typeInfo = TYPE_INFO[surah.type] || {};
  const typeLabel =
    typeInfo[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] || surah.type;
  const displayName = surah.en || surah.fr || surah.ar;
  const subLabel =
    lang === "fr"
      ? surah.fr || typeLabel
      : lang === "ar"
        ? typeLabel
        : surah.fr || typeLabel;
  const ayahLabel = `${surah.ayahs} ${lang === "ar" ? "Ø¢ÙŠØ©" : "Ayat"}`;
  const pageLabel =
    surah.page &&
    (lang === "ar"
      ? `ØµÙØ­Ø© ${surah.page}`
      : lang === "fr"
        ? `Page ${surah.page}`
        : `Page ${surah.page}`);

  /* â”€â”€ LIST ROW (unchanged) â”€â”€ */
  if (viewMode === "list") {
    const rowVisibilityStyle = {
      contentVisibility: "auto",
      containIntrinsicSize: "82px",
    };

    return (
      <button
        className={cn(
          "hpl-row !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.003]",
          isActive && "hpl-row--active",
        )}
        data-stype={surah.type?.toLowerCase()}
        onClick={() => onClick(surah.n)}
        style={rowVisibilityStyle}
      >
        <span className={cn("hpl-row__num", isActive && "hpl-row__num--on")}>
          {surah.n}
        </span>
        <div className="hpl-row__body">
          <span className="hpl-row__name">{displayName}</span>
          <span className="hpl-row__sub">{subLabel}</span>
          <span className="hpl-row__meta">
            <span className={`hpl-dot hpl-dot--${surah.type?.toLowerCase()}`} />
            {typeLabel} Â· {ayahLabel}
            {pageLabel ? ` Â· ${pageLabel}` : ""}
          </span>
        </div>
        <span className="hpl-row__ar" dir="rtl" lang="ar">
          {surah.ar}
        </span>
        <button
          className={cn(
            "hpl-row__play !transition-all !duration-300 hover:!scale-110",
            isPlaying && "hpl-row__play--on motion-safe:animate-pulse",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(surah.n);
          }}
          aria-label="Ã‰couter"
        >
          <i className={`fas fa-${isPlaying ? "pause" : "play"}`} />
        </button>
      </button>
    );
  }

  /* â”€â”€ GRID CARD â€” reference-style layout â”€â”€ */
  const cardVisibilityStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "164px",
  };

  return (
    <button
      className={cn(
        "scard !relative !overflow-hidden !transition-all !duration-300 hover:!-translate-y-1 hover:!scale-[1.01]",
        isActive && "scard--active",
        isPlaying && "scard--playing",
      )}
      data-stype={surah.type?.toLowerCase()}
      onClick={() => onClick(surah.n)}
      style={cardVisibilityStyle}
    >
      {/* Left: number badge */}
      <span className={cn("scard__num", isActive && "scard__num--on")}>
        {surah.n}
      </span>

      {/* Centre: transliteration + meaning + ayat */}
      <div className="scard__body">
        <span className="scard__name">{displayName}</span>
        <span className="scard__trans">{subLabel}</span>
        <span className="scard__meta">
          <span
            className={`scard__dot scard__dot--${surah.type?.toLowerCase()}`}
            aria-hidden="true"
          >
            {surah.type === "Meccan" ? "â–²" : "â– "}
          </span>
          {typeLabel} Â· {ayahLabel}
        </span>
      </div>

      {/* Right: Arabic calligraphy */}
      <span className="scard__ar" dir="rtl" lang="ar">
        {surah.ar}
      </span>

      {/* Play button (absolute bottom-right) */}
      <button
        className={cn(
          "scard__play !transition-all !duration-300 hover:!scale-110",
          isPlaying && "scard__play--on motion-safe:animate-pulse",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onPlay(surah.n);
        }}
        aria-label="Ã‰couter"
      >
        <i className={`fas fa-${isPlaying ? "pause" : "play"}`} />
      </button>
    </button>
  );
});

/* â”€â”€â”€ Carte juz â”€â”€â”€ */
const JuzCard = memo(function JuzCard({
  juzData,
  onClick,
  isActive,
  lang,
  viewMode,
  animIndex = 0,
}) {
  const { juz, name } = juzData;
  if (viewMode === "list") {
    const rowVisibilityStyle = {
      contentVisibility: "auto",
      containIntrinsicSize: "80px",
    };

    return (
      <button
        className={cn(
          "hpl-row !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.003]",
          isActive && "hpl-row--active",
        )}
        onClick={() => onClick(juz)}
        style={rowVisibilityStyle}
      >
        <span className={cn("hpl-row__num", isActive && "hpl-row__num--on")}>
          {juz}
        </span>
        <div className="hpl-row__body">
          <span className="hpl-row__name">Juz {juz}</span>
          <span className="hpl-row__meta">{name}</span>
        </div>
      </button>
    );
  }
  const cardVisibilityStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "120px",
  };

  return (
    <button
      className={cn(
          "hpq-card hpq-card--juz !transition-all !duration-300 hover:!-translate-y-1 hover:!scale-[1.01]",
          isActive && "hpq-card--active",
      )}
      onClick={() => onClick(juz)}
      style={cardVisibilityStyle}
    >
      <span className={cn("hpq-card__num", isActive && "hpq-card__num--on")}>
        {juz}
      </span>
      <div className="hpq-card__info">
        <span className="hpq-card__name">Juz {juz}</span>
        <span className="hpq-card__meta">{name}</span>
      </div>
    </button>
  );
});

/* â”€â”€â”€ Ã‰tat vide â”€â”€â”€ */
function EmptyState({ icon, text }) {
  return (
    <div className="hp2-empty">
      <i className={`fas ${icon}`} />
      <p>{text}</p>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HomePage principale
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function HomePage() {
  const { state, dispatch, set } = useApp();
  const {
    lang,
    currentSurah,
    currentAyah,
    currentJuz,
    displayMode,
    riwaya,
  } = state;
  const isRtl = lang === "ar";

  const [activeTab, setActiveTab] = useState("surah");
  const [activeInfo, setActiveInfo] = useState("bookmarks");
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [now, setNow] = useState(() => new Date());
  const [recentVisits, setRecentVisits] = useState([]);
  const [visibleSurahCount, setVisibleSurahCount] = useState(HOME_INITIAL_SURAHS);
  const deferredFilter = useDeferredValue(filter);
  const loadMoreRef = useRef(null);

  // Historique rÃ©el = l'utilisateur a dÃ©jÃ  naviguÃ© au-delÃ  de Al-Fatiha v.1
  const hasReadingHistory =
    currentSurah > 1 || (currentSurah === 1 && currentAyah > 1);

  useEffect(() => {
    startTransition(() => {
      setActiveTab(displayMode === "juz" ? "juz" : "surah");
    });
  }, [displayMode]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    let cancelled = false;

    const cancelIdleLoad = runWhenIdle(async () => {
      const nextRecentVisits = getRecentVisits();

      try {
        const [bks, ns] = await Promise.all([getAllBookmarks(), getAllNotes()]);
        if (cancelled) return;

        startTransition(() => {
          setRecentVisits(nextRecentVisits);
          setBookmarks((bks || []).sort((a, b) => b.createdAt - a.createdAt));
          setNotes((ns || []).sort((a, b) => b.updatedAt - a.updatedAt));
        });
      } catch {
        if (cancelled) return;
        startTransition(() => {
          setRecentVisits(nextRecentVisits);
        });
      }
    });

    return () => {
      cancelled = true;
      cancelIdleLoad();
    };
  }, []);

  const playFromHome = useCallback(
    (surahNum) => {
      const safeId = ensureReciterForRiwaya(state.reciter, state.riwaya);
      const rec = getReciter(safeId, state.riwaya);
      if (!rec) return;
      if (
        state.riwaya === "warsh" &&
        state.warshStrictMode &&
        !isWarshVerifiedReciter(rec)
      )
        return;
      const items = buildSurahAudioPlaylist(surahNum);
      if (items.length === 0) return;
      set({
        displayMode: "surah",
        currentSurah: surahNum,
        currentAyah: 1,
      });
      audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
      audioService.play();
    },
    [state.reciter, state.riwaya, state.warshStrictMode, set],
  );

  const goSurah = useCallback(
    (n) => {
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
    },
    [set, dispatch],
  );

  const goSurahAyah = useCallback(
    (surah, ayah) => {
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: ayah || 1 } });
    },
    [set, dispatch],
  );

  const goJuz = useCallback(
    (juz) => {
      set({ showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
    },
    [set, dispatch],
  );

  const continueReading = useCallback(() => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "juz")
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    else
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah, ayah: currentAyah },
      });
  }, [set, dispatch, displayMode, currentJuz, currentSurah, currentAyah]);

  const openDuas = useCallback(
    () => set({ showHome: false, showDuas: true }),
    [set],
  );

  const selectInfoTab = useCallback((tabId) => {
    startTransition(() => {
      setActiveInfo(tabId);
    });
  }, []);

  const selectContentTab = useCallback((tabId) => {
    startTransition(() => {
      setActiveTab(tabId);
    });
  }, []);

  const changeViewMode = useCallback((nextViewMode) => {
    startTransition(() => {
      setViewMode(nextViewMode);
    });
  }, []);

  const toggleSortDirection = useCallback(() => {
    startTransition(() => {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    });
  }, []);

  const trimmedDeferredFilter = deferredFilter.trim();
  const normalizedDeferredFilter = trimmedDeferredFilter.toLowerCase();
  const hasSurahFilter = normalizedDeferredFilter.length > 0;

  const filteredSurahs = useMemo(() => {
    const source = !trimmedDeferredFilter ? [...SURAHS]
      : SURAHS.filter(
          (s) =>
            s.ar.includes(trimmedDeferredFilter) ||
            s.en.toLowerCase().includes(normalizedDeferredFilter) ||
            s.fr.toLowerCase().includes(normalizedDeferredFilter) ||
            String(s.n) === trimmedDeferredFilter,
        );
    source.sort((a, b) => (sortDir === "asc" ? a.n - b.n : b.n - a.n));
    return source;
  }, [normalizedDeferredFilter, sortDir, trimmedDeferredFilter]);

  const renderedSurahs = useMemo(
    () =>
      hasSurahFilter
        ? filteredSurahs
        : filteredSurahs.slice(0, visibleSurahCount),
    [filteredSurahs, hasSurahFilter, visibleSurahCount],
  );

  const hasMoreSurahs =
    activeTab === "surah" &&
    !hasSurahFilter &&
    visibleSurahCount < filteredSurahs.length;

  const loadMoreSurahs = useCallback(() => {
    startTransition(() => {
      setVisibleSurahCount((count) =>
        Math.min(count + HOME_SURAHS_BATCH, filteredSurahs.length),
      );
    });
  }, [filteredSurahs.length]);

  useEffect(() => {
    setVisibleSurahCount(HOME_INITIAL_SURAHS);
  }, [activeTab, normalizedDeferredFilter, sortDir]);

  useEffect(() => {
    if (!hasMoreSurahs) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        loadMoreSurahs();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreSurahs, loadMoreSurahs]);

  const dailyVerse = useMemo(
    () => DAILY_VERSES[getDailyVerseIndex(now)],
    [now],
  );
  const suggestionSet = useMemo(() => getSuggestedSurahs(now), [now]);
  const surahLabel = SURAHS[currentSurah - 1];
  const progressPct = Math.round(((Math.max(1, currentSurah) - 1) / 113) * 100);

  const riwayaLabel =
    riwaya === "warsh"
      ? lang === "fr"
        ? "RiwÄya Warsh"
        : lang === "ar"
          ? "Ø±ÙˆØ§ÙŠØ© ÙˆØ±Ø´"
          : "Warsh"
      : lang === "fr"
        ? "RiwÄya á¸¤afs"
        : lang === "ar"
          ? "Ø±ÙˆØ§ÙŠØ© Ø­ÙØµ"
          : "Hafs";

  const readingModeLabel =
    displayMode === "juz"
      ? lang === "fr"
        ? "Mode Juz"
        : lang === "ar"
          ? "ÙˆØ¶Ø¹ Ø§Ù„Ø¬Ø²Ø¡"
          : "Juz mode"
      : displayMode === "page"
        ? lang === "fr"
          ? "Mode Page"
          : lang === "ar"
            ? "ÙˆØ¶Ø¹ Ø§Ù„ØµÙØ­Ø©"
            : "Page mode"
        : lang === "fr"
          ? "Mode Sourate"
          : lang === "ar"
            ? "ÙˆØ¶Ø¹ Ø§Ù„Ø³ÙˆØ±Ø©"
            : "Surah mode";

  const readingTarget =
    displayMode === "juz"
      ? lang === "ar"
        ? `Ø§Ù„Ø¬Ø²Ø¡ ${toAr(currentJuz)}`
        : `Juz ${currentJuz}`
      : displayMode === "page"
        ? lang === "ar"
          ? `ØµÙØ­Ø© ${toAr(state.currentPage || 1)}`
          : `${lang === "fr" ? "Page" : "Page"} ${state.currentPage || 1}`
        : lang === "ar"
          ? `${surahLabel?.ar || "Ø§Ù„ÙØ§ØªØ­Ø©"} Â· ${toAr(currentAyah)}`
          : `${lang === "fr" ? surahLabel?.fr : surahLabel?.en} Â· v.${currentAyah}`;

  const quickResumeLabel = hasReadingHistory
    ? lang === "fr"
      ? "Reprendre la session"
      : lang === "ar"
        ? "Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¬Ù„Ø³Ø©"
        : "Resume session"
    : lang === "fr"
      ? "DÃ©marrer une lecture"
      : lang === "ar"
        ? "Ø§Ø¨Ø¯Ø£ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©"
        : "Start reading";

  const currentYear = now.getFullYear();

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 12)
      return { fr: "Bonjour", en: "Good morning", ar: "ØµØ¨Ø§Ø­ Ø§Ù„Ø®ÙŠØ±" };
    if (h >= 12 && h < 17)
      return { fr: "Bon aprÃ¨s-midi", en: "Good afternoon", ar: "Ù…Ø³Ø§Ø¡ Ø§Ù„Ù†Ù‡Ø§Ø±" };
    if (h >= 17 && h < 22)
      return { fr: "Bonsoir", en: "Good evening", ar: "Ù…Ø³Ø§Ø¡ Ø§Ù„Ø®ÙŠØ±" };
    return { fr: "Bonne nuit", en: "Good night", ar: "Ø·Ø§Ø¨ Ù„ÙŠÙ„ÙƒÙ…" };
  }, [now]);

  const currentPrayer = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 7)
      return { icon: "fa-star", fr: "Fajr", ar: "Ø§Ù„ÙØ¬Ø±", en: "Fajr" };
    if (h >= 7 && h < 12)
      return { icon: "fa-sun", fr: "DuhÄ", ar: "Ø§Ù„Ø¶Ø­Ù‰", en: "DuhÄ" };
    if (h >= 12 && h < 15)
      return { icon: "fa-sun", fr: "Dhuhr", ar: "Ø§Ù„Ø¸Ù‡Ø±", en: "Dhuhr" };
    if (h >= 15 && h < 18)
      return { icon: "fa-cloud-sun", fr: "Asr", ar: "Ø§Ù„Ø¹ØµØ±", en: "Asr" };
    if (h >= 18 && h < 20)
      return {
        icon: "fa-cloud-moon",
        fr: "Maghrib",
        ar: "Ø§Ù„Ù…ØºØ±Ø¨",
        en: "Maghrib",
      };
    return { icon: "fa-moon", fr: "IshÄ", ar: "Ø§Ù„Ø¹Ø´Ø§Ø¡", en: "IshÄ" };
  }, [now]);

  const vodSurahNum = useMemo(() => {
    // Handles formats: "2:255", "Al-Baqarah 2:255", "Ø§Ù„Ø¨Ù‚Ø±Ø© â€” 2:255", "49:13"
    const match = dailyVerse.ref.match(/(\d{1,3}):\d+/);
    return match ? parseInt(match[1], 10) : null;
  }, [dailyVerse]);

  const T = {
    continueReading: { fr: "Continuer", en: "Continue", ar: "Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©" },
    startFatiha: { fr: "Al-Fatiha", en: "Al-Fatihah", ar: "Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©" },
    duas: { fr: "Douas", en: "Duas", ar: "Ø§Ù„Ø£Ø¯Ø¹ÙŠØ©" },
    surahs: { fr: "Sourates", en: "Surahs", ar: "Ø§Ù„Ø³ÙˆØ±" },
    juz: { fr: "Juz", en: "Juz", ar: "Ø§Ù„Ø£Ø¬Ø²Ø§Ø¡" },
    search: {
      fr: "Rechercher une sourateâ€¦",
      en: "Search a surahâ€¦",
      ar: "Ø§Ø¨Ø­Ø« Ø¹Ù† Ø³ÙˆØ±Ø©â€¦",
    },
    verseOfDay: {
      fr: "Verset du jour",
      en: "Verse of the Day",
      ar: "Ø¢ÙŠØ© Ø§Ù„ÙŠÙˆÙ…",
    },
    quickAccess: { fr: "AccÃ¨s rapide", en: "Quick Access", ar: "ÙˆØµÙˆÙ„ Ø³Ø±ÙŠØ¹" },
    noBookmarks: {
      fr: "Aucun favori â€” appuyez â˜…",
      en: "No bookmarks yet",
      ar: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø´Ø§Ø±Ø§Øª",
    },
    noNotes: {
      fr: "Aucune note encore",
      en: "No notes yet",
      ar: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù„Ø§Ø­Ø¸Ø§Øª",
    },
    noResults: {
      fr: "Aucune sourate trouvÃ©e",
      en: "No surah found",
      ar: "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ±",
    },
    bookmarks: { fr: "Favoris", en: "Saved", ar: "Ø§Ù„Ù…ÙØ¶Ù„Ø©" },
    notes: { fr: "Notes", en: "Notes", ar: "Ù…Ù„Ø§Ø­Ø¸Ø§Øª" },
    suggest: { fr: "Suggestions", en: "Suggest", ar: "Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª" },
  };
  const t = (k) =>
    T[k]?.[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] ?? k;

  const infoTabs = [
    {
      id: "bookmarks",
      icon: "fa-bookmark",
      label: t("bookmarks"),
      count: bookmarks.length,
    },
    {
      id: "notes",
      icon: "fa-pen-line",
      label: t("notes"),
      count: notes.length,
    },
    {
      id: "suggest",
      icon: "fa-lightbulb",
      label: t("suggest"),
      count: suggestionSet.surahs.length,
    },
  ];
  const useSurahGridScroll = activeTab === "surah" && viewMode === "grid";

  return (
    <div className="hp2 hp2--platform !relative !overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-28 left-[6%] h-72 w-72 rounded-full blur-[110px] motion-safe:animate-pulse [animation-duration:8s]" />
        <div className="absolute top-[18%] -right-28 h-80 w-80 rounded-full blur-[120px] motion-safe:animate-pulse [animation-duration:11s]" />
        <div className="absolute -bottom-32 left-[30%] h-96 w-96 rounded-full blur-[130px] motion-safe:animate-pulse [animation-duration:9s]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.17)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>
      {/* â•â•â•â• HERO â•â•â•â• */}
      <section className="hp2-hero !relative !z-10 !overflow-hidden !rounded-[28px]">
        <div className="pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-12 right-[14%] h-28 w-28 rounded-full border border-white/15 opacity-35 motion-safe:animate-spin [animation-duration:16s]" />
        <div className="pointer-events-none absolute -bottom-14 left-[44%] h-36 w-36 rounded-full border opacity-30 motion-safe:animate-spin [animation-direction:reverse] [animation-duration:22s]" />
        {/* Orbs dÃ©coratifs */}
        <div className="hp2-hero__orb hp2-hero__orb--1 !opacity-65 motion-safe:animate-pulse [animation-duration:9s]" aria-hidden="true" />
        <div className="hp2-hero__orb hp2-hero__orb--2 !opacity-60 motion-safe:animate-pulse [animation-duration:12s]" aria-hidden="true" />
        <div className="hp2-hero__orb hp2-hero__orb--3 !opacity-55 motion-safe:animate-pulse [animation-duration:10s]" aria-hidden="true" />

        <div className="hp2-hero__inner !relative !z-10">
          {/* â”€â”€ Gauche â”€â”€ */}
          <div className="hp2-hero__left">
            {/* Salutation + date */}
            <div className="hp2-hero__top-row !items-center !gap-3">
              <div className="hp2-hero__greeting !inline-flex !items-center !gap-2 !rounded-full !px-3 !py-1.5 !text-[0.71rem] !font-semibold !uppercase !tracking-[0.12em]">
                <i className={`fas ${currentPrayer.icon}`} />
                <span>
                  {greeting[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                </span>
              </div>
              <span className="hp2-hero__date-pill !rounded-full !px-3 !py-1.5 !text-[0.72rem] !font-medium !backdrop-blur-sm">
                {now.toLocaleDateString(
                  lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                  { weekday: "short", day: "numeric", month: "short" },
                )}
              </span>
            </div>

            {/* Titre principal avec bismallah intÃ©grÃ©e */}
            <div className="hp2-hero__headline">
              <div className="hp2-hero__bismallah" aria-hidden="true" dir="rtl">
                ï·½
              </div>
              <div className="hp2-hero__brand !items-center !gap-4">
                <PlatformLogo
                  className="hp2-hero__logo !h-[84px] !w-[84px] !rounded-3xl"
                  imgClassName="hp2-hero__logo-img !h-[62px] !w-[62px]"
                  decorative
                />
                <div className="hp2-hero__brand-text">
                  <h1 className="hp2-hero__title !text-[clamp(1.95rem,3vw,2.5rem)] !font-black !tracking-tight">
                    MushafPlus
                  </h1>
                  <div className="hp2-hero__badges-row !mt-2 !flex !flex-wrap !gap-2">
                    <span className="hp2-hero__badge hp2-hero__badge--riwaya !rounded-full !px-3 !py-1 !text-[0.74rem] !font-semibold !backdrop-blur-sm">
                      <i className="fas fa-feather-pointed" />
                      {riwayaLabel}
                    </span>
                    <span className="hp2-hero__badge hp2-hero__badge--prayer !rounded-full !px-3 !py-1 !text-[0.74rem] !font-semibold !backdrop-blur-sm">
                      <i className={`fas ${currentPrayer.icon}`} />
                      {
                        currentPrayer[
                          lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"
                        ]
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="hp2-hero__tagline !mt-3 !max-w-[62ch] !text-[0.98rem] !leading-relaxed">
              {lang === "ar"
                ? "Ø§Ù‚Ø±Ø£ Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ… ÙˆØªØ¯Ø¨ÙŽÙ‘Ø± Ù…Ø¹Ø§Ù†ÙŠÙ‡ ÙÙŠ Ù…Ø³Ø§Ø­Ø© Ø£ÙƒØ«Ø± Ø³ÙƒÙŠÙ†Ø©"
                : lang === "fr"
                  ? "Lisez, mÃ©ditez, mÃ©morisez â€” La Parole d'Allah dans toute sa beautÃ©"
                  : "Read, reflect and memorize the Holy Quran in beauty"}
            </p>

            {/* CTAs */}
            <div className="hp2-hero__ctas mt-5! flex! flex-wrap! gap-3">
              {hasReadingHistory ? (
                <button
                  className="hp2-btn hp2-btn--primary h-12! rounded-2xl! px-5! transition-all! duration-300! hover:-translate-y-0.5! hover:scale-[1.01]"
                  onClick={continueReading}
                >
                  <i className="fas fa-circle-play" />
                  <span>{t("continueReading")}</span>
                  {surahLabel && (
                    <span className="hp2-btn__chip">{surahLabel.ar}</span>
                  )}
                </button>
              ) : (
                <button
                  className="hp2-btn hp2-btn--primary h-12! rounded-2xl! px-5! transition-all! duration-300! hover:-translate-y-0.5! hover:scale-[1.01]"
                  onClick={() => goSurah(1)}
                >
                  <i className="fas fa-book-open" />
                  <span>
                    {lang === "ar"
                      ? "Ø§Ø¨Ø¯Ø£ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©"
                      : lang === "fr"
                        ? "Commencer la lecture"
                        : "Start reading"}
                  </span>
                  <span className="hp2-btn__chip">Ø§Ù„Ù’ÙÙŽØ§ØªÙØ­ÙŽØ©</span>
                </button>
              )}
              {hasReadingHistory && (
                <button
                  className="hp2-btn hp2-btn--outline h-12! rounded-2xl! px-5! transition-all! duration-300! hover:-translate-y-0.5"
                  onClick={() => goSurah(1)}
                >
                  <i className="fas fa-book-open-reader" />
                  <span>{t("startFatiha")}</span>
                </button>
              )}
              <button
                className="hp2-btn hp2-btn--soft h-12! rounded-2xl! px-5! transition-all! duration-300! hover:-translate-y-0.5"
                onClick={openDuas}
              >
                <i className="fas fa-hands-praying" />
                <span>{t("duas")}</span>
              </button>
            </div>

            {/* Lectures rÃ©centes */}
            {recentVisits.length > 0 && (
              <div className="hp2-recent-history mt-6! rounded-2xl! border! p-4! backdrop-blur-md">
                <div className="hp2-recent-title mb-3! text-[0.69rem]! font-semibold! uppercase! tracking-[0.18em]">
                  <i className="fas fa-clock-rotate-left" />
                  {lang === "ar"
                    ? "Ø§Ø³ØªÙƒÙ…Ø§Ù„"
                    : lang === "fr"
                      ? "Reprendre"
                      : "Continue"}
                </div>
                <div className="hp2-recent-items grid! gap-2.5">
                  {recentVisits.map((v) => (
                    <button
                      key={v.surah}
                      className="hp2-recent-item group grid! grid-cols-[auto_1fr_auto]! items-center! gap-3! rounded-xl! border! px-4! py-3! text-left! transition-all! duration-300! hover:-translate-y-0.5! hover:scale-[1.005]"
                      onClick={() => goSurahAyah(v.surah, v.ayah)}
                    >
                      <span className="hp2-recent-num flex! h-9! w-9! items-center! justify-center! rounded-full! border! text-sm! font-bold">
                        {v.surah}
                      </span>
                      <div className="hp2-recent-info min-w-0">
                        <span className="hp2-recent-name block! truncate! text-[0.95rem]! font-semibold">
                          {v.surahName}
                        </span>
                        {v.ayah > 1 && (
                          <span className="hp2-recent-ayah mt-0.5! block! text-[0.72rem]! font-medium">
                            v.{v.ayah}
                          </span>
                        )}
                      </div>
                      <span className="hp2-recent-play flex! h-8! w-8! items-center! justify-center! rounded-full! transition-transform! duration-300! group-hover:scale-110">
                        <i className="fas fa-play text-[0.78rem]" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Features mini grid */}
            <div className="hp2-features mt-5! grid! grid-cols-1! gap-2! sm:grid-cols-2">
              {[
                {
                  icon: "fa-palette",
                  fr: "TajwÃ®d colorÃ©",
                  en: "Color tajweed",
                  ar: "ØªØ¬ÙˆÙŠØ¯ Ù…Ù„ÙˆÙ†",
                },
                {
                  icon: "fa-language",
                  fr: "Mot Ã  mot",
                  en: "Word by word",
                  ar: "ÙƒÙ„Ù…Ø© Ø¨ÙƒÙ„Ù…Ø©",
                },
                {
                  icon: "fa-headphones",
                  fr: "18+ rÃ©citateurs",
                  en: "18+ reciters",
                  ar: "Ù¡Ù¨+ Ù‚Ø§Ø±Ø¦",
                },
                {
                  icon: "fa-moon",
                  fr: "4 themes harmonises",
                  en: "4 harmonized themes",
                  ar: "Ù¤ Ø³Ù…Ø§Øª Ù…Ù†Ø³Ø¬Ù…Ø©",
                },
              ].map((f) => (
                <div
                  key={f.icon}
                  className="hp2-feature flex! items-center! gap-2.5! rounded-xl! border! px-3! py-2.5! backdrop-blur-md! transition-all! duration-300! hover:-translate-y-0.5"
                >
                  <span className="hp2-feature__icon">
                    <i className={`fas ${f.icon}`} />
                  </span>
                  <span className="hp2-feature__text">
                    {lang === "ar" ? f.ar : lang === "fr" ? f.fr : f.en}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* â”€â”€ Droite â”€â”€ */}
          <div className="hp2-hero__right relative! z-10! space-y-3">
            {/* Verset du jour â€” carte principale droite */}
            <div className="hp2-vod relative! overflow-hidden! rounded-2xl! border! p-4! transition-all! duration-300! hover:scale-[1.01]">
              <div className="pointer-events-none absolute -top-8 right-4 h-24 w-24 rounded-full blur-2xl motion-safe:animate-pulse [animation-duration:8s]" />
              <div className="hp2-vod__head relative! z-10">
                <span className="hp2-vod__label rounded-full! border! px-2.5! py-1">
                  <i className="fas fa-star-and-crescent" />
                  {t("verseOfDay")}
                </span>
                <span className="hp2-vod__date">
                  {now.toLocaleDateString(
                    lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                    { day: "numeric", month: "short" },
                  )}
                </span>
              </div>
              <p className="hp2-vod__text relative! z-10! text-[1.45rem]! leading-[1.95]" dir="rtl">
                {dailyVerse.text}
              </p>
              {lang === "fr" && dailyVerse.trans_fr && (
                <p className="hp2-vod__trans relative! z-10">{dailyVerse.trans_fr}</p>
              )}
              <span className="hp2-vod__ref relative! z-10">{dailyVerse.ref}</span>
              {vodSurahNum && (
                <button
                  className="hp2-vod__btn relative! z-10! rounded-xl! border! px-3.5! py-2! transition-all! duration-300! hover:-translate-y-0.5"
                  onClick={() => goSurah(vodSurahNum)}
                >
                  <i className="fas fa-book-open" />
                  {lang === "fr"
                    ? "Lire la sourate"
                    : lang === "ar"
                      ? "Ø§Ù‚Ø±Ø£ Ø§Ù„Ø³ÙˆØ±Ø©"
                      : "Read surah"}
                  <i className={`fas fa-arrow-${isRtl ? "left" : "right"}`} />
                </button>
              )}
            </div>

            {/* Carte session active */}
            <div className="hp2-focus-card rounded-2xl! border! backdrop-blur-md! transition-all! duration-300">
              <div className="hp2-focus-card__head">
                <span className="hp2-focus-card__eyebrow">
                  <i className="fas fa-bolt" />
                  {lang === "fr"
                    ? "Session"
                    : lang === "ar"
                      ? "Ø§Ù„Ø¬Ù„Ø³Ø©"
                      : "Session"}
                </span>
                <span className="hp2-focus-card__riwaya">{riwayaLabel}</span>
              </div>
              <div className="hp2-focus-card__body">
                <h2 className="hp2-focus-card__title">{readingTarget}</h2>
                {surahLabel && displayMode ==! "juz" && (
                  <div className="hp2-focus-card__surah-ar" dir="rtl">
                    {surahLabel.ar}
                  </div>
                )}
              </div>
              <div className="hp2-focus-card__stats">
                <span className="hp2-focus-card__stat">
                  <strong>{bookmarks.length}</strong>
                  <span>{t("bookmarks")}</span>
                </span>
                <span className="hp2-focus-card__stat">
                  <strong>{notes.length}</strong>
                  <span>{t("notes")}</span>
                </span>
                <span className="hp2-focus-card__stat">
                  <strong>{progressPct}%</strong>
                  <span>
                    {lang === "fr"
                      ? "Avancement"
                      : lang === "ar"
                        ? "Ø§Ù„ØªÙ‚Ø¯Ù…"
                        : "Progress"}
                  </span>
                </span>
              </div>
              <div className="hp2-focus-card__progress">
                <div className="hp2-focus-card__progress-bar">
                  <div className="hp2-focus-card__progress-fill h-full w-full">
                    <PercentBar value={progressPct} />
                  </div>
                </div>
              </div>
              <button className="hp2-focus-card__cta transition-all! duration-300! hover:-translate-y-0.5! hover:scale-[1.01]" onClick={continueReading}>
                <i className="fas fa-circle-play" />
                {hasReadingHistory
                  ? lang === "fr"
                    ? "Continuer"
                    : lang === "ar"
                      ? "Ù…ØªØ§Ø¨Ø¹Ø©"
                      : "Continue"
                  : lang === "fr"
                    ? "Commencer"
                    : lang === "ar"
                      ? "Ø§Ø¨Ø¯Ø£"
                      : "Start"}
              </button>
            </div>

            {/* PriÃ¨res */}
            <div className="hp2-prayers rounded-2xl! border! p-3.5! backdrop-blur-sm">
              <div className="hp2-prayers__head mb-2.5">
                <i className="fas fa-mosque" />
                <span>
                  {lang === "fr"
                    ? "PriÃ¨res"
                    : lang === "ar"
                      ? "Ø§Ù„ØµÙ„ÙˆØ§Øª"
                      : "Prayers"}
                </span>
              </div>
              <div className="hp2-prayers__list">
                {[
                  {
                    key: "fajr",
                    icon: "fa-star",
                    fr: "Fajr",
                    ar: "Ø§Ù„ÙØ¬Ø±",
                    en: "Fajr",
                    r: [4, 7],
                  },
                  {
                    key: "dhuhr",
                    icon: "fa-sun",
                    fr: "Dhuhr",
                    ar: "Ø§Ù„Ø¸Ù‡Ø±",
                    en: "Dhuhr",
                    r: [12, 15],
                  },
                  {
                    key: "asr",
                    icon: "fa-cloud-sun",
                    fr: "Asr",
                    ar: "Ø§Ù„Ø¹ØµØ±",
                    en: "Asr",
                    r: [15, 18],
                  },
                  {
                    key: "maghrib",
                    icon: "fa-cloud-moon",
                    fr: "Maghrib",
                    ar: "Ø§Ù„Ù…ØºØ±Ø¨",
                    en: "Maghrib",
                    r: [18, 20],
                  },
                  {
                    key: "isha",
                    icon: "fa-moon",
                    fr: "IshÄ",
                    ar: "Ø§Ù„Ø¹Ø´Ø§Ø¡",
                    en: "IshÄ",
                    r: [20, 4],
                  },
                ].map((p) => {
                  const h = now.getHours();
                  const on =
                    p.r[0] < p.r[1]
                      ? h >= p.r[0] && h < p.r[1]
                      : h >= p.r[0] || h < p.r[1];
                  return (
                    <div
                      key={p.key}
                      className={cn(
                        "hp2-prayer-row",
                        "transition-all duration-300",!
                        on && "hp2-prayer-row--on",
                      )}
                    >
                      <i className={`fas ${p.icon}`} />
                      <span className="hp2-prayer-row__name">
                        {p[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                      </span>
                      {on && (
                        <span className="hp2-prayer-row__badge">
                          {lang === "fr"
                            ? "Maintenant"
                            : lang === "ar"
                              ? "Ø§Ù„Ø¢Ù†"
                              : "Now"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â• ACCÃˆS RAPIDE â•â•â•â• */}
      <nav
        className="hp2-quickbar relative! z-10! rounded-2xl! border! px-4! py-3! backdrop-blur-md"
        aria-label={t("quickAccess")}
        style={HOME_DEFERRED_SECTION_STYLE}
      >
        <span className="hp2-quickbar__title">
          <i className="fas fa-bolt" />
          {t("quickAccess")}
        </span>
        <div className="hp2-quickbar__track mt-2">
          <button className="hp2-qchip hp2-qchip--special transition-all! duration-300! hover:-translate-y-0.5! hover:scale-[1.02]" onClick={openDuas}>
            <i className="fas fa-hands-praying" />
            {lang === "ar" ? "Ø£Ø¯Ø¹ÙŠØ©" : lang === "fr" ? "Douas" : "Duas"}
          </button>
          {QUICK_ACCESS.map(({ n, label_fr, label_en }) => {
            const s = SURAHS[n - 1];
            return (
              <button key={n} className="hp2-qchip transition-all! duration-300! hover:-translate-y-0.5! hover:scale-[1.02]" onClick={() => goSurah(n)}>
                <span className="hp2-qchip__ar">{s?.ar}</span>
                <span className="hp2-qchip__sub">
                  {lang === "fr" ? label_fr : lang === "ar" ? s?.ar : label_en}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* â•â•â•â• BANDE STATS â•â•â•â• */}
      <div
        className="hp2-stats-strip relative! z-10! rounded-2xl! border! p-3"
        style={HOME_DEFERRED_SECTION_STYLE}
      >
        {[
          {
            num: "114",
            icon: "fa-quran",
            labelFr: "Sourates",
            labelEn: "Surahs",
            labelAr: "Ø³ÙˆØ±",
          },
          {
            num: "30",
            icon: "fa-layer-group",
            labelFr: "Juz'",
            labelEn: "Juz",
            labelAr: "Ø¬Ø²Ø¡",
          },
          {
            num: "6 236",
            icon: "fa-star",
            labelFr: "Versets",
            labelEn: "Ayahs",
            labelAr: "Ø¢ÙŠØ©",
          },
          {
            num: "77 430",
            icon: "fa-font",
            labelFr: "Mots",
            labelEn: "Words",
            labelAr: "ÙƒÙ„Ù…Ø©",
          },
        ].map((s, i) => (
          <div key={i} className="hp2-stats-strip__item !rounded-xl !border !transition-all !duration-300 hover:!-translate-y-0.5">
            <i className={`fas ${s.icon} hp2-stats-strip__icon`} />
            <span className="hp2-stats-strip__num">{s.num}</span>
            <span className="hp2-stats-strip__label">
              {lang === "ar"
                ? s.labelAr
                : lang === "fr"
                  ? s.labelFr
                  : s.labelEn}
            </span>
          </div>
        ))}
      </div>

      {/*  GRILLE PRINCIPALE  */}
      <div className="hp2-layout !relative !z-10">
        {/* Panneau latÃ©ral */}
        <aside className="hp2-aside" style={HOME_DEFERRED_SECTION_STYLE}>
          <div className="hp2-panel !rounded-2xl !border !backdrop-blur-md">
            <div className="hp2-panel__tabs">
              {infoTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "hp2-panel__tab",
                    activeInfo === tab.id && "hp2-panel__tab--on",
                  )}
                  onClick={() => selectInfoTab(tab.id)}
                >
                  <i className={`fas ${tab.icon}`} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="hp2-panel__count">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="hp2-panel__body">
              {activeInfo === "bookmarks" &&
                (bookmarks.length === 0 ? (
                  <EmptyState icon="fa-bookmark" text={t("noBookmarks")} />
                ) : (
                  bookmarks.slice(0, 10).map((bk) => {
                    const s = SURAHS[bk.surah - 1];
                    return (
                      <button
                        key={bk.id}
                        className="hp2-item"
                        onClick={() => goSurahAyah(bk.surah, bk.ayah)}
                      >
                        <span className="hp2-item__icon">
                          <i className="fas fa-bookmark" />
                        </span>
                        <div className="hp2-item__body">
                          <span className="hp2-item__ar">{s?.ar}</span>
                          <span className="hp2-item__sub">
                            {lang === "fr" ? s?.fr : s?.en} Â· v.{bk.ayah}
                            {bk.label && <em> â€” {bk.label}</em>}
                          </span>
                        </div>
                        <i
                          className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                        />
                      </button>
                    );
                  })
                ))}

              {activeInfo === "notes" &&
                (notes.length === 0 ? (
                  <EmptyState icon="fa-pen-line" text={t("noNotes")} />
                ) : (
                  notes.slice(0, 10).map((note) => {
                    const s = SURAHS[note.surah - 1];
                    return (
                      <button
                        key={note.id}
                        className="hp2-item"
                        onClick={() => goSurahAyah(note.surah, note.ayah)}
                      >
                        <span className="hp2-item__icon">
                          <i className="fas fa-pen-line" />
                        </span>
                        <div className="hp2-item__body">
                          <span className="hp2-item__ar">{s?.ar}</span>
                          <span className="hp2-item__sub">
                            {lang === "fr" ? s?.fr : s?.en} Â· v.{note.ayah}
                          </span>
                          {note.text && (
                            <span className="hp2-item__excerpt">
                              {note.text.slice(0, 70)}
                              {note.text.length > 70 ? "â€¦" : ""}
                            </span>
                          )}
                        </div>
                        <i
                          className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                        />
                      </button>
                    );
                  })
                ))}

              {activeInfo === "suggest" && (
                <>
                  <div className="hp2-suggest-period">
                    <i className={`fas ${suggestionSet.icon}`} />
                    <span>
                      {lang === "ar"
                        ? suggestionSet.period.ar
                        : lang === "fr"
                          ? suggestionSet.period.fr
                          : suggestionSet.period.en}
                    </span>
                  </div>
                  {suggestionSet.surahs.map(({ n, fr, en, ar: arLabel }) => {
                    const s = SURAHS[n - 1];
                    return (
                      <button
                        key={n}
                        className="hp2-item"
                        onClick={() => goSurah(n)}
                      >
                        <span className="hp2-item__num">{n}</span>
                        <div className="hp2-item__body">
                          <span className="hp2-item__ar">{s.ar}</span>
                          <span className="hp2-item__sub">
                            {lang === "ar" ? arLabel : lang === "fr" ? fr : en}
                          </span>
                        </div>
                        <i
                          className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                        />
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Colonne sourates */}
        <section className="hp2-content !rounded-2xl !border !p-3.5 !backdrop-blur-md">
          <div className="hp2-toolbar !rounded-xl !border !px-3 !py-2.5">
            {/* Onglets Sourates / Juz */}
            <div className="hp2-segs !rounded-xl !border !p-1">
              <button
                className={cn(
                  "hp2-seg !transition-all !duration-300",
                  activeTab === "surah" && "hp2-seg--on",
                )}
                  onClick={() => selectContentTab("surah")}
              >
                <i className="fas fa-align-justify" />
                {t("surahs")}
              </button>
              <button
                className={cn(
                  "hp2-seg !transition-all !duration-300",
                  activeTab === "juz" && "hp2-seg--on",
                )}
                  onClick={() => selectContentTab("juz")}
              >
                <i className="fas fa-book-open" />
                {t("juz")}
              </button>
            </div>

            {/* Recherche */}
            {activeTab === "surah" && (
              <div className="hp2-search !rounded-xl !border !backdrop-blur-sm">
                <i className="fas fa-magnifying-glass hp2-search__ico" />
                <input
                  className="hp2-search__input"
                  placeholder={t("search")}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filter && (
                  <button
                    className="hp2-search__clear"
                    onClick={() => setFilter("")}
                  >
                    <i className="fas fa-xmark" />
                  </button>
                )}
              </div>
            )}

            {/* Tri + vue */}
            <div className="hp2-toolbar__end">
              <span className="hp2-toolbar__count">
                {activeTab === "surah"
                  ? filteredSurahs.length
                  : JUZ_DATA.length}
                <span>{activeTab === "surah" ? t("surahs") : t("juz")}</span>
              </span>
              {activeTab === "surah" && (
                <button
                  className="hp2-icon-btn hp2-icon-btn--with-label !transition-all !duration-300 hover:!scale-110"
                  onClick={toggleSortDirection}
                  title={sortDir === "asc" ? "DÃ©croissant" : "Croissant"}
                >
                  <i
                    className={`fas fa-sort-${sortDir === "asc" ? "down" : "up"}`}
                  />
                  <span className="hp2-icon-btn__label">
                    {lang === "ar" ? "ØªØ±ØªÙŠØ¨" : lang === "fr" ? "Tri" : "Sort"}
                  </span>
                </button>
              )}
              <button
                className={cn(
                  "hp2-icon-btn hp2-icon-btn--with-label !transition-all !duration-300 hover:!scale-110",
                  viewMode === "grid" && "hp2-icon-btn--on",
                )}
                onClick={() => changeViewMode("grid")}
                title="Grille"
              >
                <i className="fas fa-grip" />
                <span className="hp2-icon-btn__label">
                  {lang === "ar" ? "Ø´Ø¨ÙƒØ©" : lang === "fr" ? "Grille" : "Grid"}
                </span>
              </button>
              <button
                className={cn(
                  "hp2-icon-btn hp2-icon-btn--with-label !transition-all !duration-300 hover:!scale-110",
                  viewMode === "list" && "hp2-icon-btn--on",
                )}
                onClick={() => changeViewMode("list")}
                title="Liste"
              >
                <i className="fas fa-list" />
                <span className="hp2-icon-btn__label">
                  {lang === "ar" ? "Ù‚Ø§Ø¦Ù…Ø©" : lang === "fr" ? "Liste" : "List"}
                </span>
              </button>
            </div>
          </div>

          <div
            className={cn(
              "hp2-items !mt-3",
              viewMode === "grid" ? "hp2-items--grid" : "hp2-items--list",
              useSurahGridScroll && "hp2-items--surah-scroll",
            )}
          >
            {activeTab === "surah" ? (
              filteredSurahs.length === 0 ? (
                <EmptyState icon="fa-magnifying-glass" text={t("noResults")} />
              ) : (
                renderedSurahs.map((s, idx) => (
                  <SurahCard
                    key={s.n}
                    surah={s}
                    lang={lang}
                    viewMode={viewMode}
                    onClick={goSurah}
                    onPlay={playFromHome}
                    isActive={s.n === currentSurah && displayMode === "surah"}
                    isPlaying={
                      state.isPlaying && state.currentPlayingAyah?.surah === s.n
                    }
                    animIndex={idx}
                  />
                ))
              )
            ) : (
              JUZ_DATA.map((j, idx) => (
                <JuzCard
                  key={j.juz}
                  juzData={j}
                  lang={lang}
                  viewMode={viewMode}
                  onClick={goJuz}
                  isActive={j.juz === currentJuz && displayMode === "juz"}
                  animIndex={idx}
                />
              ))
            )}
          </div>
          {hasMoreSurahs && (
            <div className="mt-4 !flex !justify-center">
              <button
                ref={loadMoreRef}
                className="hp2-btn hp2-btn--soft !min-h-11 !rounded-2xl !px-5 !transition-all !duration-300 hover:!-translate-y-0.5"
                onClick={loadMoreSurahs}
              >
                <i className="fas fa-arrow-down" />
                <span>
                  {lang === "ar"
                    ? "ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø²ÙŠØ¯ Ù…Ù† Ø§Ù„Ø³ÙˆØ±"
                    : lang === "fr"
                      ? "Charger plus de sourates"
                      : "Load more surahs"}
                </span>
                <span className="hp2-btn__chip">
                  {renderedSurahs.length}/{filteredSurahs.length}
                </span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* â•â•â•â• FOOTER â•â•â•â• */}
      <div className="relative z-10" style={HOME_FOOTER_SECTION_STYLE}>
        <Footer goSurah={goSurah} />
      </div>
    </div>
  );
}


