# Landing page "Folio" (/, /en/, /ar/)
> Surfaces : [WEB] · Statut : ⬜ · Build : feat/landing-page @ (a renseigner au run)
> Périmètre : page d'accueil `/` (cinq folios), FR/EN/AR, 320 à 1440 px, thèmes clair / sépia / nuit, mouvement normal et réduit.
> Environnement : `npm run build:ci` puis `vite preview` 127.0.0.1:4173 ; aucun compte.
> Données : profil neuf ; position mémorisée créée par l'interface (ouvrir une sourate, revenir sur `/`).
> Critère d'arrêt : tous les must-pass critiques ✅, tous les must-fail bloqués, 0 ❌.

## Préconditions
- [WEB] Build frais (jamais le `dist/` d'une autre branche) ; port 4173 tenu par un serveur lancé depuis ce dossier.
- [WEB] Les captures et vidéos de `public/images/landing/mob-*` et `public/videos/landing/mob-*` sont présentes.

## Scénarios

### LF.1 — [WEB] Le bouton principal continue la lecture (must-pass)
**Priorité** : critique
**Technique** : transition-état
**Action** : ouvrir la sourate 18, verset 10, revenir sur `/`.
**Attendu** : le bouton principal indique « Continuer · Al-Kahf v.10 » ; un clic ouvre `/surah/18/10`. Sans position, il indique « Commencer la lecture ».
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.2 — [WEB] Aucune URL de store inventée (must-fail)
**Priorité** : critique
**Technique** : erreur
**Action** : lire le Folio IV avec `site.config.json` vide ; chercher tout lien `http(s)` dans la page.
**Attendu** : la mention « Bientôt sur Android et iOS » s'affiche, aucun bouton de store, aucun lien externe. Une valeur `http://`, `//`, `javascript:` dans la config ne produit jamais de bouton (test unitaire `tests/landing-copy.test.mjs`).
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.3 — [WEB] La démo suit l'entrée visible (must-pass, large)
**Priorité** : critique
**Technique** : transition-état
**Action** : à 1280 px, faire défiler les trois entrées (Lire, Invocations, Écouter).
**Attendu** : un seul téléphone reste à l'écran ; son enregistrement change avec l'entrée au milieu de la fenêtre ; chaque bouton ouvre l'écran correspondant. À 390 px, chaque entrée porte sa propre vidéo et seule celle à l'écran est lue.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.4 — [WEB] Mouvement réduit : rien ne bouge, rien ne se lit tout seul (must-fail)
**Priorité** : critique
**Technique** : table-décision
**Action** : activer « réduire les animations » dans le système, recharger `/`, tout parcourir.
**Attendu** : aucune vidéo ne démarre, contrôles natifs visibles, pas de bouton Pause, un seul calque de fond (le thème de l'application), aucune animation CSS en cours, aucun révélateur.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.5 — [WEB] Le bouton Pause arrête les démonstrations (must-pass)
**Priorité** : normal
**Technique** : transition-état
**Action** : mouvement normal, appuyer sur « Mettre les démonstrations en pause ».
**Attendu** : les vidéos s'arrêtent, les contrôles natifs apparaissent, le bouton est à l'état pressé.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.6 — [WEB] Les vidéos ne se chargent pas avant d'être atteintes (must-fail)
**Priorité** : normal
**Technique** : valeurs-limites
**Action** : charger `/` sans défiler, observer le réseau 1 s.
**Attendu** : aucune requête `.mp4`.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.7 — [WEB] La page prend la couleur du thème montré au Folio III (must-pass)
**Priorité** : normal
**Technique** : partition-équivalence
**Action** : à 390 px, toucher « Rose de l'aube » puis « Nuit océan » ; à 1280 px, survoler et tabuler les cinq thèmes.
**Attendu** : le fond de page se teinte (data-tint), le bouton est pressé, texte lisible (axe sans violation). Deux étiquettes « Nouveau ». Le libellé dit « application mobile ».
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.8 — [WEB] Langue à la volée et arabe RTL (must-pass)
**Priorité** : critique
**Technique** : partition-équivalence
**Action** : cliquer EN puis ع ; ouvrir `/ar/` à 320, 390, 768, 1280, 1440.
**Attendu** : titre, langue (`lang`) et sens (`dir`) changent sans rechargement ; aucun défilement horizontal ; toutes les cibles tactiles ≥ 44 px ; le téléphone passe à gauche du texte en RTL.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.9 — [WEB] Rien d'invérifiable n'est affiché (must-fail)
**Priorité** : critique
**Technique** : erreur
**Action** : chercher dans le texte de la page : Android Auto, CarPlay, TestFlight, écran verrouillé, onboarding.
**Attendu** : aucune occurrence ; aucune vidéo `onboarding` ; chiffres affichés = 54 récitateurs, 267 invocations, 2 lectures, 3 langues.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.10 — [WEB] Aucune donnée personnelle dans les captures (must-fail)
**Priorité** : critique
**Technique** : erreur
**Action** : lire chaque image `mob-*.webp` et des images des quatre vidéos.
**Attendu** : ni prochaine prière, ni heure, ni date, ni « Récemment écouté » lisibles.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### LF.11 — [WEB] Lecture hors ligne de la page (must-pass)
**Priorité** : normal
**Technique** : transition-état
**Action** : installer le service worker, passer hors ligne, ouvrir `/`.
**Attendu** : la page s'affiche (titre, boutons) ; les vidéos affichent leur poster ou rien, sans erreur bloquante.
**Observé** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
