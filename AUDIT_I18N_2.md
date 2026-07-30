# AUDIT I18N — RE-AUDIT COMPLET (2026-07-30)

## Résumé exécutif

Score i18n global : **58 / 100**

Les fichiers de locale sont en parfaite parité. Le problème majeur est que 556 ternaires `lang === "fr"` dans 76 fichiers contournent entièrement le système `t()`.

---

## 1. Parité des clés FR / EN / AR

| Locale | Clés totales | Manquantes vs FR |
|--------|-------------|-----------------|
| `fr.js` | **301** | — (référence) |
| `en.js` | **301** | **0** |
| `ar.js` | **301** | **0** |

**Résultat : parité parfaite.** Les trois locales sont synchronisées à 100 % (aucune clé orpheline ni manquante).

Structure couverte : `app`, `nav`, `footer`, `duas`, `sidebar`, `quran`, `search`, `settings`, `audio`, `bookmarks`, `notes`, `actions`, `share`, `export`, `errors`, `splash`, `tajwid`, `wird`, `readingHistory`, `playlist`, `phoneticSearch`, `autoNight`, `home`, `pwa`, `toast` — 25 namespaces.

---

## 2. Statut des 4 aria-labels corrigés (commit 720862e)

| Fichier | Clé | Statut |
|---------|-----|--------|
| `src/components/AudioMakerPanel.jsx:175` | `t("audio.close", lang)` | ✅ corrigé |
| `src/components/QuranDisplay/AyahActionsModal.jsx:49` | `t("audio.close", lang)` | ✅ corrigé |
| `src/components/Quran/MushafInlineHeader.jsx:70` | `t("quran.bismillah", lang)` | ✅ corrigé |
| `src/components/QuranDisplay/QCReadingView.jsx:152` | `t("quran.bismillah", lang)` | ✅ corrigé |

**Bonus découvert :** deux fichiers UI supplémentaires corrigés dans le même commit :
- `src/components/ui/modal.jsx:102` → `t("audio.close", lang)` ✅
- `src/components/ui/sheet.jsx:71` → `t("audio.close", lang)` ✅

**Les 4 corrections ciblées sont confirmées.** 6 occurrences au total utilisent désormais `t()`.

---

## 3. Ternaires inline restants (`lang === "fr"`)

**556 occurrences** dans **76 fichiers** — inchangé depuis l'audit précédent.

### Top 10 fichiers les plus contaminés

| Fichier | Occurrences |
|---------|-------------|
| `components/AyahActions.jsx` | **139** |
| `components/WirdPanel.jsx` | 28 |
| `components/SearchModal.jsx` | 24 |
| `components/DuasPage.jsx` | 24 |
| `components/PlaylistPanel.jsx` | 20 |
| `components/NotesPanel.jsx` | 19 |
| `components/Sidebar.jsx` | 18 |
| `components/AudioPlayer.jsx` | 18 |
| `components/WeeklyStatsPanel.jsx` | 17 |
| `components/FlashcardsPanel.jsx` | 15 |

Ces ternaires produisent du **texte visible non traduit en arabe** : quand `lang === "ar"`, la branche `else` retourne la valeur anglaise plutôt qu'une traduction.

Parmi les 556 ternaires, **32 concernent des `aria-label`** (attributs d'accessibilité) répartis dans 15 fichiers :
`AyahActions.jsx`, `AudioOptionsModal.jsx`, `Sidebar.jsx`, `Header.jsx`, `DuasPage.jsx`, `FlashcardsPanel.jsx`, `TajweedQuizPanel.jsx`, `WeeklyStatsPanel.jsx`, `ReadingHistoryPanel.jsx`, `ReciterComparatorPanel.jsx`, `FullscreenMushafOverlay.jsx`, `ModeNavigation.jsx`, `AyahBlock.jsx`, `CleanPageTranslationPanel.jsx`, `WordByWordDisplay.jsx`.

---

## 4. Nouvelles chaînes hardcodées découvertes

### aria-label ternaire sans clé i18n

```
src/components/QuranDisplay/FullscreenMushafOverlay.jsx:24
  aria-label={lang === "fr" ? "Vue pleine page" : "Full page view"}
```
Pas de traduction arabe. Clé manquante : `quran.fullPageView`.

```
src/components/QuranDisplay/QCReadingView.jsx:191
  aria-label={`${lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}`}
```
Pas de traduction arabe. Utiliser : `t("quran.ayah", lang)`.

### Texte visible inline (AyahActions.jsx — échantillon)

```jsx
// Lignes 1229, 1553, 1641 — aria-label écouter
aria-label={isPlayingThisAyah ? "Pause" : (lang === "fr" ? "Écouter" : lang === "ar" ? "استماع" : "Listen")}
// → clé existante : t("actions.listen", lang)

// Lignes 1284, 1617, 1705 — aria-label partager
aria-label={lang === "fr" ? "Partager ce verset" : lang === "ar" ? "مشاركة الآية" : "Share verse"}
// → clé existante : t("actions.shareTitle", lang)

// Lignes 1305 — aria-label note
aria-label={lang === "fr" ? "Ajouter une note" : ...}
// → clé existante : t("notes.add", lang)
```

**Observation :** la plupart des ternaires dupliquent des chaînes déjà présentes dans les fichiers de locale — la correction consiste à substituer `t(clé_existante, lang)`, sans ajouter de nouvelles clés.

---

## 5. Score i18n — 58 / 100

| Critère | Poids | Score | Détail |
|---------|-------|-------|--------|
| Parité des clés FR/EN/AR | 30 | 30/30 | Parfait — 301 clés × 3 locales |
| Corrections aria-labels ciblées | 10 | 10/10 | 4+2 fixes confirmés |
| Ternaires inline résiduels | 30 | 5/30 | 556 ternaires dans 76 fichiers |
| Couverture aria-label complète | 20 | 5/20 | 32 aria-label ternaires restants |
| Absence de chaînes orphelines | 10 | 8/10 | 2 clés manquantes (fullPageView, etc.) |

---

## 6. Top 5 actions restantes

### Priorité 1 — Résorber AyahActions.jsx (impact maximal)
**Fichier :** `src/components/AyahActions.jsx` — 139 ternaires + 19 aria-label ternaires.  
Les clés `actions.listen`, `actions.shareTitle`, `notes.add`, `bookmarks.add`, `bookmarks.removed`, `actions.copy`, `audio.pause` existent déjà dans les locales. Remplacer chaque ternaire par `t(clé, lang)`.

### Priorité 2 — Corriger les aria-label ternaires restants (32 occurrences, 15 fichiers)
Fichiers clés : `AudioOptionsModal.jsx`, `Sidebar.jsx`, `Header.jsx`, `FullscreenMushafOverlay.jsx`.  
Ajouter `quran.fullPageView` dans les 3 locales et substituer les ternaires par `t()`.

### Priorité 3 — Migrer les 10 fichiers à 15-28 ternaires
Par ordre de rentabilité : `WirdPanel.jsx` (28), `SearchModal.jsx` (24), `DuasPage.jsx` (24), `PlaylistPanel.jsx` (20), `NotesPanel.jsx` (19). Les clés de locale correspondantes existent — c'est une substitution mécanique.

### Priorité 4 — Créer un lint rule / script de CI
Ajouter un check pre-commit (ou une étape CI) qui détecte les patterns `lang === "fr" ?` dans les JSX et bloque les nouveaux commits avec ternaires inline. Fichier de référence : `scripts/` (déjà présents).

### Priorité 5 — Compléter 2 clés manquantes
Ajouter dans `fr.js` / `en.js` / `ar.js` :
- `quran.fullPageView` (pour `FullscreenMushafOverlay.jsx:24`)
- Vérifier `quran.ayah` est bien utilisé pour les aria-labels `Verset N` (`QCReadingView.jsx:191`)

---

*Audit produit le 2026-07-30 — branche `perf/load-times-and-bug-fixes`*
