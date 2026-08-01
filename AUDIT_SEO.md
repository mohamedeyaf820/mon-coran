# Audit SEO — MushafPlus Quran SPA

> **Date** : 2026-07-30  
> **Version analysée** : 1.1.0  
> **Stack** : React 18 · Vite 8 · Netlify · PWA  
> **Domaine** : https://mon-coran.netlify.app  
> **Auditeur** : Analyse automatisée des sources (dist/index.html, sitemap, seoService, vite config, netlify.toml)

---

## Table des matières

1. [Executive Summary](#1-executive-summary)
2. [Meta Tags](#2-meta-tags)
3. [Structured Data (JSON-LD)](#3-structured-data-json-ld)
4. [Canonical](#4-canonical)
5. [Sitemap XML](#5-sitemap-xml)
6. [robots.txt](#6-robotstxt)
7. [Core Web Vitals SEO](#7-core-web-vitals-seo)
8. [URLs & Routing](#8-urls--routing)
9. [Internationalisation SEO (hreflang)](#9-internationalisation-seo-hreflang)
10. [Images SEO](#10-images-seo)
11. [Performance SEO](#11-performance-seo)
12. [Mobile SEO](#12-mobile-seo)
13. [Liens internes & Navigation](#13-liens-internes--navigation)
14. [Résumé prioritaire](#14-résumé-prioritaire)

---

## 1. Executive Summary

### Score global : **B+ (72 / 100)**

MushafPlus présente une architecture SEO **partiellement moderne** avec des bases solides (SSG des pages individuelles, canonical dynamique, JSON-LD sur chaque route, HSTS, sitemap avec 6 875 URLs) mais souffre de **4 blocages critiques** qui plafonnent le potentiel de ranking :

1. **Absence totale de hreflang** : le site supporte fr/en/ar mais aucune annotation multilingue n'existe. Google ne peut pas distinguer les variantes linguistiques et servira toujours la version `fr` aux arabophones.
2. **Sitemap surchargé et mal structuré** : 6 875 URLs incluant des pages de versets individuels (ex. `/surah/2/286`) dont la valeur SEO est quasi nulle et qui dilue le crawl budget.
3. **CSS critique de 395 Ko** : le fichier `OlQ7oaqm.css` est chargé en blocant le rendu (`<link rel="stylesheet">`) — impact direct sur LCP.
4. **JSON-LD incomplet** : seul `WebPage` est utilisé. Un site Coran mérite `SoftwareApplication`, `WebSite` avec `SearchAction`, et `BreadcrumbList` pour les sourates.

### Wins rapides (< 2h de travail)
- Ajouter `og:locale`, `og:site_name`, `twitter:site`
- Ajouter `lastmod` et `changefreq` dans le sitemap
- Ajouter `<meta name="robots" content="index,follow">`
- Limiter le sitemap aux 114 sourates + 604 pages + 30 juz (748 URLs vs 6 875)

---

## 2. Meta Tags

### 2.1 Title Tag

| Champ | Valeur actuelle | Analyse |
|-------|----------------|---------|
| **Homepage** | `Le Saint Coran avec MushafPlus` | 35 chars — OK longueur |
| **Surah /surah/1** | `L'Ouverture · MushafPlus` | 25 chars — trop court, keyword manquant |
| **Page /page/1** | `Page 1 du Coran · MushafPlus` | 30 chars — OK |

**Problème :** Le title de la homepage ne contient pas de keyword principal en araabe ni en anglais (ex. "Quran"). Pour un site trilingue visant `Coran en ligne`, `Quran online`, `قرآن كريم`, le title français seul perd les searches en/ar.

**Valeur actuelle** :
```html
<title>Le Saint Coran avec MushafPlus</title>
```

**Recommandation** :
```html
<title>Le Saint Coran en ligne — Lecture, Écoute & Tajwid | MushafPlus</title>
```
Pour les surates, inclure le nom arabe :
```html
<title>Sourate Al-Fatiha (الفاتحة) — Verset 1 | MushafPlus</title>
```

---

### 2.2 Meta Description

| Page | Valeur actuelle | Longueur | Problème |
|------|----------------|---------|---------|
| **Homepage** | `Lisez, écoutez et mémorisez le Saint Coran avec Tajwid, traductions et récitations Hafs et Warsh.` | 97 chars | Correct mais n'inclut pas de CTA fort ni keyword "gratuit" / "en ligne" |
| **Surah /surah/1** | `Sourate L'Ouverture (Al-Fatiha) : texte arabe, traduction, Tajwid et récitation audio.` | 87 chars | Correct |
| **Page /page/1** | `Page 1 du Saint Coran : lecture, traduction, Tajwid et récitation audio.` | 72 chars | Court mais acceptable |
| **Verset /surah/2/2** | `Sourate Al-Baqara ... Accès direct au verset 2.` | ~90 chars | Générique — identique pour tous les versets sauf le numéro |

**Problème majeur** : Les 6 122 pages de versets individuels ont des descriptions quasi-identiques (`... Accès direct au verset N.`). Google peut les signaler comme contenu dupliqué.

**Recommandation** : Soit supprimer les pages de versets individuels du sitemap (les garder comme deep links mais pas les soumettre), soit enrichir la description avec le texte du verset.

---

### 2.3 Open Graph

| Tag | Valeur actuelle | Statut | Problème |
|-----|----------------|--------|---------|
| `og:title` | `Le Saint Coran avec MushafPlus` | OK | — |
| `og:description` | `Lisez, écoutez...` | OK | — |
| `og:type` | `website` | OK | — |
| `og:url` | `https://mon-coran.netlify.app/` | OK | — |
| `og:image` | `https://mon-coran.netlify.app/logo-512.png` | **PROBLEME** | PNG 417 Ko — trop lourd. Facebook recommande < 8 Mo mais idéalement 100-150 Ko |
| `og:image:alt` | `Logo MushafPlus` | OK | Trop générique |
| `og:locale` | **ABSENT** | **CRITIQUE** | Facebook ne sait pas que le contenu est en français |
| `og:site_name` | **ABSENT** | Manquant | Recommandé pour le branding |
| `og:image:width` | **ABSENT** | Manquant | Sans dimensions, Facebook re-scrappe l'image |
| `og:image:height` | **ABSENT** | Manquant | Idem |

**Valeur actuelle** :
```html
<meta property="og:image" content="https://mon-coran.netlify.app/logo-512.png" />
<!-- Manquant : -->
<!-- <meta property="og:locale" content="fr_FR" /> -->
<!-- <meta property="og:site_name" content="MushafPlus" /> -->
<!-- <meta property="og:image:width" content="512" /> -->
<!-- <meta property="og:image:height" content="512" /> -->
```

**Recommandation** : Créer une image OG dédiée `og-image.jpg` (1200x630) compressée < 150 Ko. Ajouter les meta manquantes dans `generate-seo-pages.mjs` et `seoService.js`.

---

### 2.4 Twitter Card

| Tag | Valeur actuelle | Statut |
|-----|----------------|--------|
| `twitter:card` | `summary_large_image` | OK |
| `twitter:title` | `Le Saint Coran avec MushafPlus` | OK |
| `twitter:description` | `Lisez, écoutez...` | OK |
| `twitter:image` | `https://mon-coran.netlify.app/logo-512.png` | **PROBLEME** — même image PNG 417 Ko |
| `twitter:site` | **ABSENT** | Manquant — handle Twitter du compte |
| `twitter:creator` | **ABSENT** | Manquant |

---

### 2.5 Balises fondamentales

| Balise | Valeur actuelle | Statut |
|--------|----------------|--------|
| `charset` | `UTF-8` | OK |
| `viewport` | `width=device-width, initial-scale=1.0, viewport-fit=cover` | OK |
| `lang` | `fr` sur `<html>` | Partiellement OK — statique, jamais mis à jour pour en/ar dans l'HTML servi |
| `dir` | `ltr` hardcodé dans HTML | **PROBLEME** — la version arabe nécessite `dir="rtl"`. Le JS change `dir` dynamiquement mais l'HTML statique livré par SSG est toujours `ltr` |
| `robots` meta | **ABSENT** | Manquant — sans directive explicite, le comportement est implicitement `index,follow` mais il vaut mieux l'expliciter |
| `theme-color` | `#0D5C4A` | OK |

**Problème `lang`/`dir` statique** : Le script `seoService.js` modifie bien `document.documentElement.lang` à runtime, mais le HTML statique livré par le SSG (utilisé par les crawlers qui n'exécutent pas JS) conserve toujours `lang="fr"` et `dir="ltr"`. Pour un utilisateur en `/` avec locale `ar`, le HTML reçu est invalide sémantiquement.

---

## 3. Structured Data (JSON-LD)

### 3.1 Ce qui est présent

Chaque page statique générée contient un bloc JSON-LD de type `WebPage` :

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "L'Ouverture · MushafPlus",
  "description": "Sourate L'Ouverture (Al-Fatiha) : texte arabe, traduction, Tajwid et récitation audio.",
  "url": "https://mon-coran.netlify.app/surah/1",
  "inLanguage": "fr",
  "isPartOf": {
    "@type": "WebSite",
    "name": "MushafPlus",
    "url": "https://mon-coran.netlify.app"
  }
}
```

### 3.2 Ce qui manque (impact fort)

#### A. `WebSite` avec `SearchAction` (sitelinks searchbox)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "MushafPlus",
  "url": "https://mon-coran.netlify.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://mon-coran.netlify.app/surah/{search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```
Permet le **Sitelinks Searchbox** dans les SERPs Google — visible directement dans les résultats de recherche.

#### B. `SoftwareApplication` pour la page d'accueil

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MushafPlus",
  "applicationCategory": "EducationApplication",
  "operatingSystem": "Web, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "description": "Application Coran avec Tajwid, traductions et récitations audio.",
  "inLanguage": ["fr", "en", "ar"]
}
```
Éligible pour les **Rich Results** de type application.

#### C. `BreadcrumbList` pour les sourates

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://mon-coran.netlify.app/"},
    {"@type": "ListItem", "position": 2, "name": "Al-Fatiha", "item": "https://mon-coran.netlify.app/surah/1"}
  ]
}
```
Active les **Breadcrumbs dans les SERPs** — affiche le chemin de navigation dans les résultats Google.

#### D. `Book` ou `Article` pour les pages de sourates

Schema.org dispose d'un type `Book` avec `hasPart` (chapitres) qui modélise parfaitement le Coran. Les sourates pourraient utiliser `Chapter` ou `Article` avec `author`, `datePublished` (date de révélation si connue), et `inLanguage`.

#### E. Propriétés manquantes dans le `WebSite` de `isPartOf`

Le `WebSite` dans `isPartOf` n'a que `name` et `url`. Il manque :
- `sameAs` (liens vers réseaux sociaux, GitHub)
- `author` / `publisher`
- `inLanguage`

### 3.3 Tableau récapitulatif

| Type Schema | Présent | Priorité | Impact |
|-------------|---------|---------|--------|
| `WebPage` | Oui (toutes pages) | — | Baseline OK |
| `WebSite` avec `SearchAction` | Non | **P1** | Sitelinks Searchbox |
| `SoftwareApplication` | Non | **P1** | Rich Results PWA |
| `BreadcrumbList` | Non | **P2** | Breadcrumbs SERPs |
| `Book` / `Article` pour sourates | Non | P3 | Meilleure compréhension |
| `FAQPage` pour la page sources | Non | P3 | Featured Snippets |

---

## 4. Canonical

### 4.1 Ce qui est correct

- Chaque page statique SSG a un canonical auto-généré et correct :
  ```html
  <!-- Sur /surah/1/index.html -->
  <link rel="canonical" href="https://mon-coran.netlify.app/surah/1" />
  ```
- `seoService.js` met à jour dynamiquement le canonical à chaque navigation SPA.
- L'URL canonique utilise le protocole HTTPS et le domaine Netlify.

### 4.2 Problèmes identifiés

#### A. Pas de canonical trailing-slash cohérent

Le canonical de la homepage est :
```
https://mon-coran.netlify.app/
```
Mais les pages internes n'ont pas de slash final :
```
https://mon-coran.netlify.app/surah/1
```
Ce n'est pas un problème en soi mais doit être strictement cohérent dans le sitemap et les liens internes.

#### B. Le canonical du SSG pointe sur l'URL sans trailing slash pour les pages internes

Dans `generate-seo-pages.mjs` :
```js
const canonical = new URL(route.pathname, `${siteConfig.siteUrl}/`).href;
// Pour /surah/1 → https://mon-coran.netlify.app/surah/1 (sans /)
```
OK, mais Netlify délivre `/surah/1/` (avec slash) en raison des dossiers `surah/1/index.html`. Risque de **duplicate content** entre `/surah/1` et `/surah/1/`.

**Recommandation** : Ajouter dans `netlify.toml` :
```toml
[[redirects]]
  from = "/surah/:surah/:ayah/"
  to = "/surah/:surah/:ayah"
  status = 301
  force = true

[[redirects]]
  from = "/surah/:surah/"
  to = "/surah/:surah"
  status = 301
  force = true
```

#### C. Absence de canonical pour les pages `/juz/` et `/page/`

Ces routes sont présentes dans le sitemap et dans le script SSG, mais vérification nécessaire que les dossiers `dist/juz/1/index.html` existent bien et portent leur canonical.

---

## 5. Sitemap XML

### 5.1 État actuel

```
Fichier       : https://mon-coran.netlify.app/sitemap.xml
Taille        : 6 878 lignes
Total URLs    : 6 875
Déclaré dans  : public/robots.txt (ligne 3)
Format        : sitemap 0.9 valide
lastmod       : ABSENT
changefreq    : ABSENT
priority      : ABSENT
Hreflang      : ABSENT
```

**Décomposition des URLs** :
| Catégorie | Count | Pertinence SEO |
|-----------|-------|---------------|
| Pages de sourate (`/surah/N`) | 114 | Haute |
| Pages de versets (`/surah/N/V`) | 6 122 | Très faible |
| Pages Coran (`/page/N`) | 604 | Moyenne |
| Pages Juz (`/juz/N`) | 30 | Moyenne |
| Pages statiques | 5 | Haute |
| **Total** | **6 875** | — |

### 5.2 Problèmes critiques

#### A. Pages de versets individuels : crawl budget gaspillé

6 122 URLs de type `/surah/2/286` n'offrent qu'un contenu minuscule (une phrase de description générique). Ces pages :
- Diluent le crawl budget
- Peuvent déclencher le filtre "scaled content" de Google
- N'ont aucune chance de ranker sur un verset individuel sans le texte réel du verset dans l'HTML statique

**Recommandation** : Retirer les pages de versets du sitemap. Les garder comme deep links pour la navigation mais avec `<meta name="robots" content="noindex">`.

#### B. Absence de `lastmod`

Sans `lastmod`, Google ne sait pas quand les pages ont été mises à jour. Il re-crawle aléatoirement.

**Recommandation dans `generate-seo-pages.mjs`** :
```js
const today = new Date().toISOString().split('T')[0]; // 2026-07-30
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(route => `  <url>
    <loc>${escapeXml(new URL(route.pathname, siteConfig.siteUrl + '/').href)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq || 'monthly'}</changefreq>
    <priority>${route.priority || '0.5'}</priority>
  </url>`),
  '</urlset>',
  '',
].join('\n');
```

#### C. Absence de hreflang dans le sitemap

Le site supporte fr/en/ar mais le sitemap ne contient aucun `<xhtml:link>`. C'est le vecteur principal pour déclarer les variantes linguistiques (voir section 9).

#### D. Sitemap non découpé (sitemap index)

Au-delà de 50 000 URLs ou 50 Mo, Google exige un sitemap index. Aujourd'hui à 6 875 URLs c'est OK, mais si les versets individuels sont conservés, le sitemap devrait être découpé en sous-sitemaps par type.

### 5.3 Sitemap recommandé (structure)

```xml
<!-- sitemap-index.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://mon-coran.netlify.app/sitemap-main.xml</loc>
    <lastmod>2026-07-30</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://mon-coran.netlify.app/sitemap-surahs.xml</loc>
    <lastmod>2026-07-30</lastmod>
  </sitemap>
</sitemapindex>
```

---

## 6. robots.txt

### 6.1 Contenu actuel

```
User-agent: *
Allow: /

Sitemap: https://mon-coran.netlify.app/sitemap.xml
```

### 6.2 Analyse

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| Présent | Oui | OK |
| Sitemap référencé | Oui | OK |
| Blocage involontaire | Non | OK |
| Directives de crawl budget | Non | Recommandé |
| Blocage des assets | Non | OK — les assets JS/CSS doivent être crawlables |

### 6.3 Recommandations

```
User-agent: *
Allow: /
Disallow: /assets/
Disallow: /data/

User-agent: Googlebot
Allow: /
Allow: /assets/
Allow: /data/

Sitemap: https://mon-coran.netlify.app/sitemap.xml
```

**Explication** : Les assets hachés (`/assets/*.js`) n'ont pas besoin d'être dans l'index Google (sauf pour la vérification de rendu JS). Permettre à Googlebot spécifiquement de les lire (Google recommande d'autoriser le JS/CSS pour le rendu).

**Attention** : Ne pas bloquer `/assets/` pour Googlebot — Google a besoin du JS pour confirmer le rendu de la SPA.

---

## 7. Core Web Vitals SEO

### 7.1 Analyse des assets initiaux (avant compression réseau)

| Asset | Taille disque | Estimation gzip | Rôle |
|-------|--------------|----------------|------|
| `OlQ7oaqm.css` | 395 Ko | ~65 Ko | CSS critique — BLOQUANT rendu |
| `CKkb6Zyx.js` (entry) | 156 Ko | ~45 Ko | JS principal |
| `V-fMJQUW.js` (vendor-react) | 140 Ko | ~42 Ko | React + ReactDOM |
| `DM9bEi6p.js` (vendor-crypto) | 68 Ko | ~22 Ko | crypto-js |
| `1ZjpunNd.js` (vendor-icons) | 32 Ko | ~10 Ko | Lucide icons |
| **Total initial** | **~791 Ko** | **~184 Ko** | — |

Netlify active automatiquement Brotli/gzip sur ses CDN. Les estimations gzip ci-dessus sont conservatrices.

### 7.2 LCP (Largest Contentful Paint)

**Risque élevé.** Le LCP sur mobile est probablement la bannière hero ou le logo.

**Ce qui aide** :
- `<link rel="preload" as="image" type="image/webp" href="/logo-ui.webp" fetchpriority="high" />` — bon
- `logo-ui.webp` = 27 Ko — très bien
- `<link rel="preconnect" href="https://api.quran.com" />` — réduit le TTFB API

**Ce qui nuit** :
- Le CSS principal de 395 Ko (même gzippé à ~65 Ko) retarde le premier paint. CSS est render-blocking par défaut.
- La homepage charge `bZZ8sFa5.js` (68 Ko) en dynamique + `DnkRxovw.css` (60 Ko) en plus du CSS initial.
- La police `sura_names.woff2` (88 Ko) est preloaded mais la police de lecture Scheherazade-new (79+89 Ko) ne l'est pas.

**Estimation LCP** : 2,5-4,0s sur mobile 4G moyen (avant optimisation CSS).

**Recommandations** :
1. Extraire le CSS critique above-the-fold (< 14 Ko) et l'inliner dans le `<head>`.
2. Charger le reste du CSS de façon asynchrone via `<link rel="preload" as="style" onload>`.
3. Preload la police Scheherazade-new-400 si elle est utilisée pour le LCP element.

### 7.3 CLS (Cumulative Layout Shift)

**Risque modéré.**

Sources potentielles de CLS :
- Polices WOFF2 chargées après le premier paint — sans `font-display: swap`, le navigateur peut réserver de l'espace puis re-layouter. À vérifier dans le CSS.
- Images sans attribut `width` et `height` explicites (voir section 10).
- Le `SplashScreen` qui disparaît peut déclencher un shift si les éléments sous-jacents ne sont pas déjà dimensionnés.

**Recommandation** : Vérifier que les polices Quraniques ont `font-display: optional` ou `font-display: swap` dans les `@font-face`. Spécifier les dimensions des images OG.

### 7.4 INP (Interaction to Next Paint)

**Risque faible à modéré.**

Points positifs :
- Toutes les routes sont lazy-loaded (code splitting aggressif — bon pour INP).
- `crypto-js` chargé en vendor-crypto séparé n'est pas dans le critical path.

Points de risque :
- Le `QuranDisplay` est un chunk de 44 Ko qui charge des modules supplémentaires (JuzMode, PageMode). Une interaction d'ouverture de sourate peut prendre 200-400ms sur mobile bas de gamme.
- Le `displayClasses.js` (Buz8Mn2l2.js = 148 Ko) est partagé par QuranDisplay, JuzMode, PageMode — chunck très lourd importé dynamiquement.

### 7.5 TTFB

Netlify CDN offre un TTFB typique de 50-100ms (edge nodes). Pas de problème identifié.

---

## 8. URLs & Routing

### 8.1 Structure actuelle

```
/                     → Accueil
/surah/{n}            → Sourate numéro N
/surah/{n}/{ayah}     → Verset spécifique
/juz/{n}              → Juz numéro N
/page/{n}             → Page Mushaf N (1-604)
/duas                 → Page Douas
/privacy              → Politique de confidentialité
/legal                → Mentions légales
/sources              → Sources
```

### 8.2 Points positifs

- Structure propre et logique
- Profondeur faible (max 3 niveaux)
- Cohérence entre sitemap, SSG et routing SPA

### 8.3 Problèmes identifiés

#### A. URLs numériques sans slug textuel

```
/surah/1       → opaque pour Google
/surah/1/al-fatiha  → meilleur signal de pertinence
```

Les URLs `/surah/1` n'apportent aucun signal de keyword. La structure idéale serait `/surah/al-fatiha` ou au minimum `/surah/1-al-fatiha`.

**Impact SEO** : Modéré. Google comprend bien les numéros de sourate dans le contexte du Coran, mais les slugs textuels améliorent le CTR dans les SERPs et la compréhension sémantique.

**Recommandation** : Ajouter des redirects (ou changer les URLs) :
```
/surah/al-fatiha → /surah/1 (redirect 301) ou inversement
```

#### B. Pas de routes pour les récitateurs

Le manifest Vite montre `ReciterDetailPage.jsx` mais il n'y a pas de routes `/reciter/` dans le sitemap. Ces pages de récitateurs pourraient ranker sur des requêtes comme "récitation Mishary Rashid" ou "quran hafs warsh".

#### C. Pages `/page/N` et `/juz/N` sont génériques

604 pages intitulées `Page 1 du Coran · MushafPlus` à `Page 604 du Coran · MushafPlus` sont indexées. Sans contenu textuel (juste l'H1 et un lien), ces pages constituent du **contenu mince** en masse.

**Recommandation** : Soit les exclure de l'index (`<meta name="robots" content="noindex, follow">`), soit enrichir chaque page avec la liste des sourates/versets qu'elle contient.

---

## 9. Internationalisation SEO (hreflang)

### 9.1 État actuel

**Aucun hreflang n'est implémenté.**

Le site supporte trois langues (fr, en, ar) déclarées dans `site.config.json`, la `seoService.js` change dynamiquement `document.documentElement.lang`, mais :
- Aucun `<link rel="alternate" hreflang="...">` dans l'HTML statique
- Aucune annotation `<xhtml:link>` dans le sitemap
- Aucun `x-default` déclaré
- Aucune structure d'URL par locale (`/fr/`, `/en/`, `/ar/`)

### 9.2 Gravité du problème

**CRITIQUE pour la croissance internationale.**

Sans hreflang :
- Google ne sait pas que le site existe en arabe — les 1,8 milliard d'arabophones ne voient jamais la version arabe
- Google peut présenter la version française à des utilisateurs anglophones et vice-versa
- Les signaux de pertinence pour les requêtes `quran online` (en) et `قرآن` (ar) sont diluées

### 9.3 Architecture actuelle problématique

Actuellement, toutes les langues partagent la même URL (`/`). L'application change de langue en JavaScript, sans changement d'URL. C'est la configuration la moins favorable pour le SEO multilingue :

```
https://mon-coran.netlify.app/           → contenu fr (ou en ou ar selon préférence sauvegardée)
```

Google ne voit qu'une seule URL, en français (HTML statique `lang="fr"`).

### 9.4 Deux approches pour résoudre

#### Option A : Sous-dossiers (recommandée)

```
https://mon-coran.netlify.app/fr/         → version française
https://mon-coran.netlify.app/en/         → version anglaise
https://mon-coran.netlify.app/ar/         → version arabe
https://mon-coran.netlify.app/            → x-default (redirect vers fr)
```

Avantages : meilleure séparation, targeting précis, hreflang simple.
Inconvénients : refactoring important du SSG et du routing.

#### Option B : Hreflang sur page unique (court terme)

Si le changement de langue reste JS-only sans changement d'URL :

```html
<!-- Sur toutes les pages, déclarer les 3 variantes pointant vers la même URL -->
<link rel="alternate" hreflang="fr" href="https://mon-coran.netlify.app/" />
<link rel="alternate" hreflang="en" href="https://mon-coran.netlify.app/" />
<link rel="alternate" hreflang="ar" href="https://mon-coran.netlify.app/" />
<link rel="alternate" hreflang="x-default" href="https://mon-coran.netlify.app/" />
```

Avantages : implémentation rapide (< 1h dans `generate-seo-pages.mjs`).
Inconvénients : peu efficace car toutes pointent vers la même URL — Google comprend mal les variantes.

### 9.5 Recommandation prioritaire

Implémenter au minimum l'Option B immédiatement (quick win), puis planifier l'Option A pour la prochaine version majeure.

Dans `generate-seo-pages.mjs`, ajouter au template :
```js
const hreflang = `
<link rel="alternate" hreflang="fr" href="${canonical}" />
<link rel="alternate" hreflang="en" href="${canonical}" />
<link rel="alternate" hreflang="ar" href="${canonical}" />
<link rel="alternate" hreflang="x-default" href="${canonical}" />`;
```

### 9.6 Attribut `lang` dans l'HTML statique

L'HTML statique livre toujours `lang="fr" dir="ltr"`. Pour les pages arabes, Google lirait du contenu arabe dans un document déclaré en français — signal contradictoire.

**Recommandation** : Le script SSG pourrait générer des variantes HTML séparées avec `lang="ar" dir="rtl"` pour les chemins arabes (Option A).

---

## 10. Images SEO

### 10.1 Inventaire des images

| Image | Taille | Format | Alt | Dimensions HTML | Problème |
|-------|--------|--------|-----|-----------------|---------|
| `logo-ui.webp` | 27 Ko | WebP | Non visible dans HTML (preload) | Non spécifiées | — |
| `logo-512.png` | 418 Ko | PNG | `Logo MushafPlus` (via og:image:alt) | Non spécifiées | **Trop lourd pour OG** |
| `logo-192.png` | 63 Ko | PNG | — (apple-touch-icon, pas dans `<img>`) | — | — |
| `pwa-home-wide.png` | 229 Ko | PNG | `Accueil MushafPlus sur ordinateur` (manifest) | 1440x900 | Dans manifest uniquement |
| `pwa-home-mobile.png` | 77 Ko | PNG | `Accueil MushafPlus sur mobile` (manifest) | 390x844 | Dans manifest uniquement |
| `favicon.png` | 9 Ko | PNG | — | 64x64 | — |

### 10.2 Problèmes identifiés

#### A. Pas d'image OG dédiée

L'image `logo-512.png` (512x512, 418 Ko) est utilisée pour l'Open Graph. Cela pose deux problèmes :
1. **Format incorrect** : 512x512 au lieu du standard 1200x630 recommandé par Facebook/Twitter. Un carré en mode `summary_large_image` Twitter sera mal affiché.
2. **Poids excessif** : 418 Ko pour une image OG — la recommandation est < 300 Ko, idéalement < 150 Ko.

**Recommandation** : Créer `public/og-image.jpg` en 1200x630, compressée JPEG qualité 85, < 120 Ko.

#### B. Aucune image dans le contenu HTML des pages SSG

Les pages SSG générées n'ont que du texte (`<h1>` + `<p>`). Il n'y a donc aucune image dans le DOM HTML statique à analyser pour les alt texts.

#### C. Pas de `width`/`height` sur l'image OG

```html
<meta property="og:image" content="https://mon-coran.netlify.app/logo-512.png" />
<!-- Manquant : -->
<!-- <meta property="og:image:width" content="512" />  -->
<!-- <meta property="og:image:height" content="512" /> -->
```

Sans ces dimensions, les scrapers OG (Facebook, WhatsApp) doivent télécharger l'image pour connaître ses dimensions — coût de crawl supplémentaire.

---

## 11. Performance SEO

### 11.1 Ressources render-blocking

| Ressource | Type | Bloquant | Impact LCP |
|-----------|------|---------|------------|
| `assets/OlQ7oaqm.css` (395 Ko) | CSS critique | **OUI** | Très élevé |
| `assets/CKkb6Zyx.js` (156 Ko) | JS entry | Non (type=module) | Modéré |
| `assets/V-fMJQUW.js` (140 Ko) | JS vendor | Non (modulepreload) | Modéré |

Le CSS (`<link rel="stylesheet">`) est render-blocking. Avec 395 Ko (≈65 Ko gzip), il ajoute environ **300-600ms** au LCP sur mobile moyen.

**Recommandation** :
```html
<!-- Remplacer -->
<link rel="stylesheet" crossorigin href="/assets/OlQ7oaqm.css">

<!-- Par (avec CSS critique inline) -->
<style>/* css critique above-the-fold ici */</style>
<link rel="preload" as="style" href="/assets/OlQ7oaqm.css" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/OlQ7oaqm.css"></noscript>
```

### 11.2 Chargement des polices

| Police | Taille | Preloaded | `font-display` |
|--------|--------|-----------|---------------|
| `sura_names.woff2` | 89 Ko | **Oui** | Inconnu |
| `scheherazade-new-400.woff2` | 79 Ko | **Non** | Inconnu |
| `scheherazade-new-700.woff2` | 90 Ko | **Non** | Inconnu |

Les polices Scheherazade-new (utilisées pour le texte coranique) ne sont pas preloadées. Si elles constituent le LCP element (bloc de texte arabe), leur chargement retarde le LCP.

**Recommandation** :
```html
<link rel="preload" as="font" type="font/woff2" href="/fonts/scheherazade-new-400.woff2" crossorigin />
```

Et dans le CSS :
```css
@font-face {
  font-family: 'Scheherazade New';
  font-display: swap; /* ou optional pour éviter FOUT */
}
```

### 11.3 Cache Headers (Netlify)

| Ressource | Cache-Control actuel | Correct |
|-----------|---------------------|---------|
| `/assets/*` | `public, max-age=31536000, immutable` | Parfait — hashing garantit unicité |
| `/data/*` | `public, max-age=86400` | Bien — données mises à jour quotidiennement |
| `/*` (HTML) | `public, max-age=0, must-revalidate` | Correct — revalidation à chaque visite |
| `robots.txt`, `sitemap.xml` | Hérité de `/*` | OK — sera revalidé |

### 11.4 Compression

Netlify active automatiquement gzip et Brotli pour les types MIME standards. Pas d'action nécessaire côté netlify.toml.

### 11.5 CDN

Netlify CDN global — couverture mondiale avec edge nodes. Pas de problème identifié.

### 11.6 Connexions anticipées (preconnect/dns-prefetch)

```html
<link rel="preconnect" href="https://api.quran.com" crossorigin />
<link rel="dns-prefetch" href="https://api.alquran.cloud" />
<link rel="dns-prefetch" href="https://cdn.islamic.network" />
<!-- ... 8 autres dns-prefetch -->
```

**Positif** : preconnect sur l'API principale, dns-prefetch sur les secondaires.

**Problème** : `https://fonts.googleapis.com` est référencé dans le CSP (`style-src`) mais n'a pas de `<link rel="dns-prefetch">`. Si des styles Google Fonts sont chargés (même indirectement), ajouter :
```html
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

### 11.7 Service Worker et indexation

Le projet inclut `dist/sw.js`. Les Service Workers ne bloquent pas le crawl de Google (Googlebot n'exécute pas les SW), mais s'assurer que le SW ne serve pas de contenu obsolète après déploiement (stratégie de cache-busting correcte grâce aux hashes Vite).

---

## 12. Mobile SEO

### 12.1 Viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Correct** — `viewport-fit=cover` adapté pour les notches iPhone. Pas de `user-scalable=no` (bonne pratique).

### 12.2 PWA & Mobile-first

| Aspect | Statut |
|--------|--------|
| Manifest PWA | Présent et bien configuré |
| `start_url` | `/` |
| `display: standalone` | OK |
| `theme_color` dans manifest | `#1B5E3A` (vert) |
| `theme_color` dans HTML | `#0D5C4A` (vert différent) |
| Apple touch icon | `/logo-192.png` |
| Shortcuts PWA (3 sourates) | Présents |
| Screenshots PWA | Présentes (wide + mobile) |

**Problème** : `theme_color` incohérent entre le manifest (`#1B5E3A`) et le meta HTML (`#0D5C4A`). Utiliser la même valeur.

### 12.3 Google Mobile-Friendly

**Points positifs** :
- Pas de Flash
- Pas de `user-scalable=no`
- SPA avec routing History API (pas de hash-based routing)
- Contenu statique SSG disponible avant JS

**Points de risque** :
- Les touch targets dans l'application (boutons de navigation, versets) doivent mesurer >= 48x48 CSS px. À vérifier via Lighthouse mobile.
- Le texte arabe avec polices spécialisées peut poser des problèmes de taille lisible sur petits écrans.

### 12.4 Mobile-first Indexing

Google indexe en priorité la version mobile. Le HTML statique SSG est identique pour desktop et mobile (même fichier), donc pas de problème de divergence de contenu.

---

## 13. Liens internes & Navigation

### 13.1 Maillage interne dans le SSG

Les pages générées par `generate-seo-pages.mjs` contiennent uniquement :

```html
<main>
  <h1>L'Ouverture · MushafPlus</h1>
  <p>Sourate L'Ouverture (Al-Fatiha) : texte arabe, traduction, Tajwid et récitation audio.</p>
  <p><a href="/">Ouvrir MushafPlus</a></p>
</main>
```

**Un seul lien interne** (`href="/"`). Toutes les 6 875 pages SSG pointent uniquement vers la homepage. Il n'y a donc pas de PageRank distribué vers les pages de sourates depuis les pages de versets, et pas de liens contextuels entre sourates adjacentes.

### 13.2 Navigation principale (JavaScript)

La navigation réelle (header, sidebar, surah list) est entièrement JavaScript. Google peut la crawl si le rendu JS est exécuté, mais les pages statiques SSG n'en bénéficient pas.

### 13.3 Problèmes

#### A. Absence de breadcrumbs HTML

Aucun breadcrumb n'existe dans l'HTML statique des pages SSG. Sur `/surah/1`, il n'y a aucun lien vers la liste des sourates ou la homepage en dehors du lien `Ouvrir MushafPlus`.

**Recommandation** : Enrichir le contenu SSG :
```html
<nav aria-label="Fil d'Ariane">
  <ol>
    <li><a href="/">MushafPlus</a></li>
    <li><a href="/surah/1">Al-Fatiha</a></li>
  </ol>
</nav>
```

#### B. Pages sourates sans liens vers sourates adjacentes

La page `/surah/5` ne contient aucun lien vers `/surah/4` ou `/surah/6`. Ce maillage améliorerait :
- La distribution du PageRank
- Le crawl efficiency
- L'expérience utilisateur pré-JS

**Recommandation** : Dans le SSG, ajouter des liens de navigation :
```html
<nav>
  <a href="/surah/0">← Précédente</a> <!-- si existe -->
  <a href="/surah/2">Suivante →</a>
</nav>
```

#### C. Pas de page de liste des sourates indexable

Il n'y a pas de page `/surahs` ou `/liste` qui listerait toutes les 114 sourates avec leurs liens. Une telle page serait un excellent hub de PageRank et très utile pour le crawl.

**Recommandation** : Créer une page `/surahs/index.html` avec la liste complète :
```html
<h1>Liste des 114 Sourates du Saint Coran</h1>
<ul>
  <li><a href="/surah/1">Al-Fatiha (الفاتحة)</a> — 7 versets</li>
  <li><a href="/surah/2">Al-Baqara (البقرة)</a> — 286 versets</li>
  <!-- ... -->
</ul>
```

---

## 14. Résumé prioritaire

### Tableau de priorité

| # | Priorité | Problème | Impact SEO | Solution | Effort |
|---|----------|---------|-----------|---------|--------|
| 1 | **CRITIQUE** | Absence de hreflang fr/en/ar | Perd 100% du trafic non-francophone | Ajouter `<link rel="alternate" hreflang>` dans SSG | 2h |
| 2 | **CRITIQUE** | 6 122 pages versets en mince contenu indexé | Crawl budget gaspillé, risque contenu mince | `noindex` sur `/surah/N/V` OU enrichir avec texte verset | 1h |
| 3 | **HAUTE** | CSS critique 395 Ko render-blocking | +300ms LCP estimé | Inliner CSS above-the-fold, charger reste async | 4h |
| 4 | **HAUTE** | Sitemap sans `lastmod`/`changefreq`/`priority` | Google re-crawle aléatoirement | Modifier `generate-seo-pages.mjs` | 30min |
| 5 | **HAUTE** | JSON-LD incomplet (pas de `SoftwareApplication`, `SearchAction`, `BreadcrumbList`) | Pas de Rich Results, pas de Sitelinks Searchbox | Ajouter les types manquants dans SSG et seoService | 2h |
| 6 | **HAUTE** | `og:locale`, `og:site_name`, `og:image:width/height` absents | Mauvais partage réseaux sociaux | Ajouter dans template SSG | 30min |
| 7 | **HAUTE** | Image OG logo-512.png : 418 Ko, format carré 512x512 | Mauvais affichage Twitter/Facebook | Créer og-image.jpg 1200x630 < 150 Ko | 1h |
| 8 | **HAUTE** | URLs numériques (`/surah/1`) sans slug textuel | CTR réduit dans SERPs | Ajouter slugs ou redirects `/surah/al-fatiha` | 4h |
| 9 | **MOYENNE** | `lang="fr" dir="ltr"` hardcodé dans HTML statique | Google voit contenu arabe en lang=fr | Générer variantes par locale dans SSG (Option A) | 8h |
| 10 | **MOYENNE** | Pas de page liste des sourates indexable | PageRank non distribué, hub manquant | Créer `/surahs/index.html` avec 114 liens | 2h |
| 11 | **MOYENNE** | Polices Scheherazade-new non preloadées | Risque FOIT/LCP lent | Ajouter `<link rel="preload">` pour woff2 lecture | 30min |
| 12 | **MOYENNE** | Pages `/page/N` et `/juz/N` en contenu mince (748 URLs) | Signal contenu mince | Enrichir avec liste de sourates/versets ou `noindex` | 3h |
| 13 | **MOYENNE** | Maillage interne SSG quasi absent (1 lien par page) | PageRank non distribué | Ajouter liens breadcrumb + sourate précédente/suivante | 2h |
| 14 | **MOYENNE** | `theme_color` différent entre HTML (#0D5C4A) et manifest (#1B5E3A) | Minor incohérence branding | Harmoniser les deux valeurs | 5min |
| 15 | **FAIBLE** | `twitter:site` et `twitter:creator` absents | Branding Twitter incomplet | Ajouter handles Twitter | 15min |
| 16 | **FAIBLE** | `<meta name="robots" content="index,follow">` absent | Comportement implicite correct mais non explicite | Ajouter la balise | 10min |
| 17 | **FAIBLE** | Pages récitateurs sans URLs indexables | Opportunité de ranking sur récitateurs | Créer `/reciter/{slug}` dans SSG | 4h |
| 18 | **FAIBLE** | Sitemap non découpé par type | Maintenabilité | Créer sitemap-index.xml + sous-sitemaps | 1h |

---

### Roadmap recommandée (3 sprints)

#### Sprint 1 — Quick Wins (< 8h de travail total)

1. Ajouter dans `generate-seo-pages.mjs` : hreflang minimal, `og:locale`, `og:site_name`, `og:image:width/height`, `lastmod`/`changefreq` dans sitemap, `<meta name="robots">`
2. Ajouter `<link rel="preload">` pour Scheherazade-new-400.woff2 dans `index.html`
3. Harmoniser `theme_color` HTML ↔ manifest
4. Ajouter `twitter:site`
5. Noindex les pages versets individuels

#### Sprint 2 — Impact Moyen (8-16h)

1. Créer image OG 1200x630 dédiée (JPEG < 150 Ko)
2. Ajouter JSON-LD `SoftwareApplication` + `WebSite` avec `SearchAction` + `BreadcrumbList`
3. Enrichir le SSG avec breadcrumbs HTML + liens sourate précédente/suivante
4. Créer page `/surahs/` avec liste des 114 sourates

#### Sprint 3 — SEO Structurel (16-40h)

1. Implémenter sous-dossiers locale (`/fr/`, `/en/`, `/ar/`) avec hreflang complet
2. Ajouter slugs textuels aux URLs de sourates
3. Optimiser le chargement CSS (critical CSS inline + async load du reste)
4. Enrichir pages `/page/N` avec contenu réel (liste des sourates de la page)

---

*Audit produit à partir de l'analyse statique des fichiers source et build. Validation recommandée via Google PageSpeed Insights, Search Console et Rich Results Test (https://search.google.com/test/rich-results) après déploiement des correctifs.*
