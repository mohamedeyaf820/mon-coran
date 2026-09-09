# MushafPlus — vérification et corrections du 9 septembre 2026

## Périmètre et état initial

La demande jointe couvre lecture, Hafs/Warsh, immersion, audio, récitateurs et PWA. Le dépôt contenait déjà des modifications non commitées sur ces domaines et un rapport du 8 septembre. Elles ont été conservées. Les résultats de ce document proviennent de cette nouvelle exécution ; le rapport précédent ne prouve pas que l’état trouvé fonctionnait.

Le premier `build:ci` échouait : fermeture de `ScrollProvider` au milieu d’un `div`. Après correction, d’autres erreurs de parsing ont été exposées : expressions `className` non fermées dans deux renderers et ternaire vide dans le karaoke Warsh. Le hook de scroll utilisait aussi `showScrollTop` et son setter sans les déclarer. Ces défauts empêchaient de livrer/utiliser le lecteur.

## Inventaire technique

| Point demandé | Implémentation observée |
| --- | --- |
| Stack | React 18, JavaScript/JSX, Vite 8, Tailwind/CSS, Radix, IndexedDB/idb, Service Worker |
| Renderer normal | PageMode → CleanPageView → SmartAyahRenderer ; lecture liste via QCVerseByVerseView ; pages virtualisées en sourate/juz |
| Renderer fullscreen | FullscreenMushafOverlay → ImmersiveMushafPage → CleanPageView, portail body |
| Polices Hafs | Catalogue src/data/fonts.js, famille QPC Hafs et autres choix ; chargement fontLoader |
| Polices Warsh | Familles QPC Warsh/KFGQPC Warsh selon préférence et compatibilité |
| Tajwid | AyahTextRenderer/TajweedText, plus karaoke Warsh ; tests des segments et ligatures présents |
| Markers | appendNativeAyahMarker, renderer natif et AyahMarker pour les autres surfaces |
| Double marker Warsh | Adaptateur existant stripWarshEncodedAyahMarker : glyphe terminal isolé correspondant au numéro ; tests de préservation des autres signes réussis |
| Clipping | Aucun nouveau rognage permanent de glyphe confirmé sur les captures inspectées ; pas de certification exhaustive des 604 pages |
| Overflow suspects | App shell et règles de cartes avec overflow hidden ; le main immersif est scrollable ; une règle CSS isolée ne démontre pas un rognage |
| Scroll owner | useQuranDisplayView résout .app-main, sinon le scroll document ; plein écran : son main |
| Nested scroll | Portail immersif indépendant, application arrière rendue inert ; contrôles/panneaux peuvent avoir leur propre débordement |
| VerseBlock | Article QCVerseByVerseView : meta/actions → arabe → translittération → traduction |
| Divider | border-bottom sur l’article englobant, après son contenu ; aucun déplacement DOM nécessaire établi |
| Header mobile | Header global avec navigation, riwaya, recherche et menu ; ReadingToolbar porte les options du lecteur |
| Audio engine | audioService singleton, HTMLAudioElement, playlist et continuation ; aucun moteur fullscreen ajouté |
| Background | Continuation native et useMediaSession existants ; test hidden/frames suspendues distinct d’un verrouillage OS |
| Récitateurs | Catalogue HomePage ; ReciterDetailPage, ReciterHero, RowActions, ReciterBioCollapse |
| Loading | useReciterProfile : timeout, retry, annulation logique des réponses obsolètes ; fiche lazy avec reprise |
| Offline/download | downloadService, Cache Storage, états de cache vérifiés ; SW et réponses Range |
| Bloquants | JSX invalide et état scroll manquant confirmés |
| Autres défauts confirmés | Listeners non nettoyés ; marqueurs/clic désynchronisés ; numéro de feuille pris dans la première ayah ; basmala initialement masquée par animation |
| Intervention | Remise en état → scroll/markers → vérification navigateur → numéro des feuilles/basmala → régressions et gates |

Le fichier non suivi `MushafPageRenderer.jsx` trouvé au départ n’est pas le renderer réellement utilisé. Son import inutilisé dans PageMode a été retiré. Aucun nouveau chemin concurrent de texte n’a été introduit.

## Quran integrity, Hafs et Warsh

Aucun dataset, fichier de police, harakat, numéro de verset ou signe coranique n’a été modifié pendant cette intervention. Les corrections JSX conservent les expressions de texte existantes. Les classes `native-ayah-marker` ont été rétablies dans les branches de rendu concernées pour correspondre à la typographie et aux handlers de CleanPageView. Les signes non numérotés restent distincts.

Le karaoke Warsh avait un emplacement de marqueur vide : le marqueur natif a été rétabli avec la police sélectionnée. L’adaptateur Warsh déjà présent et ses limites ont été conservés. Les 205 tests unitaires incluent les signes Warsh et la segmentation Tajwid ; ils ne constituent pas une validation éditoriale de l’intégralité du Quran.

La basmala utilisait une animation commençant à opacity 0, translateY(10px), scale(0.97). L’inspection a retrouvé cette transformation capturée dans le plein écran. L’animation d’apparition du texte arabe a été retirée : texte visible immédiatement et métriques stables. Son contenu est identique.

## Scroll

ScrollProvider est correctement imbriqué. Il expose des callbacks stables et un délai de suspension du suivi dans une ref, sans timer ni rerender à chaque geste. Le hook retrouve son état de bouton retour en haut. Les callbacks enregistrés pour wheel/touchstart/pointerdown sont exactement ceux retirés au nettoyage. Le suivi conserve la garde de défilement manuel et le contrôle de visibilité de la cible. La restauration initiale utilise le déplacement immédiat ; le suivi respecte la préférence de mouvement réduit.

Une régression navigateur retourne deux fois à l’accueil puis reprend le lecteur : aucun listener suivi résiduel après démontage, remontage fonctionnel et aucune erreur JavaScript.

## Fullscreen, zoom et double page

Le renderer partagé existant est conservé. Les tests comparent texte, styles et regroupement des mots par ligne entre normal et immersion. Les zooms 75/100/125/150 % conservent la composition. Les scénarios de double page vérifient ordre RTL, préférence conservée lors de rotation, transport audio et borne 604.

Défaut visuel supplémentaire : le pied de page reprenait `ayahs[0].page`, et deux feuilles pouvaient afficher le même numéro. CleanPageView accepte maintenant l’identité explicite de la page, transmise par PageMode et l’adaptateur immersif. La donnée ayah reste intacte. Les tests vérifient les numéros des deux feuilles.

Le plein écran est un portail CSS, pas un appel au Fullscreen API. Les contrôles ne s’effacent pas automatiquement. Le complément ci-dessous ajoute les réglages Page entière / Largeur ; le pinch personnalisé reste absent et le zoom système disponible.

## Mobile header, VerseBlock et mini-player

La structure actuelle du header et du player compact a été conservée. Les tests existants contrôlent leur contrat mobile et les safe areas. Les captures mobile/desktop ont été inspectées. La séparation des versets est déjà en fin d’article ; aucun nouveau VerseBlock ni refonte cosmétique n’a été introduit sans défaut DOM établi.

## Audio, récitateurs et offline

Le moteur audio et les modifications préexistantes de continuation ont été conservés. Les scénarios passent pour entrée/sortie fullscreen, rotation et même élément audio. Le test offline ferme réellement le navigateur, rouvre le profil hors connexion et décode un média de test mis en cache ; ce n’est pas un téléchargement exhaustif de tous les récitateurs.

Le défaut de démarrage juz a été isolé : ReadingToolbar acceptait un clic avant disponibilité des versets, alors que playSurah retourne sur une liste vide. JuzMode transmet maintenant un état indisponible à la toolbar. La pause reste utilisable lorsqu’un transport est actif. Un test retarde la réponse juz, vérifie le bouton désactivé, libère la réponse puis vérifie le démarrage effectif. Ce test et la continuation entre juz réussissent.

Les tests de fiche couvrent échec du module/retry, échec du profil, portrait indisponible, RTL Warsh, téléchargement annulable après remontage. Les tests unitaires couvrent notamment téléchargement partiel/annulé et intégrité du cache. Aucun portrait ni biographie n’a été inventé.

Recherche vocale : useVoiceSearch et voiceRecognitionSession gèrent détection du support, contexte sécurisé au lancement, refus, absence de parole et timeout de 15 secondes. Aucun service cloud ajouté. Microphone réel non exercé.

## Validation

- `npm run build:ci` : réussi après les corrections, incluant budgets écran/bundle, CSS, SEO et headers.
- `npm run lint -- --no-cache` : réussi ; vérification sans cache pour éviter un résultat périmé.
- `npm run test:security` : 205/205 réussis.
- Campagne principale Chromium : 51/52 réussis initialement. L’échec juz a été isolé et corrigé ; test de chargement retardé et continuation réussis ensuite, 2/2 (`scratch/reading-juz-ready.log`).
- Campagne complémentaire : 13/14 réussis avant cette dernière correction. Les 13 couvrent polices réelles, basmala sans animation, double page et numéros, 393/402 px, lifecycle et trois parcours Axe ; seul le démarrage juz avait échoué et a été revérifié après correction.
- Test ajouté de démontage/remontage : réussi après correction du sélecteur de reprise du test.
- Largeurs initialement couvertes : 280, 320, 360, 375, 390, 412, 430, 480, 600, 768, 820, 1024, 1280, 1440, 1920 ; 393 et 402 ajoutées à la matrice.
- Comparaison composition page 3 Hafs/Warsh : 320 et 1280, quatre zooms.
- Aucun script typecheck dédié : projet JavaScript.

Journaux : `scratch/reading-build-current.log`, `scratch/reading-lint-current.log`, `scratch/reading-tests-current.log`, `scratch/reading-e2e-current.log`, `scratch/reading-lifecycle-current.log`, `scratch/reading-final-e2e.log`. Captures : `test-results/`, `test-results/final-reading/` et `scratch/reading-*.png`. Les artefacts scratch restent locaux.

## Limites

### Amélioration de la mise en page et correction des ligatures colorées

- Reproduction visuelle du signalement d'Al-Baqara : dans `أَلَآ` (2:13), la plage CSS Highlight limitée à l'alif supprimait visuellement une partie de la ligature lām-alif avec QPC Hafs. Le même mot sans Highlight était complet. `expandArabicPaintRange` étend désormais la coloration à la ligature et aux marques attachées ; les caractères et le texte source restent identiques. Cette correction est partagée par le rendu normal et immersif. Aucune police ni donnée coranique modifiée.
- Plein écran : mesure des hauteurs réelles par ResizeObserver, mode Page entière par défaut sur grand écran et Largeur sur petit écran, réglages traduits FR/EN/AR et zoom conservé. Les commandes audio et pagination partagent une rangée lorsque la place le permet. Les titres de sourate sont compacts ; les métadonnées et pieds de page ont leur propre mise en page. La copie de styles depuis le lecteur normal se limite au texte des versets pour ne plus agrandir les titres décoratifs.
- Validation : build:ci et lint sans cache réussis, 208 tests unitaires réussis. Comparaisons visuelles avec/sans coloration sur Al-Baqara, puis pages 186–187 ; cas navigateur dédiés pour les plages de coloration, ajustement en hauteur et largeur, rotation et mobile. Les détails d'exécution sont dans `scratch/layout-*.log` ; comparatif des ligatures dans `scratch/ligatures-comparison.png`.
- Limite : il s'agit d'une correction du défaut de peinture reproduit, pas d'une certification visuelle de chaque glyphe sur toutes les pages et tous les navigateurs.

### Correctif complémentaire après signalement du plantage plein écran

Le nouvel entry point `QuranMushafRenderer` trouvé dans le dépôt transmettait `ayahs` à `SmartAyahRenderer`, qui attend `ayah`. Cela provoquait une lecture de `numberInSurah` sur `undefined` en mode Mushaf. Cet entry point réexporte désormais `CleanPageView`, également utilisé en immersion. PageMode transmet les identifiants globaux des versets, le callback de lecture et le mode de police. Un import inutilisé et invalide de l'ancien renderer a été retiré.

Validation de cet état : lint sans cache réussi, 205 tests unitaires réussis et 10 tests Chromium réussis, dont deux nouvelles régressions Liste → Mushaf → deux ouvertures/fermetures plein écran en Hafs/Warsh. Les autres scénarios couvrent double page/rotation, borne 604, largeurs 393/1280 et continuité du transport audio. Tous les contrôles `build:ci` aboutissent, avec l'avertissement existant de taille CSS. Captures inspectées et journaux : `scratch/fullscreen-after-fix.png`, `scratch/fullscreen-fix-*.log`.

NOT_TESTED_ON_REAL_DEVICE : Android/iPhone, écran verrouillé, interruption par appel, Safari avec ses barres système, PWA installée et clavier virtuel. Chromium automatisé et l’état hidden simulé ne prouvent pas ces comportements.

NOT_CONFIRMED : certification d’absence de clipping pour tous les glyphes/pages/polices ; validation éditoriale exhaustive du catalogue. Aucune anomalie de donnée nouvelle ne justifie une modification du Quran ; toute correction future de contenu nécessitera NEEDS_QURANIC_VALIDATION.

Les scénarios d’accessibilité automatisés ne remplacent pas une session complète avec lecteur d’écran. Le profiling CPU sur téléphone et l’autonomie audio réelle ne sont pas mesurés ici. La refonte premium complète décrite dans la demande reste plus large que les corrections confirmées de cette intervention.

## Changelog de cette intervention

| Fichier | Problème → modification → vérification |
| --- | --- |
| src/App.jsx | Imbrication invalide du provider → JSX valide → build et navigation |
| src/context/ScrollContext.js | Timers/rerenders et JSX dans .js → callbacks stables, ref et createElement → build et démontage/remontage |
| src/components/QuranDisplay/PageMode.jsx | Imports doublés/inutilisés → nettoyage ; page explicite → build et double page |
| src/components/QuranDisplay/useQuranDisplayScroll.js | État absent/listeners fuyants → état restauré, nettoyage, suivi protégé → tests scroll |
| src/components/Quran/AyahTextRenderer.jsx | Expressions JSX incomplètes/classes incompatibles → syntaxe et classe natives → build, composition Hafs/Warsh |
| src/components/Quran/TajweedText.jsx | Même défaut dans deux branches → syntaxe/classes restaurées → build, polices et composition |
| src/components/Quran/KaraokeWarshText.jsx | Ternaire vide → marqueur natif avec police active → double page/audio Warsh |
| src/components/Quran/CleanPageView.jsx | Clic marker désynchronisé et pied de page ambigu → sélecteur natif et identité explicite → interaction/double page |
| src/components/QuranDisplay/ImmersiveMushafPage.jsx | Numéro de feuille implicite → transmission de page → assertions des pieds de page |
| src/components/Quran/Bismillah.jsx | Texte initialement invisible et transform capturable → retrait animation arabe → computed styles et captures |
| src/components/Quran/ReadingToolbar.jsx et src/components/QuranDisplay/JuzMode.jsx | Lecture proposée avant disponibilité des versets → disponibilité explicite du bouton → réponse retardée et démarrage réel |
| tests/e2e/reading-stability.spec.mjs | Régression lifecycle ajoutée |
| tests/e2e/fullscreen-shared-reader.spec.mjs | Numéros des feuilles + largeurs 393/402 ajoutés |
| tests/e2e/fullscreen-fonts.spec.mjs | Visibilité et stabilité immédiates de la basmala vérifiées |
