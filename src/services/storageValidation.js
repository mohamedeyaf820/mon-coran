import { z } from "zod";

const SAFE_LOCAL_STORAGE_KEY = /^[a-z0-9:_-]{1,64}$/i;

export function readLocalStorageWithSchema(key, schema, fallbackValue) {
  if (!SAFE_LOCAL_STORAGE_KEY.test(String(key || ""))) {
    return fallbackValue;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
  } catch {
    // Invalid or unavailable storage.
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore cleanup failures.
  }
  return fallbackValue;
}

export function writeLocalStorageJson(key, data) {
  if (!SAFE_LOCAL_STORAGE_KEY.test(String(key || ""))) {
    return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

const positiveInt = (max) => z.number().int().min(0).max(max);

export const memorizationMapSchema = z.record(
  z.string().regex(/^\d{1,3}:\d{1,3}$/),
  z.number().int().min(0).max(5),
);

export const khatmaGoalSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    targetDays: z.number().int().min(1).max(3650),
    startPage: z.number().int().min(1).max(604),
  })
  .strict();

export const readProgressSchema = z.record(
  z.string().regex(/^\d{1,3}$/),
  positiveInt(286),
);

export const downloadProgressEntrySchema = z
  .object({
    key: z.string().min(3).max(160),
    status: z.enum(["partial", "done", "error"]),
    surahNum: z.number().int().min(1).max(114),
    reciterId: z.string().min(1).max(80),
    riwaya: z.enum(["hafs", "warsh"]),
    updatedAt: z.number().int().nonnegative(),
    downloaded: z.number().int().min(0).optional(),
    failedCount: z.number().int().min(0).optional(),
  })
  .passthrough();

export const downloadProgressMapSchema = z.record(
  z.string().regex(/^(hafs|warsh):.{1,80}:\d{1,3}$/),
  downloadProgressEntrySchema,
);

export const noteRecordSchema = z
  .object({
    id: z.string().regex(/^\d{1,3}:\d{1,3}$/),
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1).max(286),
    text: z.string().max(8000),
    updatedAt: z.number().int().nonnegative(),
  })
  .strict();

export const bookmarkRecordSchema = z
  .object({
    id: z.string().regex(/^\d{1,3}:\d{1,3}$/),
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1).max(286),
    label: z.string().max(200),
    createdAt: z.number().int().nonnegative(),
  })
  .strict();

