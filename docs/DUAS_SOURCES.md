# Invocations et Citadelle du musulman : sources, méthode, limites

Travail du 2026-10-08 pour MushafPlus. Même méthode et mêmes statuts que `docs/WARSH_SOURCES.md` : **VÉRIFIÉ** (testé ou lu à la source, reproductible), **RAPPORTÉ** (catalogue ou fiche, non recoupé), **NON VÉRIFIÉ**.

---

## 1. Résumé

1. **La page Invocations est maintenant un hub** (`/duas`) : accès rapides (matin et soir, avant de dormir, au réveil, après la prière), la **Citadelle du musulman** (132 chapitres, 267 invocations, `/duas/hisn`, `/duas/hisn/27`) et les **invocations du Coran** (58, `/duas/coran`). Une recherche couvre le tout. [VÉRIFIÉ, rendu dans le navigateur et tests]
2. **Les noms suivent la langue choisie** : titres de chapitre, noms de sourates dans les références, noms des recueils de hadiths. En arabe, les titres restent en arabe. [VÉRIFIÉ pour les titres, 132/132 en français et en anglais]
3. **Chaque invocation indique d'où elle vient, sans inventer** : un verset du Coran se rattache à sa sourate et à son verset ; un hadith se rattache à un numéro **retrouvé** dans le texte des six recueils, avec un lien vers sunnah.com. Une invocation sans correspondance n'a aucune référence plutôt qu'une référence devinée. [VÉRIFIÉ, §3]
4. **Une référence dit « cette formulation figure dans ce hadith », pas « le livre cite ce hadith ».** Les citations propres du livre ne sont pas dans les données publiques. [VÉRIFIÉ]
5. **Les traductions française et anglaise sont celles de MushafPlus**, écrites à partir de l'arabe et recoupées avec l'anglais du livre, **non relues par un spécialiste**. Le texte de la page le dit. [RAPPORTÉ comme limite, à faire relire, §5]
6. **Les conditions de réutilisation de hisnmuslim.com ne sont pas énoncées** : l'autorisation est à confirmer auprès de son exploitant. [VÉRIFIÉ : la page du développeur n'en donne aucune]

## 2. Ce que le projet utilise

| Élément | Source | Fichier |
|---|---|---|
| Arabe, titres, répétitions, ordre | API publique de hisnmuslim.com (`/api/ar/husn_ar.json`, `/api/ar/{n}.json`) | `public/data/hisn/hisn.json` |
| Versets cités | texte Hafs d'AlQuran.cloud (`quran-simple-clean`) | idem, champ `q` |
| Numéros de hadith et degrés | `fawazahmed0/hadith-api` (Unlicense), numérotation de sunnah.com | idem, champ `h` |
| Traductions | MushafPlus, à la main | `public/data/hisn/fr.json`, `en.json` |
| Génération | `scripts/build-hisn-data.mjs` (télécharge, retrouve, vérifie, écrit) | |
| Invocations du Coran | écrites à la main, avec sourate et verset | `src/data/duas.js` |

Chargement : fichiers du même domaine, chargés quand on ouvre la bibliothèque (`src/services/hisnService.js`). Le service worker garde les JSON du même domaine après la première ouverture : un chapitre déjà visité se relit sans réseau, avec sa traduction et ses sources (test `tests/e2e/pwa-offline.spec.mjs`, projet `pwa-offline`). Une bibliothèque jamais ouverte sur l'appareil n'est pas disponible hors ligne : l'écran d'erreur le dit et propose de réessayer. [VÉRIFIÉ]

## 3. Comment les références sont retrouvées, et ce que cela vaut

- **Versets** : chaque citation entre ﴿ ﴾, ou chaque invocation entièrement coranique, est cherchée dans le texte Hafs, par squelette de consonnes (l'orthographe diffère : السموات / السماوات) et par mots entiers. Un verset contenu dans un autre (3:2 dans 2:255) est écarté ; une citation qui commence à la fin du verset précédent le rattache (43:13-14). 17 invocations ont des versets. [VÉRIFIÉ : 75 = 2:255, 101 = 2:285-286, 76 = 112:1-4 + 113:1-5 + 114:1-6, 206 = 43:13-14]
- **Hadiths** : le texte arabe de l'invocation est cherché dans Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i et Ibn Majah. Chaque référence porte son degré de correspondance (`m`) :

| `m` | Sens | Invocations dont c'est la meilleure référence |
|---|---|---|
| `exact` | tout le texte figure tel quel dans le hadith | 102 |
| `fuzzy` | ≥ 80 % des triplets de mots (un « wa » ou « fa » de différence) | 46 |
| `partial` | invocation composée, ≥ 75 % des mots retrouvés phrase par phrase | 8 |
| `fragment` | seule la phrase distinctive la plus longue (≥ 4 mots, présente dans au plus 8 hadiths) | 53 |

  Au total 209 invocations ont une référence de hadith, 17 un verset, **48 aucune**. Sur la page, `fuzzy` s'affiche « formulation proche », `partial` et `fragment` « extrait ». [VÉRIFIÉ, `stats` dans `hisn.json`]
- **Ordre des références** : même qualité de correspondance d'abord, puis les deux Sahih, puis le hadith le plus court (celui qui est surtout l'invocation). Une narration jugée faible passe après. Deux références au plus.
- **Contrôle indépendant** : sur les 27 invocations de l'application déjà référencées à la main avant ce travail, la méthode retrouve **la même référence pour 13**, une **autre référence contenant le même texte pour 6**, **aucune pour 6**, et 2 n'ont pas d'équivalent dans le livre. Les écarts « autre référence » sont des hadiths qui contiennent bien la formule (par exemple Bukhari 5662 au lieu de 5675 pour la visite du malade), pas des erreurs de lecture. [VÉRIFIÉ]
- **Liens sunnah.com ouverts et lus** : `muslim:713` (entrée à la mosquée, 713a), `muslim:713b`, `abudawud:5095` (sortie de la maison), `tirmidhi:3534`. Pour Muslim, le numéro est celui d'Abd al-Baqi avec lettre (le jeu écrit « 713.01 », la page « 713a »). Abu Dawud 5068 et 5074 ont été lus dans le texte du jeu de données, pas ouverts sur sunnah.com. [VÉRIFIÉ]
- **Degrés** : repris du jeu de données (Al-Albani en priorité) pour les quatre Sunan ; Bukhari et Muslim n'en portent pas. Ils ne sont pas recoupés avec une autre source. [RAPPORTÉ]

## 4. Fichiers de données du livre : défauts rencontrés

- Les fichiers de hisnmuslim.com commencent par un BOM et contiennent des sauts de ligne bruts dans les chaînes (JSON invalide tel quel) : le script les aplatit. [VÉRIFIÉ]
- Le fichier du chapitre 245 a une clé de titre sans guillemet fermant : le script ne lit que le tableau des invocations. [VÉRIFIÉ]
- Le site ne propose pas le français (15 langues, dont l'anglais). [VÉRIFIÉ, page d'accueil]
- Le dépôt `rn0x/Adhkar-json` (mêmes textes arabes) n'a pas de licence ; `fitrahive/dua-dhikr` (MIT) n'a que l'anglais et l'indonésien et cite des sources sans numéro. Aucun des deux n'est utilisé. [VÉRIFIÉ]

## 4 bis. Les 40 Rabbana et la fin de lecture du Coran

**Les 40 Rabbana** (`/duas/rabbana`, `src/data/rabbanaDuas.js`, généré par `scripts/build-rabbana-data.mjs`).
- Le texte arabe n'est jamais saisi à la main : chaque invocation est une suite de mots découpée dans le texte uthmani d'AlQuran.cloud (`quran-uthmani`) par position de verset et de mot, avec ses voyelles. [VÉRIFIÉ : le test compare au moins dix entrées avec le texte déjà écrit dans `src/data/duas.js`]
- « Les quarante » est la liste usuelle, pas le décompte de tous les versets qui contiennent le mot : 96 versets l'ont, beaucoup sont des récits. Le verset 2:286 compte pour trois (une par « Rabbana »), numérotés 1/3, 2/3, 3/3. Les versets qui rapportent la parole de quelqu'un sans être une demande sont écartés. [décision]
- **Le sens en français et en anglais est écrit par MushafPlus**, ce n'est pas une traduction publiée : la page l'affiche (« Sens écrit par MushafPlus »). À faire relire. [NON VÉRIFIÉ par un spécialiste]
- Chaque carte renvoie au verset dans le lecteur, et la liste ne contient aucune invocation sans référence.

**Fin de lecture du Coran (khatm)** (`/duas/khatm`, `src/data/khatmDuas.js`).
- Il n'existe pas de formule établie du Prophète pour la fin de la récitation. Ce qui est rapporté est la pratique d'Anas ibn Mâlik (réunir sa famille et invoquer) : la page l'attribue à lui, **non au Prophète**.
- Le texte courant « اللهم ارحمني بالقرآن » repose sur une chaîne très faible : la carte le dit (« ne l'attribuez pas au Prophète ») et renvoie à dorar.net. Les liens externes s'ouvrent avec `rel="noopener"`.
- La page propose en plus des invocations qui existent déjà dans l'application, chacune avec sa propre source : deux invocations du Coran (`baqara-127`, `imran-8`) et deux invocations de la Citadelle (éléments 196 et 195). Le test échoue si l'un de ces identifiants disparaît.

## 5. Limites connues et décisions à prendre

1. **Traductions non relues.** 132 titres et 267 textes en français et en anglais, écrits par MushafPlus. Les versets coraniques cités à l'intérieur d'une invocation (par exemple 43:13-14) sont traduits dans la phrase ; les invocations entièrement coraniques ne portent qu'une consigne et renvoient au verset, qui s'affiche avec la traduction du Coran choisie dans l'application. À faire relire par une personne qualifiée avant tout usage pédagogique. [NON VÉRIFIÉ par un spécialiste]
2. **Autorisation de hisnmuslim.com** à confirmer pour le texte arabe et la sélection. [NON VÉRIFIÉ]
3. **Pas de translittération** pour les invocations de la Citadelle (elle existe pour les 58 invocations du Coran). Les 27 anciennes entrées de la Citadelle écrites à la main, qui en avaient, ont été retirées de `src/data/duas.js` car la bibliothèque les couvre. [décision]
4. **Recherche globale** (la loupe de l'application) : elle ne parcourt que les invocations du Coran ; la recherche de la page Invocations parcourt tout. [décision]
5. **Non faits** : favoris, rappels programmés, « Dua Community », message du jour. Les deux derniers demandent un serveur et une modération ; les deux premiers touchent au stockage local et à la page de confidentialité. [décision]
6. **Hors ligne** : seul ce qui a déjà été ouvert est disponible (§2). Rien dans l'interface ne promet un téléchargement préalable de la bibliothèque.

## 6. Régénérer

```bash
node scripts/build-hisn-data.mjs            # télécharge (cache dans le dossier temporaire) et réécrit hisn.json
node scripts/build-hisn-data.mjs --refresh  # ignore le cache
node --test tests/hisn-data.test.mjs        # complétude, références, traductions, recherche
```

Les traductions ne sont pas régénérées : `fr.json` et `en.json` se modifient à la main, et le test échoue si un chapitre ou une invocation n'a plus de texte.
