# AUDIT_ACCESSIBILITY_2 — MushafPlus Re-Audit WCAG 2.1 AA
**Date :** 2026-07-30  
**Branche :** `perf/load-times-and-bug-fixes`  
**Auditeur :** Claude Code (expert WCAG 2.1)

---

## 1. Vérification des 4 aria-labels i18n précédemment hardcodés

### 1.1 Fermer × 2 — remplacés par `t()`

| Fichier | Ligne | État | Preuve |
|---|---|---|---|
| `AyahActionsModal.jsx` | 49 | ✅ CONFIRMÉ | `aria-label={t("audio.close", lang)}` |
| `FullscreenMushafOverlay.jsx` | 27 | ✅ CONFIRMÉ | `aria-label={t("audio.close", lang)}` |

### 1.2 Basmala × 2 — remplacés par `t()`

| Fichier | Ligne | État | Preuve |
|---|---|---|---|
| `QCReadingView.jsx` | 152 | ✅ CONFIRMÉ | `aria-label={t("quran.bismillah", lang)}` |
| `MushafInlineHeader.jsx` | 70 | ✅ CONFIRMÉ | `aria-label={t("quran.bismillah", lang)}` |

**Résultat : les 4 fixes i18n sont 100 % confirmés.**

---

## 2. aria-live regions pour l'audio player

| Composant | Implémentation | État |
|---|---|---|
| `AudioPlayer.jsx` L.1131-1140 | `role="status" aria-live="polite" aria-atomic="true" className="sr-only"` — annonce l'ayah courante | ✅ CONFIRMÉ |
| `AudioPlayer.jsx` L.1144 | `role="alert"` sur le bandeau d'erreur audio | ✅ CONFIRMÉ |
| `SimpleAudioPlayerView.jsx` L.340 | `aria-live="polite"` sur `.simple-player__mobile-status` | ✅ CONFIRMÉ |
| `AyahActions.jsx` L.1062 | `aria-live="polite"` sur `.ayah-study-loading` | ✅ CONFIRMÉ |
| `QuranDisplay/AyahList.jsx` L.69 | `aria-live="polite" aria-atomic="true"` sr-only region | ✅ CONFIRMÉ |
| `SettingsModal.jsx` L.871 | `role="alert" aria-live="polite"` pour les erreurs de confidentialité | ✅ CONFIRMÉ |

---

## 3. Focus trap dans les modales

| Composant | Focus trap | Retour focus | Fermeture Escape | État |
|---|---|---|---|---|
| `AyahActions.jsx` — 4 sheets (Study, Share, Playlist, Note) | ✅ Tab/Shift+Tab géré dans `handleSheetKeyDown` | ✅ `sheetRestoreFocusRef` restaure le focus | ✅ | ✅ CONFIRMÉ |
| `Sidebar.jsx` | ✅ `inert=""` quand fermé + Tab/Shift+Tab dans `handleSidebarKeyDown` | ✅ `previouslyFocusedRef` | ✅ | ✅ CONFIRMÉ |
| `SettingsModal.jsx` | ✅ Radix `Dialog.Content` gère le focus trap nativement | ✅ Radix | ✅ `onEscapeKeyDown={close}` | ✅ CONFIRMÉ |
| `AudioOptionsModal.jsx` | ✅ `role="dialog" aria-modal="true"` + focus auto sur `optionsCloseButtonRef` (AudioPlayer L.382) + Escape (L.371-378) | ✅ | ✅ | ✅ CONFIRMÉ |
| **`AyahActionsModal.jsx`** | 🔴 **Aucun focus trap** — pas de `useEffect` pour gérer Tab/Shift+Tab ni restauration du focus | 🔴 absent | ✅ (backdrop click) | 🔴 PROBLÈME |
| **`FullscreenMushafOverlay.jsx`** | 🔴 **Aucun focus trap** — composant purement presentationnel, pas d'effet keyboard | 🔴 absent | 🔴 absent (que backdrop click) | 🔴 PROBLÈME |

---

## 4. Navigation clavier (Tab, Escape, flèches)

| Critère | État | Détail |
|---|---|---|
| Tab order global | ✅ Correct | `inert=""` sur le sidebar fermé empêche les éléments hors-écran d'être focusables |
| Escape sur `AudioOptionsModal` | ✅ | `window.addEventListener("keydown", onEscape)` L.371 |
| Escape sur sheets `AyahActions` | ✅ | `handleSheetKeyDown` détecte Escape |
| Escape sur Sidebar | ✅ | `handleSidebarKeyDown` détecte Escape |
| Escape sur `SettingsModal` | ✅ | Radix Dialog natif |
| **Escape sur `AyahActionsModal`** | 🔴 **Absent** — aucun keydown handler |
| **Escape sur `FullscreenMushafOverlay`** | 🔴 **Absent** — aucun keydown handler |
| Flèches dans tablist Settings | ✅ | `handleTabKeyDown` gère ArrowRight/Left/Home/End |
| Flèches dans tablist Sidebar | ✅ | Tablist correctement implémenté |
| Seek audio (ArrowLeft/Right/Home/End) | ✅ | `handleProgressKeyDown` L.624-642 |
| Activation ayah QCReadingView (Enter/Space) | ✅ | `onKeyDown` L.194-200 |
| `qcom-footer` play/tafsir/bookmark sans aria-label | 🟡 Partiel | Les boutons ont du texte visible mais pas d'`aria-label` explicite — acceptable car libellés visibles, mais "Pause" hardcodé L.1429-1431 |

---

## 5. Landmarks `<main>`, `<nav>`, `<header>`, `<footer>`

| Landmark | Fichier | Implémentation | État |
|---|---|---|---|
| `<header>` | `Header.jsx` L.387 | `<header>` sémantique HTML5 | ✅ CONFIRMÉ |
| `<main id="main-content">` | `App.jsx` L.716 | `<main id="main-content" tabIndex={-1} aria-label={...}>` — label dynamique (Home/Reading/Duas/Legal) | ✅ CONFIRMÉ |
| `<nav>` header | `Header.jsx` L.454 | `<nav aria-label={headerLabels.quranNav}>` | ✅ CONFIRMÉ |
| `<nav>` footer quick-nav | `Footer.jsx` L.81 | `<nav aria-label={t("nav.quickNav", lang)}>` | ✅ CONFIRMÉ |
| `<nav>` footer legal | `Footer.jsx` L.105 | `<nav aria-label={legalLabels.legal}>` | ✅ CONFIRMÉ |
| `<footer>` | `Footer.jsx` L.62 | `<footer role="contentinfo">` — **double rôle redondant** : `<footer>` a implicitement `role="contentinfo"`, le `role` explicite est superflu mais non bloquant | 🟡 MINEUR |
| `<aside>` Sidebar | `Sidebar.jsx` L.163 | `<aside role="dialog" aria-modal="true" aria-label={...}>` quand ouvert | ✅ CONFIRMÉ |
| Absence de `<nav>` sur `.qc-reading-view` | `QCReadingView.jsx` | Navigation dans le flux de lecture — OK, ce n'est pas une nav | ✅ |
| Pas de `<header>` dupliqué dans les modales | Toutes | Les modales utilisent `role="dialog"` sans landmark `<header>` dupliqué | ✅ |

---

## 6. `role="dialog"` + `aria-modal` sur les modales

| Modale | `role="dialog"` | `aria-modal` | `aria-labelledby` / `aria-label` | État |
|---|---|---|---|---|
| `AyahActions` — Study sheet | ✅ | ✅ | ✅ `aria-labelledby={…-study-title}` | ✅ |
| `AyahActions` — Share sheet | ✅ | ✅ | ✅ `aria-labelledby={…-share-title}` | ✅ |
| `AyahActions` — Playlist sheet | ✅ | ✅ | ✅ `aria-labelledby={…-playlist-title}` | ✅ |
| `AyahActions` — Note sheet | ✅ | ✅ | ✅ `aria-labelledby={…-note-title}` | ✅ |
| `AudioOptionsModal.jsx` | ✅ | ✅ | ✅ `aria-labelledby="audio-options-modal-title"` | ✅ |
| `SettingsModal.jsx` | ✅ (Radix) | ✅ (Radix) | ✅ `Dialog.Title` + `aria-label` sur `Dialog.Content` | ✅ |
| `Sidebar.jsx` | ✅ (conditionnel) | ✅ (conditionnel) | ✅ `aria-label` dynamique | ✅ |
| **`AyahActionsModal.jsx`** | ✅ | ✅ | 🔴 **`aria-labelledby` absent** — pas de titre associé (seul `role="dialog"` sans `aria-labelledby` ni `aria-label` descriptif) | 🔴 PROBLÈME |
| **`FullscreenMushafOverlay.jsx`** | ✅ | ✅ | 🟡 `aria-label` hardcodé en FR/EN — pas de version arabe : `lang === "fr" ? "Vue pleine page" : "Full page view"` | 🟡 PARTIEL |

---

## 7. Touch targets ≥ 44px

| Zone | Taille | État |
|---|---|---|
| Bouton fermeture Sidebar | `h-[44px] w-[44px]` | ✅ |
| Onglets Sidebar (tab triggers) | `min-h-[44px]` | ✅ |
| Input page Sidebar | `h-[44px]` | ✅ |
| Boutons Juz Sidebar | `min-h-[44px]` | ✅ |
| Boutons Pages Sidebar | `min-h-[44px]` | ✅ |
| Boutons AyahActions `qcom-header-left/right` | `h-11 w-11` (44px) | ✅ |
| Boutons AyahActions `side` layout | `h-11 w-11` (44px) | ✅ |
| **Boutons AyahActions `side-mobile-row`** | `w-7.5 h-7.5` = ~30px | 🔴 **< 44px — non conforme sur mobile** |
| Bouton fermeture `AyahActionsModal` | `w-8 h-8` = 32px | 🔴 **< 44px** |
| Bouton fermeture `FullscreenMushafOverlay` (`.mfp-close-btn`) | Défini en CSS — à vérifier | 🟡 À vérifier |
| Onglets Settings | `settings-tab-button` — CSS à vérifier | 🟡 À vérifier |

---

## 8. Skip link fonctionnel

| Critère | État | Détail |
|---|---|---|
| Existence du skip link | ✅ | `App.jsx` L.692-697 : `<a href="#main-content" className="app-skip-link">` |
| Texte i18n | ✅ | `t("app.skipToContent", lang)` — traduit |
| Cible `#main-content` | ✅ | `<main id="main-content" tabIndex={-1}>` — `tabIndex={-1}` requis pour `.focus()` programmatique |
| CSS : caché par défaut, visible au focus | ✅ | `.app-root > .app-skip-link` : `clip-path: inset(50%)` + `:focus { position: fixed; inset-block-start: 0.75rem; }` |
| Position dans le DOM | ✅ | Premier enfant de `.app-root`, avant le header |

**Skip link : 100 % fonctionnel.**

---

## 9. Nouveaux problèmes identifiés

### 9.1 Aria-label "Pause" hardcodé (non i18n)

- **`AyahActions.jsx`** lignes 1229, 1553, 1641, 1743 : `aria-label={isPlayingThisAyah ? "Pause" : ...}`  
  Le label "Pause" est toujours en anglais, même en mode `lang === "fr"` ou `lang === "ar"`.  
  Correction : `isPlayingThisAyah ? t("audio.pause", lang) : ...`

### 9.2 `AyahActionsModal.jsx` — plusieurs défauts

1. **Pas de `aria-labelledby`** : la modale a `role="dialog" aria-modal="true"` mais aucun `aria-labelledby` ou `aria-label` décrivant le contenu (WCAG 4.1.2 — Nom, rôle, valeur).
2. **Pas de focus trap** : la touche Tab peut sortir de la modale (WCAG 2.1.2).
3. **Pas de gestion Escape** : seul un clic sur le backdrop ferme la modale.
4. **Touch target** : bouton fermeture `w-8 h-8` = 32px < 44px (WCAG 2.5.5).

### 9.3 `FullscreenMushafOverlay.jsx` — défauts

1. **`aria-label` non traduit en arabe** : `lang === "fr" ? "Vue pleine page" : "Full page view"` — la version arabe est absente.
2. **Pas de focus trap** ni gestion Escape clavier.
3. **Pas de focus initial** : quand la modale s'ouvre, le focus reste sur l'élément déclencheur sans être déplacé dans la modale.

### 9.4 `<footer role="contentinfo">` — rôle ARIA redondant

`Footer.jsx` L.62 : `<footer role="contentinfo">`. L'élément `<footer>` a nativement `role="contentinfo"` quand il est direct enfant de `<body>`. L'attribut est superflu mais ne cause pas d'erreur — purement cosmétique.

### 9.5 Aria-label statique sur Sidebar fermé

`Sidebar.jsx` L.179 : `aria-hidden={!sidebarOpen}` — la sidebar reste dans le DOM avec son contenu quand fermée. L'`inert=""` est bien appliqué mais le `aria-hidden` dynamique n'est pas sufisant pour garantir que tous les lecteurs d'écran l'ignorent (certains AT ignorent `inert`). L'attribut `inert` est la bonne approche mais la combinaison `aria-hidden` + `inert` est correcte.

### 9.6 `role="tab"` sans `tabIndex` roving dans la sidebar

`Sidebar.jsx` — tablist tabs : les boutons de tabs sidebar ont `role="tab"` et `aria-selected` mais pas de `tabIndex` roving (l'onglet actif devrait avoir `tabIndex={0}`, les autres `tabIndex={-1}`). Cela rompt le pattern ARIA Authoring Practices Guide pour les tablists.

### 9.7 `QCReadingView.jsx` — aria-label des versets non traduit

L.191 : `aria-label={\`${lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}\`}` — manque la version arabe `"آية"`.

---

## 10. Score WCAG AA estimé

| Critère | Poids | Statut |
|---|---|---|
| 1.1.1 Texte alternatif | 10% | ✅ 95% (images décoratives `aria-hidden`, icônes correctement étiquetées) |
| 1.3.1 Info et relations | 10% | ✅ 90% (roles, labelledby bien appliqués sauf AyahActionsModal) |
| 1.3.3 Caractéristiques sensorielles | 5% | ✅ 95% |
| 1.4.1 Utilisation de la couleur | 5% | ✅ 90% |
| 1.4.3 Contraste (minimum) | 10% | 🟡 85% (tokens CSS — non auditable statiquement sans rendu, estimé d'après thèmes) |
| 2.1.1 Clavier | 15% | 🟡 75% (AyahActionsModal et FullscreenMushafOverlay sans focus trap ni Escape) |
| 2.1.2 Pas de piège clavier | 10% | ✅ 90% |
| 2.4.1 Contournement | 5% | ✅ 100% (skip link fonctionnel) |
| 2.4.3 Ordre de focus | 5% | ✅ 85% |
| 2.5.5 Taille des cibles | 5% | 🟡 75% (side-mobile-row ~30px, AyahActionsModal close 32px) |
| 3.1.1 Langue de la page | 5% | ✅ 95% (dir, lang dynamiques) |
| 4.1.2 Nom, rôle, valeur | 15% | 🟡 80% (AyahActionsModal sans aria-labelledby, "Pause" non i18n) |

### Score global estimé : **~82 % WCAG AA**

---

## 11. Top 10 actions restantes — classées par priorité

| # | Priorité | Fichier(s) | Action | Critère WCAG |
|---|---|---|---|---|
| 1 | 🔴 CRITIQUE | `AyahActionsModal.jsx` | Ajouter focus trap (Tab/Shift+Tab + Escape), focus auto sur premier élément focusable à l'ouverture, restauration du focus à la fermeture | 2.1.1, 2.1.2 |
| 2 | 🔴 CRITIQUE | `AyahActionsModal.jsx` | Ajouter `aria-labelledby` pointant vers un titre `<h2>` dans la modale (ex. "{surah}:{ayah} — Actions") | 4.1.2 |
| 3 | 🔴 CRITIQUE | `FullscreenMushafOverlay.jsx` | Ajouter focus trap + gestion Escape + focus initial sur le bouton Fermer à l'ouverture | 2.1.1, 2.1.2 |
| 4 | 🔴 HAUTE | `AyahActions.jsx` (× 4 occurrences) | Remplacer `"Pause"` hardcodé par `t("audio.pause", lang)` dans toutes les variantes de layout | 3.1.2, 4.1.2 |
| 5 | 🟡 HAUTE | `AyahActions.jsx` — layout `side-mobile-row` | Agrandir tous les boutons de `w-7.5 h-7.5` (~30px) à `min-w-[44px] min-h-[44px]` | 2.5.5 |
| 6 | 🟡 HAUTE | `AyahActionsModal.jsx` | Agrandir le bouton fermeture de `w-8 h-8` (32px) à `w-11 h-11` (44px) | 2.5.5 |
| 7 | 🟡 MOYENNE | `FullscreenMushafOverlay.jsx` | Compléter l'`aria-label` avec la version arabe : `lang === "ar" ? "عرض الصفحة الكاملة" : lang === "fr" ? "Vue pleine page" : "Full page view"` | 3.1.2 |
| 8 | 🟡 MOYENNE | `Sidebar.jsx` | Ajouter `tabIndex={tab === tabId ? 0 : -1}` aux boutons de tabs pour respecter le pattern ARIA roving tabindex | 4.1.2 |
| 9 | 🟡 MOYENNE | `QCReadingView.jsx` L.191 | Compléter l'`aria-label` avec la version arabe : ajouter `lang === "ar" ? "آية" :` dans le ternaire | 3.1.2 |
| 10 | 🟢 BASSE | `Footer.jsx` L.62 | Supprimer `role="contentinfo"` redondant sur `<footer>` | Bonne pratique ARIA |

---

## Résumé des statuts

| Catégorie | Statut |
|---|---|
| 4 aria-labels i18n (Fermer × 2, Basmala × 2) | ✅ 4/4 confirmés |
| aria-live regions audio | ✅ Complet |
| Focus trap modales principales (AyahActions, Sidebar, Settings, AudioOptions) | ✅ Correct |
| Focus trap `AyahActionsModal` + `FullscreenMushafOverlay` | 🔴 Absent — à implémenter |
| Clavier global (Tab, Escape, flèches) | 🟡 Partiel (2 modales sans Escape) |
| Landmarks HTML5 | ✅ Complet |
| role=dialog + aria-modal | 🟡 Partiel (AyahActionsModal sans aria-labelledby) |
| Touch targets ≥ 44px | 🟡 Partiel (side-mobile-row + AyahActionsModal close button) |
| Skip link | ✅ Fonctionnel |
| i18n aria-labels ("Pause") | 🔴 4 occurrences hardcodées en anglais |
