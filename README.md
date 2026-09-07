# 📖 MushafPlus — Le Saint Coran en ligne

**Une expérience de lecture du Coran premium, fluide, authentique et respectueuse de la vie privée.**

[![Tests](https://github.com/mohamedeyaf820/mon-coran/actions/workflows/tests.yml/badge.svg)](https://github.com/mohamedeyaf820/mon-coran/actions/workflows/tests.yml)
[![Netlify Deploy](https://api.netlify.com/api/v1/badges/06596f97-416f-44f2-b601-900e4c6f7f2f/deploy-status)](https://mushafplus.netlify.app)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8.svg?logo=pwa)](https://mushafplus.netlify.app)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/mohamedeyaf820/mon-coran/releases)
[![Tests Unitaires](https://img.shields.io/badge/tests_unitaires-165_passés-success.svg)](#-qualité--tests)

---

[![Capture de l'écran de l'accueil sur ordinateur](screenshot-desktop.png)](screenshot-desktop.png)
[![Capture de l'écran mobile](screenshot-mobile.png)](screenshot-mobile.png)
[![Mode Mushaf - lecture page par page](screenshot-mushaf.png)](screenshot-mushaf.png)

---

## ✨ Fonctionnalités

### 📖 Lecture du Coran
- **Double riwaya authentique** : Lecture selon **Hafs** ('an 'Asim) et **Warsh** ('an Nafi') avec intégrité textuelle validée (114 sourates, 6 214 versets Warsh, 52 401 règles de Tajwid vérifiées).
- **3 modes de lecture** :
  - **Sourate** : défilement continu et fluide par sourate avec traduction et outils d'étude.
  - **Page (Mushaf)** : mise en page conforme au Mushaf de Médine (604 pages réelles).
  - **Juz** : navigation par les 30 divisions canoniques du Coran.
- **Affichages optimisés** : Vue `liste` (avec traductions et actions rapides) et vue `mushaf` immersif plein écran.
- **Typographie coranique de haute précision** : Polices QCF4 à chargement dynamique, Uthmanic Hafs v18, KFGQPC Warsh 10, Scheherazade New et séparateurs de versets canoniques.
- **Trilingue & RTL natif** : Français, Anglais et Arabe avec inversion directionnelle native (RTL) complète et soignée.

### 🎵 Récitation audio & Karaoké
- **59 récitateurs de renommée mondiale** : 49 profils en Hafs et 10 profils vérifiés en Warsh, enrichis de biographies progressives et de portraits sourcés.
- **Modes de diffusion** : Écoute verset par verset ou flux complet par sourate continue (sources EveryAyah et MP3Quran).
- **Karaoké mot-à-mot** : Synchronisation audio et surlignage des mots en temps réel via l'API Quran.com.
- **Résilience & Failover** : Bascule automatique transparente vers un miroir ou récitateur alternatif en cas d'indisponibilité réseau.
- **Lecteur audio flottant / ancré** : Contrôles de lecture complets, barre de progression dynamique, raccourcis clavier et mode compact mobile.

### 🧰 Outils d'apprentissage & Étude
- **Règles de Tajwid interactives** : Coloration cursive OpenType et balisage selon les 8 grandes familles de règles (Ghunna, Ikhfa, Qalqala, Idgham, Iqlab, Madd, Lam Shamsiyya, etc.), avec infobulles explicatives et légende dynamique.
- **Tafsir & Exégèse** : Consultation des commentaires islamiques verset par verset, disponible également hors-ligne.
- **Mémorisation (Hifdh)** : Algorithme de répétition espacée (`memorizationService.js`), masquage progressif du texte et suivi de révision.
- **Bibliothèque personnelle** : Gestion des favoris, signets de reprise, notes personnelles horodatées, historique et suivi des séries de lecture (streaks).
- **Recherche plein texte & vocale** : Recherche instantanée dans le texte arabe et les traductions (optimisée par Web Worker) et reconnaissance vocale multilingue.
- **Recueil de Du'as** : Index des invocations coraniques avec translittération, audio et traduction.
- **Partage esthétique de versets** : Export d'images personnalisées de versets pour réseaux sociaux et génération de liens profonds.
- **Export / Import autonome** : Sauvegarde et restauration locale en fichier JSON, sans obligation de compte.

### 🔒 Vie privée & Sécurité
- **Mode protégé par phrase secrète** : Verrouillage local et chiffrement robuste AES (via CryptoJS) des notes personnelles et données sensibles.
- **Confidentialité absolue (Zéro tracking)** : PWA 100% statique sans backend intrusif, aucune donnée personnelle collectée ou transmise à des tiers.
- **Fonctionnement hors-ligne (Offline PWA)** : Service Worker résilient avec stockage IndexedDB permettant une lecture fluide sans connexion internet.
- **Sécurité stricte (CSP)** : Politique de sécurité des contenus (Content Security Policy) injectée au build, restriction des scripts et allowlist stricte des CDN audio.
- **Thèmes & Accessibilité (A11y)** : Thèmes Clair, Sépia et Sombre conformes aux critères de contraste WCAG AA, navigation clavier intégrale et balisage ARIA rigoureux.

---

## 🌍 Internationalisation

| Langue | Interface | Direction | Traductions du Coran |
|--------|-----------|-----------|----------------------|
| 🇫🇷 Français | Par défaut | LTR | Muhammad Hamidullah |
| 🇬🇧 Anglais | Complète | LTR | Saheeh International |
| 🇸🇦 Arabe | Complète | RTL (natif) | Texte coranique original |

---

## 🛠️ Stack technique

- **Cœur applicatif** : React 18.3, Vite 8.2 (compilation Rollup / Oxc)
- **Styling** : Tailwind CSS v4.3, tokens CSS thématiques (clair, sépia, sombre), Glassmorphism v2
- **Composants UI** : Radix UI primitives (`@radix-ui/react-dialog`, `popover`, `tooltip`, `tabs`), Lucide Icons
- **Stockage local** : IndexedDB (`idb`) + LocalStorage avec validation de schéma
- **Chiffrement** : AES-256 via CryptoJS
- **Qualité & Tests** :
  - **165 tests unitaires et de sécurité** exécutés avec le test runner natif de Node.js.
  - **Playwright 1.62** : 36 suites de tests E2E couvrant lecture, audio, responsive, smoke et régression visuelle.
  - **Axe-core** : Audits d'accessibilité automatisés (WCAG AA).
- **SEO & Déploiement** : 120 pages pré-générées pour l'indexation, sitemap XML, configuration Netlify et Vercel avec en-têtes de sécurité stricts.

### Architecture
- Architecture SPA statique pure : **aucun serveur backend requis**.
- Gestion d'état centralisée via `AppContext` + `useReducer` avec sélecteurs mémoïsés (`shallowEqual`).
- Découpage du code (Code Splitting) dynamique : modales et panneaux secondaires chargés en `React.lazy()`.
- Budgets stricts appliqués en CI : 1275 KiB JS max, 1060 KiB CSS max, 810 KiB payload initial.
- Stratégie de cache à 3 niveaux : Mémoire vive (In-Memory) → IndexedDB → LocalStorage.

---

## 🚀 Démarrage rapide

```bash
# Prérequis : Node.js 22+
git clone https://github.com/mohamedeyaf820/mon-coran.git
cd mon-coran
npm install

# Lancer le serveur de développement (port 3002)
npm run dev

# Compiler pour la production (avec purge CSS et génération SEO)
npm run build

# Prévisualiser la version de production (port 4173)
npm run preview
```

---

## 📋 Scripts npm disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement local (`http://localhost:3002`) |
| `npm run build` | Compile l'application, purge le CSS, génère les pages SEO et audite les perfs |
| `npm run build:ci` | Validation CI complète : build, vérification des budgets de bundle, audit CSS et headers de sécurité |
| `npm run preview` | Prévisualise la version de production locale (`http://localhost:4173`) |
| `npm run lint` | Analyse le code avec ESLint (mode quiet et avec cache) |
| `npm run test:security` | Lance les 165 tests unitaires et de sécurité Node.js |
| `npm run test:coverage` | Exécute les tests unitaires avec le rapport de couverture de code natif |
| `npm run test:e2e` | Exécute l'ensemble de la suite de tests E2E Playwright |
| `npm run test:e2e:smoke` | Exécute les smoke tests (fallback audio, accessibilité) |
| `npm run test:e2e:reading` | Teste le défilement et la stabilité de la lecture en continu |
| `npm run test:e2e:axe` | Exécute les audits d'accessibilité axe-core (WCAG AA) |
| `npm run qa:smoke` | Exécute la chaîne d'assurance qualité rapide (smoke + reading + security) |
| `npm run perf:budget` | Vérifie le respect des budgets de taille de bundle (JS et CSS) |
| `npm run audit:css:ci` | Audite l'architecture CSS, le volume de `!important` et les règles dupliquées |
| `npm run audit:screen-budget` | Contrôle la taille des composants clés de l'application |
| `npm run audit:warsh` | Valide l'intégrité du texte Warsh, le balisage Tajwid et la disponibilité audio |
| `npm run audit:reciters` | Vérifie la joignabilité et la validité des sources audio de tous les récitateurs |
| `npm run audit:headers` | Vérifie la cohérence des en-têtes de sécurité (Netlify et Vercel) |

> ⚠️ **Note** : Les tests E2E Playwright nécessitent une compilation préalable (`npm run build`).

---

## 🧪 Qualité & Tests

- **165 tests unitaires & sécurité** : Couvrent la typographie arabe, les sources audio, le chiffrement AES, la validation du stockage, les politiques réseau et les contrats WCAG.
- **36 suites de tests E2E Playwright** : Couvrent l'expérience de lecture, le lecteur audio, la réactivité mobile/tablette, les bascules de thème et les régressions visuelles.
- **Intégration continue (CI)** : GitHub Actions exécute l'ensemble des validations sur les branches principales (`main`, `master`).
- **Garantie d'accessibilité** : Respect des critères d'accessibilité WCAG AA validé par `@axe-core/playwright`.

---

## 📦 Structure du projet

```
mon-coran/
├── src/
│   ├── App.jsx                   # Point d'entrée applicatif, routage et modales lazy
│   ├── components/               # Composants React modulaires
│   │   ├── AudioPlayer.jsx       # Lecteur audio flottant/ancré
│   │   ├── QuranDisplay.jsx      # Affichage coranique (Modes Surah / Page / Juz)
│   │   ├── HomePage.jsx          # Page d'accueil avec reprise de lecture et verset du jour
│   │   ├── recitation/           # Fiches biographiques et audio des récitateurs
│   │   ├── Quran/                # Balisage Tajwid, infobulles et polices coraniques
│   │   └── ui/                   # Primitives d'interface accessibles (Radix UI)
│   ├── context/
│   │   └── AppContext.jsx        # État global et actions centralisées
│   ├── data/
│   │   ├── reciters.js           # Catalogue des 59 récitateurs (Hafs & Warsh)
│   │   ├── surahs.js             # Métadonnées des 114 sourates
│   │   └── tajwidRules.js        # Définition des règles de Tajwid
│   ├── i18n/                     # Internationalisation (fr.js, en.js, ar.js)
│   ├── services/                 # Services audio, API, stockage IndexedDB et chiffrement
│   └── styles/                   # Tailwind CSS v4 et feuilles de style modulaires
├── public/                       # Manifest PWA, icônes, polices et assets statiques
├── tests/
│   ├── *.test.mjs                # 165 tests unitaires et de sécurité Node.js
│   └── e2e/                      # 36 suites de tests fonctionnels Playwright
├── scripts/                      # Scripts d'audit de performance, SEO, CSS et CSP
└── docs/                         # Documentation technique, budgets UX et design system
```

---

## 🗺️ Roadmap du projet

Les 8 phases fondamentales du projet ont été **terminées et validées en CI** :

| Phase | Description | Statut |
|:-----:|-------------|:------:|
| **0** | Stabilisation initiale et assainissement sécurité | ✅ Validé |
| **1** | Lecture fluide, polices coraniques & performance perçue | ✅ Validé |
| **2** | Lecteur audio modulaire, synchronisation & fallbacks | ✅ Validé |
| **3** | Design system documenté et harmonisation des surfaces | ✅ Validé |
| **4** | Accueil moderne, navigation responsive & accessibilité | ✅ Validé |
| **5** | 59 profils réciteurs vérifiés (Hafs & Warsh) avec biographies | ✅ Validé |
| **6** | Sécurité avancée, chiffrement local AES & headers CSP | ✅ Validé |
| **7** | Bibliothèque personnelle (favoris, notes, mémorisation, export) | ✅ Validé |
| **8** | Transitions audio immédiates et optimisation des requêtes | ✅ Validé |

➡️ Consultez [ROADMAP.md](ROADMAP.md) pour les détails historiques des phases.

---

## 🌐 Déploiement

- **Production (Netlify)** : [https://mushafplus.netlify.app](https://mushafplus.netlify.app)
- **Dépôt GitHub** : [https://github.com/mohamedeyaf820/mon-coran](https://github.com/mohamedeyaf820/mon-coran)

---

## 🤝 Contribution

Les contributions sont les bienvenues dans le respect des principes fondateurs du projet : authenticité du texte sacré, rigueur des règles de récitation, accessibilité et respect de la vie privée.

1. Forkez le projet et créez votre branche (`git checkout -b feature/amelioration`).
2. Assurez-vous que tous les tests passent (`npm run qa:smoke`).
3. Vérifiez la conformité du build CI (`npm run build:ci`).
4. Ouvrez une Pull Request détaillée.

Pour toute question d'architecture, consultez [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📄 Licence

Ce projet est sous droits réservés. Pour toute demande d'utilisation ou de contribution spécifique, veuillez ouvrir une issue sur le dépôt GitHub.

---

<div align="center">

⭐ **Si MushafPlus vous est utile, n'hésitez pas à lui attribuer une étoile sur GitHub !**

🌐 [Site Web](https://mushafplus.netlify.app) • 🐛 [Signaler un problème](https://github.com/mohamedeyaf820/mon-coran/issues) • 💬 [Discussions](https://github.com/mohamedeyaf820/mon-coran/discussions)

</div>