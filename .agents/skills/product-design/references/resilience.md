# Resilience

Read for network, loading, offline, persistence, extreme data, asynchronous actions, or error work.

## State inventory

Map only reachable variants:

- initial, loading, delayed, empty, sparse, populated;
- validation, disabled, busy, optimistic, success, partial success;
- network unavailable, source unavailable, timeout, retrying, stale, recovered;
- permission/privacy gate, storage quota, offline cached, offline unavailable;
- compact/wide, French/English/Arabic, RTL, Hafs/Warsh.

## Rules

- Keep loaded Quran text visible when a secondary request is pending or fails.
- Preserve reading position, form input, selections, and recoverable local work across errors.
- Explain what failed in user terms and provide a retry, alternate source, repair, or safe exit when truthful.
- Keep busy control labels stable and expose programmatic busy state.
- Prevent duplicate mutations and duplicate playback starts.
- Distinguish text availability from audio availability; one may work while the other fails.
- Do not silently switch riwaya, reciter, ayah scope, or source when the change affects what the user hears or reads.
- Treat storage quota and service-worker state as fallible. Never promise a download or offline session before verification.
- Avoid opaque skeletons or overlays over already readable Quran content.

## Stress cases

Verify long surah and reciter names, multiple translation languages, large font preferences, constrained height, virtualized content, slow font loading, reconnect during playback, stale IndexedDB/localStorage, and right-to-left text mixed with numbers or Latin source names.
