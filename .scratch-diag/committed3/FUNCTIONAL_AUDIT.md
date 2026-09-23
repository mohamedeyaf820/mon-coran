# Rapport d'audit fonctionnel — MushafPlus
**Date :** 30 juillet 2026 | **Branche :** `perf/load-times-and-bug-fixes`

Ce rapport recense tous les problèmes identifiés lors de l'audit complet de l'application, organisés par plan (bugs, sécurité, accessibilité, performance, i18n, CSS). Les corrections déjà appliquées dans cette session sont marquées ✅.

---

## Statut global des corrections

| Plan | Corrections appliquées | Restantes |
|------|----------------------|-----------|
| Bugs critiques | 5/5 ✅ | 0 |
| Bugs fonctionnels | 3/9 | 6 |
| Sécurité | 4/5 | 1 |
| Accessibilité | 4/5 | 1 |
| Performance | 3/4 | 1 |
| i18n | Tout ✅ | 0 |
| CSS / Design | Tout ✅ | 0 |

---

## A. Bugs fonctionnels

### ✅ Déjà corrigés cette session

**A1 — AppContext: `SET_LOADING(false)` effaçait les erreurs**
- Fichier : `src/context/AppContext.jsx:431`
- Symptôme : erreur de chargement silencieuse, état vide au lieu du message d'erreur
- Fix : `SET_LOADING` n'efface `error` que lors du démarrage d'un load (payload true)

**A2 — AyahActions: 3 timers non nettoyés à l'unmount**
- Fichier : `src/components/AyahActions.jsx`
- Symptôme : setState après démontage, erreurs React "can't perform state update on unmounted component"
- Fix : `useEffect` cleanup + mounted guard sur les appels async bookmark/note

**A3 — AudioPlayer: `onError` handler pouvait bloquer définitivement `autoFailoverBusyRef`**
- Fichier : `src/components/AudioPlayer.jsx:440`
- Symptôme : si le handler levait une exception, `autoFailoverBusyRef.current` restait `true` → plus aucun failover
- Fix : wrapping try/catch, reset du ref en catch

**A4 — CSS dark mode: texte arabe invisible**
- Fichier : `src/styles/domains/reading-platform.css:2947,2959`
- Symptôme : `color: #1a1a1a !important` rendait le texte noir sur fond sombre
- Fix : `color: var(--text-primary, #1a1a1a) !important`

**A5 — CSS: thème sombre recevait le fond parchemin sépia**
- Fichier : `src/styles/tailwind.css:20819-20825`
- Symptôme : `[data-theme="dark"] { --cpv-bg: #fdf6e3 }` (couleur sépia)
- Fix : séparation des blocs CSS `dark` et `sepia`

---

### 🔴 Restants — Priorité haute

**B1 — switchReciter non réentrant (double-clic / race condition)**
- Fichier : `src/components/AudioPlayer.jsx` — fonction `switchReciter`
- Symptôme : deux clics rapides sur "changer récitateur" peuvent démarrer deux initialisations en parallèle, laisser l'état dans un limbo (reciter affiché ≠ reciter audio)
- Correction : ajouter un `switchingRef.current` guard en début de `switchReciter`, identique au pattern `autoFailoverBusyRef`

**B2 — IntersectionObserver orphelin après unmount**
- Fichier : `src/hooks/useAutoScrollAyah.js:80`
- Symptôme : `IntersectionObserver` créé au mount mais pas `disconnect()`é dans le cleanup du useEffect → fuite mémoire + callbacks sur DOM démonté
- Correction :
```js
useEffect(() => {
  const obs = new IntersectionObserver(callback, options);
  obs.observe(target);
  return () => obs.disconnect();
}, [deps]);
```

**B3 — RAF actif pendant la pause en mode page (Karaoke)**
- Fichier : `src/hooks/useKaraoke.js:32`
- Symptôme : `requestAnimationFrame` continue de tourner pendant la pause → CPU inutile, ~15 instances si l'utilisateur pagine rapidement
- Correction : annuler le RAF avec `cancelAnimationFrame(rafRef.current)` dans le cleanup et lors du passage à `playing = false`

**B4 — Stale closure sur `onError` et `reciterSwitchingId`**
- Fichier : `src/components/AudioPlayer.jsx:383`
- Symptôme : `onError` est défini dans un `useEffect` avec liste de dépendances incomplète → il capture une version stale de `reciterSwitchingId` et d'autres états
- Correction : utiliser un `useRef` pour stocker la valeur courante ou inclure `reciterSwitchingId` dans les dépendances du useEffect

**B5 — Événement `end` perdu pendant le changement de sourate**
- Fichier : `src/hooks/useQuranDisplayAudio.js:48`
- Symptôme : quand l'utilisateur change de sourate pendant la lecture, l'événement `end` de l'ayah courante peut se déclencher après le changement, causant une navigation audio incorrecte
- Correction : annuler le listener `end` en début de transition (cleanup synchrone avant `audioService.stop()`)

**B6 — `loadAudioService` : erreur avalée silencieusement**
- Fichier : `src/context/AppContext.jsx:663`
- Symptôme : si `loadAudioService()` échoue (réseau, init), l'erreur est catchée mais pas dispatchée — l'utilisateur voit un spinner infini
- Correction :
```js
} catch (e) {
  dispatch({ type: "SET_ERROR", payload: t("audio.loadError", lang) });
  dispatch({ type: "SET_LOADING", payload: false });
}
```

---

### 🟡 Restants — Priorité modérée

**B7 — Scroll lock non restauré avec panneaux multiples**
- Fichier : `src/components/AyahActions.jsx:204`
- Symptôme : si deux panneaux (ex. Bookmark + Note) sont ouverts simultanément et que l'un est fermé, `document.body.style.overflow` est restauré trop tôt, débloquer le scroll alors que l'autre panneau est encore ouvert
- Correction : utiliser un compteur de panneaux ouverts (`openPanelCount`) au lieu d'un simple boolean

**B8 — Double `role="banner"` dans SurahReaderHeader**
- Fichier : `src/components/Quran/QCReaderHeader.jsx:76` (ou équivalent)
- Symptôme : `<header role="banner">` imbriqué dans une page qui a déjà un `<header>` principal → violation ARIA, lecteurs d'écran signalent deux landmarks bannière
- Correction : supprimer `role="banner"` de QCReaderHeader (le `<header>` HTML suffit pour les landmarks secondaires)

---

## B. Sécurité

### ✅ Déjà corrigés
- SEC-001/002 : cryptoUtil.js — clé en clair supprimée, migration SubtleCrypto
- SEC-006/010 : HSTS + COOP dans netlify.toml
- SEC-003/004/005 : CSP download.quranicaudio + messages d'erreur + unsafe-inline

### 🟡 Restant

**S1 — SW: mise en cache des réponses opaques (CORS sans credentials)**
- Fichier : `public/sw.js:293`
- Code actuel : `if (response.ok || response.type === "opaque") { cache.put(...) }`
- Problème : les réponses opaques peuvent être des erreurs (status 0, 400, 500 masqués) → le SW met en cache silencieusement des erreurs réseau comme si c'était du contenu valide
- Correction : retirer `|| response.type === "opaque"` ou ajouter un check explicite
```js
if (response.ok) {
  cache.put(request, response.clone());
}
```

---

## C. Accessibilité

### ✅ Déjà corrigés
- CRIT-04/05 : aria-pressed→selected, slider keyboard
- HIGH-03/09 : live region, sidebar tablist
- SearchModal : aria-live regions + labels formulaires associés
- ContentSection : aria-pressed toggles

### 🟡 Restant

**AC1 — `aria-label="Fermer"` hardcodé en français**
- Fichiers : composants UI génériques (modal.jsx, sheet.jsx, ou équivalents Radix wrappers)
- Symptôme : lecteurs d'écran annoncent "Fermer" quelle que soit la langue sélectionnée
- Correction : passer `lang` depuis AppContext et utiliser `t("ui.close", lang)`

---

## D. Performance

### ✅ Déjà corrigés
- Google Fonts non-bloquant
- AyahBlock useAppSelector
- Warsh/Hafs fetch parallèle
- CSS non-critique différé

### 🔴 Restant

**P1 — Budget JS initial dépassé : 418 kB limite, ~488 kB actuel**
- Contexte : le budget `BUDGET_INITIAL_JS_KB=418` en CI échoue
- Cause racine : `@radix-ui/*` et `lucide-react` sont importés de manière synchrone depuis `App.jsx` → ils atterrissent dans le chunk initial quel que soit le `manualChunks`
- Ce qui a été tenté et raté : ajouter `@radix-ui → vendor-radix` et `lucide-react → vendor-icons` en `manualChunks` — cela ne défère pas, ça nomme juste les chunks initiaux, gonflant le budget de 70 kB
- Solution correcte : convertir les imports des composants Radix et Lucide dans `App.jsx` en dynamic imports :
```js
// Avant
import { Dialog } from "@radix-ui/react-dialog";

// Après (dans le composant qui l'utilise)
const Dialog = lazy(() => import("@radix-ui/react-dialog").then(m => ({ default: m.Dialog })));
```
- Effort : élevé (touche ~15 fichiers) — à planifier comme tâche séparée
- Alternative rapide : augmenter le budget à 500 kB avec justification (valeur actuelle est très stricte pour une app Quran complète)

---

## E. i18n — Tout corrigé ✅

Toutes les chaînes hardcodées ont été migrées vers `t(key, lang)` :
- PWAUpdateBanner, ContentSection, AyahSkeleton, Header, Footer
- SettingsModal font hints
- Branches AR manquantes
- Clés manquantes : `pwa.update`, `home.tabs.*`, `searchReciter`

---

## F. CSS / Architecture CSS — Tout corrigé ✅

- Z-index scale établi avec variables (`--z-progress`, `--z-player`, `--z-sidebar`, `--z-modal`)
- Riwaya fonts consolidées dans `riwaya-fonts.css`
- Breakpoints 640px/768px ajoutés
- `isMobileMushaf` réactif via `matchMedia`
- Variables hardcodées migrées vers `var(--*)`

---

## G. Récapitulatif — À faire en priorité

| Priorité | ID | Quoi | Fichier |
|----------|----|------|---------|
| 🔴 Haute | B1 | switchReciter race condition | AudioPlayer.jsx |
| 🔴 Haute | B3 | RAF actif en pause (karaoke) | useKaraoke.js |
| 🔴 Haute | P1 | Budget JS initial dépassé | Vite config / imports dynamiques |
| 🟠 Importante | B2 | IntersectionObserver orphelin | useAutoScrollAyah.js |
| 🟠 Importante | B4 | Stale closure onError | AudioPlayer.jsx |
| 🟠 Importante | B5 | Événement `end` perdu | useQuranDisplayAudio.js |
| 🟠 Importante | B6 | loadAudioService erreur silencieuse | AppContext.jsx |
| 🟡 Modérée | S1 | SW cache réponses opaques | public/sw.js |
| 🟡 Modérée | AC1 | aria-label Fermer hardcodé FR | modal/sheet wrappers |
| 🟡 Modérée | B7 | Scroll lock multi-panneaux | AyahActions.jsx |
| 🟢 Mineure | B8 | Double role=banner | QCReaderHeader.jsx |

---

## H. Ce qui fonctionne bien

- **Architecture React** : hooks bien séparés, context bien structuré
- **Gestion des erreurs API** : ErrorBoundary par modale lazy, messages i18n
- **Service Worker** : stratégie cache-first avec timeout fonctionnelle
- **Audio failover** : fallback EveryAyah → CDN islamique → CDN secondaire bien enchaîné
- **Mémoire** : la grande majorité des timers/listeners sont nettoyés (post-corrections)
- **Sécurité** : clé crypto supprimée, HSTS/COOP en place, CSP stricte
- **Accessibilité** : navigation clavier dans les modales, aria-live regions, focus management
