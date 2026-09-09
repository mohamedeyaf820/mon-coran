# MushafPlus — correction Mushaf, audio et récitateurs

Date : 8 septembre 2026. Validation locale sur Windows, Chromium automatisé. Ce rapport distingue les résultats observés des scénarios qui nécessitent un téléphone réel.

## Diagnostic et architecture

La stack est React 18, JavaScript/JSX, Vite 8 et CSS/Tailwind, avec un Service Worker et des données locales dans IndexedDB/Cache Storage. Le manifest demande `display: standalone`. Le bouton « Plein écran » ouvre un portail CSS dans `document.body`, dimensionné en `100dvh` ; il n'appelle pas `requestFullscreen()`. Il ne s'agit donc pas du plein écran natif du navigateur.

Le lecteur normal utilise `PageMode → CleanPageView → SmartAyahRenderer → AyahTextRenderer/TajweedText`, avec un chemin karaoke Warsh. L'ancien plein écran utilisait un autre chemin Hafs, `QuranMushafPage`, avec les glyphes QCF par page, et un autre flux Warsh. Ses règles de largeur, de taille et de police n'étaient pas celles du lecteur normal. Le portail ne recevait pas non plus les variables typographiques de l'arbre normal.

Le plein écran utilise désormais `ImmersiveMushafPage → CleanPageView`, avec les mêmes objets ayah et les mêmes composants de rendu. L'adaptateur conserve les métriques typographiques mesurées dans le lecteur normal. Il ne recopie pas le texte du DOM, ne construit pas de nouvelles lignes coraniques et ne possède pas de cache de texte parallèle. La page voisine utilise le chargeur partagé, avec une identité incluant la riwaya et le mode Warsh strict ; les réponses devenues obsolètes sont ignorées.

Un autre risque de perte d'état existait dans `App.jsx` : la référence du lecteur pouvait passer du composant lazy au composant résolu. La référence React reste maintenant stable après le chargement.

## Polices et signes

- Hafs : le lecteur courant utilise notamment la police locale `QPC Hafs` (`uthmanic-hafs-v18.woff2`). Le mode immersif conserve la police choisie et les mêmes règles Tajwid.
- Warsh : la police locale `KFGQPC Warsh` (`kfgqpc-warsh-10.woff2`) et les variantes configurées restent transmises au renderer, y compris au karaoke.
- Le chargement des polices ne déclare plus une réussite fictive sous automatisation. Une réussite QCF est liée à la famille et au fichier de la page exacte. Le chemin QCF historique refuse un code appartenant à une autre page/version et utilise son fallback Unicode existant si nécessaire.
- L'inspection de la police KFGQPC Warsh 0.10 a confirmé que les 286 glyphes U+FC00–U+FD1D contiennent la rosette U+06DD et les chiffres du numéro de verset. Certaines données de pages Warsh contenaient déjà ce glyphe terminal ; l'interface ajoutait ensuite son numéro. L'adaptateur retire uniquement le glyphe isolé en fin de chaîne qui correspond exactement au numéro de ce verset, puis utilise le marqueur du renderer. Il laisse les cas inconnus, attachés, intérieurs ou incompatibles intacts.
- Les signes de hizb, sajda et waqf restent affichés. Ils ne sont plus classés comme boutons de numéro d'ayah. Le nettoyage des suffixes conserve désormais les signes de hizb/sajda, y compris en fin de texte.

Aucun fichier de dataset Quran ou de police n'a été modifié. Les traitements Unicode déjà présents dans le projet n'ont pas fait l'objet d'une réécriture générale. La validation automatisée de glyphes et de coordonnées ne remplace pas une validation coranique éditoriale des 604 pages.

## Plein écran, double page et zoom

Les commandes comprennent sortie, pages précédente/suivante, lecture/pause/reprise, pistes précédente/suivante, accès au sélecteur audio global, répétition et préférence une/deux pages. Le sélecteur de récitateur quitte l'immersion pour ouvrir les options du lecteur partagé, sans remplacer le transport audio.

La double page dépend de la largeur disponible, de la hauteur utile, du rapport largeur/hauteur et de la dimension réelle de la composition. La page courante apparaît à droite, la suivante à gauche. Ce choix respecte l'ordre de lecture RTL sans inventer une parité éditoriale propre à une édition. La page 604 reste seule. La préférence est conservée localement ; une rotation étroite peut temporairement revenir à une page sans l'effacer.

Le zoom 75/100/125/150 % agit sur la feuille entière avec des bornes de défilement correspondant à sa taille affichée. Il ne modifie pas `quranFontSize` ni la composition interne. Cette mise à l'échelle répond à la demande ultérieure de zoom sans redistribution des lignes ; les polices et le renderer ont été corrigés indépendamment de ce zoom. Les événements tactiles du portail ne modifient plus accidentellement la préférence de police du lecteur normal.

Le portail gère les quatre safe areas, l'inertie de l'application située derrière, le focus initial, la boucle Tab/Shift+Tab, Escape et le retour du focus. Les commandes de chrome conservent des cibles de 44 px. La présence physique d'encoches et de barres système reste à vérifier sur appareils réels.

## Audio et arrière-plan

Le moteur principal était déjà un singleton `audioService`, avec un `HTMLAudioElement` créé dans son constructeur. Il reste le moteur commun au lecteur normal, au mini-player et au plein écran. Les éléments de préchargement et l'audio mot à mot existants ne sont pas un deuxième moteur de récitation fullscreen.

Les causes corrigées sont distinctes :

1. Le portail masquait le lecteur global sans offrir son transport essentiel. Il expose désormais les commandes du même service.
2. La navigation pouvait remplacer passivement la playlist active ou en pause. La navigation visuelle est maintenant séparée d'une demande explicite de lecture.
3. La fin d'une page ou d'un juz attendait la navigation et le rendu React avant de démarrer la suite. La continuation utilise désormais le service natif et le chargeur partagé, sans attendre une frame React. Les générations de lecture, changement de voix, arrêt, pause et réponses obsolètes sont contrôlés.
4. Le suivi de sourate dans le lecteur global pouvait transformer une navigation page/juz en navigation sourate. Il respecte désormais le mode courant.
5. Une récitation lancée depuis la feuille de gauche doit continuer depuis sa propre page, même si l'ancre visuelle est encore la feuille de droite.
6. La récupération d'un fichier optionnel en erreur pouvait recharger toute l'application. La récupération de démarrage ne recharge plus un arbre React déjà monté ; les fiches utilisent leur propre erreur et leur bouton Réessayer.

L'audit n'a trouvé aucune règle mettant la récitation en pause uniquement sur `visibilitychange`. La sauvegarde des préférences lors du passage en arrière-plan est conservée. Aucun AudioContext artificiel, audio silencieux ou mécanisme destiné à empêcher une suspension système n'a été ajouté.

`useMediaSession` était déjà présent : play, pause, next, previous, stop et seek, metadata de sourate/ayah/récitateur, position native et abonnements au service. Cette intégration est conservée. Aucun résultat sur notification Android ou Control Center iOS n'est déduit d'un test DOM.

| Scénario | Résultat et portée |
| --- | --- |
| Lecture normale, entrée/sortie plein écran | Transport identique, position et état conservés dans le test navigateur instrumenté |
| Pause, reprise, piste suivante | Validés avec le même élément de récitation |
| `ended` entre ayahs, pages et juz | Validé ; frames d'animation suspendues et état hidden simulé |
| Rotation et double page | Préférence, riwaya et transport conservés |
| Retour visible après hidden simulé | Cohérence vérifiée dans le scénario automatisé |
| Lecture hors connexion après fermeture du navigateur | Fichier téléchargé par le service, Cache Storage persistant, décodage natif et progression réelle ; média WAV de test sur une URL CDN contrôlée |
| Requête audio Range hors connexion | Réponse 206 et suffixe de 4 octets vérifiés |
| Fenêtre réellement minimisée, écran verrouillé, appels entrants | NOT_TESTED_ON_REAL_DEVICE ; pas de résultat de minimisation native revendiqué |
| Android Chrome/PWA et iOS Safari/PWA installées | NOT_TESTED_ON_REAL_DEVICE |

Les contrôles Media Session permettent une intégration système lorsque la plateforme les prend en charge ; ils ne garantissent pas l'exécution d'une page suspendue ou terminée. Références de plateforme : [Chrome, Media Session](https://developer.chrome.com/blog/media-session?hl=en), [WebKit, politiques de lecture](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/). Les politiques d'autoplay et les paramètres utilisateur restent distincts des bugs de playlist corrigés ici.

## Récitateurs et téléchargements

Le catalogue existant conserve ses données de récitateurs, portraits, attributions, biographies locales FR/EN/AR et URLs de sources. Aucune biographie ni photographie n'a été inventée ou remplacée par une image générée. Les biographies complètes du catalogue n'ont pas été revérifiées auprès de chaque source externe pendant cette correction : NOT_CONFIRMED pour une certification éditoriale exhaustive.

La fiche conserve un seul dialogue et un bouton de fermeture accessibles pendant chargement, erreur et reprise. Le module a une échéance de 12 secondes ; le profil JSON dispose d'une échéance de 8 secondes, d'états chargement/vide/erreur et d'une reprise sans changer l'URL précachable. Les retours tardifs après changement de fiche sont ignorés. La biographie reste lisible, le portrait a des dimensions réservées et un fallback d'initiales. Les lignes et actions de sourates ont été vérifiées sur petit écran et en RTL.

Les téléchargements distinguent terminé, partiel, annulé, erreur et manque de stockage. L'activité est visible dès le démarrage et reste annulable après fermeture/réouverture de la fiche. Une reprise ne conserve que les URLs encore vérifiées en cache. Suppression et vidage attendent la fin des opérations concernées pour éviter qu'une écriture tardive recrée des fichiers supprimés. Les réponses HTML ou opaques ne deviennent pas des succès hors connexion ; l'éviction du cache est détectée.

## Validation et preuves

- `npm run lint` : réussi. Le dossier local `scratch/`, déjà exclu de Git et du déploiement, est exclu du lint des sources.
- `npm run test:security` : **205 tests réussis**.
- `npm run build:ci` : réussi, y compris SEO, performance, budgets écran/bundle, architecture CSS et en-têtes de sécurité. Aucun typecheck dédié n'est configuré pour ce projet JavaScript.
- Budgets mesurés : CSS environ 1016 kB, JavaScript environ 1235 kB, total environ 2251 kB pour une limite de 2260 kB ; CSS accueil 57,2 kB pour une limite de 58 kB. La marge reste faible ; aucun seuil n'a été augmenté.
- Comparaisons normal/plein écran : Hafs et Warsh, page 3, largeurs 320 et 1280, quatre niveaux de zoom ; mots regroupés par lignes à l'aide de leurs coordonnées DOM, captures avant/après.
- Matrice responsive : 280, 320, 360, 375, 390, 412, 430, 480, 600, 768, 820, 1024, 1280, 1440 et 1920 px, avec rotation et retour.
- Polices réelles et pages 564–566 ; aucune réussite de police simulée sous Playwright.
- Double page, RTL, préférence persistée, borne 604, boutons audio, scope de playlist, erreurs de fiche/profil, portraits indisponibles, annulation et cache audio.

Journaux locaux : `scratch/immersive-security-final.log`, `scratch/immersive-lint-final.log`, `scratch/immersive-build-ci-final.log`, `scratch/immersive-release.log`. Captures de la dernière campagne : `scratch/immersive-release/`. Les captures ont été inspectées, notamment les compositions Hafs/Warsh et les fiches française mobile/arabe sépia. Les médias des tests de transport sont instrumentés ; le test de cache utilise un petit fichier WAV effectivement décodé, pas le téléchargement complet de tous les récitateurs.

## Changelog

| Fichier | Problème → modification → raison → validation |
| --- | --- |
| `src/App.jsx` | Référence du reader changeante → composant lazy stable → préserver l'état local → parcours entrée/sortie et matrice navigateur |
| `src/components/QuranDisplay/FullscreenMushafOverlay.jsx` | Renderer et transport divergents → présentation commune, commandes globales, double page, focus → continuité → tests composition/audio/RTL |
| `src/components/QuranDisplay/ImmersiveMushafPage.jsx` | Zoom redistribuant les lignes → feuille aux métriques conservées et bornes mesurées → zoom sans reflow → quatre niveaux comparés |
| `src/components/QuranDisplay.jsx` | Props et sélection immersive incomplètes → taille, calibration, ayah active et options globales transmises → même contexte de lecture → tests fullscreen |
| `src/components/QuranDisplay/PageMode.jsx` | Observer normal actif derrière le portail → garde sur l'immersion → page stable → rotation/navigation |
| `src/components/Quran/CleanPageView.jsx` | Pas d'identité de verset exploitable pour comparer les pages → attributs de référence → comparaison DOM précise → tests par ayah |
| `src/components/Quran/SmartAyahRenderer.jsx` | Police karaoke Warsh implicite → police sélectionnée transmise → cohérence → Warsh normal/lecture |
| `src/components/Quran/KaraokeWarshText.jsx` | Marqueur encodé doublé et signes exclus → traitement terminal ciblé, signes conservés → intégrité → tests marqueurs |
| `src/components/Quran/AyahTextRenderer.jsx` | Hizb/sajda assimilés à une ayah → annotation distincte, sans bouton de verset → rôle correct → page Warsh avec hizb |
| `src/components/Quran/TajweedText.jsx` | Même confusion dans le chemin Tajwid → même distinction sémantique → conserver le signe → composition et marqueur unique |
| `src/data/fonts.js` | Suffixe Warsh numéroté et nettoyage trop large → adaptateur ciblé, hizb/sajda conservés → pas de suppression de signe valide → tests Unicode |
| `src/utils/warshAyahMarker.js` | Encodage particulier de la police → reconnaissance du suffixe numéroté exact → pas de normalisation générale → 286 cas et cas négatifs |
| `src/utils/quranUtils.js` | Signes confondus avec numéros → prédicat d'annotation sans transformation du texte → sémantique partagée → tests signes |
| `src/services/fontLoader.js` | Réussite fictive ou d'une autre page → chargement réel et clé famille/URL → glyphes corrects → tests FontFace et navigateur |
| `src/components/QuranDisplay/QuranMushafPage.jsx` | Risque de code QCF d'une autre page/version → garde stricte et famille chargée exacte → sécuriser le chemin historique → revue et tests police |
| `src/components/QuranDisplay/useQuranDisplayAudio.js` | Navigation et continuité liées au rendu → scope propre à la queue et continuation native → ne pas attendre React → pages/juz/annulation |
| `src/services/audioService.js` | Chargement suivant sans garde de génération → continuation annulable sur le même élément → ignorer les réponses périmées → tests concurrence audio |
| `src/components/AudioPlayer.jsx` | Suivi de sourate imposé aux pages/juz → respecter le mode courant → pas de changement de vue parasite → tests audio |
| `src/components/HomePage.jsx` | Fiche fragile au chargement → dialogue permanent, erreur, délai et reprise → rester utilisable → échec de chunk injecté |
| `src/hooks/useReciterProfile.js` | Erreur/vide/chargement indistincts → états explicites et retry → pas de loader infini → erreur JSON/reprise |
| `src/components/recitation/ReciterDetailPage.jsx` | Contenu et états peu lisibles → structure fiche/bibliothèque et feedback → FR/EN/AR → captures et tests |
| `src/components/recitation/ReciterBioCollapse.jsx` | Biographie masquée par défaut → lecture initiale ouverte, contrôle de réduction → accès au contenu → captures fiche |
| `src/components/recitation/ReciterHero.jsx` | Image cassée ou attente visible → fallback, taille réservée, chargement eager → identité stable → images bloquées |
| `src/components/recitation/RowActions.jsx` | Annulation perdue au remount → abonnement à l'activité globale et gestion terminale → contrôle fiable → test démarrage suspendu |
| `src/services/downloadService.js` | Races reprise/suppression et succès incomplets → coordination, URLs vérifiées, quota et notifications → cohérence hors connexion → tests service/cache |
| `src/styles/mushaf-book.css` | Portail sans métriques/safe areas → feuille commune, chrome et disposition des pages → rendu responsive → captures 280–1920 |
| `src/styles/domains/recitation-polish.css` | Nom arabe et actions contraints → espacement et adaptation responsive → lisibilité → tests 280–1920/RTL |
| `src/styles/domains/reciter-dialog-shell.css` | Erreur dépendante du CSS du chunk défaillant → enveloppe légère indépendante → fermeture/retry accessibles → test réseau en erreur |
| `src/styles/recitationStyles.js` | Ordre de cascade de la fiche → import de l'enveloppe partagée → même apparence après chargement → build/budget et captures |
| `src/i18n/fr.js`, `en.js`, `ar.js` | Nouvelles commandes et états → libellés localisés → préserver trois langues → lint et tests FR/EN/AR |
| `public/boot-recovery.js` | Erreur optionnelle rechargeant l'application → récupération réservée au démarrage → conserver dialogue/audio → test chunk/retry |
| `eslint.config.js` | Scripts temporaires inclus dans le lint → exclure `scratch/` → même périmètre que Git/déploiement → lint global réussi |
| Tests audio, marqueurs, fonts et e2e | Régressions sans preuve → scénarios de coordonnées, transport, réseau et cache → vérifier les causes corrigées → campagnes consignées ci-dessus |

## Limites et suite de validation

- **NOT_TESTED_ON_REAL_DEVICE** : verrouillage Android/iOS, application installée, commandes système, interruption téléphonique, mode économie d'énergie, encoches physiques et minimisation native.
- **NOT_CONFIRMED** : cause exacte de chaque arrêt signalé sur le téléphone de l'utilisateur, disponibilité de chaque CDN et exactitude éditoriale de toutes les biographies. Les bugs applicatifs reproduits sont décrits séparément.
- **NEEDS_QURANIC_VALIDATION** : toute anomalie de contenu rencontrée lors d'une revue éditoriale future doit être validée avant changement. Aucune correction de dataset n'a été faite pour masquer un problème CSS.

Le résultat n'est pas une promesse de lecture après arrêt forcé du navigateur ou suspension imposée par l'OS. Le téléchargement intégral des 114 sourates de chaque voix n'a pas été exécuté : les transitions de statut sont testées avec des données contrôlées, et la persistance audio avec un média réel de petite taille.

## Déploiement

Projet cible identifié par le dépôt Git connecté : `mon-coran-main`, compte `mohamedeyaf820s-projects`. Le résultat de publication et la vérification de l'URL seront ajoutés après déploiement.
