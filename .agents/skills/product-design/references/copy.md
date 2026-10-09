# Product copy

Canonical owner: `src/i18n/`. French is the default UI language; English and Arabic must remain semantically equivalent. Do not hardcode new user-facing strings in JSX when the i18n system can own them.

## Standards

- Use short, direct labels that describe the user's action.
- Name the exact object and scope when ambiguity could affect an ayah, surah, playlist, download, note, or local data.
- Describe consequences before destructive, privacy-sensitive, or storage actions.
- Use the same term for the same product object across surfaces.
- Keep control labels stable while loading; communicate progress separately.
- State what failed and what the user can do next. Avoid error codes as primary copy.
- Never imply Quran text, audio, translation, or tafsir is available offline until verified.
- Keep French accents. Use valid Unicode or JavaScript Unicode escapes; never ship mojibake.
- Use natural Arabic and native RTL. Do not translate product or reciter names mechanically without an accepted canonical form.
- Accessible names must be localized and describe the control, not the icon.

## Action patterns

- Navigation: `Ouvrir la sourate`, `Revenir à l'accueil`.
- Reversible action: verb + object, with feedback explaining the result.
- Destructive action: exact verb + exact object; never use only `OK`, `Confirmer`, or a context-free `Supprimer`.
- Retry: name the failed resource when useful, such as text, audio, or download.

When copy exposes an unresolved product decision, record the decision instead of hiding it behind vague wording.
