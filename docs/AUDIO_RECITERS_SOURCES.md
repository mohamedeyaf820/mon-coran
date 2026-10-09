# Récitants et audio : où les trouver, comment chaque source fonctionne

Recherche du 2026-10-08 pour MushafPlus. Même méthode que `docs/WARSH_SOURCES.md`. Aucune ligne de code ni donnée du projet n'a été modifiée.

Statuts : **VÉRIFIÉ** (requête faite pendant la recherche, résultat reproductible), **RAPPORTÉ** (fiche de store ou résultat de recherche, non recoupé), **NON VÉRIFIÉ**.

---

## 1. Résumé

1. **Golden Quran : la liste exacte de ses récitants et ses serveurs audio sont inconnus.** Les fiches des stores annoncent « plus de 200 récitants » (iPhone, v17.0.2) et « plus de 40 récitants » (Android, v20.1), en streaming ou en téléchargement. [RAPPORTÉ] Je n'ai pas installé l'application et je n'ai pas regardé son trafic réseau : dire d'où viennent ses fichiers serait deviner. La méthode pour le savoir est au §6. [NON VÉRIFIÉ]
2. **Les fiches décrivent deux modes de lecture** : verset par verset avec surlignage, avec répétition d'un verset, d'un passage, d'un hizb ou d'un juz' (iPhone) ; et une rubrique « sourate entière » avec n'importe quel récitant (Android). [RAPPORTÉ]
3. **Il existe quatre catalogues publics couvrant largement ce que ces applications proposent**, et trois fonctionnent de façons différentes (§2 à §5). Les chiffres ci-dessous sont mesurés aujourd'hui. [VÉRIFIÉ]

| Source | Récitants | Forme du fichier | Horaires par verset | Riwayat |
|---|---|---|---|---|
| mp3quran.net | 242 récitants, 288 mushafs | un MP3 par sourate | oui pour 115 lectures (API séparée) | Hafs 220, Warsh 15, Qalon 11, autres |
| Quran.com (QDC) | 14 récitations par sourate | un MP3 par sourate | oui, pour tous : verset et mot | Hafs |
| EveryAyah | 79 entrées (plusieurs débits par récitant) | un MP3 par verset | non nécessaire (un fichier = un verset) | Hafs surtout |
| AlQuran.cloud | 32 éditions verset par verset | un MP3 par verset | non nécessaire | Hafs |

---

## 2. mp3quran.net : sourate entière, horaires sur une partie des lectures

- Catalogue : `GET https://www.mp3quran.net/api/v3/reciters?language=eng` (avec `www` et en https : l'adresse sans `www` renvoie une redirection 301). 242 récitants, 288 mushafs. [VÉRIFIÉ]
- Chaque mushaf a un `server` (dossier sur `cdn.mp3quran.net` ou `serverN.mp3quran.net`), une `surah_list` et un `surah_total`. Le fichier d'une sourate est `<server>/<numéro sur 3 chiffres>.mp3`. Certains mushafs sont incomplets : par exemple 50, 65 ou 16 sourates sur 114. [VÉRIFIÉ]
- Riwayat : Hafs 220 mushafs, Warsh `ʿan Nāfiʿ` 13 (+2 par d'autres chaînes de transmission), Qalon 11, Ad-Dūrī, Shuʿba, Khalaf, etc. [VÉRIFIÉ]
- Horaires : `GET https://www.mp3quran.net/api/v3/ayat_timing?surah=N&read=ID` renvoie `[{ayah, start_time, end_time, ...}]` en millisecondes. La liste des lectures qui en ont : `GET /api/v3/ayat_timing/reads` (115 lectures : 98 Hafs, 5 Warsh, 3 Qalon, et quelques autres). [VÉRIFIÉ]
- Warsh avec horaires : Yassin Al-Jazairi (14), Al-Koshi (16), Omar Al-Qazabri (80), Husary Warsh (120), Muhammad Saayed (134). Le numéro de verset de ces horaires est-il en numérotation Warsh ou Hafs ? **Non vérifié** : à contrôler avant tout usage. [NON VÉRIFIÉ]
- Dans le projet : 3 récitants sont déjà servis en `mp3quran-surah` (Al-Thubaiti, Al-Meqren, Al-Kalbani), mais sans horaires : `src/utils/surahStreamSync.js` est un stub, donc ni surlignage ni saut au verset.

## 3. Quran.com (QDC) : sourate entière, avec horaires de verset et de mot

- Récitants : `GET https://api.qurancdn.com/api/qdc/audio/reciters?locale=en` renvoie 14 récitations : Abdulbaset (Murattal et Mujawwad), As-Sudais, Al-Shatri, Hani Ar-Rifai, Husary (Murattal et Muallim), Ash-Shuraim, Al-Afasy (2), Al-Minshawi (Murattal et « Kids repeat »), Yasser Ad-Dussary, Khalifah Al-Tunaiji. Tous Hafs. [VÉRIFIÉ]
- Fichier et horaires : `GET https://api.quran.com/api/v4/chapter_recitations/{id}/{sourate}?segments=true` renvoie **un MP3** (`https://download.quranicaudio.com/qdc/...`) et, pour chaque verset, `timestamp_from`, `timestamp_to` (ms) et les segments mot par mot. Testé sur Al-Afasy (7), sourate 1 : 7 versets, bornes continues. [VÉRIFIÉ]
- Attention : l'identifiant d'une récitation **par sourate** n'est pas celui d'une récitation **verset par verset** (`/recitations/{id}/by_chapter/{n}`, que le projet utilise déjà dans `quranComAudioTimingService.js`). Ne pas les mélanger. [RAPPORTÉ par la documentation, cohérent avec les identifiants relevés]
- `GET /api/v4/resources/chapter_reciters` a répondu 503 à plusieurs reprises pendant la recherche : utiliser le point d'accès QDC ci-dessus. [VÉRIFIÉ]

## 4. EveryAyah : un fichier par verset

- Catalogue : `https://everyayah.com/data/recitations.js` : 79 entrées (`subfolder`, `name`, `bitrate`). Plusieurs entrées sont le même récitant à des débits différents. Le fichier d'un verset est `https://everyayah.com/data/<subfolder>/<sourate sur 3 chiffres><verset sur 3 chiffres>.mp3`. [VÉRIFIÉ]
- Pas de fichier de sourate, pas d'horaires : un fichier correspond exactement à un verset, ce qui rend le surlignage trivial mais oblige à changer de source à chaque verset (le sujet du document sur l'audio en arrière-plan).
- Dans le projet : 43 récitants `everyayah`. Les récitants Warsh du projet (6) passent par Quranpedia, un fichier par verset en numérotation Warsh.

## 5. AlQuran.cloud : un fichier par verset

- `GET https://api.alquran.cloud/v1/edition?format=audio&type=versebyverse` : 32 éditions (identifiants du type `ar.alafasy`, que le projet utilise déjà pour nommer ses récitants). [VÉRIFIÉ]

---

## 6. Savoir ce que Golden Quran utilise vraiment

Les fiches ne le disent pas. Pour le savoir sans deviner :

1. **Android (le plus simple)** : installer l'application sur un téléphone ou un émulateur, passer le trafic par un proxy d'inspection (par exemple HTTP Toolkit ou mitmproxy), lancer un verset puis une sourate entière. Les adresses des fichiers montrent immédiatement le serveur (`everyayah.com`, `*.mp3quran.net`, `download.quranicaudio.com`, ou un serveur propre) et la forme (`001001.mp3` = verset ; `001.mp3` = sourate).
2. **iPhone** : même idée avec un proxy sur le Wi-Fi ; le trafic de certaines applications n'est lisible qu'avec un certificat installé, et certaines applications refusent le proxy.
3. **Ce que cela prouverait** : la forme du fichier (sourate ou verset), l'origine des horaires (fichier de sourate découpé par des horaires, ou plusieurs fichiers de versets), et le catalogue réel des récitants.

Je n'ai pas fait ces essais : ils demandent un appareil et l'installation d'une application tierce. Les fiches des stores ne remplacent pas cette mesure.

## 7. Ce qu'il faut retenir pour MushafPlus

- **Pour le verset par verset** (répétition A-B, un verset, mémorisation) : EveryAyah et Quranpedia, déjà en place.
- **Pour l'écoute continue** (sourate entière, écran verrouillé) : mp3quran (242 récitants) ou Quran.com (14, avec horaires mot par mot). Le surlignage exige des horaires ; sans eux, ces fichiers jouent « à l'aveugle » (état actuel des 3 récitants du projet).
- **Couverture Warsh en sourate entière avec horaires** : 5 lectures chez mp3quran, numérotation à vérifier.
- **Ordre de grandeur de poids** : Al-Fatiha pèse 840 Ko pour 46 s chez Al-Afasy ; Al-Baqarah dépasse très probablement 100 Mo (extrapolation, non mesurée).

## 8. Ce qui est en place : sourate complète ou verset par verset (2026-10-08)

**Principe** (celui de Quran.com) : une voix publiée des deux façons peut lire une sourate entière comme **un seul enregistrement**, sans changement de source à chaque verset (donc rien pour un téléphone verrouillé à figer entre deux versets) ; le verset en cours est déduit de la position, grâce aux horaires de chaque verset.

- **Choix de la voix** : `src/services/surahAudioSources.js` relie les fichiers par verset déjà utilisés (EveryAyah / Quran.com CDN) à l'identifiant « lecteur de chapitre » de Quran.com. Onze voix y figurent (Alafasy 7, Abdul Basit murattal 2 et mujawwad 1, Husary 6 et Husary muallim 12, Minshawi murattal 9, Shuraym 10, Sudais 3, Rifai 5, Shaatree 4, Tunaiji 161). Chaque identifiant a été vérifié contre l'`audio_url` que l'API renvoie (le nom du dossier désigne la voix) et contre le nombre de versets d'Al-Baqara. **Minshawi mujawwad (8) est exclu** : ses horaires commencent au verset 27.
- **Horaires** : `GET /api/v4/chapter_recitations/{voix}/{sourate}?segments=true` donne le fichier (`download.quranicaudio.com`) et, par verset, `timestamp_from` / `timestamp_to` en millisecondes et les segments de mots. `getChapterAudioTimeline` (`quranComAudioTimingService.js`) les convertit en secondes, rend les segments relatifs à leur verset (le surlignage mot à mot lit donc les mêmes données dans les deux modes) et **refuse** une réponse incomplète : fichier absent, mauvaise sourate, verset manquant, ordre cassé, nombre de versets différent de la sourate.
- **Quand** (`audioSurahRoute.js`) : mode « Auto » = sourate(s) **complète(s)**, Hafs, en ligne, voix à double publication, et rien qui exige un élément par verset. Restent en verset par verset : une page ou un juz, la répétition A-B, le mode Tartil, Warsh (numérotation différente), hors ligne (les audios téléchargés sont des fichiers de verset). Si le chargement des horaires échoue, **le même verset est joué depuis ses fichiers** et l'échec est retenu pour la session.
- **Réglage** : « Mode d'écoute » (Auto / Sourate complète / Verset par verset), visible seulement pour une voix qui a les deux, enregistré dans les réglages (`audioPlaybackMode`). Activer A-B ou Tartil passe d'abord en verset par verset, sur le verset en cours.
- **Verset suivant / précédent** : un déplacement dans le même enregistrement (pas de changement de source).

**Limites connues.**
1. Un fichier de sourate entier est plus lourd qu'un fichier de verset : en réseau limité, le début peut être plus long à venir. Le positionnement sur un verset utilise la position de départ avant lecture ; un navigateur qui l'ignore démarre au début puis se place (un court instant du début peut s'entendre). [NON VÉRIFIÉ sur iOS/Safari réel]
2. Les audios **téléchargés** pour l'hors ligne sont des fichiers de verset : en ligne, l'application lit l'enregistrement de sourate même si le verset est téléchargé. [décision à prendre : préférer le local]
3. Le comportement en arrière-plan sur un vrai téléphone verrouillé n'a pas pu être vérifié ici (tests simulés seulement).
4. Les autres voix restent en verset par verset (aucun jumeau de sourate vérifié pour elles).
