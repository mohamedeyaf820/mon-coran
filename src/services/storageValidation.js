const SAFE_LOCAL_STORAGE_KEY = /^[a-z0-9:_-]{1,64}$/i;
const MEMO_KEY = /^\d{1,3}:\d{1,3}$/;
const SURAH_KEY = /^\d{1,3}$/;
const DOWNLOAD_KEY = /^(hafs|warsh):.{1,80}:\d{1,3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function schema(validate) {
  const api = {
    safeParse(value) {
      const data = validate(value);
      return data === null ? { success: false } : { success: true, data };
    },
    nullable() {
      return {
        safeParse(value) {
          if (value === null) return { success: true, data: null };
          return thisSchema.safeParse(value);
        },
      };
    },
  };
  const thisSchema = api;
  return api;
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isIntBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isText(value, max) {
  return typeof value === "string" && value.length <= max;
}

export function readLocalStorageWithSchema(key, schemaToUse, fallbackValue) {
  if (!SAFE_LOCAL_STORAGE_KEY.test(String(key || ""))) {
    return fallbackValue;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    const result = schemaToUse.safeParse(parsed);
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

export const memorizationMapSchema = schema((value) => {
  if (!isPlainObject(value)) return null;
  for (const [key, rating] of Object.entries(value)) {
    if (!MEMO_KEY.test(key) || !isIntBetween(rating, 0, 5)) return null;
  }
  return value;
});

export const khatmaGoalSchema = schema((value) => {
  if (!isPlainObject(value)) return null;
  if (!ISO_DATE.test(value.startDate)) return null;
  if (!isIntBetween(value.targetDays, 1, 3650)) return null;
  if (!isIntBetween(value.startPage, 1, 604)) return null;
  return {
    startDate: value.startDate,
    targetDays: value.targetDays,
    startPage: value.startPage,
  };
});

export const readProgressSchema = schema((value) => {
  if (!isPlainObject(value)) return null;
  for (const [key, progress] of Object.entries(value)) {
    if (!SURAH_KEY.test(key) || !isIntBetween(progress, 0, 286)) return null;
  }
  return value;
});

export const downloadProgressEntrySchema = schema((value) => {
  if (!isPlainObject(value)) return null;
  if (!isText(value.key, 160) || value.key.length < 3) return null;
  if (!["partial", "done", "error"].includes(value.status)) return null;
  if (!isIntBetween(value.surahNum, 1, 114)) return null;
  if (!isText(value.reciterId, 80) || value.reciterId.length < 1) return null;
  if (!["hafs", "warsh"].includes(value.riwaya)) return null;
  if (!isIntBetween(value.updatedAt, 0, Number.MAX_SAFE_INTEGER)) return null;
  if (
    value.downloaded !== undefined &&
    !isIntBetween(value.downloaded, 0, Number.MAX_SAFE_INTEGER)
  ) {
    return null;
  }
  if (
    value.failedCount !== undefined &&
    !isIntBetween(value.failedCount, 0, Number.MAX_SAFE_INTEGER)
  ) {
    return null;
  }
  return value;
});

export const downloadProgressMapSchema = schema((value) => {
  if (!isPlainObject(value)) return null;
  const out = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!DOWNLOAD_KEY.test(key)) return null;
    const result = downloadProgressEntrySchema.safeParse(entry);
    if (!result.success) return null;
    out[key] = result.data;
  }
  return out;
});

export const noteRecordSchema = schema((value) => {
  if (!isPlainObject(value)) return null;
  if (!MEMO_KEY.test(value.id)) return null;
  if (!isIntBetween(value.surah, 1, 114)) return null;
  if (!isIntBetween(value.ayah, 1, 286)) return null;
  if (!isText(value.text, 8000)) return null;
  if (!isIntBetween(value.updatedAt, 0, Number.MAX_SAFE_INTEGER)) return null;
  return {
    id: value.id,
    surah: value.surah,
    ayah: value.ayah,
    text: value.text,
    updatedAt: value.updatedAt,
  };
});

export const bookmarkRecordSchema = schema((value) => {
  if (!isPlainObject(value)) return null;
  if (!MEMO_KEY.test(value.id)) return null;
  if (!isIntBetween(value.surah, 1, 114)) return null;
  if (!isIntBetween(value.ayah, 1, 286)) return null;
  if (!isText(value.label, 200)) return null;
  if (!isIntBetween(value.createdAt, 0, Number.MAX_SAFE_INTEGER)) return null;
  return {
    id: value.id,
    surah: value.surah,
    ayah: value.ayah,
    label: value.label,
    createdAt: value.createdAt,
  };
});
