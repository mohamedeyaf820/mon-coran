# Revue technique et UX de Mushaf Plus

Date: 2026-06-05

## Synthese

Mushaf Plus est deja une application riche: lecture Hafs/Warsh, audio multi-recitateurs, PWA, reglages avances, memorisation, favoris, notes, partage, navigation URL et tests de securite. La base est exploitable, mais plusieurs zones demandent une stabilisation avant d'ajouter de nouvelles fonctionnalites.

La priorite n'est pas de refaire tout le produit en une fois. Il faut d'abord securiser la navigation, la politique CSP, les tests, les budgets et les composants les plus gros. Ensuite, la refonte UI/UX peut etre poursuivie par domaines: accueil, lecture, audio player, parametres, recitations.

## Forces observees

- React 18 + Vite avec code splitting et chunks manuels.
- Tests Node pour securite, stockage et navigation.
- Tests Playwright E2E pour audio, accessibilite et lecture.
- Synchronisation URL bidirectionnelle deja presente avec `popstate`.
- Sauvegarde des preferences de police par riwaya deja presente.
- Service audio centralise avec logique de playlist et reciter failover branchee dans `AudioPlayer.jsx`.
- CSP injectee via `scripts/cspPolicy.mjs` pendant le build Vite.
- Validation de stockage via schemas Zod dans les services.

## Problemes critiques ou prioritaires

### P0 - Validation URL de verset trop large

Fichier: `src/hooks/useUrlSync.js`

`parseInitialRoute()` limite l'ayah a `1..286` pour toutes les sourates. Exemple: `/surah/114/999` devient `currentAyah: 286`, alors que sourate 114 contient 6 versets. Cela peut creer un etat React impossible, une selection fantome, un scroll casse ou un chargement inutile.

Correction recommandee: utiliser le nombre exact d'ayahs depuis `src/data/surahs.js`.

### P0 - CSP dispersee et incoherente entre environnements

Fichiers: `scripts/cspPolicy.mjs`, `netlify.toml`, `vercel.json`, `index.html`

La CSP source est dans `scripts/cspPolicy.mjs`, mais les headers de `netlify.toml` et `vercel.json` sont dupliques. Ils ne sont pas strictement identiques. Cette duplication augmente le risque de deployer une politique differente selon l'hebergeur.

Correction recommandee: centraliser la source, synchroniser les headers et ajouter un test/script de coherence.

### P1 - Domaine `archive.org` autorise sans usage applicatif detecte

Fichiers: `scripts/cspPolicy.mjs`, `netlify.toml`, `vercel.json`

Le domaine `https://ia800304.us.archive.org` est autorise en `connect-src`, mais aucune reference applicative n'a ete detectee hors CSP. Comme ce domaine peut heberger du contenu utilisateur, il vaut mieux le retirer tant qu'il n'est pas requis.

### P1 - Dette de taille sur composants et CSS

Fichiers principaux:

- `src/components/AudioPlayer.jsx` environ 118 kB.
- `src/components/AyahActions.jsx` environ 73 kB.
- `src/styles/tailwind.css` environ 497 kB.
- `src/styles/domains/reading-platform.css` environ 139 kB.
- `src/styles/domains/reader-consolidation.css` environ 131 kB.

Ces tailles rendent les regressions UI plus probables, compliquent la revue et ralentissent les iterations. L'audio player doit etre extrait en hooks et sous-composants, sans changer le comportement utilisateur d'un seul coup.

### P1 - Audit npm avec vulnerabilites moderees

`npm audit --json` signale des vulnerabilites moderees dans `brace-expansion`, `postcss`, `vite` et `esbuild`. Les correctifs Vite/esbuild disponibles demandent une mise a jour majeure de Vite. Il faut appliquer les correctifs lockfile possibles, puis planifier la migration Vite separement.

### P1 - Donnees locales chiffrees mais menace XSS encore importante

Le stockage local est chiffre/valide, mais une cle gardee dans le meme origin ne protege pas contre un script injecte dans l'application. Le chiffrement local reste utile contre l'inspection simple du stockage, mais pas contre une compromission runtime.

Correction recommandee: conserver la validation stricte, renforcer la CSP, eviter tout HTML non fiable, et proposer plus tard un mode "donnees privees" protege par phrase secrete utilisateur.

## UI / UX

### Accueil

La page d'accueil a une bonne structure fonctionnelle, mais elle reste sensible aux incoherences de densite: cartes rapides, session recente, statistiques et liste de sourates doivent partager des tokens communs de spacing, radius, ombre et contraste.

Actions recommandees:

- Unifier les cartes par variantes (`surface`, `interactive`, `selected`).
- Garder les CTA principaux visibles sur mobile.
- Valider les calculs sur 114 sourates.
- Verifier les libelles arabes de `src/data/surahs.js`.

### Lecture / recitation

La lecture a beaucoup de logique utile, mais les etats d'ayah active, police chargee, mode mushaf/page/liste et audio peuvent creer des shifts visibles.

Actions recommandees:

- Clamp exact de l'ayah dans la route.
- Initialiser une taille typographique stable avant chargement de police.
- Conserver la largeur du conteneur de lecture avec `clamp()` et `max-width`.
- Eviter tout overlay persistant au refresh.
- Separer clairement l'etat "active", "playing" et "focused".

### Audio player

L'audio player contient deja la logique de failover, mais le composant est trop volumineux. Les bugs de deplacement, z-index, taille qui varie et bottom sheet doivent etre traites avec une structure plus petite.

Actions recommandees:

- Extraire drag/persist position dans un hook dedie.
- Donner des dimensions compactes stables.
- Nettoyer les panels secondaires a la fermeture.
- Traduire tous les `aria-label` selon `lang`.
- Garder le player au-dessus du contenu sans masquer les actions mobiles.

## Securite

### Points positifs

- `sanitizeSvgMarkup()` retire deja `script`, `style`, `use`, `foreignObject`, `iframe`, `object`, `embed`, `link`, `meta`.
- `sanitizeHtml()` limite les tags HTML.
- Les URL externes passent par whitelist.
- CSP de production n'autorise pas `unsafe-eval`.

### Points a renforcer

- Ajouter des tests explicites pour `sanitizeSvgMarkup()`.
- Retirer les domaines CSP inutilises.
- Aligner CSP Netlify/Vercel avec la politique generee.
- Eviter `dangerouslySetInnerHTML` hors contenu deja sanitize.

## Performance

### Points positifs

- Build avec `drop console/debugger`.
- Budget perf separe via `scripts/check-bundle-budget.mjs`.
- Code splitting vendors.
- PWA/offline et caches deja presents.

### Risques

- CSS tres volumineux, avec plusieurs fichiers de domaine.
- Composants monolithiques.
- Certaines polices Quran peuvent provoquer des reflows si la taille fallback differe trop.
- Les pages de lecture peuvent charger lentement si les requetes et polices ne sont pas prechauffees par contexte.

## Responsive et accessibilite

### A verifier/regresser regulierement

- Aucun overflow horizontal sur 360px, 390px, 430px, 768px, 1024px.
- Touch targets minimum 44px.
- Toolbar lecture scrollable sans masquer le texte.
- Player deplacable au clavier ou avec alternative claire si drag souris/tactile.
- Focus visible sur tous les boutons icon-only.
- Aucun label anglais en mode arabe.

## Maintenabilite

### A reduire

- Gros fichiers CSS.
- Gros composants React.
- Duplication CSP.
- Documentation de scripts dispersee.

### A conserver

- Tests de securite/navigation existants.
- Services separes pour stockage, audio, quran data.
- Politique de build avec budgets.

## Conclusion

Les corrections immediates doivent etre petites et verifiables: route ayah exacte, CSP coherente, tests de sanitizer, nettoyage de domaines inutilises et audit npm. Les refontes lourdes doivent passer par une roadmap progressive pour ne pas casser une app deja fonctionnelle.
