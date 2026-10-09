/**
 * Reciter media audit — the catalogue's single source of truth for "is this
 * reciter actually usable".
 *
 * One file per position is not enough: a CDN can serve Al-Fatiha and be dead
 * for the rest of the Quran, and the Warsh numbering splits verses so the last
 * Hafs ayah of a surah may not exist at all. Every profile is probed at several
 * positions, on every URL candidate the player would try, plus its portrait.
 *
 * A portrait must also be that reciter's face, not merely a live image: each
 * Assabile portrait is checked against the attributed profile page, which has to
 * reference the same media file.
 */

import RECITERS, {
  RECITER_PHOTOS_MAP,
  getReciterProfileSource,
  validateReciterProfile,
} from "../src/data/reciters.js";

globalThis.Audio = class {
  addEventListener() {}
  removeEventListener() {}
  load() {}
  play() {
    return Promise.resolve();
  }
  pause() {}
};
const { AudioService } = await import("../src/services/audioService.js");

// First ayah, a deep Medinan ayah, a surah whose Warsh count differs from Hafs
// (67 splits at verse 31, so 15 is safe in both), the last ayah of a long
// surah, and the final ayah of the Quran.
const SAMPLES = [
  [1, 1],
  [2, 25],
  [50, 10],
  [67, 15],
  [93, 11],
  [114, 6],
];

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;

async function probe(url) {
  const send = async (init) =>
    (
      await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        ...init,
      })
    ).status;
  try {
    const head = await send({ method: "HEAD" });
    if (head >= 200 && head < 400) return { ok: true, status: head };
    // Some CDNs reject HEAD outright but answer a ranged GET.
    if (head === 403 || head === 405) {
      const ranged = await send({ headers: { Range: "bytes=0-63" } });
      return { ok: ranged >= 200 && ranged < 400, status: ranged };
    }
    return { ok: false, status: head };
  } catch (error) {
    return { ok: false, status: error?.name || "network-error" };
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
  return results;
}

/** The player falls back across mirror URLs; the audit must try the same list. */
function urlsFor(reciter, surah, ayah) {
  if (AudioService.isSurahStreamCdn(reciter.cdnType)) {
    return [AudioService.buildUrl(reciter.cdn, { surah, ayah }, reciter.cdnType)];
  }
  return AudioService.buildUrlCandidates(reciter.cdn, { surah, ayah }, reciter.cdnType);
}

const allReciters = [
  ...RECITERS.hafs.map((reciter) => ({ reciter, riwaya: "hafs" })),
  ...RECITERS.warsh.map((reciter) => ({ reciter, riwaya: "warsh" })),
];

const staticFailures = allReciters.flatMap(({ reciter }) => {
  const validation = validateReciterProfile(reciter);
  return validation.valid
    ? []
    : [{ id: reciter.id, reason: `metadata: ${validation.errors.join(", ")}` }];
});

const probes = [];
let avatarOnlyCount = 0;
for (const { reciter, riwaya } of allReciters) {
  for (const [surah, ayah] of SAMPLES) {
    probes.push({
      reciter,
      riwaya,
      label: `audio ${surah}:${ayah}`,
      urls: urlsFor(reciter, surah, ayah),
    });
  }
  const photo = RECITER_PHOTOS_MAP[reciter.id];
  if (!photo) {
    avatarOnlyCount += 1;
    continue;
  }
  const isAssabile = photo.includes("assabile.com");
  probes.push({
    reciter,
    riwaya,
    label: "portrait",
    urls: [photo],
    identityUrl: isAssabile
      ? getReciterProfileSource(reciter.id)?.url || null
      : undefined,
    identityFile: isAssabile ? photo.split("/").pop() : null,
  });
}

/**
 * Assabile publishes each reciter's portraits under /media/ using that person's
 * own slug, so the attributed profile page is the authority on whose face a
 * portrait is. A live URL that no profile page references is a misattribution.
 */
async function checkPortraitIdentity(probeItem) {
  if (probeItem.identityUrl === undefined) return { ok: true };
  if (!probeItem.identityUrl) {
    return {
      ok: false,
      status: "aucune page profil déclarée",
      url: probeItem.urls[0],
    };
  }
  try {
    const response = await fetch(probeItem.identityUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status < 200 || response.status >= 400) {
      return {
        ok: false,
        status: `page profil HTTP ${response.status}`,
        url: probeItem.identityUrl,
      };
    }
    const html = await response.text();
    return html.includes(probeItem.identityFile)
      ? { ok: true }
      : {
          ok: false,
          status: `page profil sans référence à ${probeItem.identityFile}`,
          url: probeItem.identityUrl,
        };
  } catch (error) {
    return {
      ok: false,
      status: `page profil ${error?.name || "network-error"}`,
      url: probeItem.identityUrl,
    };
  }
}

const results = await mapWithConcurrency(probes, CONCURRENCY, async (probeItem) => {
  let last = { ok: false, status: "missing-url" };
  for (const url of probeItem.urls) {
    last = await probe(url);
    if (!last.ok) continue;
    const identity = await checkPortraitIdentity(probeItem);
    return {
      ...probeItem,
      ok: identity.ok,
      url: identity.url || url,
      status: identity.ok ? last.status : identity.status,
    };
  }
  return { ...probeItem, ok: false, url: probeItem.urls[0] || null, status: last.status };
});

const failures = results.filter((result) => !result.ok);
const grouped = new Map();
for (const failure of failures) {
  const list = grouped.get(failure.reciter.id) || [];
  list.push(`${failure.label}: ${typeof failure.status === "number" ? `HTTP ${failure.status}` : failure.status}${failure.url ? ` — ${failure.url}` : " (aucune URL déclarée)"}`);
  grouped.set(failure.reciter.id, list);
}

const output = [];
for (const { reciter, riwaya } of allReciters) {
  const lines = grouped.get(reciter.id);
  if (!lines) continue;
  output.push(
    `- ${riwaya}/${reciter.id} [${reciter.cdnType}:${reciter.cdn}]:\n  ${lines.join("\n  ")}`,
  );
}

const profileFailures = staticFailures.map(
  (failure) => `- ${failure.id}: ${failure.reason}`,
);

const identityConfirmed = results.filter(
  (result) => result.ok && result.identityUrl !== undefined,
).length;

if (output.length || profileFailures.length) {
  console.error(
    `[reciters] ${failures.length + staticFailures.length} échec(s) sur ${probes.length} sondes (${allReciters.length} profils, ${avatarOnlyCount} sans photo)`,
  );
  for (const line of [...profileFailures, ...output]) console.error(line);
  process.exitCode = 1;
} else {
  console.log(
    `[reciters] OK — ${allReciters.length} profils normalisés, ${SAMPLES.length} positions audio et ${probes.length - allReciters.length * SAMPLES.length} portraits accessibles dont ${identityConfirmed} confirmés par leur page profil (${avatarOnlyCount} voix sans photo déclarée, avatar à initiales)`,
  );
}
