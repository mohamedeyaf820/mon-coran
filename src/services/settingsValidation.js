import { z } from "zod";

/**
 * Schémas de validation Zod pour les paramètres de l'application
 */

// Schéma pour la position de lecture
const lastPositionSchema = z.object({
  surah: z.number().int().min(1).max(114).default(1),
  ayah: z.number().int().min(1).default(1),
  page: z.number().int().min(1).max(604).default(1),
  juz: z.number().int().min(1).max(30).default(1),
});

// Schéma pour les offsets de synchronisation
const syncOffsetsSchema = z.record(z.number()).default({});

// Schéma principal des settings
export const settingsSchema = z.object({
  // Langue et thème
  lang: z.enum(["fr", "en", "ar"]).default("fr"),
  theme: z.enum(["light", "dark", "sepia", "oled", "night-blue", "forest", "ocean", "premium-beige"]).default("light"),
  
  // Lecture du Quran
  riwaya: z.enum(["hafs", "warsh"]).default("hafs"),
  displayMode: z.enum(["surah", "page", "juz"]).default("surah"),
  mushafLayout: z.enum(["list", "mushaf"]).default("list"),
  quranFontSize: z.number().min(20).max(200).default(36),
  fontFamily: z.string().default("qpc-hafs"),
  
  // Affichage
  showTranslation: z.boolean().default(true),
  showTajwid: z.boolean().default(false),
  showWordByWord: z.boolean().default(false),
  showTransliteration: z.boolean().default(true),
  showWordTranslation: z.boolean().default(true),
  translationReadingMode: z.boolean().default(false),
  translationLangs: z.array(z.string()).default(["fr"]),
  wordTranslationLang: z.string().default("fr"),
  
  // Navigation
  showHome: z.boolean().default(true),
  showDuas: z.boolean().default(false),
  pinnedAyahs: z.array(z.any()).default([]),
  lastPosition: lastPositionSchema.default({}),
  
  // Audio
  reciter: z.string().default("ar.alafasy"),
  audioSpeed: z.number().min(0.25).max(2).default(1),
  volume: z.number().min(0).max(1).default(1),
  continuousPlay: z.boolean().default(true),
  syncOffsetsMs: syncOffsetsSchema,
  focusReading: z.boolean().default(false),
  karaokeFollow: z.boolean().default(true),
  surahRepeatCount: z.number().int().min(1).max(10).default(1),
  
  // Options avancées
  warshStrictMode: z.boolean().default(false),
  playerMinimized: z.boolean().default(false),
  
  // Reciters
  favoriteReciters: z.array(z.string()).default([]),
  autoSelectFastestReciter: z.boolean().default(false),
  reciterLatencyByKey: z.record(z.number()).default({}),
  reciterAvailabilityById: z.record(z.boolean()).default({}),
  
  // Modes nuit/jour
  autoNightMode: z.boolean().default(false),
  nightStart: z.string().default("20:00"),
  nightEnd: z.string().default("05:00"),
  nightTheme: z.string().default("dark"),
  dayTheme: z.string().default("light"),
  usePrayerTimes: z.boolean().default(false),
  
  // Wird
  wirdGoalType: z.enum(["pages", "hizb", "juz"]).default("pages"),
  wirdGoalAmount: z.number().int().min(1).default(5),
});

/**
 * Valide et nettoie les settings
 * @param {unknown} data - Données à valider
 * @returns {Settings} Settings validés avec valeurs par défaut
 */
export function validateAndCleanSettings(data) {
  const result = settingsSchema.safeParse(data);
  
  if (result.success) {
    return result.data;
  }
  
  // En cas d'erreur, logger et retourner les valeurs par défaut
  if (import.meta.env.DEV) {
    console.warn("[SettingsValidation] Invalid settings, using defaults:", result.error.format());
  }
  
  return settingsSchema.parse({});
}

/**
 * Valide partiellement les settings (pour les mises à jour partielles)
 * @param {unknown} data - Données partielles à valider
 * @returns {Partial<Settings>} Partial<Settings> validé
 */
export function validatePartialSettings(data) {
  const partialSchema = settingsSchema.partial();
  const result = partialSchema.safeParse(data);
  
  if (result.success) {
    return result.data;
  }
  
  if (import.meta.env.DEV) {
    console.warn("[SettingsValidation] Invalid partial settings:", result.error.format());
  }
  
  return {};
}
