# Audit WCAG 2.1 — MushafPlus Quran SPA
**Date :** 2026-07-30  
**Auditeur :** Claude Sonnet 4.6 (analyse statique exhaustive)  
**Portée :** 12 fichiers sources + feuilles de styles thématiques  
**Norme cible :** WCAG 2.1 niveau AA  

---

## Table des matières

1. [Contraste des couleurs (1.4.3 / 1.4.6)](#1-contraste-des-couleurs)
2. [Navigation clavier (2.1.1 / 2.4.3)](#2-navigation-clavier)
3. [Rôles ARIA et landmarks (1.3.1 / 4.1.2)](#3-rôles-aria-et-landmarks)
4. [Images et alternatives textuelles (1.1.1)](#4-images-et-alternatives-textuelles)
5. [Formulaires (1.3.1 / 3.3.1)](#5-formulaires)
6. [Compatibilité lecteur d'écran](#6-compatibilité-lecteur-décran)
7. [RTL et contenu arabe (1.3.4)](#7-rtl-et-contenu-arabe)
8. [Animations (2.3.3)](#8-animations)
9. [Accessibilité du lecteur audio](#9-accessibilité-du-lecteur-audio)
10. [Mobile et cibles tactiles (2.5.5)](#10-mobile-et-cibles-tactiles)
11. [Score WCAG estimé par catégorie](#11-score-wcag-estimé-par-catégorie)

---

## 1. Contraste des couleurs

**Critères :** WCAG 1.4.3 (AA, minimum 4.5:1 texte normal / 3:1 grand texte), 1.4.6 (AAA, 7:1 / 4.5:1), 1.4.11 (composants UI 3:1)

### 1.1 Thèmes principaux — analyse des tokens CSS

**Fichier :** `src/styles/domains/themes4.css`

| Combinaison | Thème | Valeur hex | Ratio estimé | Niveau |
|---|---|---|---|---|
| `--theme-text` sur `--brand-bg` | Light (`#17211c` / `#f7f9f8`) | — | ~15.3:1 | AAA |
| `--theme-text` sur `--brand-bg` | Dark (`#eceae3` / `#101412`) | — | ~17.8:1 | AAA |
| `--theme-text` sur `--brand-bg` | Sepia (`#241505` / `#f3e8cf`) | — | ~13.2:1 | AAA |
| `--theme-text-muted` sur `--brand-bg` | Light (`#5d6c64` / `#f7f9f8`) | — | ~5.7:1 | AA |
| `--theme-text-muted` sur `--brand-bg` | Dark (`#9ca69e` / `#101412`) | — | ~4.6:1 | AA borderline |
| `--theme-text-muted` sur `--brand-bg` | Sepia (`#6b502a` / `#f3e8cf`) | — | ~4.8:1 | AA borderline |
| `--theme-primary` sur `--brand-bg` | Light (`#0b6235` / `#f7f9f8`) | — | ~7.5:1 | AAA |
| `--theme-primary` sur `--brand-bg` | Dark (`#2f9f6b` / `#101412`) | — | ~5.2:1 | AA |
| `--theme-primary` sur `--brand-bg` | Sepia (`#7c4a17` / `#f3e8cf`) | — | ~5.6:1 | AA |

**Diagnostic :** Les couleurs de texte principal et primaires sont conformes sur les trois thèmes. Les valeurs muted en mode dark et sepia frôlent le minimum AA (~4.5:1) — elles doivent être mesurées avec un outil précis (ex. axe DevTools) pour confirmer.

---

### 1.2 Focus visible — thème sepia (ECHEC)

**Fichier :** `src/styles/domains/themes4.css`, ligne ~1611  
**Critère :** WCAG 1.4.11 (3:1 non-text contrast), WCAG 2.4.7  
**Sévérité :** Modérée

```css
/* Problème actuel */
outline: 2px solid rgba(181, 125, 42, 0.70);
```

La transparence à 70% sur fond sépia (`#f3e8cf`) abaisse le ratio effectif de l'anneau de focus au-dessous de 3:1 requis pour les composants non-textuels.

**Correction :**
```css
/* Utiliser une valeur opaque calculée */
outline: 2px solid #a06a1c; /* ratio ~4.5:1 sur #f3e8cf */
outline-offset: 2px;
```

---

### 1.3 Couleurs de Tajweed — plusieurs ECHECS

**Fichier :** `src/styles/domains/themes4.css`  
**Critère :** WCAG 1.4.3  
**Sévérité :** Haute (si le tajwid est le seul moyen de distinguer les règles de lecture)

| Propriété | Valeur | Fond estimé | Ratio | Verdict |
|---|---|---|---|---|
| `--tajwid-qalqala` | `#2fadff` (cyan) | Fond blanc/clair | ~2.3:1 | ECHEC |
| `--tajwid-tafkhim` | `#3f48e6` (bleu) | Fond blanc/clair | ~4.0:1 | ECHEC AA |
| `--tajwid-madd` | `#ce9e00` (or) | Fond blanc/clair | ~2.5:1 | ECHEC |
| `--tajwid-ghunna` | `#09b000` (vert) | Fond blanc/clair | ~5.7:1 | OK AA |

**Note importante :** Si les couleurs de tajwid sont purement décoratives (l'information est disponible autrement), l'exception WCAG 1.4.3 s'applique. Cependant, dans ce cas elles *sont* le support d'information. Recommandation : fournir un mode de lecture sans codage couleur (option existante "lecture simple"), et documenter cela pour les utilisateurs.

**Correction alternative :** Renforcer les couleurs pour le thème clair :
```css
--tajwid-qalqala: #006da8;  /* bleu foncé, ratio >4.5:1 */
--tajwid-tafkhim: #1a28b8;  /* bleu indigo foncé */
--tajwid-madd:    #8a6900;  /* or foncé */
```

---

### 1.4 Texte basse opacité dans AudioPlayer (ECHEC probable)

**Fichier :** `src/components/AudioPlayer.jsx`, lignes ~951 et ~973  
**Critère :** WCAG 1.4.3  
**Sévérité :** Modérée

```js
// Ligne ~951
playerMutedTextClass = "text-[rgba(233,223,202,0.74)]"
// Ligne ~973
playerFadedTextClass = "text-[rgba(195,186,167,0.56)]"
```

Sur la surface sombre du player (fond ~`#1a2b23`), `rgba(233,223,202,0.74)` donne un ratio d'environ 3.8:1 — insuffisant pour texte normal (besoin 4.5:1). La valeur à 0.56 descend probablement sous 2.5:1.

**Correction :**
```js
playerMutedTextClass = "text-[rgba(233,223,202,0.88)]"  // ~5.2:1
playerFadedTextClass = "text-[rgba(195,186,167,0.75)]"  // ~3.5:1 acceptable si grand texte
```

---

### 1.5 SplashScreen — textes à très basse opacité (ECHEC)

**Fichier :** `src/components/SplashScreen.jsx`, styles inline, lignes ~305-348  
**Critère :** WCAG 1.4.3  
**Sévérité :** Faible (SplashScreen est transitoire, <400ms)

| Élément | Couleur | Fond | Ratio | Verdict |
|---|---|---|---|---|
| `.splash-verse-ref` | `rgba(212,175,55,0.45)` | `#102A1A` | ~1.5:1 | ECHEC |
| `.splash-loading-text` | `rgba(212,175,55,0.35)` | `#102A1A` | ~1.2:1 | ECHEC |
| `.splash-skip` | `rgba(255,255,255,0.50)` | `rgba(255,255,255,0.08)` effectif | ~3.0:1 | ECHEC |

Ces éléments sont visibles (même brièvement). Le bouton Skip est particulièrement problématique car il est interactif.

**Correction pour le bouton Skip :**
```css
.splash-skip {
  color: rgba(255, 255, 255, 0.85);   /* ratio >7:1 */
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.30);
}
```

---

## 2. Navigation clavier

**Critères :** WCAG 2.1.1 (toute fonctionnalité accessible au clavier), 2.4.3 (ordre du focus), 2.4.7 (focus visible)

### 2.1 Formulaire GoTo dans Header — label non lié (ECHEC)

**Fichier :** `src/components/Header.jsx`, lignes ~506-515  
**Critère :** WCAG 1.3.1, 2.1.1  
**Sévérité :** Modérée

```jsx
{/* Problème : le <label> ne cible pas l'<input> */}
<label className="text-center text-[0.85rem]...">{goToLabel}</label>
<div className="flex items-center gap-2">
  <input ref={inputRef} type="number" ... />
```

Le `<label>` n'a pas d'attribut `htmlFor` et l'`<input>` n'a pas d'`id` correspondant. Un utilisateur de lecteur d'écran ne saura pas à quoi sert ce champ.

**Correction :**
```jsx
<label htmlFor="goto-input" className="text-center text-[0.85rem]...">{goToLabel}</label>
<div className="flex items-center gap-2">
  <input id="goto-input" ref={inputRef} type="number" ... />
```

---

### 2.2 Action sheets d'AyahActions — absence totale de piège de focus (CRITIQUE)

**Fichier :** `src/components/AyahActions.jsx`, lignes ~1895-2190  
**Critère :** WCAG 2.1.2 (pas de piège clavier — *inverse* : le piège doit exister pour les dialogs), 2.4.3  
**Sévérité :** Critique

Les quatre action sheets (étude, partage, playlist, note) sont rendues via `createPortal` mais n'ont :
- Aucun `role="dialog"`
- Aucun `aria-modal="true"`
- Aucune gestion du focus à l'ouverture (pas de `focus()` sur un élément interne)
- Aucun piège de tab (l'utilisateur peut tabber hors du sheet sans le fermer)
- Seulement un listener `Escape` sur `window` (ligne ~215-226) — insuffisant

**Correction :**
```jsx
// Wrapper de chaque action sheet
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="sheet-title-id"
  ref={sheetRef}
  // ... existing classes
>
  <h2 id="sheet-title-id" className="sr-only">{sheetTitle}</h2>
  {/* content */}
</div>
```

Ajouter un hook `useFocusTrap(sheetRef, isOpen)` identique à celui utilisé dans `Sidebar.jsx` (lignes 100-124).

---

### 2.3 AyahActions — boutons fermeture sans texte accessible (CRITIQUE)

**Fichier :** `src/components/AyahActions.jsx`, lignes ~1921, ~1982, ~2073, ~2148  
**Critère :** WCAG 4.1.2, 2.1.1  
**Sévérité :** Critique

```jsx
{/* Problème : aucun label accessible */}
<button onClick={closeStudy}>
  <X size={16} />
</button>
```

**Correction :**
```jsx
<button onClick={closeStudy} aria-label={t("common.close", lang)}>
  <X size={16} aria-hidden="true" />
</button>
```

---

### 2.4 SettingsModal — Segmented sans état pressed (ECHEC)

**Fichier :** `src/components/SettingsModal.jsx`, lignes ~137-153  
**Critère :** WCAG 4.1.2  
**Sévérité :** Modérée

Le composant `<Segmented>` utilise `data-active` pour indiquer la sélection mais n'expose pas `aria-pressed` ou `aria-selected` aux technologies d'assistance.

**Correction :**
```jsx
<button
  data-active={isActive}
  aria-pressed={isActive}
  onClick={() => onChange(value)}
>
  {label}
</button>
```

---

### 2.5 Sidebar — onglets sans aria-controls (Modéré)

**Fichier :** `src/components/Sidebar.jsx`, lignes ~216-230  
**Critère :** WCAG 4.1.2  
**Sévérité :** Modérée

Les boutons `role="tab"` n'ont pas d'attribut `aria-controls` pointant vers leur panel, et les panels n'ont pas d'`id` correspondant ni de `role="tabpanel"`.

**Correction :**
```jsx
{/* Onglet */}
<button
  role="tab"
  aria-selected={activeTab === tabId}
  aria-controls={`sidebar-panel-${tabId}`}
  id={`sidebar-tab-${tabId}`}
>
  {label}
</button>

{/* Panel */}
<div
  role="tabpanel"
  id={`sidebar-panel-${tabId}`}
  aria-labelledby={`sidebar-tab-${tabId}`}
  hidden={activeTab !== tabId}
>
  {/* content */}
</div>
```

---

### 2.6 Points conformes notables (pour référence)

| Composant | Mécanisme | Verdict |
|---|---|---|
| `Sidebar` focus trap (Tab/Shift+Tab) | lignes 100-124 | CONFORME |
| `Sidebar` Escape ferme | lignes 93-97 | CONFORME |
| `SearchModal` (Radix Dialog) | Radix gère le piège | CONFORME |
| `SettingsModal` navigation Arrow keys | lignes 230-248 | CONFORME |
| `AudioPlayer` progress bar ArrowLeft/Right/Home/End | lignes 624-642 | CONFORME |
| `Header` menu button `aria-expanded` | lignes 401-413 | CONFORME |
| `AudioPlayer` options modal focus rAF | lignes 381-385 | CONFORME |

---

## 3. Rôles ARIA et Landmarks

**Critères :** WCAG 1.3.1 (information et relations), 4.1.2 (nom, rôle, valeur)

### 3.1 Modal reciter dans HomePage — role="dialog" manquant (ECHEC)

**Fichier :** `src/components/HomePage.jsx`, ligne ~1030  
**Critère :** WCAG 4.1.2, WCAG 1.3.1  
**Sévérité :** Haute

```jsx
{/* Problème */}
<div className="reciter-detail-overlay" onClick={...}>
  <div className="reciter-detail-modal">
    {/* contenu modal */}
  </div>
</div>
```

Le piège de focus est bien implémenté (lignes 317-349) et Escape fonctionne, mais le rôle sémantique est absent.

**Correction :**
```jsx
<div className="reciter-detail-overlay" role="presentation" onClick={...}>
  <div
    className="reciter-detail-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="reciter-modal-title"
  >
    <h2 id="reciter-modal-title" className="sr-only">{reciterName}</h2>
    {/* contenu */}
  </div>
</div>
```

---

### 3.2 Action sheets AyahActions — aucun rôle sémantique (CRITIQUE)

**Fichier :** `src/components/AyahActions.jsx`, lignes ~1895-2190  
**Critère :** WCAG 4.1.2  
**Sévérité :** Critique — déjà détaillé en 2.2

---

### 3.3 AudioPlayer — aria-live absent en mode lecture normale (ECHEC)

**Fichier :** `src/components/AudioPlayer.jsx`, lignes ~1124-1133  
**Critère :** WCAG 4.1.3 (messages de statut)  
**Sévérité :** Modérée

La région `aria-live="polite"` n'existe que quand `memMode` est actif. En lecture normale, les changements de verset/sourate ne sont pas annoncés.

**Correction :**
```jsx
{/* Déplacer la région live en dehors de la condition memMode */}
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {currentSurahName && currentAyah
    ? `${currentSurahName}, ${t("ayah", lang)} ${currentAyah}`
    : null}
</div>
```

---

### 3.4 AyahActions tablist "étude" sans aria-label (Modéré)

**Fichier :** `src/components/AyahActions.jsx`, ligne ~1939  
**Critère :** WCAG 4.1.2  
**Sévérité :** Modérée

```jsx
<div role="tablist">  {/* pas d'aria-label */}
```

**Correction :**
```jsx
<div role="tablist" aria-label={t("study.tabs.label", lang)}>
```

---

### 3.5 Inventaire complet des landmarks — conformes

| Landmark | Fichier | Attribut | Verdict |
|---|---|---|---|
| `<header role="banner">` | Header.jsx:388 | `role="banner"` | CONFORME |
| `<footer role="contentinfo">` | Footer.jsx:42 | `role="contentinfo"` | CONFORME |
| `<nav aria-label>` footer nav | Footer.jsx:62 | `aria-label` | CONFORME |
| `<nav aria-label>` footer legal | Footer.jsx:85 | `aria-label` | CONFORME |
| `role="dialog"` Sidebar | Sidebar.jsx:188 | dynamique open/close | CONFORME |
| `aria-hidden={!sidebarOpen}` | Sidebar.jsx:179 | — | CONFORME |
| `inert` Sidebar quand fermé | Sidebar.jsx:181 | — | CONFORME |
| `inert` Header quand sidebar ouverte | Header.jsx:394-396 | — | CONFORME |
| `Dialog.Title` / `Dialog.Description` | SearchModal.jsx, SettingsModal.jsx | Radix | CONFORME |
| `aria-modal="true"` | SearchModal.jsx:296 | — | CONFORME |
| `role="tablist"` Sidebar | Sidebar.jsx:216-220 | `aria-label` | CONFORME |
| `role="tablist"` SettingsModal | SettingsModal.jsx:923 | — | CONFORME |
| Section lecture `aria-label` | HomePage.jsx:936-944 | — | CONFORME |

---

## 4. Images et alternatives textuelles

**Critère :** WCAG 1.1.1 (contenu non textuel)

### 4.1 AlertCircle icon — aria-hidden manquant

**Fichier :** `src/components/AudioPlayer.jsx`, ligne ~1141  
**Critère :** WCAG 1.1.1  
**Sévérité :** Faible (l'erreur est dans un `role="alert"` avec texte adjacent)

```jsx
{/* Problème */}
<AlertCircle size={16} />
<span>{audioError}</span>
```

L'icône sera lue par certains lecteurs d'écran (VoiceOver macOS) comme "image" ou son nom par défaut Lucide.

**Correction :**
```jsx
<AlertCircle size={16} aria-hidden="true" />
<span>{audioError}</span>
```

---

### 4.2 AyahActions — boutons fermeture icône-seule (CRITIQUE)

**Fichier :** `src/components/AyahActions.jsx`, lignes ~1921, ~1982, ~2073, ~2148  
**Critère :** WCAG 1.1.1, 4.1.2  
**Sévérité :** Critique — déjà détaillé en 2.3

---

### 4.3 AyahActions — faIcon() sans aria-hidden

**Fichier :** `src/components/AyahActions.jsx`, lignes ~580-600 (fonction `faIcon`)  
**Critère :** WCAG 1.1.1  
**Sévérité :** Modérée

La fonction utilitaire `faIcon()` retourne des composants Lucide sans `aria-hidden="true"`. Quand ces icônes sont utilisées dans des boutons ayant déjà un label texte, l'icône sera lue en doublon.

**Correction :**
```jsx
const faIcon = (Icon, props = {}) => <Icon size={16} aria-hidden="true" {...props} />;
```

---

### 4.4 AyahActions — boutons qcom-footer avec title mais sans aria-label

**Fichier :** `src/components/AyahActions.jsx`, layout `qcom-footer`  
**Critère :** WCAG 4.1.2  
**Sévérité :** Modérée

L'attribut `title` n'est pas garanti d'être annoncé par les lecteurs d'écran, surtout sur mobile (pas de survol). Remplacer par `aria-label`.

**Correction :**
```jsx
<button title={label} aria-label={label}>
  <Icon aria-hidden="true" />
</button>
```

---

### 4.5 Points conformes

| Élément | Fichier | Traitement | Verdict |
|---|---|---|---|
| Particules / halo / arabesque SplashScreen | SplashScreen.jsx | `aria-hidden="true"` | CONFORME |
| `PlatformLogo` | SplashScreen.jsx | prop `decorative` | CONFORME |
| Icônes footer nav | Footer.jsx:73-75 | `aria-hidden="true"` | CONFORME |
| Verse icon footer | Footer.jsx:45 | `aria-hidden="true"` | CONFORME |
| Orbs background HomePage | HomePage.jsx:892-907 | `aria-hidden="true"` | CONFORME |
| `SettingsReciterAvatar` img | SettingsModal.jsx | `alt=""` | CONFORME |
| Boutons Header avec icônes | Header.jsx | `aria-label` séparé | CONFORME |

---

## 5. Formulaires

**Critères :** WCAG 1.3.1 (info et relations), 3.3.1 (identification d'erreur), 3.3.2 (étiquettes)

### 5.1 Header GoTo input — label non associé (ECHEC)

**Fichier :** `src/components/Header.jsx`, lignes ~506-515  
**Critère :** WCAG 1.3.1, 3.3.2  
**Sévérité :** Haute — déjà détaillé en 2.1

---

### 5.2 SettingsModal — select police sans label htmlFor (ECHEC)

**Fichier :** `src/components/SettingsModal.jsx`, ligne ~539  
**Critère :** WCAG 1.3.1, 3.3.2  
**Sévérité :** Haute

```jsx
{/* Problème : le <h3> précédent n'est pas lié au select */}
<h3>Police de lecture</h3>
<select id="settings-font-family">
```

**Correction :**
```jsx
<label htmlFor="settings-font-family">Police de lecture</label>
<select id="settings-font-family">
```
Ou utiliser `aria-labelledby` si le `<h3>` doit rester :
```jsx
<h3 id="font-family-label">Police de lecture</h3>
<select id="settings-font-family" aria-labelledby="font-family-label">
```

---

### 5.3 SettingsModal — champ recherche récitant sans label (ECHEC)

**Fichier :** `src/components/SettingsModal.jsx`, ligne ~644  
**Critère :** WCAG 1.3.1, 3.3.2  
**Sévérité :** Haute

```jsx
{/* Problème : SearchIcon est aria-hidden, aucun label associé */}
<SearchIcon aria-hidden="true" />
<input id="settings-reciter-search" type="text" placeholder="Rechercher..." />
```

**Correction :**
```jsx
<label htmlFor="settings-reciter-search" className="sr-only">
  {t("settings.searchReciter", lang)}
</label>
<SearchIcon aria-hidden="true" />
<input id="settings-reciter-search" type="text"
  placeholder={t("settings.searchReciterPlaceholder", lang)} />
```

---

### 5.4 AyahActions — note textarea sans label

**Fichier :** `src/components/AyahActions.jsx`, lignes ~1162 et ~2162  
**Critère :** WCAG 1.3.1  
**Sévérité :** Modérée

```jsx
{/* Problème : seulement un placeholder */}
<textarea placeholder={t("note.placeholder", lang)} />
```

**Correction :**
```jsx
<label htmlFor="ayah-note-textarea" className="sr-only">
  {t("note.label", lang)}
</label>
<textarea id="ayah-note-textarea" placeholder={t("note.placeholder", lang)} />
```

---

### 5.5 Points conformes — gestion d'erreur et labels

| Élément | Fichier | Mécanisme | Verdict |
|---|---|---|---|
| `SwitchRow` labels | SettingsModal.jsx | `<label htmlFor={id}>` | CONFORME |
| `SliderRow` labels | SettingsModal.jsx | `<label htmlFor={id}>` | CONFORME |
| Formulaires Privacy | SettingsModal.jsx | `<label htmlFor>` | CONFORME |
| Erreur Privacy | SettingsModal.jsx:860 | `role="alert"` + `aria-live` | CONFORME |
| Input recherche Sidebar | Sidebar.jsx:248-253 | `aria-label` | CONFORME |
| Bouton effacer filtre | Sidebar.jsx:263-268 | `aria-label` | CONFORME |
| Input page numéro | Sidebar.jsx:437-441 | `aria-label` | CONFORME |
| Erreur audio player | AudioPlayer.jsx:1139 | `role="alert"` | CONFORME |

---

## 6. Compatibilité lecteur d'écran

**Critères :** WCAG 1.3.1, 2.4.1 (contournement de blocs), 2.4.6 (en-têtes), 3.1.1 (langue), 4.1.3 (messages de statut)

### 6.1 Lien d'évitement ("Skip to content") — absent (ECHEC probable)

**Critère :** WCAG 2.4.1  
**Sévérité :** Haute

Aucun lien "Aller au contenu principal" n'a été détecté dans les fichiers audités. Ce lien est indispensable pour les utilisateurs clavier/lecteur d'écran qui doivent naviguer sur la page principale depuis le header.

**Correction :** Ajouter en premier enfant de `<body>` dans `src/App.jsx` ou `src/components/Header.jsx` :
```jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded"
>
  {t("skipToContent", lang)}
</a>

{/* ... plus bas dans la page */}
<main id="main-content">
```

---

### 6.2 Hiérarchie des titres — à vérifier

**Critère :** WCAG 2.4.6  
**Sévérité :** Modérée

- SplashScreen a un `<h1>MushafPlus</h1>` (conforme pour l'écran de démarrage)
- Il n'y a pas de `<h1>` visible dans les fichiers audités pour la page principale — cela doit être vérifié dans `QuranDisplay.jsx` et `HomePage.jsx` pour s'assurer qu'un `<h1>` existe sur chaque vue

**Recommandation :** S'assurer que chaque vue principale expose un `<h1>` sémantique (peut être `sr-only` si visuellement redondant).

---

### 6.3 ReciterDetailFallback — correct (référence)

**Fichier :** `src/components/HomePage.jsx`, lignes ~83-95  
**Verdict :** CONFORME — `role="status"`, `aria-live="polite"`, `aria-label`

---

### 6.4 Aria-live SearchModal — correct (référence)

**Fichier :** `src/components/SearchModal.jsx`, lignes ~449-459  
**Verdict :** CONFORME — `aria-live="polite"`, `aria-atomic="false"`, `aria-label`

---

### 6.5 Annonces AudioPlayer en lecture normale — absent (ECHEC)

Déjà détaillé en 3.3. Un utilisateur de lecteur d'écran ne sait pas quelle sourate/verset est en cours de lecture sans les commandes.

---

### 6.6 SplashScreen barre de chargement — correct

**Fichier :** `src/components/SplashScreen.jsx`, lignes ~179-186  
**Verdict :** CONFORME — `role="status"`, `aria-live="polite"`, texte `sr-only`

---

## 7. RTL et contenu arabe

**Critère :** WCAG 1.3.4 (orientation), WCAG 1.3.2 (séquence signifiante)

### 7.1 Points entièrement conformes

| Mécanisme | Fichier | Détail | Verdict |
|---|---|---|---|
| `document.documentElement.dir = langDir` | AppContext.jsx:813 | Bascule RTL/LTR | CONFORME |
| `document.documentElement.lang = state.lang` | AppContext.jsx:814 | Langue HTML | CONFORME |
| Footer verset `dir="rtl" lang="ar"` | Footer.jsx:53-55 | — | CONFORME |
| SearchModal `lang` et `dir` | SearchModal.jsx:299-300 | — | CONFORME |
| AyahActions `dir="rtl" lang="ar"` | AyahActions.jsx | Aperçu verset | CONFORME |
| Utilitaires Tailwind `rtl:*` | Global | Classes adaptatives | CONFORME |
| `data-theme` sur documentElement | AppContext.jsx:639 | — | CONFORME |
| Détection `prefers-color-scheme` | AppContext.jsx:795-808 | Mode sombre système | CONFORME |

### 7.2 SplashScreen verset — lang="ar" manquant sur le <p>

**Fichier :** `src/components/SplashScreen.jsx`, ligne ~174  
**Critère :** WCAG 3.1.2 (langue des parties)  
**Sévérité :** Faible

```jsx
{/* Problème : direction RTL en CSS mais pas de lang sur l'élément */}
<p className="splash-verse">{v.ar}</p>
```

**Correction :**
```jsx
<p className="splash-verse" lang="ar" dir="rtl">{v.ar}</p>
<p className="splash-verse-ref" lang="ar">{v.ref}</p>
```

---

### 7.3 Titre h1 SplashScreen — pas de direction sur le sous-titre arabe

**Fichier :** `src/components/SplashScreen.jsx`, ligne ~168  
**Critère :** WCAG 3.1.2  
**Sévérité :** Faible

```jsx
<p className="splash-subtitle">القرآن الكريم</p>
```

**Correction :**
```jsx
<p className="splash-subtitle" lang="ar" dir="rtl">القرآن الكريم</p>
```

---

## 8. Animations

**Critère :** WCAG 2.3.3 (animation depuis les interactions — niveau AAA), mais aussi bonnes pratiques WCAG 2.1 via `prefers-reduced-motion`

### 8.1 SplashScreen — aucune media query prefers-reduced-motion (ECHEC)

**Fichier :** `src/components/SplashScreen.jsx`, styles inline lignes ~193-415  
**Critère :** WCAG 2.3.3, EN 301 549  
**Sévérité :** Haute

Les animations suivantes n'ont aucune désactivation via `prefers-reduced-motion` :
- `splashIn` (entrée du contenu, 1s)
- `logoPulse` (3s infini)
- `splashHalo` (4s infini)
- `floatParticle` (6-10s infini par particule — 8 instances)
- `arFlow` (20s infini)
- `blink` (2s infini)
- `shimmerBar` (1.8s infini)

Le mode `perf-low` désactive certaines animations mais ce n'est pas conditionné à `prefers-reduced-motion`.

**Correction :** Ajouter dans le bloc `<style>` :
```css
@media (prefers-reduced-motion: reduce) {
  .splash-content,
  .splash-logo-wrap,
  .splash-halo,
  .splash-arabesque,
  .splash-particle,
  .splash-loader-bar,
  .splash-loading-text {
    animation: none !important;
    transition: none !important;
  }
  .splash-screen {
    transition: opacity 0.01s linear;
  }
  .splash-verse-wrap {
    transition: none;
  }
}
```

---

### 8.2 Points conformes sur les animations

| Élément | Mécanisme | Fichier | Verdict |
|---|---|---|---|
| Orbs HomePage | `motion-safe:animate-pulse` | HomePage.jsx:897 | CONFORME |
| Transitions CSS globales | `@media (prefers-reduced-motion: reduce)` | responsive-all.css:441, 2728 | CONFORME |
| Transitions audio-player | `@media (prefers-reduced-motion: reduce)` | audio-player-simple.css:755 | CONFORME |
| Transitions header | `@media (prefers-reduced-motion: reduce)` | header-enhanced.css:213 | CONFORME |
| Transitions récitation | `@media (prefers-reduced-motion: reduce)` | recitation-polish.css:79, 761 | CONFORME |
| Transitions reading-platform | `@media (prefers-reduced-motion: reduce)` | reading-platform.css:929+ | CONFORME |
| Tailwind `motion-safe:` et `motion-reduce:` | — | tailwind.css | CONFORME |

---

### 8.3 Rotation de versets SplashScreen — transition CSS non couverte

**Fichier :** `src/components/SplashScreen.jsx`, ligne ~293  
**Critère :** WCAG 2.3.3  
**Sévérité :** Modérée

```css
.splash-verse-wrap {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
```

Cette transition n'est pas désactivée par `prefers-reduced-motion`. Couverte par la correction 8.1 ci-dessus.

---

## 9. Accessibilité du lecteur audio

**Critères :** WCAG 2.1.1 (clavier), 4.1.2 (nom/rôle/valeur), 4.1.3 (messages de statut)

### 9.1 Points conformes

| Fonctionnalité | Ligne | Détail | Verdict |
|---|---|---|---|
| Barre de progression keyboard | ~624-642 | ArrowLeft/Right/Home/End | CONFORME |
| Modal options — focus géré | ~381-385 | `rAF + focus()` | CONFORME |
| Modal options — Escape ferme | ~370-378 | — | CONFORME |
| Erreur audio `role="alert"` | ~1139 | annonce immédiate | CONFORME |
| MediaSession API | — | contrôles OS/casque | CONFORME |

---

### 9.2 aria-live absent en lecture normale (ECHEC)

**Fichier :** `src/components/AudioPlayer.jsx`, lignes ~1124-1133  
**Critère :** WCAG 4.1.3  
**Sévérité :** Haute — déjà détaillé en 3.3

---

### 9.3 Icône AlertCircle — aria-hidden manquant

**Fichier :** `src/components/AudioPlayer.jsx`, ligne ~1141  
**Critère :** WCAG 1.1.1  
**Sévérité :** Faible — déjà détaillé en 4.1

---

### 9.4 Barre de progression — role="slider" et aria-valuenow à vérifier

**Fichier :** `src/components/audioPlayer/SimpleAudioPlayerView.jsx`  
**Critère :** WCAG 4.1.2  
**Sévérité :** Haute (non audité directement)

Le gestionnaire clavier est dans `AudioPlayer.jsx` mais le rendu du slider est délégué à `SimpleAudioPlayerView.jsx`. Ce fichier n'était pas dans le périmètre d'audit initial. Il convient de vérifier que :
```jsx
<div
  role="slider"
  aria-valuemin={0}
  aria-valuemax={duration}
  aria-valuenow={currentTime}
  aria-valuetext={`${formatTime(currentTime)} sur ${formatTime(duration)}`}
  aria-label={t("player.progress", lang)}
  tabIndex={0}
  // handlers clavier
>
```

---

### 9.5 Texte de statut — opacité insuffisante (ECHEC)

**Fichier :** `src/components/AudioPlayer.jsx`, lignes ~951 et ~973  
**Critère :** WCAG 1.4.3  
**Sévérité :** Modérée — déjà détaillé en 1.4

---

## 10. Mobile et cibles tactiles

**Critère :** WCAG 2.5.5 (taille cible minimum 44×44 CSS px), WCAG 2.5.8 (AA 2.2 : 24×24)

### 10.1 AyahActions — multiples boutons sous 44px (ECHECS)

**Fichier :** `src/components/AyahActions.jsx`  
**Critère :** WCAG 2.5.5  
**Sévérité :** Haute

| Layout | Élément | Taille CSS mesurée | Verdict |
|---|---|---|---|
| `side-mobile-row` | bouton play | `w-7.5 h-7.5` (~30px) | ECHEC |
| `side` | bouton partage | `w-8 h-8` (32px) | ECHEC |
| `compact` | boutons inline | `h-[2.06rem] w-[2.06rem]` (~33px) | ECHEC |
| `qcom-footer` | boutons actions | taille non mesurée | À vérifier |

**Correction pour `side-mobile-row` :**
```jsx
{/* Augmenter la taille du bouton OU ajouter une zone de tap étendue */}
<button
  className="relative flex items-center justify-center w-11 h-11"
  /* ou: padding augmenté pour hit area */
>
  <PlayIcon className="w-7.5 h-7.5" aria-hidden="true" />
</button>
```

**Ou via CSS (`touch-action` zone étendue) :**
```css
.ayah-action-btn-sm {
  min-width: 44px;
  min-height: 44px;
  /* L'icône reste petite visuellement mais la zone de tap est correcte */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### 10.2 SplashScreen — bouton Skip trop petit (ECHEC)

**Fichier :** `src/components/SplashScreen.jsx`, ligne ~390  
**Critère :** WCAG 2.5.5  
**Sévérité :** Modérée

```css
.splash-skip {
  padding: 0.4rem 1rem;   /* hauteur effective ~26px */
  font-size: 0.75rem;
}
```

**Correction :**
```css
.splash-skip {
  padding: 0.7rem 1.4rem;  /* hauteur ~44px */
  font-size: 0.85rem;
  min-height: 44px;
}
```

---

### 10.3 Points conformes

| Élément | Taille | Verdict |
|---|---|---|
| Bouton hamburger Header | 44px (Tailwind `h-11 w-11` ou équivalent) | CONFORME probable |
| Boutons de navigation prev/next | vérifier `h-10 w-10` minimum | À confirmer |
| Tuiles de thème SettingsModal | suffisamment grandes | CONFORME probable |
| Boutons récitants | `aria-pressed`, zone convenable | CONFORME probable |

---

## 11. Score WCAG estimé par catégorie

| # | Catégorie | Problèmes critiques | Problèmes modérés | Score estimé | Niveau atteint |
|---|---|---|---|---|---|
| 1 | Contraste couleurs | 3 (tajwid, player opacity, splash) | 2 (sepia focus, muted dark) | ~72% | **A/AA partiel** |
| 2 | Navigation clavier | 2 (action sheets, boutons X) | 3 (GoTo label, Segmented, sidebar tabs) | ~65% | **A/AA partiel** |
| 3 | ARIA roles & landmarks | 2 (action sheets, reciter modal) | 3 (AudioPlayer live, tablist labels, aria-controls) | ~70% | **A/AA partiel** |
| 4 | Images & alternatives | 2 (boutons X AyahActions, faIcon) | 2 (AlertCircle, title vs aria-label) | ~75% | **AA partiel** |
| 5 | Formulaires | 0 | 4 (Header GoTo, font select, reciter search, textarea) | ~75% | **AA partiel** |
| 6 | Lecteur d'écran | 1 (skip link absent) | 2 (h1 hiérarchie, audio live) | ~70% | **A/AA partiel** |
| 7 | RTL / Arabe | 0 | 2 (lang="ar" SplashScreen) | ~93% | **AA** |
| 8 | Animations | 1 (SplashScreen sans prefers-reduced-motion) | 1 (transition verse) | ~82% | **AA partiel** |
| 9 | Lecteur audio | 0 critique | 3 (aria-live, slider rôle, contrast) | ~78% | **AA partiel** |
| 10 | Mobile / Touch | 3 (AyahActions layouts, Skip btn) | 1 (qcom-footer) | ~62% | **A partiel** |

---

### Résumé exécutif

**Score global estimé : AA partiel (~74%)**

#### Blocages critiques (à corriger en priorité absolue)

1. **AyahActions action sheets** : Ni `role="dialog"`, ni `aria-modal`, ni piège de focus, ni label accessible sur les boutons de fermeture. Toutes les 4 sheets (étude, partage, playlist, note) sont inaccessibles au clavier et au lecteur d'écran. → `AyahActions.jsx` lignes ~1895-2190
2. **Skip link absent** : Aucun lien d'évitement de navigation. → Ajouter dans `App.jsx` ou `Header.jsx`
3. **Boutons de fermeture icône-seule** : 4 boutons `<X>` sans label. → `AyahActions.jsx` lignes ~1921, ~1982, ~2073, ~2148

#### Corrections importantes (priorité haute)

4. **Header GoTo** : `<label>` non lié à `<input>`. → `Header.jsx` ligne ~506
5. **SettingsModal** : `select` police et input recherche récitant sans label. → `SettingsModal.jsx` lignes ~539, ~644
6. **AudioPlayer** : Pas d'annonce `aria-live` en lecture normale. → `AudioPlayer.jsx` lignes ~1124
7. **SplashScreen** : Aucune media query `prefers-reduced-motion`. → `SplashScreen.jsx` lignes ~193-415
8. **Cibles tactiles** : 3 layouts AyahActions avec boutons <44px. → `AyahActions.jsx`

#### Améliorations mineures (priorité normale)

9. Sepia focus-visible semi-transparent → `themes4.css` ligne ~1611
10. Couleurs Tajweed insuffisantes en thème clair → `themes4.css`
11. Texte audio player à basse opacité → `AudioPlayer.jsx` lignes ~951, ~973
12. `lang="ar"` manquant sur les `<p>` arabes SplashScreen → `SplashScreen.jsx`
13. `aria-pressed` manquant sur `Segmented` → `SettingsModal.jsx` lignes ~137-153
14. `aria-controls` manquant sur les tabs Sidebar → `Sidebar.jsx` lignes ~216-230
15. `aria-label` manquant sur tablist étude AyahActions → `AyahActions.jsx` ligne ~1939

---

### Plan de correction priorisé

| Priorité | Action | Effort | Impact |
|---|---|---|---|
| P0 | Ajouter `role="dialog"` + focus trap sur les 4 action sheets | ~2h | Critique |
| P0 | Ajouter `aria-label` sur les 4 boutons fermeture (X) | ~30min | Critique |
| P0 | Ajouter skip link dans App.jsx | ~30min | Haute |
| P1 | Lier label GoTo à l'input (Header) | ~15min | Haute |
| P1 | Ajouter labels pour select police et input récitant (Settings) | ~30min | Haute |
| P1 | Ajouter aria-live non-conditionnel AudioPlayer | ~45min | Haute |
| P1 | Ajouter prefers-reduced-motion dans SplashScreen | ~30min | Haute |
| P1 | Corriger tailles touch targets AyahActions | ~1h | Haute |
| P2 | Ajouter aria-controls/aria-labelledby sur tabs Sidebar | ~1h | Modérée |
| P2 | Corriger couleurs Tajweed ou documenter l'exception | ~1h | Modérée |
| P2 | Corriger opacité texte AudioPlayer | ~15min | Modérée |
| P2 | Ajouter aria-pressed sur Segmented | ~30min | Modérée |
| P3 | Ajouter lang="ar" sur éléments arabes SplashScreen | ~15min | Faible |
| P3 | Corriger focus-visible sépia | ~15min | Faible |
| P3 | Ajouter aria-hidden sur AlertCircle | ~5min | Faible |

---

*Audit réalisé par analyse statique du code source. Une validation dynamique avec axe-core, NVDA/VoiceOver et un audit de contraste instrumenté (ex. Colour Contrast Analyser) est recommandée pour confirmer les ratios borderline et détecter d'éventuels problèmes de rendu dynamique non visibles dans le code.*
