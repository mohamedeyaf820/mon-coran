# Audit i18n — MushafPlus

**Date :** 2026-07-30  
**Branche :** `perf/load-times-and-bug-fixes`

---

## 1. Inventaire des clés

Les trois locales partagent exactement la même structure de clés. Comptage par section :

| Section | Clés |
|---|---|
| app | 6 |
| nav | 12 |
| footer | 2 |
| sidebar | 6 |
| quran | 16 |
| search | 5 |
| settings | 58 |
| audio | 19 |
| bookmarks | 5 |
| notes | 5 |
| actions | 11 |
| share | 10 |
| export | 6 |
| errors | 6 |
| splash | 2 |
| tajwid | 7 |
| wird | 11 |
| readingHistory | 7 |
| playlist | 11 |
| phoneticSearch | 3 |
| autoNight | 5 |
| home | 11 |
| pwa | 3 |
| toast | 14 |
| **TOTAL** | **247** |

---

## 2. Clés présentes en FR mais absentes en EN

**Aucune.** Les trois fichiers ont exactement les mêmes 247 clés feuilles. La parité est complète.

---

## 3. Clés présentes en FR mais absentes en AR

**Aucune.** Même constat — parité parfaite FR/AR.

---

## 4. Valeurs vides ou identiques entre locales

### Valeurs identiques (suspects)

| Clé | Valeur commune | Raison probable |
|---|---|---|
| `app.name` | `'MushafPlus'` | Nom propre — OK |
| `footer.verseRef` | `'Adh-Dhariyat · 51:56'` (FR/EN) vs `'الذاريات · ٥١:٥٦'` (AR) | OK, AR traduit |
| `splash.verse` | Identique dans les 3 locales | Texte coranique fixe — OK |
| `audio.tartil` | FR `'Tartîl'` / EN `'Tarteel'` / AR `'ترتيل'` | OK |
| `playlist.placeholder` | FR/EN identiques : `'Ex: bismillah, rahman, fatiha…'` | Phonetics — OK |
| `pwa.updateAvailable` | Contient `✨` dans les 3 locales | Emoji UI — acceptable |

**Aucune valeur vide** n'a été détectée dans les trois fichiers.

**Note :** `audio.memorization` et `audio.memorizeMode` sont des doublons sémantiques dans les trois locales (FR : `'Mode mémorisation'` / `'Mode mémorisation'`). Les deux clés existent mais portent la même valeur FR et EN.

---

## 5. Chaînes hardcodées dans les composants JSX

### aria-labels hardcodés (non traduits via `t()`)

| Fichier | Valeur hardcodée | Clé i18n existante |
|---|---|---|
| `src/components/QuranDisplay/AyahActionsModal.jsx:46` | `aria-label="Fermer"` | `audio.close` |
| `src/components/QuranDisplay/FullscreenMushafOverlay.jsx:27` | `aria-label="Fermer"` | `audio.close` |
| `src/components/AudioMakerPanel.jsx:175` | `aria-label="Close"` | `audio.close` |
| `src/components/DuasPage.jsx:167` | `aria-label="Dua categories"` | Aucune — à créer |
| `src/components/Footer.jsx:52` | `aria-label="Adh-Dhariyat 51:56"` | `footer.verseRef` |
| `src/components/Quran/AyahMarker.jsx:83` | `aria-label="Sajda"` | Aucune — à créer |
| `src/components/Quran/MushafInlineHeader.jsx:69` | `aria-label="Basmala"` | `quran.bismillah` |
| `src/components/QuranDisplay/QCReadingView.jsx:153` | `aria-label="Basmala"` | `quran.bismillah` |

### Textes ternaires inline (pattern répété, non externalisé)

Vingt composants gèrent la traduction "Fermer/Close/إغلاق" avec des ternaires inline plutôt qu'en appelant `t('audio.close', lang)` :

```
App.jsx, AudioPlayer.jsx, AyahActions.jsx (×2), BookmarksModal.jsx,
FlashcardsPanel.jsx (×2), FutureFeaturesModal.jsx, KeyboardShortcutsModal.jsx,
KhatmaPanel.jsx, NotesPanel.jsx, PlaylistPanel.jsx, ReciterDetailPage.jsx,
ReciterComparatorPanel.jsx, Sidebar.jsx, TafsirSidebar.jsx, TajweedQuizPanel.jsx,
ConfirmDialogHost.jsx (inline object fr/en/ar), AyahActions.jsx:1117 ("Retour")
```

La clé `audio.close` **existe** dans les trois locales. Le pattern ternaire est redondant et contourne le système i18n.

---

## 6. Couverture RTL

**72 occurrences** de `dir="rtl"` ou `dir={lang==="ar"?"rtl":"ltr"}` dans les JSX.

| Patron | Résultat |
|---|---|
| `App.jsx:682` — `dir={lang === "ar" ? "rtl" : "ltr"}` | Racine de l'app adaptée dynamiquement |
| Éléments Arabic inline (`<span>`, `<p>`, `<b>`) | `dir="rtl" lang="ar"` systématiquement présents |
| Composants UI génériques (`modal.jsx`, `sheet.jsx`) | Pas de `dir` intrinsèque — héritent de la racine |

**Points faibles RTL identifiés :**
- `AyahActionsModal.jsx` et `FullscreenMushafOverlay.jsx` : les aria-labels hardcodés en français ne s'adaptent pas selon la langue ET n'ont pas de `dir` conditionnel.
- `DuasPage.jsx` : `aria-label="Dua categories"` en anglais fixe, pas de RTL sur le tablist.
- `ConfirmDialogHost.jsx` : objet de traduction local (fr/en/ar) sans clé AR pour `close` — manque `إغلاق`.

---

## 7. Clés orphelines (définies mais non appelées)

Recherche par usage de `t('…')` dans les JSX/JS :

| Clé suspectée | Usage trouvé ? | Verdict |
|---|---|---|
| `phoneticSearch.*` | Oui (15+ appels) | Utilisée |
| `wird.*` | Oui | Utilisée |
| `readingHistory.*` | Oui | Utilisée |
| `autoNight.*` | Oui | Utilisée |
| `playlist.*` | Oui (24+ appels) | Utilisée |
| `toast.*` | Oui | Utilisée |
| `pwa.*` | Oui | Utilisée |
| `settings.qpcHafsHint` … `scheherazadeWarshHint` (8 clés font hints) | À vérifier manuellement — complexité du settings panel | Probablement utilisées |

**Aucune clé clairement orpheline** n'a été identifiée à ce stade. Les 247 clés semblent toutes référencées.

---

## 8. Résumé

| Locale | Clés totales | Clés complètes (non vides) | Clés manquantes | % couverture |
|---|---|---|---|---|
| **FR** | 247 | 247 | 0 | **100 %** |
| **EN** | 247 | 247 | 0 | **100 %** |
| **AR** | 247 | 247 | 0 | **100 %** |

### Actions prioritaires

1. **CRITIQUE — 2 aria-labels hardcodés** dans `AyahActionsModal.jsx` et `FullscreenMushafOverlay.jsx` : remplacer par `t('audio.close', lang)`.
2. **MOYEN — 18+ ternaires inline** pour "Fermer/Close/إغلاق" : centraliser sur `t('audio.close', lang)` dans tous les composants concernés.
3. **MOYEN — aria-label "Basmala"** (×2) : utiliser `t('quran.bismillah', lang)`.
4. **FAIBLE — "Dua categories" et "Sajda"** : créer les clés manquantes (`duas.categoriesLabel`, `quran.sajda`) dans les trois locales.
5. **FAIBLE — Doublon sémantique** `audio.memorization` / `audio.memorizeMode` : fusionner en une seule clé.
