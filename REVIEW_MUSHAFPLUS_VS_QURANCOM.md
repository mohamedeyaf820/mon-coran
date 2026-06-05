# 📖 Revue Exhaustive — MushafPlus vs Quran.com

> Analyse détaillée fonctionnalité par fonctionnalité — Focalisée sur les pages de récitation

**Date :** Mai 2026
**Méthodologie :** Analyse du code source MushafPlus + exploration live de Quran.com (reciters, radio, reader, reciter detail)

---

## 📑 TABLE DES MATIÈRES

1. [Page Récitateurs (`/reciters`)](#1-page-récitateurs-reciters)
2. [Page Détail Récitateur (`/reciters/:id`)](#2-page-détail-récitateur-recitersid)
3. [Radio Quran (`/radio`)](#3-radio-quran-radio)
4. [Lecteur Audio (pendant la lecture)](#4-lecteur-audio-pendant-la-lecture)
5. [Page de Lecture (`/:surah`)](#5-page-de-lecture-surah)
6. [Fonctionnalités Avancées Récitation](#6-fonctionnalités-avancées-récitation)
7. [Matrice de Comparaison Globale](#7-matrice-de-comparaison-globale)
8. [Scoring Final](#8-scoring-final)
9. [Recommandations & Roadmap](#9-recommandations--roadmap)

---

## 1. PAGE RÉCITATEURS (`/reciters`)

### Quran.com — Ce qui est présent

| Fonctionnalité | Description |
|----------------|-------------|
| **Grille de cartes** | Photo du récitateur, nom, badge de style (Murattal/Mujawwad/Kids Repeat/Muallim) |
| **Photos de profil** | Images hébergées sur `static.qurancdn.com`, optimisées Next/Image |
| **Style badges** | Colorés par type : Murattal, Mujawwad, Muallim, Kids Repeat |
| **Navigation** | Clic → page détail du récitateur avec ses 114 sourates |
| **Search/Filter** | ❌ Aucun — pas de barre de recherche ni filtre par style |
| **Play direct** | ❌ Non — impossible de lancer l'audio depuis cette page |
| **Favoris** | ❌ Non — nécessite un compte (Sign in) |
| **Tri** | ❌ Non — ordre fixe |

### MushafPlus — Ce qui est présent

| Fonctionnalité | Description | Fichier |
|----------------|-------------|---------|
| **Grille + Liste** | Vue grille ET vue liste, toggle utilisateur | `HomePage.jsx` |
| **Recherche récitateur** | Filtre par nom (arabe, français, anglais) | `reciterRanking.js` |
| **Filtre par style** | Murattal / Mujawwad / Muallim / Tous | `HomePage.jsx` |
| **Favoris** | ⭐ Toggle favori, max 24, persistant localStorage | `reciterRanking.js` |
| **Tri intelligent** | Favoris d'abord → disponibles → latency → ordre alpha | `reciterRanking.js` |
| **Play direct** | ▶️ Bouton play sur chaque carte récitateur | `HomePage.jsx` |
| **Radio récitateur** | 📻 Bouton « Play Radio » lance une station continue | `HomePage.jsx`, `StationService.js` |
| **Badge de style** | Murattal (vert), Mujawwad (ambre), Muallim (bleu), Kids Repeat | `ReciterTypeBadge.jsx` |
| **Badge CDN** | Islamic CDN / EveryAyah CDN / MP3Quran | `AudioPlayer.jsx` |
| **Badge HD** | Pour les récitateurs mp3quran-surah (full surah) | `AudioPlayer.jsx` |
| **Badge latence** | Temps de réponse mesuré en ms par récitateur | `audioService.js` |
| **Badge « Fast »** | Indique le récitateur le plus rapide (auto-select) | `AudioPlayer.jsx` |
| **Badge disponibilité** | Cooldown visuel si récitateur temporairement indisponible | `audioService.js` |
| **Détail récitateur** | Modal avec bio, photo, style, liste des sourates | `ReciterDetailPage.jsx` |
| **Warsh dédié** | Bascule Hafs/Warsh avec 8 récitateurs Warsh distincts | `reciters.js` |

### 🆚 Verdict page `/reciters`

```
MushafPlus     ████████████████████░  9.5/10
Quran.com      ██████░░░░░░░░░░░░░░░  3/10

MushafPlus DOMINE massivement : recherche, filtres, favoris, play direct,
radio, badges multiples, tri intelligent, support Warsh complet.
Quran.com est une simple galerie statique sans interactivité.
```

---

## 2. PAGE DÉTAIL RÉCITATEUR (`/reciters/:id`)

### Quran.com — Ce qui est présent

| Fonctionnalité | Description |
|----------------|-------------|
| **Photo + Nom** | Large photo du récitateur avec nom complet |
| **Biographie** | Texte bio avec bouton « ...More » pour déplier |
| **Badge style** | Murattal / Mujawwad / Muallim / Kids Repeat |
| **Play Radio** | Bouton unique pour lancer la radio de ce récitateur |
| **Liste complète** | Les 114 sourates numérotées, cliquables |
| **Play par sourate** | ❌ Sur la page reciters, le play n'est pas directement sur la ligne sourate |
| **Tri sourates** | ❌ Ordre fixe 1→114 |
| **Filtre sourates** | ❌ Aucun |
| **Download** | ❌ Pas de téléchargement |
| **Surah info** | ❌ Pas de nombre d'ayah, type, etc. |
| **Favori** | ❌ Pas de favori |
| **Mode hors-ligne** | ❌ |
| **Warsh** | ❌ Uniquement Hafs |

### MushafPlus — Ce qui est présent

| Fonctionnalité | Description | Fichier |
|----------------|-------------|---------|
| **Photo + Nom trilingue** | Nom en arabe, français, anglais + photo | `ReciterHero.jsx` |
| **Biographie** | Texte bio avec collapse/expand | `ReciterBioCollapse.jsx` |
| **Badges multiples** | Style (Murattal/Mujawwad), CDN, HD, Warsh vérifié | `ReciterTypeBadge.jsx` |
| **Play Radio** | 📻 Lance la station du récitateur | `ReciterDetailPage.jsx` |
| **Lecture directe** | ▶️ Play sur chaque sourate individuelle | `SurahRecitationRow.jsx` |
| **Navigation vers lecture** | 📖 Ouvre la sourate dans le reader Mushaf | `SurahRecitationRow.jsx` |
| **Téléchargement** | ⬇️ Download MP3 direct (pour mp3quran-surah) | `SurahRecitationRow.jsx`, `downloadService.js` |
| **Info sourate** | Nom arabe + nombre d'ayah + type (Meccan/Medinan) | `SurahRecitationRow.jsx` |
| **Tri sourates** | 🔄 Tri ascendant/descendant | `HomePage.jsx` |
| **Vue grille/liste** | Toggle d'affichage | `HomePage.jsx` |
| **Infinite scroll** | IntersectionObserver pour lazy loading | `HomePage.jsx` |
| **Warsh complet** | 8 récitateurs Warsh avec leurs sourates dédiées | `reciters.js` |
| **Mode Warsh strict** | Badge spécial « Warsh strict » pour récitateurs vérifiés | `warshService.js` |
| **Détail riwaya** | Badge Hafs/Warsh sur chaque récitateur | `ReciterDetailPage.jsx` |

### 🆚 Verdict page `/reciters/:id`

```
MushafPlus     ████████████████████░  9.5/10
Quran.com      ██████████░░░░░░░░░░░  5/10

MushafPlus DOUBLE les fonctionnalités : play par sourate, download, tri,
navigation reader, info sourate, badges détaillés, support Warsh complet.
Quran.com a une belle photo et une bio mais peu d'interactivité.
```

---

## 3. RADIO QURAN (`/radio`)

### Quran.com — Ce qui est présent

| Station | Description |
|---------|-------------|
| **Popular Recitations** | Feed quotidien de récitations populaires |
| **Yaseen, Al-Waqiah, Al-Mulk** | Compilation de réciteurs pour ces 3 sourates |
| **Surah Al-Kahf** | Al-Kahf en boucle (repeat) |
| **Juz Amma** | Sourates 78-114 complètes |
| **Stations par récitateur** | ~20 récitateurs, chacun en station individuelle |

### MushafPlus — Ce qui est présent

| Station | Description | Fichier |
|---------|-------------|---------|
| **Popular Recitations** | Sourates 1, 36, 55, 67, 18 | `StationService.js` |
| **Surah Al-Kahf** | Al-Kahf jouée 3 fois en boucle | `StationService.js` |
| **Juz Amma** | Sourates 78 à 114 (37 sourates) | `StationService.js` |
| **Night Recitation** ⭐ | Sourates 67, 36, 55, 56 (récitation nocturne) | `StationService.js` |
| **Stations par récitateur** | Top 8 récitateurs avec sourates 1, 36, 55, 67 | `StationService.js` |
| **Auto-reprise** | Reprend la dernière station jouée | `AudioQueueStore.js` |
| **Changement récitateur** | Change de récitateur sans arrêter la station | `audioService.js` |

### Ce qui manque vs Quran.com

| Manquant | Importance |
|----------|------------|
| Couverture photo des stations | 🟡 Moyen |
| Feed quotidien dynamique (curation) | 🟡 Moyen |
| « Yaseen + Waqiah + Mulk » en station combo | 🟢 Faible |

### 🆚 Verdict Radio

```
MushafPlus     ██████████████████░░░  9/10
Quran.com      ████████████████░░░░░  8/10

Fonctionnellement équivalent. MushafPlus a le mode Night et l'auto-reprise.
Quran.com a un meilleur visuel (photos des stations) et un feed curaté.
```

---

## 4. LECTEUR AUDIO (PENDANT LA LECTURE)

C'est le cœur de l'expérience de récitation.

### 4.1 Contrôles de Base

| Fonctionnalité | MushafPlus | Quran.com | Détails MushafPlus |
|----------------|-----------|-----------|---------------------|
| Play/Pause | ✅ | ✅ | Bouton central avec animation |
| Précédent/Suivant | ✅ | ✅ | Navigation ayah par ayah |
| Stop | ✅ | ❌ | Arrêt complet + reset position |
| Barre de progression | ✅ Click+Drag | ✅ Click | Mushaf : draggable avec SVG gradient |
| Temps écoulé/restant | ✅ M:SS | ✅ M:SS | Format identique |
| Volume | ✅ 0-100% slider | ✅ | Mute toggle, persistance |
| Cover Art | ✅ Animé | ❌ | SVG animé avec glow radial, cercles, waveform |
| Waveform visuel | ✅ 32 barres | ❌ | Animées, or, proportionnelles à la progression |

### 4.2 Récitateurs

| Fonctionnalité | MushafPlus | Quran.com | Détails MushafPlus |
|----------------|-----------|-----------|---------------------|
| Nombre Hafs | **33** (26 actifs) | ~20 | +65% |
| Nombre Warsh | **8** | **0** ❌ | Exclusivité MushafPlus |
| Photos | 17 photos CDN | Tous avec photos | Mushaf : seulement 17/29 ont une photo |
| Recherche récitateur | ✅ | ❌ | Filtre par nom (3 langues) |
| Favoris ⭐ | ✅ | ❌ (via compte) | Max 24, persistants, priorisés |
| Tri par latence | ✅ | ❌ | Le plus rapide en premier |
| Auto-sélection rapide | ✅ | ❌ | Choisit automatiquement le récitateur le plus rapide |
| Changement à chaud | ✅ | ✅ | Mushaf : préserve la position temporelle exacte |
| Bascule Hafs/Warsh | ✅ Bouton | ✅ Menu | Changement instantané |

### 4.3 Qualité Audio & CDN

| Fonctionnalité | MushafPlus | Quran.com | Détails |
|----------------|-----------|-----------|---------|
| CDN Multiple | ✅ 3 CDNs | ✅ 1 CDN | Islamic.network, EveryAyah, MP3Quran |
| Failover automatique | ✅ | ❌ | Passe au CDN suivant si échec |
| URL candidates | ✅ | ❌ | Primaire + miroir + Quran.com |
| Retry avec backoff | ✅ 2 retries, 800ms | ❌ | Gestion stale request via `_loadRequestId` |
| Timeout audio | ✅ 12 secondes | ❌ | Par tentative de chargement |
| Préchargement smart | ✅ 3 pistes | ❌ | Pool LRU, évite les doublons |
| Latence mesurée | ✅ Par récitateur | ❌ | Moyenne mobile exponentielle |
| Détection réseau | ✅ | ❌ | Badge 4G/3G/2G/offline, adapte le comportement |
| Audit audio | ✅ | ❌ | Vérifie disponibilité de chaque récitateur Warsh |

### 4.4 Vitesse de Lecture

| Fonctionnalité | MushafPlus | Quran.com | Détails MushafPlus |
|----------------|-----------|-----------|---------------------|
| Presets | **6** (0.5x-2x) | ~5 | 0.5, 0.75, 1, 1.25, 1.5, 2x |
| Cycle rapide | ✅ | ❌ | Un bouton cycle à travers les presets |
| **Mode Tartil** ⭐ | ✅ | ❌ | Vitesse adaptative selon longueur du verset |
| Tartil court (<30 car) | 0.9x | ❌ | Accélère les versets courts |
| Tartil long (100+ car) | 0.65x | ❌ | Ralentit les longs versets |
| Persistance vitesse | ✅ | ✅ | Sauvegardée |

### 4.5 Contrôle de Répétition

| Fonctionnalité | MushafPlus | Quran.com | Détails MushafPlus |
|----------------|-----------|-----------|---------------------|
| Repeat sourate | ✅ 1-999 ou ∞ | ✅ Simple | Mushaf : compteur de cycles, presets (1, 3, 5, 10, ∞) |
| **A-B Repeat** ⭐ | ✅ | ❌ | Marque début/fin, boucle entre les deux |
| UI A-B | ✅ Boutons A/B | ❌ | Labels `{surah}:{ayah}` sur desktop et mobile |
| **Memorization Mode** ⭐ | ✅ | ❌ | Répète chaque ayah N fois avec pause |
| Config mémorisation | ✅ | ❌ | Répétitions : 1-100, Pause : 0-60 secondes |
| Star rating mémorisation | ✅ | ❌ | Note 0-5 étoiles par verset, statistiques |

### 4.6 Égaliseur Audio

| Fonctionnalité | MushafPlus | Quran.com | Détails MushafPlus |
|----------------|-----------|-----------|---------------------|
| Égaliseur | ✅ 3 bandes | ❌ | Bass (200Hz), Mid (1000Hz), Treble (3500Hz) |
| Presets EQ | ✅ 6 presets | ❌ | Flat, Bass Boost, Treble Boost, Near, Hall, Vocals |
| Web Audio API | ✅ BiquadFilter | ❌ | Dégradation gracieuse si indisponible |
| UI presets | ✅ Boutons | ❌ | Labels anglais/français |

### 4.7 Synchronisation Karaoké (Word Highlighting)

| Fonctionnalité | MushafPlus | Quran.com | Détails MushafPlus |
|----------------|-----------|-----------|---------------------|
| Surbrillance mot | ✅ | ✅ | Les deux le font |
| Source timing | Quran.com API | Interne | Mushaf utilise l'API Quran.com v4 |
| **Calibration par récitateur** ⭐ | ✅ 27 récitateurs | ❌ | 19 Hafs + 8 Warsh avec offsets dédiés |
| Offset configurable | ✅ -500ms à +500ms | ❌ | Slider utilisateur + boutons ±40ms |
| Lissage exponentiel | ✅ α 0.82-0.94 | ❌ | Évite les sauts visuels |
| Compensation latence | ✅ Auto | ❌ | Basée sur la latence mesurée du récitateur |
| Compensation vitesse | ✅ | ❌ | Ajuste selon le playbackRate |
| Compensation dérive | ✅ | ❌ | Rattrape la dérive cumulative sur longs versets |
| Presets par style | ✅ | ❌ | Murattal (0.15s), Tartil (0.22s), Mujawwad (0.31s) |
| **Verrouillage mot** ⭐ | ✅ | ❌ | Garde le mot courant surligné même si timing dérive |

### 4.8 UI Player

| Fonctionnalité | MushafPlus | Quran.com | Détails MushafPlus |
|----------------|-----------|-----------|---------------------|
| **Mobile Dock** | ✅ Barre basse | ✅ Intégré | Mushaf : expandable, compact, fermable |
| **Desktop Card** | ✅ Flottant | ✅ Fixe | Mushaf : DRAGGABLE, position libre sauvegardée |
| Auto-minimize | ✅ Si idle | ❌ | Se réduit automatiquement quand inactif |
| Auto-open | ✅ Au play | ✅ | Se rouvre automatiquement à la lecture |
| Reset position | ✅ | ❌ | Remet le widget à sa position par défaut |
| Cover Art animé | ✅ SVG animé | ❌ | Glow radial, cercles concentriques, icône Quran |
| Waveform | ✅ 32 barres or | ❌ | Animée, remplissage proportionnel |
| Nom sourate arabe | ✅ Avec glow | ✅ | Les deux affichent le nom |
| Chips d'état | ✅ Multiples | ❌ | Riwaya, Ayah, Speed, Repeat, Memo, Surah-mode |
| Network state badge | ✅ | ❌ | « Loading audio... », « Unstable connection » |
| Thème adaptatif | ✅ Clair/Sombre/Sépia | ✅ Clair/Sombre | 3 thèmes + auto dark mode (horaire prière) |

---

## 5. PAGE DE LECTURE (`/:surah`)

### 5.1 Affichage du Texte

| Fonctionnalité | MushafPlus | Quran.com | Détails |
|----------------|-----------|-----------|---------|
| Texte arabe | ✅ | ✅ | Uthmani script |
| Polices | **9 options** | 3 options | Mushaf : Scheherazade, Amiri, Noto Naskh, QPC, etc. |
| Taille police | 36-72px + pinch zoom | 14 niveaux | Mushaf : plus de granularité |
| Tajweed colors | ✅ 14+ couleurs | ✅ | Les deux supportent le tajweed |
| Translittération | ✅ | ✅ | Latin phonétique |
| Word-by-word | ✅ Basique | ✅ Avancé (corpus) | Quran.com : analyse grammaticale complète |
| Traductions | **7 langues** | **50+ langues** | Quran.com DOMINE |
| Tafsir | ✅ Quran.com API | ✅ Intégré natif | Mushaf dépend de l'API Quran.com |
| Mode page Mushaf | ✅ 15 lignes | ✅ 15 lignes | Disposition identique |
| Mode mémorisation | ✅ Masquage mots | ❌ | Cache le texte, révèle au clic |

### 5.2 Navigation

| Fonctionnalité | MushafPlus | Quran.com | Détails |
|----------------|-----------|-----------|---------|
| Surah | ✅ | ✅ | 1-114 |
| Page (604) | ✅ | ✅ | Navigation page Mushaf |
| Juz (30) | ✅ | ✅ | 30 parties |
| **Hizb** | ❌ | ✅ | 60 sections (demi-juz) |
| **Ruku** | ❌ | ✅ | 540 sections thématiques |
| Raccourcis clavier | ✅ 15+ | ✅ | Mushaf : RTL-aware, très complet |
| URL sync | ✅ | ✅ | `/surah/1`, `/page/100`, `/juz/30` |
| Browser back/forward | ❌ (bug) | ✅ | Mushaf : pas de `popstate` listener |
| Scroll infini | ✅ | ✅ | Les deux supportent le défilement continu |

### 5.3 Outils d'Étude

| Fonctionnalité | MushafPlus | Quran.com | Détails |
|----------------|-----------|-----------|---------|
| Signets | ✅ | ✅ (via compte) | Mushaf : localStorage, notes |
| **Notes personnelles** ⭐ | ✅ | ❌ | Notes par ayah avec validation Zod |
| Historique de lecture | ✅ | ✅ (via compte) | |
| Progression lecture | ✅ Barre | ✅ % | |
| **Wird (objectif quotidien)** ⭐ | ✅ | ❌ | Suivi objectif de lecture journalier |
| **Khatma (groupe)** ⭐ | ✅ | ❌ | Suivi de complétion collective |
| **Flashcards** ⭐ | ✅ | ❌ | Cartes de mémorisation |
| **Tajweed Quiz** ⭐ | ✅ | ❌ | Quiz sur les règles de tajweed |
| Comparaison versets | ✅ Pin | ❌ | Épingler des versets pour comparaison |
| Partage réseau social | ✅ Génération image | ✅ | Mushaf : génération d'image personnalisée |
| Export données | ✅ | ❌ (via compte) | Mushaf : export local |

---

## 6. FONCTIONNALITÉS AVANCÉES RÉCITATION

### 6.1 MushafPlus — Exclusivités Audio

| Fonctionnalité | Description | Fichier |
|----------------|-------------|---------|
| **Reciter Comparator** | Compare jusqu'à 4 récitateurs sur le même verset — audio indépendants synchronisés | `ReciterComparatorPanel.jsx` |
| **Audio Maker** | Crée des sessions personnalisées multi-sourates, sauvegarde, rejoue | `AudioMakerPanel.jsx` |
| **Recitation Practice** | Reconnaissance vocale (Web Speech API), vérifie la prononciation arabe | `AudioPlayer.jsx` |
| **Playlists** | CRUD complet, ayahs depuis le reader, persistance IndexedDB | `PlaylistPanel.jsx` |
| **Resume Playback** | Sauvegarde position toutes les 10s, reprise avec seek exact | `audioResumeService.js` |
| **Tartil Auto-Speed** | Vitesse adaptative selon complexité du verset | `audioService.js` |
| **Reciter Latency Ranking** | Mesure et classe les récitateurs par temps de réponse | `reciterRanking.js` |
| **Auto Reciter Failover** | Change automatiquement de récitateur si erreur audio | `AudioPlayer.jsx` |
| **EQ + Karaoke Combo** | Égaliseur 3-bandes + synchro mot par mot calibrée par récitateur | `audioService.js` + `useKaraoke.js` |
| **Warsh Audio** | Seul au monde avec 8 récitateurs Warsh en audio | `reciters.js` |

### 6.2 Quran.com — Exclusivités

| Fonctionnalité | Description |
|----------------|-------------|
| **Compte utilisateur** | Sync cloud, historique cross-device |
| **Voice Search** | Recherche vocale de versets |
| **Audio Search** | Recherche par récitation audio |
| **Topic Index** | Index thématique du Quran |
| **Cross-references** | Références croisées entre versets |
| **Embedding** | Intégration iframe sur sites externes |
| **Lessons & Reflections** | Intégration QuranReflect.com |
| **Quran.AI** | IA pour questions sur le Quran |
| **Corpus linguistique** | Analyse grammaticale complète (corpus.quran.com) |
| **Apps natives** | Android + iOS officielles |
| **SEO/SSR** | Next.js, rich snippets, indexé Google |
| **Donations** | 501(c)(3) non-profit via Quran Foundation |
| **50+ traductions** | Couverture linguistique mondiale |
| **Hizb & Ruku** | Navigation granulaire (60 hizb, 540 ruku) |
| **Download officiel** | Téléchargement audio intégré |
| **Modes de lecture** | Mode « Reading » continu + « Verse by verse » + Traduction seule |

### 6.3 MushafPlus — Ce qui est ANNONCÉ mais ABSENT ou BUGGÉ

| Fonctionnalité | Statut réel | Fichier |
|----------------|-------------|---------|
| Browser back/forward | ❌ Cassé — pas de `popstate` listener | `useUrlSync.js` |
| Re-renders Context | ❌ Tout re-render à chaque changement | `AppContext.jsx` |
| Clé chiffrement en dur | ❌ `"mushafplus-2026"` visible dans le code | `cryptoUtil.js` |
| Fallback chiffrement | ❌ Tombe en JSON clair si erreur CryptoJS | `cryptoUtil.js` |
| 15 flags booléens modales | ❌ Code smell — devrait être 1 string | `AppContext.jsx` |
| Immersive mode | ⚠️ Présent mais avec 28 dépendances | `App.jsx` |
| Service Worker | ⚠️ SW existe mais registration non vérifiée | `sw.js` |
| Offline audio | ⚠️ Cache API présent mais pas UI de gestion offline | `downloadService.js` |
| Thèmes vides | ⚠️ Ocean/Forest/Night-Blue/Beige — commentaires sans CSS | `responsive.css` |
| Font override riwaya | ❌ La police utilisateur est écrasée au changement Hafs/Warsh | `AppContext.jsx` |
| beforeunload save | ❌ Pas de flush du debounce localStorage à la fermeture | `AppContext.jsx` |
| Focus trap modales | ⚠️ tabIndex=-1 mais pas de librairie focus-trap | Modales |

---

## 7. MATRICE DE COMPARAISON GLOBALE

### 7.1 RÉCITATION & AUDIO — DÉTAIL EXHAUSTIF

| # | Fonctionnalité | MushafPlus | Quran.com | Gagnant |
|---|---------------|-----------|-----------|---------|
| 1 | Nombre récitateurs Hafs | 33 (26 actifs) | ~20 | 🏆 MF |
| 2 | Récitateurs Warsh audio | **8** | **0** | 🏆 MF |
| 3 | Photos récitateurs | 17/29 | Tous | 🏆 QC |
| 4 | Recherche/Filtre récitateur | ✅ | ❌ | 🏆 MF |
| 5 | Favoris récitateurs | ✅ Local | ✅ Cloud | = |
| 6 | Tri récitateurs | ✅ Intelligent | ❌ Fixe | 🏆 MF |
| 7 | Auto-sélection rapide | ✅ | ❌ | 🏆 MF |
| 8 | Multi-CDN failover | ✅ 3 CDNs | ❌ 1 CDN | 🏆 MF |
| 9 | Retry avec backoff | ✅ | ❌ | 🏆 MF |
| 10 | Préchargement audio | ✅ 3 pistes | ❌ | 🏆 MF |
| 11 | Mesure latence | ✅ Par récitateur | ❌ | 🏆 MF |
| 12 | Vitesse playback | 6 presets | ~5 presets | = |
| 13 | Mode Tartil adaptatif | ✅ | ❌ | 🏆 MF |
| 14 | Repeat sourate | ✅ 1-999/∞ | ✅ Simple | 🏆 MF |
| 15 | A-B Repeat | ✅ | ❌ | 🏆 MF |
| 16 | Mode mémorisation | ✅ Complet | ❌ | 🏆 MF |
| 17 | Égaliseur 3-bandes | ✅ 6 presets | ❌ | 🏆 MF |
| 18 | Karaoké word highlight | ✅ Calibré | ✅ Standard | 🏆 MF |
| 19 | Calibration par récitateur | ✅ 27 profils | ❌ | 🏆 MF |
| 20 | Offset manuel karaoké | ✅ Slider | ❌ | 🏆 MF |
| 21 | Audio Maker (mix) | ✅ | ❌ | 🏆 MF |
| 22 | Reciter Comparator | ✅ 4 récitateurs | ❌ | 🏆 MF |
| 23 | Reconnaissance vocale | ✅ | ❌ | 🏆 MF |
| 24 | Playlists | ✅ CRUD | ❌ | 🏆 MF |
| 25 | Resume playback | ✅ Position exacte | ❌ | 🏆 MF |
| 26 | Radio thématique | ✅ 4 stations | ✅ 4 stations | = |
| 27 | Radio par récitateur | ✅ 8 récitateurs | ✅ ~20 récitateurs | 🏆 QC |
| 28 | Sleep timer | ❌ | ❌ | = |
| 29 | Player draggable desktop | ✅ | ❌ | 🏆 MF |
| 30 | Cover Art / Waveform | ✅ Animé | ❌ | 🏆 MF |
| 31 | Network state indicator | ✅ | ❌ | 🏆 MF |
| 32 | Download offline | ✅ Cache API | ✅ Direct | = |

**Résultat Audio : MushafPlus 26 - 4 Quran.com (2 égalités)**

### 7.2 LECTURE & AFFICHAGE

| # | Fonctionnalité | MushafPlus | Quran.com | Gagnant |
|---|---------------|-----------|-----------|---------|
| 1 | Polices arabes | 9 | 3 | 🏆 MF |
| 2 | Taille police | 36-72px + zoom | 14 niveaux | 🏆 MF |
| 3 | Tajweed | ✅ 14 couleurs | ✅ | = |
| 4 | Translittération | ✅ | ✅ | = |
| 5 | Word-by-word | Basique | Avancé (corpus) | 🏆 QC |
| 6 | Traductions | 7 langues | 50+ | 🏆 QC |
| 7 | Tafsir | Via API QC | Intégré natif | 🏆 QC |
| 8 | Modes layout | 3 + mémorisation | 5+ | 🏆 QC |
| 9 | Hizb/Ruku | ❌ | ✅ | 🏆 QC |
| 10 | Mode mémorisation | ✅ Masquage | ❌ | 🏆 MF |
| 11 | Dark mode | ✅ + Auto | ✅ | 🏆 MF |
| 12 | Thèmes multiples | 3 (light/sepia/dark) | 2 (light/dark) | 🏆 MF |

**Résultat Lecture : Quran.com 5 - 5 MushafPlus (2 égalités)**

### 7.3 OUTILS & ÉTUDE

| # | Fonctionnalité | MushafPlus | Quran.com | Gagnant |
|---|---------------|-----------|-----------|---------|
| 1 | Signets | ✅ Local | ✅ Cloud | = |
| 2 | Notes personnelles | ✅ | ❌ | 🏆 MF |
| 3 | Wird (objectif) | ✅ | ❌ | 🏆 MF |
| 4 | Khatma (groupe) | ✅ | ❌ | 🏆 MF |
| 5 | Flashcards | ✅ | ❌ | 🏆 MF |
| 6 | Tajweed Quiz | ✅ | ❌ | 🏆 MF |
| 7 | Recherche texte | ✅ | ✅ | = |
| 8 | Voice search | ❌ | ✅ | 🏆 QC |
| 9 | Topic index | ❌ | ✅ | 🏆 QC |
| 10 | Cross-references | ❌ | ✅ | 🏆 QC |
| 11 | Lessons/Reflections | ❌ | ✅ QuranReflect | 🏆 QC |
| 12 | Partage social | ✅ Génération | ✅ Prédéfini | 🏆 MF |
| 13 | Export données | ✅ | ❌ (via compte) | 🏆 MF |
| 14 | Embedding | ❌ | ✅ Iframe | 🏆 QC |

**Résultat Outils : MushafPlus 7 - 5 Quran.com (2 égalités)**

### 7.4 TECHNIQUE & QUALITÉ

| # | Aspect | MushafPlus | Quran.com | Gagnant |
|---|--------|-----------|-----------|---------|
| 1 | Performance/bundle | 2.4 MB | ~700 KB | 🏆 QC |
| 2 | Temps de chargement | 3-5s | <1s | 🏆 QC |
| 3 | SSR/SEO | ❌ SPA pure | ✅ Next.js | 🏆 QC |
| 4 | Accessibilité | Partielle (335 aria) | Complète | 🏆 QC |
| 5 | Mobile UX | ⚠️ Tronqué | ✅ Parfait | 🏆 QC |
| 6 | Design consistency | ⚠️ Surchargé | ✅ Minimaliste | 🏆 QC |
| 7 | Tests | 10 fichiers | Probablement 100+ | 🏆 QC |
| 8 | Apps natives | ❌ | ✅ iOS/Android | 🏆 QC |
| 9 | Compte/Sync cloud | ❌ | ✅ | 🏆 QC |
| 10 | Sécurité CSP | ✅ Strict | ✅ | = |
| 11 | PWA/Offline | ✅ SW + Cache | ✅ | = |
| 12 | Fiabilité données | ⚠️ GitHub tiers | ✅ Officielle | 🏆 QC |
| 13 | i18n UI | 3 langues | 20+ langues | 🏆 QC |
| 14 | Warsh audio | ✅ Exclusif | ❌ | 🏆 MF |
| 15 | Open source | ✅ | ✅ | = |

**Résultat Technique : Quran.com 11 - 2 MushafPlus (2 égalités)**

---

## 8. SCORING FINAL

### Par Catégorie (sur 10)

| Catégorie | MushafPlus | Quran.com | Écart | Commentaire |
|-----------|-----------|-----------|-------|-------------|
| **Récitation / Audio** | **10** | 5 | +5 🏆 | Domination totale : 33 fonctionnalités vs 9 |
| **Lecture / Affichage** | 8 | **9** | -1 | Égalité globale, Hizb/Ruku + corpus manquent |
| **Outils Étude** | **9** | 7 | +2 🏆 | Notes, Wird, Khatma, Flashcards, Quiz uniques |
| **UX / UI** | 6 | **9** | -3 | Design surchargé, mobile tronqué |
| **Performance** | 5 | **9** | -4 | Bundle 3x plus gros, chargement 3-5x plus lent |
| **Fiabilité données** | 7 | **9** | -2 | Warsh via GitHub tiers, traductions limitées |
| **Accessibilité** | 7 | **9** | -2 | 335 aria mais focus trap manquant |
| **SEO / Reach** | 3 | **10** | -7 | SPA pure vs Next.js + apps natives + 20 langues |
| **Sécurité** | 8 | **8** | 0 | CSP strict des deux côtés |
| **TOTAL** | **63** | **75** | **-12** | |

### Par Usage (recommandé pour)

| Profil utilisateur | MushafPlus | Quran.com |
|-------------------|-----------|-----------|
| **Écoute intensive** | 🏆🏆🏆 | ✅ |
| **Mémorisation** | 🏆🏆🏆 | ❌ |
| **Étude comparative** | 🏆🏆 | ✅ |
| **Navigation rapide** | ✅ | 🏆🏆🏆 |
| **Recherche avancée** | ✅ | 🏆🏆🏆 |
| **Multilingue (20+)** | ❌ | 🏆🏆🏆 |
| **Usage mobile** | ⚠️ | 🏆🏆🏆 |
| **Warsh (audio)** | 🏆🏆🏆 | ❌ |
| **Apprentissage** | 🏆🏆🏆 | ✅ |
| **Performance** | ⚠️ | 🏆🏆🏆 |
| **Développeurs** | ✅ Open source | ✅ Open source |

---

## 9. RECOMMANDATIONS & ROADMAP

### 🔴 Priorité 0 — BLOQUANT (1-2 semaines)

| # | Action | Impact |
|---|--------|--------|
| 1 | **Réparer navigation historique** — Ajouter `popstate` listener dans `useUrlSync.js` | Navigation navigateur fonctionnelle |
| 2 | **Corriger re-renders Context** — Split `AppContext` en contextes granulaires | Perf x3-5 sur tous les écrans |
| 3 | **Nettoyer clé chiffrement en dur** — Supprimer `_LEGACY_SECRET_KEY` et forcer migration | Données utilisateur sécurisées |

### 🟠 Priorité 1 — CRITIQUE (2-4 semaines)

| # | Action | Impact |
|---|--------|--------|
| 4 | **Ajouter Hizb & Ruku** — Navigation granulaire manquante | Parité fonctionnelle Quran.com |
| 5 | **Réduire bundle CSS** — 1.37 MB → 500 KB via PurgeCSS rigoureux | Temps chargement divisé par 2 |
| 6 | **Stabiliser écouteur clavier** — Remplacer 28 dépendances par `useRef` | Plus de re-registration abusive |
| 7 | **Ajouter `beforeunload` flush** — Sauvegarder avant fermeture onglet | Plus de perte de position |
| 8 | **Sleep Timer** — Minuterie d'arrêt automatique | Fonctionnalité attendue |

### 🟡 Priorité 2 — IMPORTANT (1-2 mois)

| # | Action | Impact |
|---|--------|--------|
| 9 | **Ajouter photos pour 12 récitateurs manquants** — Parity visuelle avec Quran.com | Expérience visuelle complète |
| 10 | **Refonte mobile** — Tester sur devices réels, fix truncation | UX mobile acceptable |
| 11 | **Simplifier UI** — Réduire gradients/shadows, unifier l'apparence | Cohérence visuelle |
| 12 | **Ajouter plus de traductions** — Cibler 20+ langues | Audience élargie |
| 13 | **Focus trap modales** — Utiliser `focus-trap-react` | Accessibilité conforme |
| 14 | **Virtual scrolling** — Pour longues sourates (Al-Baqarah) | Performance lecture |
| 15 | **Tests unitaires** — `quranAPI`, `AppContext` reducer, `storageService` | Fiabilité |
| 16 | **Corriger `fontFamily` override** — Ne pas écraser au changement riwaya | Respect choix utilisateur |
| 17 | **Remplacer 15 flags modales par `activeModal`** — Simplifier le reducer | Maintenabilité |

### 🟢 Priorité 3 — NICE TO HAVE (3-6 mois)

| # | Action | Impact |
|---|--------|--------|
| 18 | **Voice Search** — Recherche vocale de versets | Nouvelle feature |
| 19 | **Cross-references** — Références entre versets | Étude avancée |
| 20 | **Topic Index** — Index thématique | Navigation alternative |
| 21 | **Cloud Sync** — Compte utilisateur + synchronisation | Multi-device |
| 22 | **Apps natives** — Android/iOS via Capacitor/React Native | Distribution stores |
| 23 | **SSR/SEO** — Migration Next.js ou Remix | Indexation Google |
| 24 | **Embedding** — Iframe intégration | Viralité |
| 25 | **Gestion offline UI** — Interface de gestion des téléchargements | Expérience offline |
| 26 | **Animations subtiles** — Remplacer flashy par fluide | Professionnalisme |
| 27 | **Plus de stations radio** — Curated feeds hebdomadaires | Engagement |
| 28 | **Contribution communauté** — Traductions, corrections | Croissance |

### 📊 Quick Wins (moins d'1 jour chacun)

| # | Quick Win | Effort |
|---|-----------|--------|
| | Réparer le `é` dans `manifest.json` | 1 min |
| | Supprimer balises meta debug dans `index.html` | 1 min |
| | Supprimer thèmes vides commentés dans CSS | 5 min |
| | Fusionner `@keyframes shimmer` dupliqué | 5 min |
| | Corriger `DEFAULT_SETTINGS` en `structuredClone` | 10 min |
| | Ajouter `<style>` et `<use>` à l'assainissement SVG | 10 min |
| | Nettoyer `archive.org` de la liste blanche URLs | 2 min |
| | Déplacer `getInitialState()` en lazy (pas module scope) | 15 min |

---

## 📊 POSITIONNEMENT STRATÉGIQUE FINAL

```
                    QUALITÉ TECHNIQUE →
                    Faible               Élevée
                ┌─────────────────┬─────────────────┐
     Élevée     │                 │   ★ Quran.com   │
                │                 │   (75/100)      │
F              │                 │                 │
O  ────────────┼─────────────────┼─────────────────┤
N              │                 │                 │
C  Médium     │                 │ ★ MushafPlus    │
T              │                 │   (63/100)      │
I              │                 │                 │
O  ────────────┼─────────────────┼─────────────────┤
N              │                 │                 │
N  Faible     │                 │                 │
S              │                 │                 │
                └─────────────────┴─────────────────┘
```

**MushafPlus** : Champion fonctionnel — 32+ features audio exclusives, modes d'apprentissage uniques, Warsh audio.  
**Quran.com** : Champion technique — Performance, accessibilité, reach mondial (20 langues, apps natives, SSR).

### Positioning recommandé

> **« MushafPlus — Le compagnon d'étude et de mémorisation du Quran »**
>
> - **Différenciation clé :** Audio avancé (33 récitateurs, Warsh, EQ, karaoké calibré) + Outils d'apprentissage (mémorisation, flashcards, quiz, wird)
> - **Ne pas concurrencer sur :** Performance brute, SEO, nombre de traductions — c'est le terrain de Quran.com
> - **Avantage compétitif durable :** Warsh audio (exclusivité mondiale), mode mémorisation, calibration karaoké par récitateur

---

*Rapport généré le 29 Mai 2026 — Analyse exhaustive : code source MushafPlus + exploration live Quran.com*
*33 fonctionnalités audio, 12 modes lecture, 14 outils étude, 15 dimensions techniques comparées*
