# AUDIT_PWA_BUGS_2 — MushafPlus Re-audit fonctionnel + PWA
Date : 2026-07-30

---

## Section 1 — Bugs fonctionnels

### B1 — switchReciter race condition ✅ CORRIGE

**Fichier :** `src/components/AudioPlayer.jsx`

`reciterSwitchingIdRef` (ligne 118) sert de verrou mutex :

- Ligne 174 : `if (autoFailoverBusyRef.current || reciterSwitchingIdRef.current) return false;`
  bloque tout failover concurrent.
- Ligne 795 : `handleReciterSelect` quitte immédiatement si `reciterSwitchingIdRef.current` est déjà défini.
- Ligne 818 : le ref est positionné **avant** `await audioService.switchReciter(...)`.
- Lignes 840-842 : bloc `finally` nettoie le ref même en cas d'exception.

Aucune double invocation concurrente de `switchReciter` n'est possible.

---

### B2 — IntersectionObserver orphan ✅ CORRIGE

**Fichier :** `src/hooks/useAutoScrollAyah.js`

Trois couches de protection :

1. Ligne 80 : `observerRef.current?.disconnect()` avant chaque création d'observateur (évite l'accumulation si le timeout tire).
2. Ligne 83 : `observer.disconnect()` à l'intérieur du callback IO, dès que la visibilité est connue.
3. Lignes 98-101 : la fonction de cleanup du `useEffect` appelle `clearTimeout(debounceRef.current)` + `observerRef.current?.disconnect()` — couvre le cas où l'effet re-tourne (changement d'ayah) avant que le timeout n'ait pu créer l'observateur.

Pas d'observateur orphelin possible.

---

### B3 — RAF actif en pause ✅ CORRIGE

**Fichier :** `src/hooks/useKaraoke.js`

- Ligne 5 : utilise `createPausableAnimationLoop` — le RAF est architecturé pour être pausable nativement.
- Lignes 43-46 : garde explicite dans le tick : `if (!audioService.isPlaying) { frameLoop?.stop(); return; }` — le loop se gare lui-même s'il tourne alors que l'audio s'est arrêté.
- Lignes 108-110 : abonnement aux listeners play/pause/end pour démarrer/stopper le loop.
- Lignes 114-120 : cleanup complet — `running = false`, désinscription des trois listeners, `frameLoop.stop()`.

Aucun RAF actif pendant une pause ou après un démontage.

---

### B4 — Stale closure onError ✅ CORRIGE

**Fichier :** `src/components/AudioPlayer.jsx`, lignes 446-519

`audioService.onError` est assigné à l'intérieur d'un `useEffect` avec les dépendances complètes :

```js
}, [dispatch, lang, markReciterAvailable, markReciterUnavailable,
    reciter, riwaya, set, tryAutoReciterFailover]);
```

Toutes les valeurs capturées par le handler (`lang`, `reciter`, `riwaya`, `tryAutoReciterFailover`) sont dans le tableau de deps — l'effet se réexécute dès que l'une d'elles change et réassigne un handler frais. Le cleanup (ligne 506) remet `audioService.onError = null`. Pas de closure périmée.

---

### B5 — End event perdu ✅ CORRIGE

**Fichier :** `src/components/QuranDisplay/useQuranDisplayAudio.js`, lignes 74-108

```js
useEffect(() => {
  return audioService.addEndListener(() => { ... });
}, []);
```

- `addEndListener` retourne une fonction de désinscription ; le `useEffect` la retourne directement comme cleanup — le listener est retiré au démontage.
- Le handler lit uniquement `playbackNavigationRef.current` (pas de variables capturées directement) — pas de stale closure possible sur la navigation.
- `activePlaylistScopeRef.current` est aussi lu par ref — toujours à jour.

---

### B6 — loadAudioService erreur silencieuse ✅ CORRIGE

**Fichier :** `src/context/AppContext.jsx`, lignes 671-679

```js
.catch((error) => {
  if (import.meta.env.DEV) {
    console.warn("Audio service initialization failed:", error);
  }
  dispatch({
    type: "SET",
    payload: { audioServiceError: true },
  });
});
```

L'erreur est propagée dans le store via `{ audioServiceError: true }` — l'UI peut réagir. Pas de silence.

---

### B7 — Scroll lock multi-panneaux 🟡 MINEURE — PATRON CORRECT MAIS FRAGILE

**Fichier :** `src/components/AyahActions.jsx`, lignes 225-230

Pattern utilisé : save-and-restore.

```js
const previousOverflow = document.body.style.overflow;
document.body.style.overflow = "hidden";
return () => { document.body.style.overflow = previousOverflow; };
```

**Pourquoi c'est fonctionnel ici :** `activeSheet` est un booléen unique dérivé de l'union des quatre panneaux (`showStudy || showNote || showShare || showPlaylistMenu`). Un seul `useEffect` gère le lock pour **toute** la zone AyahActions. Pas de double-lock possible depuis ce composant.

**Risque résiduel :** Si un autre composant React implémente la même technique de save-and-restore sur `document.body.style.overflow` simultanément, les deux cleanups pourraient se marcher dessus (LIFO non garanti). Actuellement, grep ne révèle qu'une seule instance dans le projet — risque théorique seulement.

**Fix recommandé si le projet scale :** compteur global `document.__scrollLockCount` ou utilitaire centralisé `lockScroll/unlockScroll`.

---

## Section 2 — PWA

### manifest.json — ✅ COMPLET ET VALIDE

| Champ | Valeur | Statut |
|---|---|---|
| `theme_color` | `#0D5C4A` | ✅ |
| `background_color` | `#071A0F` | ✅ |
| `id` | `"/"` | ✅ |
| `scope` | `"/"` | ✅ |
| Icones maskable 192+512 | Présentes (`purpose: "maskable"`) | ✅ |
| Icones any 192+512 | Présentes (`purpose: "any"`) | ✅ |
| Screenshots wide + narrow | Présentes avec `form_factor` | ✅ |
| Shortcuts (3) | Fatiha, Mulk, Kahf | ✅ |
| `prefer_related_applications` | `false` | ✅ |

---

### SW opaque response caching — ✅ PROTEGE

**Fichier :** `public/sw.js`

- `cacheFirst` (ligne 292) : `if (response && response.status === 200)` — les réponses opaques (status 0) sont exclues.
- `staleWhileRevalidate` (ligne 308) : `if (response?.ok)` — `ok === false` pour les opaques, donc pas de mise en cache.
- Fetch handler ligne 165-167 : les requêtes cross-origin (audio MP3, images récitateurs) n'ont aucun `event.respondWith` — elles passent directement au réseau sans passer par le cache SW.

Aucun risque de polluer le cache avec des réponses opaques.

---

### SW SKIP_WAITING origin validation — ✅ VALIDE

**Fichier :** `public/sw.js`, lignes 177-186

```js
function isTrustedClientMessage(event) {
  const sender = new URL(senderUrl);
  const scope  = new URL(self.registration.scope);
  return (
    sender.origin === self.location.origin &&
    sender.href.startsWith(scope.href)
  );
}
```

Double validation : origin identique ET URL dans la portée du SW. Appliqué en entrée du handler `message` (`if (!isTrustedClientMessage(event)) return`). La commande `SKIP_WAITING` ne peut pas être déclenchée depuis une origine externe.

---

### Cache limit (180 → 300) — ✅ DEJA APPLIQUE

**Fichier :** `public/sw.js`, ligne 14

```js
[CACHE_NAME]: 300,
```

La limite est déjà à 300 entrées pour le cache principal (`mushaf-plus-v14`) et à 200 pour le cache API (`mushaf-plus-api-v3`). Migration effectuée.

---

## Section 3 — Score et actions prioritaires

### Score fonctionnel : 9 / 10

Tous les bugs B1-B6 identifiés lors du premier audit ont été corrigés. B7 est présent mais mineur et sans impact utilisateur réel dans la configuration actuelle (une seule instance du pattern). Les PWA checks passent tous.

### Top 5 fixes restants (par priorité décroissante)

| Priorité | Titre | Fichier : Ligne | Détail |
|---|---|---|---|
| 1 | Centraliser le scroll lock | `src/components/AyahActions.jsx:226` | Remplacer save/restore par un compteur global ou un utilitaire `lockScroll/unlockScroll` pour éviter les conflits si d'autres composants adoptent le même pattern. |
| 2 | Icone de shortcut manquante | `public/shortcut-quran-96.png` | Le manifest référence `/shortcut-quran-96.png` dans les shortcuts — vérifier que le fichier est bien présent en prod (non présent dans le git status actuel). |
| 3 | `audioService.onError` : absence de guard contre les appels overlapping | `src/components/AudioPlayer.jsx:446` | Le handler async `onError` peut être réentrant si l'audio émet deux erreurs rapprochées (l'await de `tryAutoReciterFailover` laisse la fenêtre ouverte). Ajouter un flag `errorHandlingRef.current` similaire à `autoFailoverBusyRef`. |
| 4 | useAutoScrollAyah : `prevAyahRef` non réinitialisé à l'arrêt | `src/hooks/useAutoScrollAyah.js:22` | Quand `isPlaying` passe à `false`, `prevAyahRef.current` conserve la dernière clé. Si l'utilisateur reprend depuis un autre ayah, la première fois l'ayah identique peut être skippée. Réinitialiser le ref quand `isPlaying` change à `false`. |
| 5 | SW : pas de gestion des requêtes audio cross-origin offline | `public/sw.js:165` | Les fichiers audio MP3 cross-origin ne sont jamais mis en cache. Hors connexion, la lecture est impossible même pour des sourates récemment écoutées. Envisager un cache audio optionnel limité (ex. 50 entrées, stratégie Cache-First sur domaines CDN connus). |
