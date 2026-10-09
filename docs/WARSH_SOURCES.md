# Warsh — texte, traductions et polices : sources, authenticité, licences

Recherche du 2026-10-07 pour MushafPlus (riwaya Warsh ʿan Nāfiʿ, numérotation Madinah : **6 214 versets** contre 6 236 en Hafs).
Complète `docs/TAFSIR_FR_SOURCES.md` (même méthode). Aucune ligne de code ni donnée du projet n'a été modifiée.

Statuts : **VÉRIFIÉ** (testé ou lu à la source, résultat reproductible), **RAPPORTÉ** (résultat de recherche ou catalogue, non recoupé), **NON VÉRIFIÉ**.

---

## 1. Résumé

1. **Quran.com n'a pas de texte Warsh, et son API ne le dit pas.** `GET /api/v4/quran/verses/warsh` répond 200 et renvoie le texte **Hafs** (identique à `uthmani`, vérifié sur 2:2). Aucun appel à ce type ne doit servir de source Warsh. AlQuran.cloud : 14 éditions de texte, aucune Warsh. [VÉRIFIÉ]
2. **Le texte Warsh du projet est solide.** Trois sources se recoupent sur les 6 214 versets : le jeu KFGQPC v2.1 (`aziz011133/quran_warsh`, octets identiques au SHA-256 épinglé), `Yousr-Allah-Allouani/warsh-quran-audio`, et le mushaf n° 4 de l'API Quranpedia (« Complexe du roi Fahd, copie conforme à l'imprimé »). Elles diffèrent seulement par des signes de mise en forme et par l'ordre Unicode de deux versets (§3.2). [VÉRIFIÉ] Cela prouve la cohérence, pas la conformité au mushaf imprimé : les trois peuvent partager la même origine KFGQPC.
3. **La meilleure source d'API pour Warsh est Quranpedia API v1** : sans clé, CORS ouvert, mushaf Warsh complet, table Warsh→Hafs pour chaque verset, dumps versionnés avec SHA-256 et conditions de réutilisation écrites. [VÉRIFIÉ]
4. **Table de correspondance Warsh→Hafs : 6 211 lignes sur 6 214 identiques à Quranpedia.** Les 3 écarts sont des versets Warsh qui contiennent des mots d'un verset Hafs voisin (1:1, 11:82, 56:52). Pour 11:82 et 56:52, la table du projet omet ce verset Hafs (§3.3). Impact limité (un mot), mais réel. [VÉRIFIÉ, avis d'un spécialiste Warsh à prendre]
5. **Aucune traduction « authentique pour Warsh » n'existe en données ouvertes.** Les traductions du sens sont indépendantes de la riwaya et numérotées en Hafs ; le projet les remappe sur 6 214. Une édition imprimée française en Warsh existe (Rachid Maach, Al Bayyinah) [RAPPORTÉ] ; sa traduction est disponible sur QuranEnc (§4).
6. **Police Warsh : une seule source officielle, KFGQPC « Uthmanic Warsh » v2.1, sous licence propriétaire** (usage, copie, distribution autorisés ; modification et reproduction interdites). Le fichier du projet porte la licence complète dans ses métadonnées. Alternative libre (OFL) : Scheherazade New couvre les 63 lettres et signes du texte ; Amiri Quran n'en couvre pas 2 (§5). [VÉRIFIÉ]

---

## 2. Ce que le projet utilise

| Élément | Source | Fichier |
|---|---|---|
| Texte Warsh par sourate | `Yousr-Allah-Allouani/warsh-quran-audio`, commit `72644e3…` | `src/constants/warshSource.js` |
| Texte par page / juz et correspondance Hafs | `aziz011133/quran_warsh`, `warshData_v2-1.json`, commit `31d4c18…`, SHA-256 `c6017e68…` | `public/data/warsh-page-source.json` |
| Traduction française Warsh | Montada 2017 (Dr Nabil Redouane), Quranpedia livre 1949, remappée sur 6 214 versets | `public/data/warsh-translation-fr/` |
| Traduction anglaise Warsh | Pickthall 1930 (domaine public), Quranpedia livre 13604 | `public/data/warsh-translation-en/` |
| Police Warsh par défaut | `kfgqpc-warsh-21.woff2` (« KFGQPC Warsh Uthmanic Script », v2.1) | `public/fonts/` |
| Police Warsh alternative | Scheherazade New 4.400 (SIL OFL 1.1) | `public/fonts/`, `src/data/fonts.js` |

---

## 3. Texte Warsh par API ou fichier

### 3.1 Sources examinées

| Source | Warsh ? | Accès | Licence / conditions | Verdict |
|---|---|---|---|---|
| **Quran.com API v4** | **Non** : le type `warsh` renvoie du Hafs | — | — | Ne pas utiliser pour Warsh |
| **AlQuran.cloud** | **Non** : 14 éditions, aucune Warsh | — | — | Idem |
| **Tanzil** | Rien sur Warsh dans les pages lues | Fichiers | Attribution à Tanzil, pas de modification | Non retenu |
| **Quranpedia API v1** | **Oui** : `GET /v1/mushafs/4` (« مصحف ورش — مجمع الملك فهد »), 6 214 versets, police `UthmanicWarsh_V21.ttf` | `https://api.quranpedia.net/v1`, sans clé, `access-control-allow-origin: *`, 120 req/min et 10 000/jour par IP, réponse ≈ 5,5 Mo | Attribution (lien + numéro de version) **seulement** pour republier la donnée comme base téléchargeable ; aucune pour l'usage dans une app ; « ne pas aspirer en masse », utiliser les dumps | **Source recommandée** |
| **Quranpedia dumps** | 13 mushafs dont Warsh (4,7 Mo pour l'ensemble), 138 traductions | Version `2026-10-03`, JSON gzip + SHA-256 | Texte de licence inclus dans chaque fichier (`LICENSE.md`) | Idéal pour une copie épinglée |
| **QUL (Tarteel)** | Oui : « Quran Script (Warsh) » ayah par ayah et mot à mot, étiquette `qpc-warsh` | JSON, SQLite | Aucune licence par ressource affichée | À éviter comme source de référence (même lacune que pour le tafsir) |
| **GitHub `radouane-saddiki/Quran`** | Oui, KFGQPC Warsh v2.1, 6 214 versets | JSON, CSV, TXT | MIT sur le dépôt ; données KFGQPC sous leurs propres conditions | Miroir pratique, pas une source |
| **GitHub `quran-center/quran-meta`** | Oui, `warshData_v2-1.json` (KFGQPC v2.1) | npm | Bibliothèque MIT ; données KFGQPC « à consulter séparément » | Idem |
| **KFGQPC (officiel)** | Oui : texte, polices, mushaf PDF (`qurancomplex.gov.sa/en/warsh/`, `fonts.qurancomplex.gov.sa`) | Téléchargements | **Non lues** : le site est injoignable depuis mes outils (connexion refusée ; navigateur intégré refusé) | À consulter par vous, voir §6 |

### 3.2 Recoupement du texte (6 214 versets)

Comparaison faite le 2026-10-07, verset par verset, entre le texte du projet (`warshData_v2-1.json`) et deux autres sources. On ignore uniquement : les glyphes de fin de verset (U+FC00–FDFF, U+06DD, chiffres arabes-indiens), le signe de hizb U+06DE, le tatwil U+0640 et les espaces. Toutes les lettres et tous les signes Warsh sont comparés.

| Comparaison | Identiques | Différents |
|---|---|---|
| `warshData_v2-1.json` (KFGQPC v2.1) ↔ `warsh_text` (Yousr-Allah-Allouani) | **6 214** | 0 |
| `warshData_v2-1.json` ↔ Quranpedia mushaf 4, après NFD | **6 214** | 0 |
| idem **sans** normalisation NFD | 6 212 | 2 : 67:9 (« آ » contre « ا + ٓ ») et 67:10 (shadda/fatha dans l'ordre inverse), équivalents canoniques Unicode |

Deux particularités sans effet sur les lettres :
- Quranpedia insère un **tatwil** avant la hamza dans **601 versets** : c'est un réglage d'affichage de leur site, à ne pas copier dans l'app.
- Le fichier `warshData_v2-1.json` contient les glyphes de fin de verset KFGQPC (par ex. « ﰀ »), ce qui confirme son origine KFGQPC.

### 3.3 Correspondance Warsh → Hafs

La table du projet (`src/data/warshHafsNumbering.js`) aligne traductions, audio, tafsir et mot à mot. Comparée au champ `number_in_hafs` de Quranpedia (6 214 lignes) :

| Verset Warsh | Projet | Quranpedia | Ce que dit le texte |
|---|---|---|---|
| **1:1** | Hafs 2 | Hafs 1 et 2 | Warsh 1:1 = « الحمد لله رب العالمين ». La basmala n'est pas un verset numéroté en Warsh ; le choix du projet est cohérent avec sa propre note |
| **11:82** | Hafs 83 | Hafs 82 et 83 | Warsh 11:82 commence par « مَّنضُودٖ », mot qui **termine** Hafs 11:82, puis reprend tout Hafs 11:83 |
| **56:52** | Hafs 49 | Hafs 49 et 50 | Warsh 56:52 finit par « لَمَجْمُوعُونَ », mot qui **ouvre** Hafs 56:50 |

Pour 11:82 et 56:52, un verset Warsh recouvre deux versets Hafs et la table n'en retient qu'un. Conséquence : une traduction ou un tafsir attaché au verset Hafs omis ne s'affiche pas avec le verset Warsh correspondant. Les 6 211 autres lignes concordent.

---

## 4. Traductions pour Warsh

**Constat.** Une traduction du sens ne dépend pas de la riwaya ; ce qui change en Warsh, c'est le découpage des versets (6 214) et quelques mots de lecture. Toutes les traductions ouvertes trouvées sont numérotées **Hafs** : QuranEnc renvoie 286 lignes pour Al-Baqara (Warsh : 285), Quranpedia 6 236 lignes. Je n'ai trouvé aucune traduction ouverte découpée sur la numérotation Warsh.

| Traduction | Où | Numérotation | Conditions | Remarque |
|---|---|---|---|---|
| **Montada / Noor International (Dr Nabil Redouane, 2017)** | Quranpedia 1949 ; **QuranEnc `french_montada`** v1.0.0 | Hafs | Quranpedia : voir §3.1. QuranEnc : attribution, version, sans modification | Les deux copies sont **le même texte** : 6 233 versets identiques sur 6 236, après retrait des balises HTML ; les 3 écarts (2:68, 56:19, 8:1) sont deux espaces et un saut de ligne que ma normalisation a mal traité |
| **Rachid Maach** | **QuranEnc `french_rashid`** v1.0.3 (2026-06-21), 118 versets de la sourate 2 avec notes ; Quran.com id 779 | Hafs | QuranEnc : idem | Édition imprimée **en Warsh** chez Al Bayyinah [RAPPORTÉ : la page éditeur renvoie 403, je n'ai pas lu la fiche] |
| **Hamidullah** | Quran.com id 31 ; AlQuran.cloud `fr.hamidullah` ; QuranEnc (supervision Rowwad) | Hafs | variables | Le Complexe du roi Fahd publie une édition révisée [RAPPORTÉ] |
| **Pickthall (EN, 1930)** | Quranpedia 13604 | Hafs | Domaine public | Utilisé par le projet |
| Quran.com : 3 traductions françaises | Montada (136), Hamidullah (31), Rashid Maash (779) | Hafs | Conditions de l'API Quran Foundation | — |

**Attribution à régler (à ma lecture des conditions).** Quranpedia exige un crédit « lien + numéro de version » quand la donnée est republiée comme **base téléchargeable**. Les fichiers JSON du projet (`warsh-translation-fr/` et `-en/`) sont téléchargeables par tout visiteur, et leur attribution cite le livre mais **pas la version du dump** (ex. `2026-10-03`). La même traduction française existe sur QuranEnc avec des conditions écrites similaires (attribution, version, sans modification).

---

## 5. Polices Warsh

### 5.1 KFGQPC « Uthmanic Warsh » v2.1 (police par défaut)

Métadonnées lues dans `public/fonts/kfgqpc-warsh-21.woff2` (table `name`) :
- famille « KFGQPC Warsh Uthmanic Script », version 2.1, éditeur et concepteur : King Fahd Glorious Quran Printing Complex ;
- copyright : « This Font is the property of King Fahd Glorious Quran Printing Complex, and may not be reproduced, modified without the express written approval of King Fahd Glorious Quran Printing Complex » ;
- licence (EULA) : autorisation gratuite de **Use, Copy, Distribute**, sous condition que le logiciel de police **ne soit pas « Sold, Modified, Altered, Translated, Reverse Engineered, Decompiled, Disassembled, Reproduced »**, fourni « AS IS ».

Points d'attention :
- Le fichier embarqué est une **conversion WOFF2** : les tables (`GSUB`, `GPOS`, `glyf`, `name`…) y sont, et la licence est conservée. Savoir si la conversion de conteneur compte comme « modification » ou « reproduction » est une question juridique que je ne tranche pas. D'autres sites diffusent aussi des conversions, mais cela ne vaut pas autorisation.
- Aucun fichier de licence séparé n'est livré avec les polices dans `public/fonts/` ; la mention du registre légal parle de « droits à vérifier avant redistribution ».
- La licence du **texte** KFGQPC lui-même n'a pas pu être lue (site officiel injoignable).

### 5.2 Couverture des 63 lettres et signes du texte Warsh du projet

Les glyphes de numéro de verset (U+FC00–FD1C) et U+200F sont traités à part : Scheherazade et Amiri n'ont pas ces glyphes, et le projet fait déjà afficher le médaillon par la police KFGQPC (`riwaya-fonts.css`).

| Police | Licence | Code points manquants |
|---|---|---|
| KFGQPC Warsh 2.1 | Propriétaire, voir 5.1 | **0** |
| Scheherazade New 4.400 | SIL OFL 1.1 | **0** |
| Noto Naskh Arabic (3 fichiers) | SIL OFL | **0** |
| Amiri Quran | SIL OFL | **2** : U+065E (1 815 occurrences) et U+06D2 (2 996 occurrences) |

Amiri Quran n'est **pas** proposé pour Warsh dans le projet (`WARSH_FONT_IDS` : `qpc-warsh` et `scheherazade-new-warsh`) : c'est le bon choix. Attention : la couverture des code points ne prouve pas que le rendu soit correct (placement des signes, ligatures) ; je n'ai pas fait de contrôle visuel.

### 5.3 Autres polices

| Police | Statut |
|---|---|
| **AALMAGHRIBI QURAN WARSH** (elharrak, 2018) | La page FontSpace dit « Public Domain », 527 glyphes. Un agrégateur de polices n'est pas une source de licence ; couverture du texte du projet **NON VÉRIFIÉE** |
| **Mushaf v4 Warsh** (polices à un glyphe par mot, miroir `nuqayah/qpc-fonts`) | Même licence KFGQPC ; non utilisées par le projet [RAPPORTÉ] |
| Polices du site `fonts.quran.ws` | Conversions tierces des polices KFGQPC ; pas une autorisation (un résumé automatique de cette page contenait une erreur grossière, je ne m'y fie pas) |

---

## 6. Recommandations

1. **Corriger la correspondance pour 11:82 et 56:52** : ajouter le verset Hafs omis (82 pour 11:82, 50 pour 56:52), ou adopter `number_in_hafs` de Quranpedia, et ajouter un test sur ces deux versets. Faire valider par une personne qui connaît Warsh. Garder le choix pour 1:1 tel quel.
2. **Ne jamais utiliser** `quran/verses/warsh` de Quran.com comme source Warsh.
3. **Documenter Quranpedia comme amont du texte Warsh** : mushaf 4, version de dump, SHA-256. Ajouter un script de recoupement (celui de §3.2) pour détecter une dérive des dépôts GitHub épinglés. Ne pas reprendre ses 601 tatwils.
4. **Attribution des traductions** : ajouter lien Quranpedia et numéro de version de dump dans `index.json` et le registre légal. Option : s'aligner sur QuranEnc `french_montada`, même texte, conditions écrites.
5. **Police KFGQPC** : obtenir du KFGQPC une confirmation écrite qu'une version WOFF2 est acceptable, ou servir le TTF d'origine ; joindre la licence aux fichiers. Garder Scheherazade New (OFL) comme repli.
6. **Lire vous-même les conditions officielles** sur `qurancomplex.gov.sa` (texte et polices) : je n'y ai pas eu accès.
7. **Relecture par un spécialiste Warsh** : texte, correspondance de numérotation et rendu des signes (imāla, naql, taqlīl), que ni les tests ni cette comparaison ne couvrent.
8. **Ne pas présenter** de traduction française comme « traduction de Warsh » : ce sont des traductions du sens, remappées.

---

## 7. Limites

- Site officiel du KFGQPC injoignable : ses conditions pour le texte et l'historique des versions de police ne sont pas lues. La licence de police vient des métadonnées du fichier embarqué (première main) et de citations de recherche concordantes.
- Plusieurs pages ont été lues à travers un outil de résumé : relire les conditions de Quranpedia (`LICENSE.md` des dumps) avant de s'y fier juridiquement.
- Les trois sources de texte peuvent partager la même origine : l'accord prouve l'absence de corruption entre copies, pas la fidélité au mushaf imprimé.
- Le rendu visuel des polices Warsh n'a pas été contrôlé. Aucune relecture doctrinale.
- Les éditions imprimées et les polices tierces reposent sur des résultats de recherche et des catalogues.
- Cette note ne constitue pas un avis juridique.

---

## 8. Sources consultées

- Quran.com API v4 : `https://api.quran.com/api/v4/quran/verses/warsh?verse_key=2:2` (retourne du Hafs), `/resources/translations`, `/resources/recitations`
- AlQuran.cloud : `https://api.alquran.cloud/v1/edition?type=quran`
- Quranpedia : API `https://api.quranpedia.net/` (`/v1/mushafs`, `/v1/mushafs/4`), dumps `https://quranpedia.net/dumps?lang=en`, livre `https://quranpedia.net/translation-books/1949.json`
- QuranEnc : `https://quranenc.com/api/v1/translation/sura/french_montada/{n}`, `french_rashid`
- QUL : `https://qul.tarteel.ai/resources/quran-script`
- KFGQPC (non lu) : `https://qurancomplex.gov.sa/en/warsh/`, `https://fonts.qurancomplex.gov.sa/`
- GitHub : `quran-center/quran-meta`, `radouane-saddiki/Quran`, `thetruetruth/quran-data-kfgqpc`, `nuqayah/qpc-fonts`, `aziz011133/quran_warsh`, `Yousr-Allah-Allouani/warsh-quran-audio`
- Tanzil : `https://tanzil.net/docs/Text_License`
- Police AALMAGHRIBI : `https://www.fontspace.com/aalmaghribi-font-f112332`
- Édition Warsh Rachid Maach (non lue, 403) : `https://albayyinah.fr/coran-warch/4249-…`


## 9. Intégration des options demandées (2026-10-09)

- **QPC Warsh de QUL** : la [documentation QUL](https://qul.tarteel.ai/resources/font/qpc-warsh-font) référence `uthmanic-warsh-v21.ttf`, soit la famille KFGQPC v2.1 déjà utilisée. Le choix existant est nommé « QPC Uthmani Warsh (Madinah) »; aucun doublon ajouté.
- **Alkalami 3.000** : WOFF2 original du [paquet officiel SIL](https://software.sil.org/downloads/r/alkalami/Alkalami-3.000.zip), accompagné de sa licence OFL. Option `alkalami-warsh`, réservée à Warsh. Style Kano, pas un fac-similé du mushaf marocain. Le texte reste intact : Scheherazade New fournit les caractères absents, KFGQPC les numéros de verset. Le fichier est inclus dans le cache du shell PWA.
- Couverture mesurée avec fontTools sur les 6 214 entrées de `public/data/warsh-page-source.json` : Alkalami contient U+08BB–U+08BD mais manque de U+065E, U+06D6, U+06DE, U+06DF, U+06E2, U+06E6, U+06E8, U+06E9, U+06EA, U+06EC. Les marqueurs de numéros de verset sont traités séparément. Le repli est donc indispensable; Alkalami ne doit pas être présentée comme une police Warsh complète et autonome.
- **Mushaf v4 Warsh** : le [dépôt de polices](https://github.com/nuqayah/qpc-fonts/tree/master/mushaf-v4-warsh) contient 51 TTF. Premier fichier testé : `QCF4_Warsh_01_W.ttf`, 2 073 entrées cmap, aucune lettre U+0620–U+0650. L’intégration nécessite le texte encodé et la correspondance exacte mot/glyphe/fichier de cette édition, ainsi qu’un rendu dédié. Ne pas appliquer ces fichiers au texte Unicode existant.
- **Wiam** : la [discussion de l’auteur](https://mtafsir.net/threads/خط-وئام-لكتابة-المصحف-برواية-ورش-بالخط-العثماني.57969/) annonce des essais et un partage privé. Aucun fichier redistribuable avec licence confirmé dans cette recherche.
- **Mushaf Mohammed VI** : le [site de la Fondation](https://al-mushaf.com/) propose un lecteur et des applications. Un accès au lecteur ne constitue pas une licence de redistribution de sa police; les requêtes directes du lecteur ont retourné HTTP 403. Aucun fichier accompagné d’une autorisation de redistribution confirmé. Pas d’entrée factice dans le sélecteur.
- Vérification : rendu inspecté en français à 1 280 px et en arabe/RTL à 390 px sur des versets réels; les dix signes absents ont été rendus dans des mots du corpus et contrôlés avec le protocole Chrome (Alkalami/Scheherazade, aucune police système). Cache PWA installé, puis fichier Alkalami récupéré hors ligne : HTTP 200, 56 543 octets, signature WOFF2 valide. Ce contrôle ne remplace pas une relecture spécialisée de l’ensemble du Coran.
