# Product judgment

Read for shaping, implementation, hardening, full review, or any material flow decision.

## Decision authority

Resolve conflicts in this order:

1. The user's explicit goal and constraints.
2. Quran/riwaya correctness, verified product behavior, and user safety or privacy.
3. Repository-canonical guidance and component APIs.
4. Accepted decisions with stable evidence.
5. Verified adjacent patterns in the same MushafPlus surface.
6. General interface heuristics.

## Compact decision brief

Write this internally before choosing UI:

- User and context:
- Job to complete:
- Current behavior and evidence:
- Desired outcome and success signal:
- Non-goals:
- Product object (ayah, surah, juz, page, reciter, playlist, note, session, preference):
- Scope of the action:
- Consequence and reversibility:
- Persistence/offline/privacy implications:
- Hafs/Warsh and language/RTL implications:
- Reachable states:
- Open decisions or assumptions:

## Product priorities

- Protect exact Quran text, ayah identity, ordering, riwaya, font compatibility, and source attribution.
- Preserve the user's reading position and input through navigation, validation, temporary failure, and reconnect.
- Keep reading calm and primary; supporting controls should remain discoverable without competing with the text.
- Prefer strong defaults and progressive disclosure to configuration the user must learn.
- Make audio source, reciter, riwaya, playback scope, and network failure understandable.
- Treat local library, notes, history, memorization, and preferences as private user data.
- Avoid claiming offline availability until the required text, audio, or asset is actually stored and usable.

## Scope test

Choose the smallest change that fully solves the stated job. Do not add unrelated settings, abstractions, engagement mechanics, or decorative novelty. If the request exposes a broader issue, report it separately unless the user authorized expansion.
