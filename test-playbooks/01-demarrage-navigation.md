# 01 — Démarrage et navigation
> Surfaces : [WEB] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [WEB] Lancer l'application en local (`npm run dev`) ou ouvrir l'URL de preview fournie.
- [WEB] Utiliser au minimum les viewports 375×812, 768×1024 et 1280×800.

## Scénarios

### 01.1 — [WEB] Chargement initial
**Action** : Ouvrir l'application sur une session propre (cache vidé).
**Attendu** : Aucun écran blanc. Le splash disparaît en ≤ 750 ms. Le bouton Skip apparaît à ≤ 400 ms. L'accueil devient utilisable. Aucune erreur console bloquante.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 01.2 — [WEB] Navigation principale
**Action** : Naviguer entre accueil, lecture Coran, récitations/radio, douas/outils via footer et sidebar.
**Attendu** : Chaque section s'ouvre. Header/footer restent cohérents. L'URL ou l'état actif correspond à la section. Le bouton Back du navigateur fonctionne.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 01.3 — [WEB] Langues FR / EN / AR
**Action** : Basculer successivement en français, anglais puis arabe via les paramètres.
**Attendu** : Les libellés principaux changent. L'arabe passe en RTL (`dir="rtl"` sur `<html>`). Aucun texte i18n brut (clé non traduite) n'apparaît.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 01.4 — [WEB] Thèmes clair, sombre, sépia
**Action** : Changer le thème et parcourir accueil + lecture.
**Attendu** : Couleurs, contrastes, bordures et overlays restent lisibles sur chaque thème. Aucun élément en blanc sur blanc ou noir sur noir.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 01.5 — [WEB] Raccourcis clavier
**Action** : Utiliser `?` (aide), `T` (traduction), `W` (word-by-word), `J` (tajwid), `M` (mémorisation), `/` (recherche), `,` (paramètres), `Space` (play/pause), `Escape` (fermer modale).
**Attendu** : Chaque raccourci déclenche l'action attendue sans conflit ni double-dispatch.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 01.6 — [WEB] Responsive de base
**Action** : Rejouer le chargement et la navigation sur mobile (375 px), tablette (768 px) et desktop (1280 px).
**Attendu** : Pas d'overflow horizontal. Pas de texte coupé dans les boutons. Les zones fixes (header, footer, MiniPlayer) ne masquent pas le contenu principal.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
