# Tafsir du Coran en français — sources, authenticité, licences

Recherche du 2026-10-06 pour MushafPlus (PWA sans backend, offline, FR/EN/AR, numérotation Hafs).
Objectif : savoir quelles sources françaises de tafsir sont **attribuables, complètes, utilisables par API ou en fichier, et légalement embarquables**.

Légende des statuts : **VÉRIFIÉ** (lu à la source ou testé en direct), **RAPPORTÉ** (issu d'un résultat de recherche ou d'un catalogue libraire, non recoupé), **NON VÉRIFIÉ**.

---

## 1. Résumé

1. **Il n'existe qu'un seul tafsir français disponible sous forme de données ouvertes** : *Al-Mukhtasar fi Tafsir al-Qur'an al-Karim* (traduction française), déjà embarqué dans l'app. Quran.com n'en a aucun (19 ressources, 6 langues, 0 français). AlQuran.cloud n'a que 6 tafsirs, tous en arabe. Les autres tafsirs français (Ibn Kathir, As-Sa'di, Jalalayn…) existent en livres sous droits ; je n'ai trouvé aucune source numérique officielle et réutilisable. [VÉRIFIÉ]
2. **La copie embarquée contient une erreur de contenu.** En 10:3, elle dit « en **neuf** jours » ; la source QuranEnc dit « en **six** jours » (le Coran dit six jours). Sur les 6 236 versets, 6 234 sont identiques à QuranEnc après normalisation ; les 2 écarts sont ce 10:3 et un séparateur de liste volontairement retiré en 1:1. [VÉRIFIÉ — comparaison des 114 sourates, voir §3.1]
3. **L'attribution affichée dans l'app est fausse.** L'app écrit « édition du Ministère égyptien des Awqaf ». *Al-Mukhtasar* est publié par le **Markaz Tafsir li-d-Dirasat al-Qur'aniyya** (Tafsir Center for Quranic Studies, Arabie saoudite). Le texte égyptien est un autre ouvrage : *Al-Muntakhab fi Tafsir al-Qur'an al-Karim*. [VÉRIFIÉ — QuranEnc affiche « Publisher: Tafsir Center for Quranic Studies » pour ce jeu ; site officiel mokhtasr.com]
4. **Le statut légal n'est pas le même selon la porte d'entrée.** QuranEnc autorise la republication avec attribution et sans modification ; le site officiel mokhtasr.com dit « All rights reserved » et limite l'usage à « personal, non-commercial » ; la chaîne QUL → spa5k, d'où vient la copie actuelle, n'a pas de licence documentée. [VÉRIFIÉ — détail §3.3]

**Recommandation** : (a) corriger 10:3 et l'attribution maintenant ; (b) re-baser l'import sur QuranEnc (`french_mokhtasar`), la seule source ouverte qui porte des conditions de réutilisation écrites ; (c) demander une autorisation écrite au Markaz Tafsir ; (d) n'ajouter aucun autre tafsir français sans licence écrite. Détail §6.

---

## 2. Ce que l'app fait aujourd'hui

| Élément | Fait | Fichier |
|---|---|---|
| Édition française | `fr-mokhtasar`, 114 sourates, 6 236 versets, ≈ 2,25 Mo, JSON statique | `public/data/tafsir-fr-mokhtasar/` |
| Provenance déclarée | `spa5k/tafsir_api`, slug `french-mokhtasar` (id 259), commit épinglé `3bdd776…` | `scripts/build-french-tafsir.mjs` |
| Intégrité | SHA-256 par sourate dans `index.json`, vérifié avant affichage et avant mise en cache | `src/services/frenchTafsirService.js` |
| Autres tafsirs | Quran.com v4 : Muyassar, Wasit, Ibn Kathir (ar/en), Ma'arif, Tazkir, Tabari, Qurtubi, Baghawi, As-Sa'di. Aucun n'est français | `src/services/quranComStudyService.js` |
| Repli français | `fr-mokhtasar` → `en-kathir` → `en-maarif` → `ar-muyassar`, avec message explicite | `quranComStudyService.js` (`FALLBACK_TAFSIRS_BY_LANG`) |

Le commentaire du build script reconnaît déjà que la licence du texte français « n'est pas indiquée en amont » et justifie le choix par « attribution + signalement d'erreur ». Cette recherche précise ce que l'on peut maintenant affirmer.

---

## 3. Constats vérifiés

### 3.1 Erreur « neuf jours » (10:3)

Comparaison faite le 2026-10-06 : les 114 sourates de `https://quranenc.com/api/v1/translation/sura/french_mokhtasar/{n}` contre `public/data/tafsir-fr-mokhtasar/*.json`, après retrait des accents graves et normalisation des espaces.

| Mesure | Résultat |
|---|---|
| Versets côté API / côté app | 6 236 / 6 236 |
| Identiques | 6 234 |
| Différents | 2 |
| Textes vides côté API | 0 |
| Notes de bas de page côté API | 0 (champ `footnotes` toujours `null`) |

Les deux écarts :
- **1:1** — l'API a `à savoir: - Allâhu…`, l'app a `à savoir: Allâhu…`. Écart voulu : le build retire le séparateur ` - ` (voir en-tête du script).
- **10:3** — API : « …la Terre malgré son étendue en **six jours** » ; app : « …en **neuf jours** ». L'app est fausse. Le fichier `010.json` n'a qu'un commit (`6661da2`), donc l'erreur vient de l'import, pas d'une édition locale.

Hypothèse non vérifiée : le changelog de la page QUL 259 mentionne une correction critique le 2026-09-30 (« 500 ayahs » mises à jour, dont 79:21). Les amonts corrigent donc leurs données ; le commit épinglé `3bdd776` est antérieur à ces corrections. **Je n'ai pas comparé 79:21** (l'app et l'API sont identiques sur ce verset d'après la comparaison ci-dessus, ce qui suggère que le commit épinglé ne portait pas cette erreur ou que QuranEnc ne l'a pas).

Limite : « conforme à QuranEnc » ne veut pas dire « sans erreur ». Je n'ai relu aucun des 6 236 commentaires. Voir §5 pour la relecture humaine.

### 3.2 Attribution

- QuranEnc, fiche du jeu : « French Translation of Al-Mukhtasar in Interpreting the Noble Quran », V1.0.0, 03/10/2019, éditeur **Tafsir Center for Quranic Studies**.
- Site officiel mokhtasr.com : le projet est décrit comme en cours de traduction vers plus de 50 langues ; la traduction française (« Traduction en français du résumé de l'exégèse du Noble Coran », **V6**) émane « du centre de l'exégèse pour les études coraniques ».
- *Al-Muntakhab fi Tafsir al-Qur'an al-Karim* est l'ouvrage du Conseil suprême des affaires islamiques d'Égypte (traduit en anglais, français, etc.). [RAPPORTÉ — résultats de recherche, WorldCat, Stanford SearchWorks, GloQur]

**Chaînes à corriger** (visibles par l'utilisateur dans le panneau de tafsir) :
- `src/i18n/fr.js:102` et `src/i18n/en.js:103` (`frenchAttribution`)
- `scripts/build-french-tafsir.mjs:5` (commentaire) et `:51` (`ATTRIBUTION`, recopié dans `index.json`)
- `public/data/tafsir-fr-mokhtasar/index.json:8`
- `tests/e2e/french-tafsir.spec.mjs:67` : le test attend `/Awqaf/i` à l'écran, il faudra le changer en même temps.

Ces chaînes changent ce que l'utilisateur lit : à traiter avec `.agents/skills/product-design/SKILL.md` et vérification dans l'interface rendue (FR, EN, AR).

### 3.3 Licences et conditions, source par source

| Source | Ce qu'elle dit | Conséquence pour l'app |
|---|---|---|
| **QuranEnc** (page d'accueil et documentation d'API) | « Contents of the translations can be downloaded and re-published » sous conditions : attribution à QuranEnc.com, **aucune modification**, indiquer la version, pas de publicité inappropriée à côté des textes | Seule base écrite de réutilisation. Le build actuel **modifie** le texte (retrait des accents graves et des ` - `) : à régler (§6, point 2) |
| **mokhtasr.com** (conditions d'utilisation) | « No material from this site and software may be taken for the purpose of reproduction, publication, or broadcast, in any way, except for personal, non-commercial use » ; « Copyright © 2023 Mokhtasar. All rights reserved » ; rien sur les apps ni sur l'API | Pas d'autorisation de redistribution. Contact pour droits d'auteur et erreurs : adresse affichée sur le site |
| **QUL / Tarteel** (ressource 259) | FAQ : « you can use QUL data in commercial projects. However, please review the licensing terms for each resource » ; pas de licence par ressource ; l'issue GitHub #772 (2026-09-27) pose exactement la question de l'embarquement hors ligne d'un tafsir Mukhtasar et **n'a reçu aucune réponse** | Ne protège pas l'app. Le dépôt est sous MIT, mais cela couvre le code, pas le contenu |
| **spa5k/tafsir_api** | Miroir MIT du code ; contenu hérité de QUL | Idem |

Provenance : le texte de l'app est identique à QuranEnc, y compris les accents graves de translittération. La chaîne QuranEnc → QUL → spa5k n'est pas documentée ; je ne peux pas affirmer qui a copié qui.

Conclusion honnête : **embarquer ce tafsir est défendable via QuranEnc (attribution + version + texte inchangé), mais pas couvert par une autorisation du détenteur des droits.** Les conditions de QuranEnc et celles de mokhtasr.com ne disent pas la même chose. Le seul moyen de lever l'ambiguïté est une autorisation écrite du Markaz Tafsir.

---

## 4. Catalogue des sources françaises

### 4.1 Utilisables par API ou fichier

| Source | Nature | Accès | Contenu français | Licence | Verdict |
|---|---|---|---|---|---|
| **QuranEnc** `french_mokhtasar` | Tafsir (Markaz Tafsir), version 1.0.0 | `GET https://quranenc.com/api/v1/translation/sura/french_mokhtasar/{1-114}` et `/translation/aya/{key}/{sura}/{aya}`. Sans clé. Champs : `id, sura, aya, arabic_text, translation, footnotes`. Testé : 200, 6 236 versets. Limites de débit non documentées | Complet | Attribution, version, sans modification | **Source d'import recommandée.** Note : cette clé n'apparaît **pas** dans `/translations/list` (76 jeux listés, français : `french_rashid`, `french_montada` seulement) bien que l'endpoint réponde. Elle peut être retirée du catalogue public sans préavis : épingler le résultat dans le dépôt, ne jamais l'appeler à l'exécution |
| **mokhtasr.com API officielle** | Tafsir, **V6** (livre n° 310 d'après l'URL du site) | `https://admin.mokhtasr.com/api/v1/…` ; jeton obtenu par `POST /app/register` (nom, email, mot de passe, URL). `GET /book-contents?books=310&sura=&aya=&lang=` ; `GET /mobile-updated-data?date=` pour les mises à jour. Testé sans jeton : **401** | Complet | Tous droits réservés (voir §3.3) | **Source de référence pour la version et les corrections.** Je n'ai pas créé de compte ; l'inscription est à faire par vous, avec une adresse et un nom d'application |
| **QUL 259** / **spa5k** | Miroir de la même œuvre | JSON, SQLite | Complet | Non documentée | Garder comme comparaison, pas comme source |

Écart de version à éclaircir : QuranEnc publie V1.0.0 (2019), le site officiel affiche V6 pour le français. Je n'ai pas pu comparer les deux : l'API officielle exige un compte. Il est probable que QuranEnc soit en retard sur l'officiel.

### 4.2 Pas de tafsir français

| Source | Constat |
|---|---|
| **Quran.com API v4** (`/resources/tafsirs`) | 19 ressources : arabe 7, bengali 4, anglais 3, ourdou 3, russe 1, kurde 1. **Aucun français.** Le commentaire de `quranComStudyService.js` est exact |
| **AlQuran.cloud** (`/edition?type=tafsir`) | 6 tafsirs, tous arabes : `ar.muyassar`, `ar.jalalayn`, `ar.qurtubi`, `ar.miqbas`, `ar.waseet`, `ar.baghawi` |
| **QuranEnc, autres jeux français** | `french_rashid` (Rachid Maach, 1.0.3), `french_montada` (Centre international Nûr, trad. Nabîl Ridwân, 1.0.0), Hamidullah (supervision Rowwad). Ce sont des **traductions du sens**, pas des tafsirs : ne pas les présenter sous l'intitulé « tafsir » |
| **spa5k/tafsir_api** | 145 éditions, 33 langues, **1 française** (le Mukhtasar) |

### 4.3 Tafsirs classiques en français : livres, pas de données ouvertes

Tout ce tableau est **RAPPORTÉ** (catalogues de libraires et résultats de recherche). Je n'ai pas ouvert les pages éditeurs ni vérifié les contrats.

| Ouvrage | Éditions françaises signalées | Remarque |
|---|---|---|
| **Ibn Kathîr** | *L'exégèse du Coran*, 4 vol. (DKI) ; *Sahih Tafsir Ibn Kathir*, 5 vol. (éd. Tawbah) ; édition Universel, 4 vol. ; *Exégèse abrégée*, 10 vol. (Daroussalam, d'après *al-Misbâh al-Munîr*) | Plusieurs textes différents portent le même nom (intégral, résumé, « authentique »). Il faut choisir une édition précise avant toute demande de licence |
| **As-Sa'dî** | *Taysîr al-Karîm ar-Rahmân*, 2 vol. (Sana / Dar Ibn Hazm, 2015), trad. Messaoud Boudjenoun | Œuvre brève et claire : bon candidat si une autorisation est obtenue |
| **Al-Jalalayn** | « Exégèse simplifiée du Coran » (Dar al-Fiqr al-Islami al-Hadith) ; éd. Orientica (Cheikh Cherif Zahar) | Édition Orientica enrichie de commentaires d'autres savants : ce n'est plus le texte des deux auteurs |
| **Al-Muntakhab** (Égypte) | Version française existante, d'après notices bibliographiques | Pas de jeu de données numérique repéré |
| **Muyassar** (Complexe du roi Fahd) | NON VÉRIFIÉ : je n'ai pas trouvé de tafsir Muyassar français diffusé séparément | À ne pas annoncer |

Des PDF de ces ouvrages circulent sur Internet Archive et des blogs. **Je n'ai pas vérifié qu'ils soient autorisés par les éditeurs.** Un scan d'ouvrage commercial n'est pas une source licite pour une app ; ne pas les utiliser comme jeu de données.

Domaine public : aucun tafsir français trouvé. Les anciennes traductions (Du Ryer, Savary, Kasimirski) sont des traductions, avec des notes, pas des tafsirs.

---

## 5. Critères d'« authentique » pour une source de tafsir

La machine ne peut pas certifier le fond doctrinal. Ce que l'on peut contrôler, et ce qui exige un humain :

| Contrôle | Qui | Statut pour le Mukhtasar |
|---|---|---|
| Auteur ou institution identifié et vérifiable | Dev | OK après correction de l'attribution : Markaz Tafsir |
| Édition et version nommées | Dev | QuranEnc V1.0.0 vs officiel V6 : **à éclaircir** |
| Couverture 1…N par sourate, numérotation Hafs | Test auto | OK : 6 236 versets, contrôlé par `isValidSurahDoc` |
| Texte inchangé par rapport à la source | Test auto | **Échoue** sur 10:3 ; à ajouter en test |
| Empreinte épinglée | Build | OK (SHA-256 par sourate) |
| Droit de redistribution écrit | Éditeur | **Manquant** pour l'officiel ; partiel via QuranEnc |
| Relecture du contenu (chiffres, noms propres, citations de hadiths, passages de croyance) | Relecteur humain qualifié | **Non faite.** Aucune relecture des 6 236 entrées n'a été menée par moi ni, à ma connaissance, par vous |
| Traducteur français identifié | Éditeur | Non trouvé (ni sur QuranEnc ni sur mokhtasr.com dans ce que j'ai lu) |

Détail utile : l'erreur 10:3 est un chiffre. Les erreurs de ce type (nombre de jours, nombre d'anges, noms de prophètes) se détectent par contrôle croisé avec l'arabe et le Coran lui-même ; une relecture ciblée des versets contenant des nombres est un bon premier passage.

---

## 6. Recommandations

À faire dans cet ordre. Rien n'a été modifié dans le code ou les données pour cette recherche.

1. **Corriger 10:3 maintenant** : régénérer les données depuis QuranEnc (identiques sinon), ou corriger ce seul verset et recalculer le SHA-256 de `010.json` dans `index.json`. Une erreur de chiffre sur la création en six jours est le genre de défaut qui détruit la confiance.
2. **Choisir la règle sur la modification du texte.** QuranEnc interdit la modification ; le build retire les accents graves et les ` - `. Deux options : (a) garder le texte brut et nettoyer au rendu (le contenu embarqué reste fidèle à la source) ; (b) demander l'accord de l'éditeur. L'option (a) respecte les conditions écrites.
3. **Corriger l'attribution** (liste en §3.2) : « Markaz Tafsir li-d-Dirasat al-Qur'aniyya (Tafsir Center for Quranic Studies) », version, lien vers la source, et conserver le lien de signalement d'erreur.
4. **Écrire au Markaz Tafsir** (contact sur mokhtasr.com) pour : autorisation d'embarquer le texte français hors ligne dans une app gratuite, conditions d'attribution, version à utiliser (V6 ?), canal de signalement des erreurs. Garder la réponse dans `docs/`.
5. **Ajouter un test de non-régression** : pour chaque verset, le texte embarqué doit égaler la source épinglée ; plus quelques points de contrôle nommés : les versets sur la création en six jours (7:54, 10:3, 11:7, 25:59, 32:4, 50:38, 57:4), à retenir seulement si leur commentaire cite la durée (non vérifié verset par verset).
6. **Ne pas ajouter d'autres tafsirs français** (Ibn Kathir, As-Sa'dî, Jalalayn) sans licence écrite de l'éditeur. Si l'on veut un deuxième avis en français, As-Sa'dî (Sana / Dar Ibn Hazm) est le candidat le plus réaliste à solliciter : œuvre concise, un seul traducteur identifié.
7. **Relecture humaine ciblée** du Mukhtasar français par une personne compétente, en commençant par les versets contenant des nombres, des noms de prophètes et les passages de croyance.

---

## 7. Limites de cette recherche

- Les pages web ont été lues à travers un outil qui les résume : les formulations « citées » des conditions d'utilisation viennent de ce résumé, pas d'une copie littérale de la page. Relire les conditions de `quranenc.com` et de `mokhtasr.com` avant de s'y fier juridiquement. Une URL de conditions QuranEnc que j'ai devinée a renvoyé 404 ; les conditions viennent de la page d'accueil et de la page d'API.
- L'API officielle mokhtasr.com : testée sans jeton (401). Je n'ai pas créé de compte. Le contenu V6 n'a donc pas été comparé à la copie de l'app.
- Les éditions papier (§4.3) ne reposent que sur des catalogues de libraires et des résultats de recherche.
- Je n'ai fait aucune relecture doctrinale.
- Cette recherche ne constitue pas un avis juridique.

---

## 8. Sources consultées

- Quran.com API v4, liste des tafsirs : https://api.quran.com/api/v4/resources/tafsirs
- Index spa5k/tafsir_api : https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/editions.json
- AlQuran.cloud, éditions de tafsir : https://api.alquran.cloud/v1/edition?type=tafsir
- QuranEnc, page du jeu : https://quranenc.com/en/browse/french_mokhtasar
- QuranEnc, API : https://quranenc.com/en/home/api/ ; exemple testé : https://quranenc.com/api/v1/translation/sura/french_mokhtasar/10
- QuranEnc, catalogue : https://quranenc.com/api/v1/translations/list
- Mokhtasar (site officiel) : https://mokhtasr.com/en ; livres : https://mokhtasr.com/en/books ; conditions : https://mokhtasr.com/en/pages/terms-and-conditions ; API : https://mokhtasr.com/en/api-doc
- QUL ressource 259 : https://qul.tarteel.ai/resources/tafsir/259 ; FAQ : https://qul.tarteel.ai/faq ; issue de licence : https://github.com/TarteelAI/quranic-universal-library/issues/772
- Al-Muntakhab (notices) : https://search.worldcat.org/title/al-Muntakhab-fi-tafsir-al-Quran-al-Karim/oclc/48663088
