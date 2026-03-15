import RECITERS, { isWarshVerifiedReciter } from '../data/reciters';
import { AudioService } from './audioService';

const WARSH_SAMPLE_AYAHS = [
  { surah: 1, ayah: 1 },
  { surah: 2, ayah: 255 },
  { surah: 18, ayah: 1 },
  { surah: 36, ayah: 58 },
  { surah: 55, ayah: 13 },
  { surah: 67, ayah: 1 },
  { surah: 78, ayah: 1 },
  { surah: 93, ayah: 1 },
  { surah: 112, ayah: 1 },
  { surah: 114, ayah: 1 },
];

export function getWarshAuditSamples() {
  return WARSH_SAMPLE_AYAHS;
}

export async function checkUrlStatus(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, cache: 'no-store' });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

export function loadAudioDuration(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    const audio = new Audio();
    let done = false;
    const finish = (duration) => {
      if (done) return;
      done = true;
      audio.removeAttribute('src');
      resolve(duration);
    };

    const timer = setTimeout(() => finish(0), timeoutMs);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      finish(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    audio.onerror = () => {
      clearTimeout(timer);
      finish(0);
    };
    audio.src = url;
  });
}

export async function auditWarshAudio(reciterId = null, samples = WARSH_SAMPLE_AYAHS) {
  const reciters = reciterId
    ? RECITERS.warsh.filter(r => r.id === reciterId)
    : RECITERS.warsh;

  const report = [];
  for (const rec of reciters) {
    for (const sample of samples) {
      const url = AudioService.buildUrl(rec.cdn, {
        surah: sample.surah,
        numberInSurah: sample.ayah,
        number: 1,
      }, rec.cdnType || 'everyayah');

      const status = await checkUrlStatus(url);
      const duration = status.ok ? await loadAudioDuration(url) : 0;
      const suspicious = !isWarshVerifiedReciter(rec);
      report.push({
        reciterId: rec.id,
        reciterName: rec.nameEn || rec.name,
        surah: sample.surah,
        ayah: sample.ayah,
        url,
        status: status.status,
        duration,
        ok: status.ok && duration > 0.4 && !suspicious,
        suspicious,
      });
    }
  }

  return report;
}
