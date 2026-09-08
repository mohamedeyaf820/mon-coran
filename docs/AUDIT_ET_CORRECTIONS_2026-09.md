# Audit et corrections — septembre 2026

Contrôles locaux des 7 et 8 septembre 2026. Ce rapport ne constitue ni une
certification du texte coranique ni un test sur téléphone physique.

## Architecture et périmètre

PWA React/Vite, hébergée sur Netlify : contexte React pour les préférences,
services pour API/audio/stockage, IndexedDB pour les données privées,
service worker et Cache API pour le shell et les médias. Hafs, Warsh,
traductions et récitations viennent de sources distinctes ; une réponse HTTP
ne prouve pas leur correspondance éditoriale.

Les références actives sont `ARCHITECTURE.md`, `SCREEN_UX_BUDGETS.md`,
`DESIGN_SYSTEM.md`, `src/components/ui/` et `src/i18n/`. Les anciens rapports
sont dans [archive/reports](archive/reports/README.md). Polices, données,
licences et outils réutilisables ont été conservés. Le nettoyage initial a
retiré 26 artefacts temporaires (3 640 205 octets), récupérables dans Git.

## Changelog et vérifications

| Fichiers ou ensemble | Correction | Vérification |
| --- | --- | --- |
| `audioService.js`, `audioTrackLoader.js`, `useMediaSession.js`, `useQuranDisplayAudio.js` | Chargement extrait, événements natifs, demandes obsolètes annulées, changement de sourate sans attente d'une animation React. | Tests même élément natif, fin de piste, pause, annulation, refus de lecture. |
| `audioEqualizer.js`, options audio | Égaliseur et graphe Web Audio retirés pour éviter suspension ou silence sur médias externes. Playlists conservées. | Tests audio, compilation, références restantes. |
| `AudioPlayer.jsx`, dock, `audio-player-simple.css` | Hauteur mesurée, options défilables et boutons principaux de 44 px. | Matrice de 30 configurations FR/AR entre 280 et 1920 px ; captures inspectées. |
| `ReciterBioCollapse.jsx`, `recitation-polish.css` | Police UI arabe, interligne, biographie sans hauteur figée ; actions séparées des titres sur mobile/tablette. | 36 configurations : trois langues, trois thèmes, quatre largeurs ; inspection visuelle après correction du chevauchement tablette. |
| `offlineAudioResponse.js`, `downloadService.js` | Vérification des octets et du conteneur avant cache ; refus HTML/vide/opaque, réutilisation, détection d'éviction, attente de l'annulation avant suppression. | Tests de réponses et téléchargement/lecture réelle/éviction dans Chromium. |
| `public/sw.js`, `public/boot-recovery.js`, `main.jsx` | Range suffixe/ouvert et 416 ; pas de nettoyage automatique de secours hors réseau. | Tests Range et récupération ; fermeture complète puis réouverture hors ligne avec audio lisible. |
| `qrSyncValidation.js`, `qrSyncService.js`, `QrSyncModal.jsx` | Taille/version/champs autorisés, UTF-8 strict, rejet des clés dangereuses, réciteur compatible, notes exclues par défaut, confirmation d'import, arrêt caméra. | Tests QR Unicode, entrées invalides et rollback sur abandon IndexedDB. |
| `storageService.js`, `storageValidation.js`, `dbService.js`, `exportService.js` | Prévalidation, fusion préservant les conflits, transaction notes/signets, restauration des réglages sur erreur, plafond JSON. | Tests stockage et abandon forcé de transaction. |
| `AppContext.jsx`, `storageService.js` | Préférence canonique `quranFontSize`, migration de `fontSize`, retrait du skin inutilisé. | Test de migration et tailles rendues dans le lecteur. |
| `voiceRecognitionSession.js`, `useVoiceSearch.js`, `SearchModal.jsx` | Session unique bornée, arrêt et nettoyage, erreurs traduites, saisie manuelle préservée. | Tests résultat, délai, annulation, refus et fallback navigateur. |
| CSS prioritaires et doublons d'autres couches | Anciennes familles de lecteur retirées ; déclarations identiques dominées supprimées sans purge aveugle des classes dynamiques. | Budget CSS, thèmes/RTL et responsive. |
| `tajwid-highlights.css`, `audit-performance.mjs` | Règles Highlight séparées du traitement Tailwind ; sondes réseau bornées et diagnostics précis. | Disparition des 22 avertissements ; métadonnées HTTP 200 après l'échec initial non déterministe. |
| `KhatmaPlannerPanel.jsx`, `khatmaService.js`, `LibraryModal.jsx` | Plan local intégré, reprise du lecteur, confirmation de réinitialisation. | Tests calcul/persistance ; couverture UX encore partielle. |
| Documentation et workflows | Couverture native Node, budgets actualisés, archives, `npm ci`. | Compilation CI et en-têtes centralisés. |

## Mesures et campagnes de tests

- 190 tests unitaires/sécurité/services passent ; lint et `build:ci` passent.
- `audioService.js` : environ 35,2 Kio contre 45,7 initialement (limite 45).
- CSS livré : environ 1013 Kio contre 1039,8 ; sources : environ 1669 Kio
  contre 1821,3 ; 6404 `!important` contre 6937. Les valeurs exactes
  sont produites par `build:ci`. Aucun budget n'a été relevé.
- `npm audit` : aucune vulnérabilité déclarée à la date du contrôle ; cela
  ne remplace pas un audit complet du code et des fournisseurs.
- Trois parcours d'intégration hors ligne passent : octets/éviction,
  rollback QR, fermeture/réouverture complète de Chromium sans réseau.
- Campagne Chromium de 44 tests : 42 réussites, deux échecs investigués
  (déplacement visuel à froid intermittent et survol pendant le repli de
  l'en-tête, près du lecteur flottant). Les deux reprises ciblées passent,
  sans relever les seuils ; le test de survol utilise le pointeur réel.
- Firefox/WebKit : routes et façonnage arabe contrôlés ; synchronisation du
  test de recherche avec le chargement réel du lecteur nécessaire sur Firefox.
  Campagne de 16 tests : 15 réussites ; la reprise du test Firefox passe.
- Dernière campagne ciblée : 10/10 parcours audio, accessibilité, défilement
  et absence de chevauchement des actions de récitation passent. Lint final OK.

Largeurs du lecteur audio : 280, 320, 360, 375, 390, 412, 430, 480, 600,
768, 820, 1024, 1280, 1440 et 1920 px. Récitation : 280, 390, 820, 1440,
FR/EN/AR et thèmes clair/sépia/sombre. Certaines captures utilisent des
réponses réseau de test : elles ne certifient pas le contenu religieux.
Les campagnes répétées ne sont pas des scénarios uniques additionnables.

## État fonctionnel et limites

**Validé dans le périmètre testé :** commandes natives, annulation et
enchaînement de sourates ; média effectivement lisible en cache ; reprise
hors ligne ; import sans écrasement des conflits ; migration des tailles ;
affichage mobile/tablette et RTL examinés.

**Partiel — `NOT_TESTED_ON_REAL_DEVICE` :** écran éteint, Bluetooth, appels,
restrictions batterie, installation iOS/Android et éviction automatique des
caches par le système. L'émulation de bureau ne permet pas de promettre le
fonctionnement sur tous les téléphones.

La voix dépend de l'API et du fournisseur du navigateur : aucun moteur
coranique local garanti hors ligne n'a été inventé. Le QR est un transfert
ponctuel en clair, pas un compte ni une sauvegarde chiffrée multiappareil.
Les notes demandent un choix explicite. IndexedDB et localStorage ne partagent
pas une transaction atomique en cas d'arrêt brutal entre leurs écritures,
malgré la compensation sur erreur. La suppression Cache API et son registre
nécessitent encore un durcissement pour les défaillances exceptionnelles.

**`NEEDS_QURANIC_VALIDATION` :** la comparaison Warsh a examiné 114 sourates,
6214 versets et 52401 balises tajwid. Elle ne remplace pas une validation
savante. L'alignement page/juz et coordonnées Hafs/Warsh, traductions, WBW et
correspondances audio demandent une validation indépendante. Aucun texte
coranique n'a été réécrit pour masquer un échec. L'audit audio Warsh obtient
96 réponses sur 100 sondes ; quatre erreurs réseau du réciteur Yassin restent
à distinguer d'une indisponibilité du fournisseur.

**Retiré :** égaliseur, préférence de skin sans interface, CSS d'anciens
lecteurs et artefacts temporaires. **Conservé :** playlists, ressources
coraniques et données privées. Les nouveaux tafsirs/WBW/traductions et une
reconnaissance automatique de récitation ne sont pas annoncés comme réalisés :
ils exigent des sources, licences et validations propres.

## Appréciation et priorités

Notes indicatives d'ingénierie, non certifiées : sources 6/10 (validation
spécialisée manquante), stabilité 7/10, audio 7/10, hors ligne 7/10,
confidentialité/sécurité 7/10, responsive 8/10, performance 6/10,
maintenabilité 6/10, documentation 8/10.

- **P0 :** validation spécialisée des correspondances Hafs/Warsh avant toute
  modification éditoriale ; préserver les données locales lors d'un import.
- **P1 :** essais physiques iPhone/Android/Pixel, écoute prolongée écran éteint,
  interruptions et réseaux dégradés ; surveiller les courses au chargement
  et les déplacements visuels à froid.
- **P2 :** consolidation CSS (bundle encore lourd), opérations cache/registre
  robustes aux arrêts brutaux, scénarios Khatma et validation des dates.
- **P3 :** fonctionnalités nouvelles après stabilisation et vérification des
  licences et de la provenance des contenus.

## Publication

Cible autorisée : `https://mushafplus.netlify.app`, site existant
`06596f97-416f-44f2-b601-900e4c6f7f2f`. Le dossier `dist` issu de `build:ci`
est prêt. La connexion CLI et l'accès au site ont été confirmés.

**Publication bloquée le 8 septembre 2026 :** la création du déploiement
renvoie HTTP 403 avec le motif exact : `Account credit usage exceeded - new
deploys are blocked until credits are added`. Aucun nouveau déploiement n'a
été créé ; la nouvelle version n'est pas annoncée comme publiée. Aucun achat
ni changement d'offre n'a été effectué. Après rétablissement des crédits :

```sh
npx netlify-cli deploy --prod --dir dist --no-build --site 06596f97-416f-44f2-b601-900e4c6f7f2f
```

Relancer `build:ci` auparavant si les sources changent. Vérifier ensuite le
domaine public et son asset d'entrée avant de déclarer la publication réussie.
