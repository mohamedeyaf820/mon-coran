# MushafPlus — audio et hors connexion

Rapport du 30 septembre 2026. Modifications locales, sans déploiement. Un autre travail est actif dans ce dépôt, confirmé par l’utilisateur : les modifications de lecture et de tajwid de cet autre travail ont été préservées. Les mesures du build portent sur l’état partagé du dépôt.

## Audit et causes identifiées

Le lecteur principal était déjà un singleton. Les défaillances venaient surtout de responsabilités concurrentes : commandes Media Session liées au montage React, chemin de changement de verset distinct du chargeur normal, états « playing » fondés sur l’intention, reprises déclenchées par visibilité/réseau, et tentatives automatiques en arrière-plan. La fin de basmala pouvait être devinée par un délai. Un changement de récitateur pouvait amorcer deux chargements.

Le téléchargement acceptait des réponses opaques `no-cors`, impossibles à valider ; une clé de cache était assimilée à un fichier utilisable. Le calcul de taille extrapolait un échantillon. La suppression pouvait effacer le registre malgré un refus de Cache Storage, ou être suivie d’une écriture d’un téléchargement encore actif. Le lecteur dépendait du Service Worker pour utiliser un fichier local. Les anciens flux par sourate inventaient la position des versets à partir de la longueur du texte.

L’audit a également couvert les lecteurs de prononciation et d’adhan, les préchargements, les mappings Hafs/Warsh, les timings Quran.com, le stockage des préférences, le manifest et les caches shell/API/polices. Ces lecteurs secondaires ont des usages distincts ; les préchargeurs ne jouent jamais.

## Architecture retenue et comportement livré

- `audioService.js` reste le moteur global et propriétaire de l’unique lecteur principal. Un changement de route conserve cet élément. Les commandes asynchrones ont des identifiants ; pause et remplacement annulent les anciennes commandes. Les Object URLs et listeners sont libérés.
- États explicites : `IDLE`, `LOADING`, `PLAYING`, `PAUSED_BY_USER`, `INTERRUPTED`, `BUFFERING`, `ENDED`, `ERROR`. L’état du média natif détermine ce qui est annoncé au système. Les commandes de reprise simultanées partagent une promesse.
- `engineMediaSession.js` possède les commandes système, métadonnées et position, avec détection des capacités. Aucun composant React n’est nécessaire pour maintenir ces commandes.
- `ended` détermine l’avancement. Le chargeur est commun aux gestes utilisateur et aux changements de piste. Aucun minuteur ne déduit la fin d’un verset ou d’une basmala. Aucun retour au premier plan ou événement réseau ne force une reprise. Un rejet d’autoplay demande une action explicite.
- `offlineAudioStore.js` choisit d’abord un fichier local vérifié, puis le réseau si disponible. La lecture par Blob fonctionne même sans Service Worker. Un fichier absent hors connexion produit un message FR/EN/AR et un état d’erreur visible.
- Les onglets échangent une demande de focus via `BroadcastChannel`, lorsqu’il existe. Récitation, prononciation et adhan se réclament aussi le focus dans la même page. Une demande d’adhan remplacée ne relance pas son ancien chargement asynchrone.
- Diagnostic uniquement en développement : `window.__mushafAudioDiagnostics()`. Anneau limité à 100 entrées, sans URL complète : événements, état natif, piste, position, erreur, source locale/distante, visibilité, Media Session et présence d’un Service Worker.

### Fichiers par verset ou sourate complète

Un fichier continu par sourate réduit les frontières qui exigent du JavaScript et serait préférable lorsque le système suspend le processus. Mais le catalogue actuel ne propose pas de récitateurs à fichier complet par sourate, et les timings Quran.com existants portent sur les mots d’un fichier de verset, pas sur une sourate complète. Aucun jeu de timings fiable et compatible Warsh/Hafs n’a été trouvé dans le dépôt.

La lecture actuelle par fichiers a donc été conservée avec ses mappings exacts. Les anciens flux par sourate restent lisibles ; leur synchronisation et leur recherche par verset sont désactivées plutôt que déduites du texte. Aucun changement automatique de récitateur ne remplace la voix choisie lors d’une erreur. La suspension complète de JavaScript reste une limite réelle de l’enchaînement de fichiers.

## Stockage, validation et migration

Cache Storage conserve les corps audio dans **`mushafplus-audio-v2`**, sans renommer ni supprimer le cache existant lors d’une mise à jour du shell. Le petit registre de progression reste sous `mushaf_offline_progress_v2` dans localStorage ; aucun MP3 n’y est stocké. IndexedDB reste propriétaire des données applicatives existantes. Dupliquer les gros fichiers audio dans une nouvelle base apporterait une migration et un coût inutiles.

La validation exige une réponse lisible HTTP 200, un MIME audio accepté, un corps non vide, une longueur cohérente lorsqu’elle est fournie sans encodage, et des trames MPEG Layer III complètes jusqu’à la fin, avec prise en charge ID3v2/ID3v1. Les réponses 206, opaques, HTML et tronquées sont refusées pour un téléchargement complet. La lecture native reste responsable du décodage ; cette vérification ne constitue pas une empreinte du fichier original et ne peut pas détecter toute troncature exactement sur une frontière de trame si le fournisseur ne fournit aucune longueur de référence. Les variantes MP3 non reconnues sont refusées prudemment.

Les octets sont écrits, relus et vérifiés avant d’augmenter la progression réussie. Une reprise réutilise les fichiers valides. Les quotas estimés et les véritables `QuotaExceededError` sont traités. `navigator.storage.persist()` est demandé si disponible ; son acceptation n’est jamais présumée. Le contrôle des fichiers répare le registre ancien avec `validationVersion: 1`, détecte les évictions et révoque une disponibilité trompeuse, sans supprimer les téléchargements opaques ou anciens non vérifiables.

La suppression attend la fin des tâches annulées. Un refus de suppression conserve le registre et affiche une erreur. Une basmala partagée nécessaire à une autre sourate du même récitateur est conservée. La suppression groupée, confirmée, supprime le cache audio commun, qui contient aussi les adhan téléchargés.

Le Service Worker conserve son traitement des requêtes Range/206. Son shell passe à `mushaf-plus-v22` ; l’activation élimine uniquement les anciens caches shell appartenant à l’application et conserve les téléchargements, les polices et les caches d’autres applications.

## Interface vérifiée

L’onglet « Téléchargements / Hors connexion » présente la sourate, le récitateur, la riwaya, l’état vérifié/incomplet/non vérifié, le nombre de fichiers, leur taille, la connexion et la persistance. Il distingue les octets audio lisibles de l’usage total estimé de l’origine fourni par le navigateur : les anciennes réponses opaques ne permettent pas une mesure directe fiable.

Suppression individuelle, suppression groupée avec confirmation, annulation et nouvelle vérification sont disponibles. Les boutons respectent 44 px. La barre des paramètres est défilable sur téléphone. FR/EN/AR, RTL et les états vides ont été inspectés en rendu ; la migration, l’annulation et la suppression groupée sont testées dans les trois langues.

Preuves de rendu locales :

- [Français, téléphone](../.codex-artifacts/offline-audio/settings-fr.png)
- [Anglais, bureau](../.codex-artifacts/offline-audio/settings-en.png)
- [Arabe RTL, téléphone](../.codex-artifacts/offline-audio/settings-ar.png)

## Vérification automatisée

| Commande / contrôle | Résultat constaté |
| --- | --- |
| `npm run lint` | Réussi, dernière exécution sans erreur. |
| `npm run audit:screen-budget` | Réussi ; moteur 44,5 kB / 46, lecteur 36,9 kB / 42. |
| `npm run test:security` | 476 tests réussis, 0 échec dans la dernière exécution du dépôt partagé. |
| Scénarios Chromium audio + paramètres | 8/8 réussis après les dernières modifications du focus, avec FR/EN/AR. |
| `npm run test:e2e:smoke` | 7/7 réussis. |
| `npm run test:e2e:responsive` | 36/36 réussis. Exécution avant la dernière coordination du focus, qui ne change pas le rendu. |
| `npm run test:e2e:offline` | 4/4 réussis ; shell, texte, police et audio. Exécution avant la dernière coordination du focus ; lecture locale reverifiée ensuite dans les 8 scénarios audio. |
| `npm run test:e2e:reading` | 5 succès directs et 1 succès après relance automatique. Intermittence : déplacement de mise en page au démarrage, score 0,2788 contre seuil 0,1. |
| `npm run build:ci` | Compilation Vite et génération des ressources réussies ; commande globale en échec sur `bundle-budget`. |
| `git diff --check` | Réussi. |

Le dernier build mesure 1 387,3 kB de JavaScript pour un plafond de 1 380 kB ; CSS + JS : 2 412,1 kB pour 2 405 kB ; entrée initiale : 822,1 kB pour 820 kB. Le plus gros JS respecte désormais son plafond (234,8 / 235 kB). Les contrôles SEO, performance, budget par écran, architecture CSS et en-têtes de sécurité passent. Aucun plafond n’a été relevé. **Le build CI n’est donc pas validé pour livraison.** Ces mesures incluent le travail concurrent ; son attribution exacte nécessiterait une mesure isolée de référence.

Échecs rencontrés et corrigés pendant cette intervention : données de cache de tests contenant seulement trois octets ID3 remplacées par un MP3 réel ; assertions d’anciens noms de shell/cache corrigées ; données de préparation des paramètres complétées par le champ obligatoire `updatedAt` ; ancien faux lecteur Warsh remplacé par un fichier natif de test, car il ne produisait jamais la fin de basmala. Une collision de génération du rapport Playwright a été éliminée par des sorties distinctes et le reporter texte. Un test de tajwid a échoué dans une exécution intermédiaire du dépôt partagé ; il passe dans la dernière suite complète sans intervention dans son implémentation. Les réserves restantes sont le budget de build, l’intermittence de mise en page et les appareils réels.

Les traces, captures et journaux de cette session sont conservés localement sous `.codex-artifacts/offline-audio/` (dossier ignoré par Git). Les tests reproduisent les captures de paramètres.

Les tests couvrent le singleton, les transitions natives, le refus de `play()`, la pause explicite, la reprise à la même position, les commandes Media Session indépendantes de l’UI, l’enchaînement caché, le focus entre usages audio, les fichiers invalides, la priorité locale sans Service Worker, les mappings Warsh/Hafs, les basmalas partagées, les quotas, l’annulation pendant une suppression, la migration, l’éviction et l’activation du Service Worker. Le test navigateur de lecture hors ligne vérifie aussi que la navigation vers l’accueil conserve le même élément et la même source en lecture.

Les sondages réels de `001001.mp3` chez EveryAyah ont reçu HTTP 200 et passé la validation pour Husary (82 164 octets) et Muhammad Ayyoub (106 289 octets). Le contrôle HTTP de Husary a indiqué CORS `Access-Control-Allow-Origin: *`. Un sondage QuranPedia a renvoyé HTTP 403 depuis cet environnement ; cela ne valide pas ce fournisseur sur un téléphone ni toutes ses ressources. Aucun contournement `no-cors` ne masque un refus de téléchargement.

## Limites et validation sur appareils

**REAL_DEVICE_TEST_REQUIRED** : aucun Android ou iPhone physique n’a été utilisé dans cette session. Chromium automatisé, les événements cachés simulés et les viewport mobiles ne prouvent pas la tenue pendant un verrouillage réel, une suspension système, un appel ou une coupure du processus.

À exécuter sur Chrome Android, PWA Android installée, Safari iPhone et PWA iPhone installée : télécharger une sourate Hafs et une Warsh ; passer en mode avion ; lancer puis verrouiller pendant 15–30 minutes en traversant plusieurs fichiers ; utiliser les commandes système ; recevoir un appel/changer la sortie audio ; revenir sans reprise inattendue ; effectuer une pause volontaire, changer de route/récitateur, reprendre ; vérifier une mise à jour du shell et un téléchargement interrompu. Consigner OS, version du navigateur, récitation, durée et résultat exact. Tester aussi l’EQ actif séparément du chemin natif plat.

La Media Session a une disponibilité et des commandes variables selon les navigateurs ; le code ne suppose pas leur présence. Voir [MDN MediaSession](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession) et [setPositionState](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession/setPositionState). WebKit a documenté des suspensions d’AudioContext en arrière-plan dans [le ticket 261554](https://bugs.webkit.org/show_bug.cgi?id=261554) : ce ticket historique n’est pas une preuve concernant chaque version actuelle d’iOS. Le stockage peut être refusé ou évincé même après une demande de persistance.

La fermeture ou destruction de la page détruit son lecteur ; une PWA ne peut pas garantir l’audio d’un processus arrêté. Les préférences et la position de lecture applicative restent dans leur mécanisme existant ; la position temporelle audio est conservée dans le moteur vivant lors d’une interruption, sans promesse de restauration sonore automatique après destruction du processus. Les téléchargements et suppressions simultanés entre onglets ne sont pas des transactions globales ; le focus BroadcastChannel est une coordination au mieux selon l’activité des onglets.

## Fichiers de cette intervention

Créés :

- `src/services/offlineAudioStore.js`
- `src/services/engineMediaSession.js`
- `src/i18n/offline.js`
- `src/components/settings/OfflineDownloadsSection.jsx`
- `tests/offline-audio-store.test.mjs`
- `tests/e2e/offline-downloads-settings.spec.mjs`
- `docs/OFFLINE_AUDIO_REFACTOR.md`

Modifiés :

- `src/services/audioService.js`, `audioSession.js`, `audioHandoff.js`, `basmalaPreroll.js`, `downloadService.js`, `adhanService.js`
- `src/components/AudioPlayer.jsx`, `SettingsModal.jsx`, `recitation/RowActions.jsx`
- `src/utils/surahStreamSync.js`, `wordAudio.js`
- `src/styles/settings-enhanced.css`, `public/sw.js`, `ARCHITECTURE.md`
- `tests/audio-mobile-lifecycle.test.mjs`, `basmala-preroll.test.mjs`, `full-quran-download.test.mjs`, `security-audio-network.test.mjs`, `recitation-performance.test.mjs`, `pwa-sw.test.mjs`, `qa-offline-resilience.test.mjs`
- `tests/e2e/background-audio.spec.mjs`, `offline-audio-playback.spec.mjs`, `audio-fallback.spec.mjs`

Supprimé : `src/hooks/useMediaSession.js`, après vérification de ses références et déplacement de son unique consommateur vers le moteur.

Le code de relance automatique en arrière-plan, les timers de reprise abandonnés, le chemin séparé de démarrage entre versets et les timings estimés ont été retirés. Les autres changements visibles dans `git status` appartiennent au travail concurrent et ne font pas partie de cette liste. Le fichier partagé `wordAudio.js` contient également les améliorations de réutilisation de son élément effectuées par cet autre travail ; l’intervention audio ci-dessus y ajoute la coordination du focus.
