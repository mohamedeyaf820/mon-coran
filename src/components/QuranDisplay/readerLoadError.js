/**
 * Reader data-load failure taxonomy.
 *
 * The reader used to forward every load failure as one opaque string, which
 * made an offline reader with an unstored section look like a crash and put it
 * next to a genuine bug. This module turns a raw rejection into a small set of
 * states the interface can answer, and it is deliberately free of React and
 * network imports so `node --test` can exercise the classification directly.
 *
 * Rules mirrored from src/components/SearchModal.jsx (offline / network /
 * unavailable / timeout) so the app speaks one error language.
 */

export const READER_LOAD = {
  /** Offline and this section was never stored on the device. */
  OFFLINE_NOT_STORED: "offline-not-stored",
  /** Reachable-looking network failure while a connection is reported. */
  NETWORK: "network",
  /** The request was open too long and was cut. */
  TIMEOUT: "timeout",
  /** The provider answered with an HTTP status we cannot read. */
  SERVER: "server",
  /** The provider answered but carried no verses. */
  EMPTY: "empty",
  /** Warsh strict mode refused a Hafs text substitution. */
  WARSH_TEXT: "warsh-text",
  /** A newer navigation replaced this request: show nothing. */
  ABORTED: "aborted",
  /** Nothing classified: a real defect, which must reach the boundary. */
  UNEXPECTED: "unexpected",
};

const CHUNK_LOAD_PATTERN =
  /dynamically imported module|importing a module script failed|failed to fetch dynamically|error loading dynamically|chunkloaderror|loading chunk\s+[\w~.-]+\s+failed|could not load module|unable to preload/i;

// Same definition of "an app asset" that public/boot-recovery.js listens for.
// Bundlers disagree on how a failed import is worded (and the wording changes
// between engines), but every one of them names the file it could not fetch.
const ASSET_URL_PATTERN = /\/assets\/[\w~.-]+\.(?:js|css)/;

const TIMEOUT_PATTERN =
  /timed out|timeout|econnreset|etimedout|enotfound|econnrefused|err_network_(?:timeout|changed|volatile)|request was aborted due to timeout/i;

const NETWORK_PATTERN =
  /failed to fetch|networkerror|network request failed|network error|load failed|err_network|internetwork error|error loading content/i;

const STATUS_PATTERN = /(?:error|status|http)\D{0,4}(\d{3})/i;

// Providers and the Warsh loader also append the status after a colon
// ("Failed to load Warsh surah JSON: 404"), which is the answer the reader has
// to classify as an unavailable source rather than a defect.
const COLON_STATUS_PATTERN = /:\s*(4\d\d|5\d\d)\b/i;

/** Tag an error raised inside the reader data path with its taxonomy code. */
export function createReaderDataError(code, detail) {
  const error = new Error(detail || code);
  error.readerCode = code;
  return error;
}

export function isReaderAbort(error) {
  return error?.name === "AbortError" || error?.code === "ABORT_ERR";
}

/** True for a lazy module (code-split route) that the network could not deliver. */
export function isChunkLoadError(error) {
  // React.lazy and Vite's preload helper each wrap the original rejection, so
  // the wording that proves "an app asset did not arrive" can be on the cause.
  for (let node = error, depth = 0; node && depth < 4; node = node.cause, depth++) {
    const text = `${String(node?.name || "")} ${String(node?.message || node || "")}`;
    if (CHUNK_LOAD_PATTERN.test(text) || ASSET_URL_PATTERN.test(text)) return true;
  }
  return false;
}

function readStatus(error) {
  const explicit = Number(error?.status ?? error?.response?.status);
  if (Number.isInteger(explicit) && explicit > 0) return explicit;
  const message = String(error?.message || error || "");
  const match = STATUS_PATTERN.exec(message) || COLON_STATUS_PATTERN.exec(message);
  const parsed = match ? Number(match[1]) : NaN;
  return Number.isInteger(parsed) ? parsed : null;
}

/**
 * Map a rejection to the state the reader should show.
 *
 * @param {unknown} error raw rejection
 * @param {{online?: boolean, aborted?: boolean, hadPayload?: boolean}} context
 * @returns {{code: string, retryable: boolean, boundary: boolean, silent: boolean, status: number|null}}
 */
export function classifyReaderLoadError(error, context = {}) {
  const { online = true, aborted = false, hadPayload = false } = context;
  const status = readStatus(error);
  const message = String(error?.message || error || "");

  const verdict = (code, { retryable = false, boundary = false, silent = false } = {}) => ({
    code,
    retryable,
    boundary,
    silent,
    status,
  });

  // A superseded request is not a failure: the next request already owns the screen.
  if (aborted || (isReaderAbort(error) && !error?.readerCode)) {
    return verdict(READER_LOAD.ABORTED, { silent: true });
  }

  // Explicitly typed errors from the data layer win over message sniffing.
  if (error?.readerCode === READER_LOAD.EMPTY) return verdict(READER_LOAD.EMPTY, { retryable: true });
  if (error?.readerCode === READER_LOAD.WARSH_TEXT) {
    return verdict(READER_LOAD.WARSH_TEXT, { retryable: true });
  }

  // No connection and the payload is not on the device: the only honest answer
  // is that this section is not stored here yet. Never a crash, never a retry
  // loop, and never shown as "this surah has no text".
  if (!online) return verdict(READER_LOAD.OFFLINE_NOT_STORED);

  if (TIMEOUT_PATTERN.test(message)) return verdict(READER_LOAD.TIMEOUT, { retryable: true });
  if (status !== null && status >= 400) {
    return verdict(READER_LOAD.SERVER, { retryable: status >= 500 || status === 429, status });
  }
  if (NETWORK_PATTERN.test(message)) return verdict(READER_LOAD.NETWORK, { retryable: true });
  if (hadPayload) return verdict(READER_LOAD.NETWORK, { retryable: true });

  // Genuinely unknown: keep the boundary reachable so a real defect stays visible.
  return verdict(READER_LOAD.UNEXPECTED, { boundary: true });
}

/**
 * Boundary-level classification. A route chunk that the network cannot deliver
 * is an offline content gap, not an application defect: it must not be shown
 * with a reload button that reloads the same missing file.
 */
export function classifyBoundaryError(error, { online = true } = {}) {
  const chunkLoad = isChunkLoadError(error);
  if (!chunkLoad) {
    return { chunkLoad: false, offline: false, retryable: true };
  }
  return {
    chunkLoad: true,
    offline: !online,
    retryable: online,
  };
}
