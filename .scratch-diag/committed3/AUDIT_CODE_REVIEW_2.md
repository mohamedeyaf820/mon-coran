# AUDIT_CODE_REVIEW_2 — Branche `perf/load-times-and-bug-fixes`

> Revue réalisée le 2026-07-30 sur le diff `main...HEAD` (337 fichiers, +39 459 / −17 945 lignes)

---

## Sommaire de la branche

Commits principaux (30 derniers) :
- Performance audio, virtualisation du lecteur, karaoke, profils récitateurs
- Corrections a11y (landmarks, i18n, dark-mode, React bugs)
- Sécurité SW (`SKIP_WAITING` + origine), PWA, SEO

---

## Statut des bugs connus

### B1 — Race condition `switchReciter` (AudioPlayer.jsx)
**✅ Corrigé**

`audioService.switchReciter()` utilise maintenant une file d'attente interne (`_reciterSwitchQueue`) basée sur une `Promise` chaînée et un `requestId` (`_reciterSwitchRequestId`). Seul le dernier appel prend effet ; les intermédiaires retournent `false` proprement. `AudioPlayer.jsx` utilise en plus `reciterSwitchingIdRef` comme verrou UI.

Résidu mineur : `handleReciterSelect` ne protège que contre le reciteur actif (`nextReciterId === reciter`), pas contre un double-clic rapide *avant* que `reciterSwitchingIdRef.current` soit positionné (la fenêtre est ~0 ms, peu probable en pratique).

---

### B2 — IntersectionObserver orphan (useAutoScrollAyah.js)
**✅ Corrigé**

La correction est correcte et élégante :
```js
return () => {
  clearTimeout(debounceRef.current);
  observerRef.current?.disconnect();
  observerRef.current = null;
};
```
L'observer est déconnecté dans le cleanup de l'effet ET dans le callback après observation (`observer.disconnect(); observerRef.current = null`). Pas de fuite.

---

### B3 — RAF actif pendant pause (useKaraoke.js)
**✅ Corrigé**

Le hook utilise maintenant `createPausableAnimationLoop` et abonne des listeners `addPlayListener` / `addPauseListener` / `addEndListener`. Le `tick` s'auto-stoppe quand `!audioService.isPlaying`. Le cleanup (`running = false; frameLoop.stop()`) est correct.

---

### B4 — Stale closure `onError` (AudioPlayer.jsx)
**🟡 Partiellement corrigé**

`onError` est dans un `useEffect` avec les dépendances `[dispatch, lang, markReciterAvailable, markReciterUnavailable, reciter, riwaya, set, tryAutoReciterFailover]`. Ces dépendances incluent correctement `reciter` et `riwaya`, ce qui évite le closure stale classique.

**MAIS** : l'effet réassigne directement `audioService.onError = async (error) => { ... }`. Si une erreur survient exactement *pendant* le retour d'un re-render (entre le teardown de l'ancien effet et l'attache du nouveau), l'ancien `onError` est `null` et l'erreur est silencieusement perdue. Ce n'est pas un stale closure mais un **gap d'enregistrement** (~1 frame). Risque faible mais non zéro.

---

### B5 — Événement `end` perdu pendant changement de sourate (useQuranDisplayAudio.js)
**✅ Corrigé**

L'event `end` est abonné via `audioService.addEndListener()` (système de listeners multiples), enregistré dans un `useEffect([], [])` vide qui persiste toute la durée de vie du composant. Le listener lit les valeurs fraîches via `playbackNavigationRef.current` (pattern ref mutable), évitant ainsi toute perte d'événement lors d'un changement de sourate.

---

### S1 — SW opaque response caching (public/sw.js)
**✅ Corrigé**

Toutes les stratégies de cache (Cache-First, Stale-While-Revalidate, NetworkFirst) vérifient maintenant `response.ok` ou `response.status === 200` avant de mettre en cache. Le caching des réponses opaques est impossible car seules les origines same-origin et les API whitelistées (`api.alquran.cloud`, `api.quran.com`) sont mises en cache. Les requêtes cross-origin restantes (audio MP3) ne sont pas interceptées (commentaire explicite ligne 166-167).

---

## Nouveaux bugs trouvés

### NB1 — `sheetRef` partagé entre 4 portails concurrents (AyahActions.jsx)
**🔴 BUG — Sévérité HIGH**

```jsx
// ligne 1968 — showStudy portal
ref={sheetRef}
// ligne 2058 — showShare portal
ref={sheetRef}
// ligne 2163 — showPlaylistMenu portal
ref={sheetRef}
// ligne 2245 — showNote portal
ref={sheetRef}
```

`sheetRef` est une `useRef` unique partagée par 4 portails distincts. En théorie un seul peut être actif à la fois (`activeSheet` est exclusif), mais si deux portails se chevauchent pendant une transition (ex. un `setShowShare(true)` + `setShowStudy(false)` dans le même cycle React), `sheetRef.current` peut pointer vers l'élément faussement fermé.

Plus grave : le focus trap (`useEffect` sur `activeSheet`) lit `sheetRef.current` *après* le `requestAnimationFrame`, donc si un portail se ferme et qu'un autre s'ouvre dans le même render, le focus va vers le mauvais container.

**Correction** : utiliser 4 refs distinctes (`studySheetRef`, `shareSheetRef`, etc.) et passer la ref active dans l'effet de focus.

---

### NB2 — `renderPortal` défini comme fonction interne non-mémoïsée (AyahActions.jsx)
**🟡 Sévérité MEDIUM**

```jsx
const renderPortal = (content) => {
  if (typeof document === "undefined") return null;
  const target = document.querySelector(".app-root") || document.body;
  return createPortal(content, target);
};
```

Cette fonction est redéfinie à chaque render sans `useCallback`. Elle crée un appel `document.querySelector(".app-root")` à chaque render, même quand aucun portail n'est ouvert. Sur des écrans avec beaucoup d'ayahs, cela multiplie les queries DOM. Devrait être `useCallback([], [])` avec la cible mémoïsée.

---

### NB3 — Stale `visibleCount` non réinitialisé à la bonne valeur lors d'un changement de contenu (QCReadingView.jsx)
**🟡 Sévérité MEDIUM**

```jsx
useEffect(() => {
  setVisibleCount(getInitialVisibleCount(items.length, displayMode));
}, [contentKey, displayMode, items.length]);
```

L'effet dépend de `items.length`, mais `items` est recalculé à chaque render depuis `surahGroups` (qui peut changer indépendamment de `contentKey`). Si `items.length` reste identique mais que le contenu change (ex. changement de riwaya sur la même sourate avec le même nombre d'ayahs), `visibleCount` ne se réinitialise pas car `contentKey` dépend de `riwaya` — OK dans ce cas. Cependant, le `useEffect` sur `items.length` peut déclencher une réinitialisation intempestive si `items` est reconstruit avec la même taille via un re-render parent, provoquant un flash de scroll.

L'effet devrait dépendre uniquement de `contentKey` (pas de `items.length`).

---

### NB4 — `toggleStudyPanel` : `studyTab` stale dans la closure (AyahActions.jsx)
**🟡 Sévérité MEDIUM**

```jsx
const toggleStudyPanel = (tab = "tafsir") => {
  ...
  setShowStudy((value) => (value && studyTab === tab ? false : true));
};
```

`studyTab` est une variable d'état lue en closure directe (pas via `useCallback`). `toggleStudyPanel` n'est pas mémoïsée. Si `studyTab` change entre deux renders sans que `toggleStudyPanel` soit recréée (cas rare mais possible en mode concurrent React 18), la comparaison `studyTab === tab` lira une valeur obsolète. Solution : lire la valeur state actuelle dans le setter fonctionnel, ou mémoïser avec `[studyTab]`.

---

### NB5 — `currentSurah` absent du `useAppSelector` de `AudioPlayer` (AudioPlayer.jsx)
**🔴 BUG — Sévérité HIGH**

```jsx
const state = useAppSelector(
  (current) => ({
    lang: current.lang,
    // ...
    // currentSurah est ABSENT du sélecteur !
  }),
  shallowEqual,
);
// ...
const { currentSurah } = state; // ← ligne 856 : destructure state qui ne contient pas currentSurah
currentSurahRef.current = currentSurah; // ← undefined
```

L'objet renvoyé par `useAppSelector` ne contient pas `currentSurah` (lignes 42-64), mais la ligne 856 tente de le destructurer depuis `state`. `currentSurah` sera `undefined`. `currentSurahRef.current` vaudra toujours `undefined`, ce qui empêche la navigation automatique de sourate dans `onAyahChange` (ligne 418 : `if (item.surah && item.surah !== currentSurahRef.current)` sera toujours vrai → navigation à chaque ayah change, même si on est déjà sur la bonne sourate).

**Correction immédiate requise** : ajouter `currentSurah: current.currentSurah` dans le sélecteur `useAppSelector`.

---

### NB6 — Texte hardcodé FR/EN dans AyahActions.jsx
**🟡 i18n — Sévérité LOW-MEDIUM**

Plusieurs chaînes restent hardcodées hors du système `t()` :

- L. 1929 : `"à préférés"` (mélange fr/ar, probablement un bug de copier-coller)  
  ```jsx
  : lang === "ar"
    ? "أضف إلى préférés"  // ← "préférés" en français dans la traduction arabe
  ```
- L. 866 : `"Pin"` en anglais dans la branche `lang === "ar"` du label "Comparer"  
- L. 872 : `"Pin this verse"` comme description en branche `lang === "ar"`  
- L. 1519 : `"Playlists"` hardcodé sans i18n dans le layout `qcom-footer`

---

### NB7 — `AyahActionsModal` : dialog sans `aria-labelledby` ni Escape handler (AyahActionsModal.jsx)
**🟡 A11Y — Sévérité MEDIUM**

```jsx
<div
  role="dialog"
  aria-modal="true"
  // aria-labelledby manquant !
>
```

La modale n'a pas de `aria-labelledby` pointant vers un titre visible. Elle n'a pas non plus de gestion `Escape` intégrée (le focus trap est géré par le composant `AyahActions` enfant via `activeSheet`, mais seulement si un panneau interne est ouvert). Si `AyahActionsModal` est ouvert avec `activeSheet === null`, aucun focus trap ni Escape ne fonctionne.

---

### NB8 — Double déclenchement du timer `audioErrorTimerRef` possible (AudioPlayer.jsx)
**🟡 Sévérité LOW**

Dans `onError` :
```js
if (switched) {
  // ...
  audioErrorTimerRef.current = setTimeout(() => { ... }, 2600);
  return;
}
// ...
audioErrorTimerRef.current = setTimeout(() => { ... }, 5000);
```

Si `tryAutoReciterFailover()` prend plus de 2600 ms et que `onError` est appelé à nouveau pendant ce délai (nouvelle erreur audio), un second timer est créé sans que le premier soit nettoyé (`clearTimeout` est bien appelé en début de fonction, mais *avant* l'`await`). Le second appel concurrent nettoiera `audioErrorTimerRef.current` qui pointe vers le premier, le laissant fuir.

---

### NB9 — `precacheUrls` ne gère pas les URL invalides silencieusement (public/sw.js)
**🟡 Sévérité LOW**

```js
async function precacheUrls(cache, urls, concurrency = 4) {
  // ...
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) {
    throw new Error(`Unable to precache ${url}: ${response.status}`);
  }
```

Un `throw` ici arrête *toute* l'installation du SW (car le résultat est `await`-é dans `precacheAppShell()`). Si un seul asset de `ASSETS_TO_CACHE` retourne une 404 (ex. `/data/reciter-profiles.json` absent en staging), le SW échoue à s'installer. Meilleure pratique : log + skip, ne pas bloquer.

---

### NB10 — `useAutoScrollAyah` : `prevAyahRef` peut se désynchroniser si `userScrolledRef` est vrai (useAutoScrollAyah.js)
**🟡 Sévérité LOW**

```js
if (userScrolledRef.current) return; // retour AVANT la mise à jour de prevAyahRef
prevAyahRef.current = ayahKey;       // ← jamais exécuté si user scrollé
```

Commentaire dans le code : *"Don't scroll if user recently scrolled manually — commit ref AFTER this check so that if we skip here, the next render can retry scroll for the same ayah"*. C'est voulu. Mais : si l'utilisateur scrolle manuellement *pendant exactement le même ayah*, les 5 secondes de cooldown expireront et un re-render causera un scroll automatique non désiré vers un ayah que l'utilisateur a intentionnellement quitté. Le commentaire documente le problème mais le comportement est discutable.

---

### NB11 — `AppContext` : effet reciterRanking déclenché sur changement de `reciterLatencyByKey` (AppContext.jsx)
**🟡 Sévérité LOW — Performance**

```jsx
useEffect(() => {
  if (!state.autoSelectFastestReciter || state.isPlaying) return;
  // ...
}, [
  state.autoSelectFastestReciter,
  state.favoriteReciters,
  state.isPlaying,
  state.reciter,
  state.reciterLatencyByKey,  // ← objet mis à jour fréquemment
  state.reciterAvailabilityById,
  state.riwaya,
]);
```

`reciterLatencyByKey` est un objet mis à jour à chaque mesure de latence pendant la lecture. Cela déclenche un re-run de l'effet (import dynamique + calcul du reciteur préféré) à chaque mesure. L'effet est gardé par `state.isPlaying` mais la vérification arrive *après* le re-mount. Envisager un `useRef` + `debounce` pour la mise à jour de latency.

---

## Problèmes de sécurité

### SEC1 — Pas de Content-Security-Policy sur l'URL `canvas.toBlob` vers `mailto:` (AyahActions.jsx)
**🟡 Sévérité LOW**

`shareEmail()` construit une URL `mailto:` en encodant `getShareText()`. `getShareText()` inclut `ayahData?.text` (donnée externe). Si le texte contient des caractères spéciaux mal encodés, cela pourrait provoquer un mailto injection. `encodeURIComponent` est utilisé correctement — risque mineur.

### SEC2 — `openExternalUrl` non vérifié pour `wa.me`, `t.me`, `x.com` (AyahActions.jsx)
Dépend de l'implémentation de `openExternalUrl` dans `lib/security`. Si elle valide bien les schémas (`https:` uniquement), pas de problème. À vérifier.

---

## Score de qualité global

| Dimension | Score | Notes |
|-----------|-------|-------|
| Correctness (bugs) | 6/10 | NB5 est un bug réel qui affecte la navigation, NB1 est un bug de focus trap |
| Architecture | 8/10 | Pattern ref mutable + listeners bien appliqué, contexte bien segmenté |
| Performance | 8/10 | Virtualisation, RAF pausable, sélecteurs optimisés |
| Sécurité | 8/10 | SW opaque response corrigé, trust check audio URLs, SKIP_WAITING validé |
| Accessibilité | 6/10 | NB7 dialogue sans labelledby, focus trap partiel |
| i18n | 7/10 | Gros effort fait, quelques chaînes hardcodées résiduelles (NB6) |
| Maintenabilité | 7/10 | AyahActions.jsx > 2300 lignes avec 6 layouts — trop grand, difficile à lire |

**Score global : 7.1 / 10**

---

## Top 10 actions prioritaires

| # | Priorité | Fichier | Action |
|---|----------|---------|--------|
| 1 | 🔴 CRITIQUE | `AudioPlayer.jsx` | Ajouter `currentSurah: current.currentSurah` dans le sélecteur `useAppSelector` (NB5) — bug silencieux qui force une navigation à chaque changement d'ayah |
| 2 | 🔴 HIGH | `AyahActions.jsx` | Remplacer `sheetRef` unique par 4 refs distinctes (`studySheetRef`, `shareSheetRef`, `playlistSheetRef`, `noteSheetRef`) pour corriger le focus trap (NB1) |
| 3 | 🟠 MEDIUM | `AyahActionsModal.jsx` | Ajouter `aria-labelledby` pointant vers un titre et un handler `Escape` quand `activeSheet === null` (NB7) |
| 4 | 🟠 MEDIUM | `AyahActions.jsx` | Corriger le bug de traduction `"à préférés"` (chaîne FR dans branche AR, L.1929) et les autres chaînes hardcodées (NB6) |
| 5 | 🟠 MEDIUM | `AyahActions.jsx` | Mémoïser `renderPortal` via `useCallback` avec la cible DOM mémoïsée (NB2) |
| 6 | 🟠 MEDIUM | `QCReadingView.jsx` | Retirer `items.length` des dépendances du `useEffect` de reset de `visibleCount` — ne garder que `contentKey` et `displayMode` (NB3) |
| 7 | 🟡 LOW | `AudioPlayer.jsx` | Corriger le timer `audioErrorTimerRef` double-déclenchement : déplacer `clearTimeout` après l'`await tryAutoReciterFailover()` (NB8) |
| 8 | 🟡 LOW | `public/sw.js` | Remplacer le `throw` dans `precacheUrls` par un `console.warn` + skip pour éviter l'échec total d'installation sur un 404 (NB9) |
| 9 | 🟡 LOW | `AppContext.jsx` | Debouncer la mise à jour de `reciterLatencyByKey` dans l'effet de sélection de reciteur (NB11) |
| 10 | 🟡 LOW | `AyahActions.jsx` | Mémoïser `toggleStudyPanel` avec `[studyTab]` pour éviter le stale closure en React 18 concurrent mode (NB4) |

---

## Bugs connus — récapitulatif final

| ID | Description | Statut |
|----|-------------|--------|
| B1 | switchReciter race condition | ✅ Corrigé |
| B2 | IntersectionObserver orphan | ✅ Corrigé |
| B3 | RAF actif pendant pause | ✅ Corrigé |
| B4 | Stale closure onError | 🟡 Partiellement (gap d'enregistrement ~1 frame) |
| B5 | Événement `end` perdu pendant changement sourate | ✅ Corrigé |
| S1 | SW opaque response caching | ✅ Corrigé |

---

*Rapport généré par analyse statique manuelle sur la branche `perf/load-times-and-bug-fixes` (HEAD: ccd8e05).*
