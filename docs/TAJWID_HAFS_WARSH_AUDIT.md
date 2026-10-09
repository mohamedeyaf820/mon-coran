# Audit et refonte Tajwid Hafs / Warsh

## Archive utilisateur du 3 octobre 2026

Le ZIP `quran_warsh_tajweed_complet.zip` est intégré à la demande de
l’utilisateur : 6 207 versets alignés sur le corpus Warsh Madinah (5 773 avant la correction
des versets qui s’ouvrent sur le marqueur de rub), 7 versets
conservant les signes du mushaf. Le texte affiché n’est pas remplacé. Les
règles individuelles partagent la palette Hafs et la légende explique
chaque groupe de couleur et cite la source des couleurs (Quran.com) ; la
provenance du fichier et ses limites sont dans le registre de la page Sources.
Voir [l’audit de l’archive](WARSH_TAJWEED_USER_ARCHIVE_AUDIT.md).

## Première mise à jour du 3 octobre 2026 — signes Warsh (avant intégration du ZIP)

Warsh utilise les mêmes tokens de couleur que Hafs pour les sept règles actuellement prises en charge. La légende FR/EN/AR présente les quatre groupes effectivement disponibles et indique que les règles propres à Warsh attendent une source validée. Quran.com fournit la référence visuelle de la palette ; ses annotations Hafs ne sont pas utilisées pour détecter des règles Warsh.

Le passage en audio perdait la coloration : `SmartAyahRenderer` envoyait systématiquement `null` au rendu Warsh. Le composant transmet désormais le choix Tajwid et les mots du texte préparé pour la police. `WarshWordText` peint les plages issues du même interpréteur de signes Warsh que le reste du lecteur, avec les tokens communs. Les mots, signes de waqf compris, restent des nœuds de texte entiers ; aucune sous-partie arabe n'est séparée pour la coloration. Le suivi du mot récité et son calibrage Warsh sont conservés.

Contrôles de cette mise à jour :

- 513 tests unitaires réussis, dont 21 contrôles ciblés sur le corpus et la provenance Warsh.
- 25 scénarios Tajwid réussis : texte ON/OFF, douze largeurs, six combinaisons Warsh compact/large et clair/sombre/sépia, FR/AR, légende et même source en page/plein écran.
- 49 scénarios audio/accessibilité/lecture/responsive réussis sur le premier build. Sur le build final, le scénario audio Warsh enrichi vérifie les couleurs, le texte exact du verset effectivement joué, un seul médaillon et un seul nœud de texte par mot : réussi. Son premier échec comparait à tort le verset 5 au verset 1 lancé par le lecteur ; la comparaison utilise désormais le numéro réellement joué.
- 6 contrôles ciblés Firefox/WebKit réussis. La coloration fine WebKit reste limitée au repli existant : seuls les mots entièrement couverts par une même règle peuvent être colorés. Ces tests ne prouvent pas une coloration complète sur iPhone.
- Lint, budget des écrans et six gates du build final réussis avec les budgets actuellement présents dans le dépôt. Aucun budget n'a été relevé dans cette mise à jour. JS : 1 416,9 kB ; CSS : 1 020,7 kB.

Inspection réelle : sourate 3 sur 384 px, page 5 sur 1 440 px, page 5 en plein écran sur 384 px. Les captures `warsh-mobile-latest.png`, `warsh-page-wide-latest.png` et `warsh-fullscreen-mobile-latest.png` sont dans `.codex-artifacts/tajwid-audit/`. Le contrôle des couleurs en trois thèmes utilise le corpus Warsh épinglé, pas un texte de test inventé. Un essai intermédiaire a échoué parce qu'un autre groupe de tests avait arrêté le serveur de prévisualisation partagé ; la suite Tajwid a ensuite été exécutée avec un serveur indépendant.

Limites conservées : couverture partielle des règles, validation des familles propres à Warsh et contrôle sur appareils physiques. Les tests de corpus vérifient les offsets et la conservation du texte ; ils ne constituent pas une validation religieuse indépendante des correspondances de signes.

Date : 1 octobre 2026. Intervention locale, sans publication. Les travaux audio/offline antérieurs et les changements de lecture déjà présents ont été conservés.

## Résultat et limites

La coloration provient exclusivement des annotations du fournisseur. Les marqueurs de fin inclus dans certains champs QPC sont retirés par le même préparateur que la lecture normale ; ils ne deviennent plus un mot supplémentaire à côté du médaillon du mushaf. Les catégories de règles restent distinctes des huit groupes de couleurs. Un même adaptateur Hafs fournit désormais le texte canonique, le choix d’annotation et les plages de mots à la lecture normale et au mushaf, dont le plein écran réutilise les composants. La couleur ne peut jamais servir à remplacer un caractère, déplacer une annotation ou inventer une règle.

**Hafs : rendu source vérifié, couverture de coloration partielle.** Une annotation dont le texte diffère du texte préparé pour la police est rejetée pour tout le verset. Les sous-parties compatibles ne sont pas récupérées à partir d’une autre édition. Le lecteur conserve le texte original sans couleur et expose `QURAN_TEXT_INTEGRITY_FAILURE` dans ses diagnostics.

**Warsh : `warsh-dabt`, couverture partielle et bornée par l'édition.** Le corpus Warsh épinglé est le mushaf KFGQPC, qui imprime son propre ḍabṭ : ce sont ces signes, et non un motif de lettres deviné, qui portent la couleur. Sept règles, toutes déjà utilisées par l'annotation officielle Hafs, sont peintes depuis les signes de l'édition : `ham-wasl` (U+06EB/U+06EC/U+06DF sur l'alif de l'article, 9 996), `lam-shamsiyya` (4 432), `silent` (sukun sur un alif, 3 716), `iqlab` (le mīm d'iqlāb et le bā' suivant, 1 137 plages), `qalqala` (sukun imprimé sur ق ط ب ج د, 3 304), `ghunna` (chadda imprimé sur ن / م, 7 331) et `madd-normal` (lettre de ṣila imprimée, 1 922). Mesuré sur les 6 214 versets et 77 860 mots réellement imprimés : 25 562 mots et 5 725 versets portent au moins une couleur. Chaque signe refusé est listé avec sa raison dans `src/data/warshTajwidSigns.js` : U+06EA (2 569, deux rôles : alif de waṣl et alif d'imāla/taqlīl), U+06DF pour ses 276 occurrences de waṣl et de hamza qaṭʿ (les 5 autres sont le ḍabṭ de l'article lui-même, peint), la madda de madd (3 316, durée non datée par la source), l'alif-dague (10 033), U+06E7 (22), U+06E8 (2) et les tanwīn maghrébins (U+0656/0657/065E), qui sont de l'orthographe. Les familles propres à Warsh — imāla, taqlīl, naql, ibdāl, tafkhīm/tarqīq du rāʾ, longueurs de madd — restent `NEEDS_QURANIC_VALIDATION` : aucune source adoptée ne les déclare. Le transport Hafs, les caches expérimentaux et les déclarations `verified` ne franchissent toujours pas cette limite.

**La compilation fonctionne, mais `build:ci` échoue encore au budget de taille des bundles.** Les limites n’ont pas été augmentées. Voir les mesures et les tests ci-dessous.

## Sources officielles et provenance

La référence visuelle Quran.com a été consultée et épinglée au commit `aff1a035b09b66f28047b3216edcae4c5c949a49` :

- [Groupes de la légende](https://github.com/quran/quran.com-frontend-next/blob/aff1a035b09b66f28047b3216edcae4c5c949a49/src/components/QuranReader/TajweedBar/TajweedBar.tsx#L17-L25).
- [Palettes light, dark et sepia](https://github.com/quran/quran.com-frontend-next/blob/aff1a035b09b66f28047b3216edcae4c5c949a49/src/components/QuranReader/TajweedBar/TajweedBar.module.scss#L103-L195).
- [Indices des palettes de police](https://github.com/quran/quran.com-frontend-next/blob/aff1a035b09b66f28047b3216edcae4c5c949a49/src/components/Verse/TajweedFontPalettes.tsx#L19-L31).
- [Documentation Quran Foundation des polices](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/) : QCF V4, Mushaf 19, champ `code_v2`, palettes 0/1/2 ; alternatives Unicode QPC.
- [Documentation du champ `text_uthmani_tajweed`](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/quran-verses-uthmani-tajweed/).

L’audit intégral utilise les réponses publiques officielles [annotations Uthmani](https://api.quran.com/api/v4/quran/verses/uthmani_tajweed) et [texte Uthmani](https://api.quran.com/api/v4/quran/verses/uthmani). Les réponses complètes sont des entrées d’audit locales, pas un remplacement du corpus de l’application.

| Entrée | SHA-256 |
| --- | --- |
| Annotations | `fa4468f76c66e0eae6647f22b8a084f6d8c893148a54eeb51a267bd0c1b685a5` |
| Texte canonique | `79ec6b5626ca5e9e6129f7dc91ef85ba9b316a9f057acbde7a64afe025d6e7a0` |

Le [Quranic Phonemizer de QUD](https://github.com/QUD-Technologies/quranic-phonemizer) demeure une piste algorithmique de recherche. Son existence et un alignement de texte ne constituent pas une validation religieuse de ses règles Warsh.

## Chaîne de données et intégrité

1. `getAyahTextForFont` reste propriétaire du texte de base et des adaptations de signes propres aux polices. La suppression de la basmala séparée et la présentation des marqueurs relèvent de la lecture existante.
2. `getHafsTajwidSource` choisit l’annotation de verset Quran.com ; à défaut, il rassemble les annotations des mots en excluant les éléments de fin de verset. Ce choix est commun à tous les rendus Hafs.
3. `normalizeTajwidAnnotation` lit les balises de transport, décode les entités et contrôle leur structure. La comparaison du texte annoté au texte original est une égalité exacte, code point par code point. Pas de comparaison simplifiée des signes pour autoriser la peinture.
4. `splitTajwidIntoWords` conserve les caractères et les séparateurs. Les plages adressent les offsets UTF-16 du mot original ; aucun caractère React supplémentaire n’est inséré pour joindre les lettres.
5. La lecture normale reçoit directement le verdict et les plages de la source commune. Le suffixe du marqueur généré est ajouté sans règle, sans analyser à nouveau ni normaliser le markup du fournisseur ; un rejet ne peut donc pas être transformé en succès par la préparation de ce marqueur.
6. `TajweedText` et `MushafFlowPage` utilisent ces plages et les mêmes tokens de couleur. Les descriptions de règles sont communes et traduites FR/EN/AR.
7. Le plein écran réutilise `QuranMushafPage`, donc les mêmes sources et rendus de page. Les modes sourate/page/juz réutilisent les composants de lecture partagés.

Invariant testé : `original === segments.map(segment => segment.text).join("")`. `assertTajwidIntegrity` échoue explicitement avec `QURAN_TEXT_INTEGRITY_FAILURE` si la source annotée est incompatible ou mal formée. Au runtime, le même diagnostic laisse l’original intact et sans coloration.

La couche Tajwid ne remplace pas U+0672, ne supprime pas ZWNJ, ne réordonne pas les marques et ne transforme pas les signes pour faire correspondre une annotation. Les adaptations de base préexistantes dans `fonts.js` / `quranUtils.js` restent séparées, identiques entre ON et OFF. L’audit de conservation des annotations ne certifie pas à lui seul ces choix typographiques historiques.

Les marqueurs de fin de verset, bandes de basmala, titres et espaces de séparation de la page sont des éléments de présentation distincts du texte coranique normalisé. Le `span class=end` de l’API est explicitement traité comme métadonnée de fin, pas comme règle de Tajwid.

La récitation par mot Hafs est également conditionnée par la cohérence des données de mots avec le texte canonique. Si leur division ou leur identité ne convient pas, le mushaf ouvre les actions du verset plutôt que d’utiliser une position audio supposée.

## Catégories de règles et groupes visuels

Les catégories source ne sont pas fusionnées parce qu’elles partagent une couleur. En particulier, `madda_obligatory_monfasel` reste distinct d’un madd permis : l’identifiant et la couleur reflètent la catégorie effectivement fournie.

| Catégorie du fournisseur | Identifiant interne | Groupe visuel |
| --- | --- | --- |
| `ham_wasl` | `ham-wasl` | Gris : lettres non prononcées / assimilation |
| `slnt` | `silent` | Gris |
| `laam_shamsiyah` | `lam-shamsiyya` | Gris |
| `idgham_wo_ghunnah` | `idgham-without-ghunnah` | Gris |
| `idgham_mutajanisayn` | `idgham-mutajanisayn` | Gris |
| `idgham_mutaqaribayn` | `idgham-mutaqaribayn` | Gris |
| `ghunnah` | `ghunna` | Vert : nasalisation |
| `ikhafa` | `ikhfa` | Vert |
| `ikhafa_shafawi` | `ikhfa-shafawi` | Vert |
| `iqlab` | `iqlab` | Vert |
| `idgham_ghunnah` | `idgham-ghunnah` | Vert |
| `idgham_shafawi` | `idgham-shafawi` | Vert |
| `qalaqah` | `qalqala` | Cyan / bleu clair |
| `madda_normal` | `madd-normal` | Madd naturel |
| `madda_permissible` | `madd-permissible` | Madd permis |
| `madda_obligatory` | `madd-obligatory` | Madd obligatoire |
| `madda_obligatory_mottasel` | `madd-connected` | Madd obligatoire |
| `madda_obligatory_monfasel` | `madd-obligatory-separated` | Madd obligatoire |
| `madda_necessary` | `madd` | Madd nécessaire |

Les 17 catégories présentes dans la réponse intégrale sont couvertes. Les variantes supplémentaires des annotations par mot sont prises en charge sans détection à partir du texte. Les alias génériques et le token Tafkhīm existent pour une catégorie explicitement fournie ; ils ne produisent pas de règles absentes. Le champ Unicode audité n’annotant pas explicitement Tafkhīm, sa présence dans la légende V4 ne prouve pas sa couverture sur ce corpus.

## Couleurs Quran.com

Les valeurs sont centralisées dans `themes4.css`. Deux familles de tokens distinguent la référence exacte `--quran-com-tajwid-*` de l’encre utilisée `--tajwid-palette-*`. Les tokens de règle pointent vers les groupes, sans couleurs JS indépendantes.

| Groupe | Référence light | Référence dark | Référence sepia |
| --- | --- | --- | --- |
| Gris | `#a5a5a5` | `#999999` | `#ababab` |
| Madd naturel | `#ce9e00` | `#ffc1e0` | `#c09725` |
| Madd permis | `#ff7b00` | `#ff8e3b` | `#e67b00` |
| Madd obligatoire | `#f40000` | `#ff5e8e` | `#ff0000` |
| Madd nécessaire | `#b50000` | `#e30000` | `#b7001c` |
| Nasalisation | `#09b000` | `#26b55d` | `#09b000` |
| Qalqala | `#2fadff` | `#00deff` | `#00b4e0` |
| Tafkhīm | `#3f48e6` | `#3c84d5` | `#134fe1` |

Depuis le 2026-10-05, les encres `--tajwid-palette-*` reprennent exactement les couleurs publiées par Quran.com dans les trois thèmes (aucune adaptation de contraste). Conséquence assumée : sur le papier clair et sépia, le gris, le madd naturel, la nasalisation et le qalqala sont sous 3:1, seuil WCAG que les anciennes encres assombries respectaient. Les libellés du guide utilisent les tokens de texte UI et ne reposent pas seulement sur la couleur.

Les huit groupes V4 sont repris. Les durées contextuelles ne sont pas déduites d’un groupe de couleur. La police QCF V4 contient une annotation par glyphes plus riche que le champ Unicode ; les deux ne sont pas interchangeables.

L’activation complète des glyphes V4 n’est pas réalisée : le chemin de page déjà présent les positionnait avec des chevauchements à la largeur proportionnelle du lecteur. Les préférences concernées restent sur le rendu Unicode stable. Aucun indice CPAL non documenté n’est utilisé pour simuler OFF. La présente intervention adapte le système visuel V4 au rendu Unicode ; elle ne certifie pas un mushaf QCF V4 complet.

## Rendu, guide et accessibilité

Chaque mot conserve un seul nœud texte et un seul façonnage arabe. Chromium / Firefox peignent des plages via une couleur de fond découpée au texte, sans spans par caractère. Les gradients suivent les boîtes mesurées des caractères ; des glyphes ou marques superposés restent une limite à contrôler visuellement avec chaque police.

Le repli WebKit n’applique une couleur de mot entier que si une unique règle couvre exactement tout le mot. Les règles partielles restent sans peinture plutôt que de colorer de fausses lettres. Leurs métadonnées peuvent rester disponibles pour l’aide. Les essais WebKit sur Windows ne prouvent pas le comportement d’un iPhone physique.

Le guide est une popover sur écran large et une feuille modale mobile sous 640 px. Il reste consultable quand Tajwid est OFF. Il possède titre accessible, huit groupes nommés, textes FR/EN/AR, ordre RTL natif, boutons d’au moins 44 px, fermeture clavier, retour de focus et défilement interne. Dans le plein écran, le premier Escape ferme le guide et rend le focus à son bouton ; le suivant ferme le plein écran. Sa couche passe au-dessus de celle du mushaf.

Warsh affiche un message de source manquante et aucune liste de couleurs prétendument disponible. Le service ne fait ni requête QUD ni lecture d’un cache d’annotations expérimentales. Les règles de lecture et la préférence ON/OFF utilisent la persistance existante.

## Audit du corpus officiel

| Contrôle | Résultat |
| --- | --- |
| Versets comparés | 6 236 |
| Paires compatibles exactement | 1 958 |
| Annotations rejetées | 4 278 |
| Dont annotation mal formée | 1, en 32:3 |
| Texte original altéré par le normaliseur | 0 |

Ces nombres comparent **les deux réponses API brutes d’éditions distinctes** après retrait de la métadonnée de fin dans l’annotation. Ils incluent des différences de signes et de présentation des espaces. Ils ne comptent pas des erreurs religieuses et ne mesurent pas directement la couverture colorée de l’application après préparation de chaque police. Les rejets sont attendus avec une comparaison stricte ; aucun ajustement approximatif ne les transforme en réussite.

Le cas 32:3 comporte une fermeture `</tajweed>` sans ouverture correspondante. Il est conservé dans les fixtures et rejeté, sans réparation conjecturale.

Le script `scripts/audit-tajwid-integrity.mjs` contrôle le corpus complet à partir des deux réponses conservées dans `.codex-artifacts/tajwid-audit/`. La fixture versionnable `tests/fixtures/tajwid-official-verses.json` conserve des exemples des catégories, des sourates courtes et longues, 2:282 et 32:3. Les tests ajoutent balises imbriquées, entités, signes, ZWNJ, caractères non BMP, séparateurs multiples, rejet strict et cloisonnement Warsh.

## Performance

Benchmark local Node v24.19.0, 286 annotations officielles d’Al-Baqara, médiane de 20 tours après échauffement. Le parseur précédent ne comprenait que le transport `<rule>` : les deux entrées utilisent donc les mêmes balises `<rule>`, avec le texte Quran inchangé.

| Mesure | Médiane |
| --- | --- |
| Parseur pur HEAD précédent | 17,66 ms |
| Nouveau parseur structurel | 39,26 ms |
| Nouveau parseur avec validation exacte | 45,43 ms pour 286 versets |

La validation ajoute du coût, environ 0,16 ms par verset dans cette mesure. Il n’y a pas de gain de vitesse à prétendre. L’ancien DOMParser de navigateur n’est pas inclus dans cette comparaison. Aucune mesure du rendu UI avant la refonte n’a été capturée, donc aucun gain UI avant/après n’est revendiqué.

Les rendus mémorisent les annotations et les mots, le cache de parsing est borné à 2 000 entrées, la page n’analyse sa source Hafs qu’une fois par composition, les thèmes changent les tokens CSS et il n’y a pas de composants par caractère. La mesure UI avec fixtures monte 10 versets : 70 nœuds descendants dans le texte ON, 50 OFF, retour à 70 ON ; OFF 147 ms et ON 211 ms dans le premier relevé ciblé. Ces chiffres incluent les attentes et commandes Playwright. Le scénario Al-Baqara vérifie un ensemble monté de versets borné et le même texte/nombre de nœuds après un cycle OFF/ON ; ses timings Playwright sont des temps d’interaction, pas un benchmark de moteur.

## Vérifications exécutées

| Contrôle | Résultat |
| --- | --- |
| ESLint | Réussi |
| Tests unitaires / sécurité | 487 réussis |
| Budgets de fichiers propriétaires | Réussis |
| E2E smoke audio / accessibilité | 7 réussis |
| E2E continuité de lecture | 6 réussis |
| E2E responsive général | 35 réussis + 1 réussi après retry ; contrôle ciblé final réussi |
| E2E Tajwid, langues, guide et plein écran | 18 réussis |
| Firefox + WebKit, Tajwid et waqf | 8 réussis |
| Compilation Vite | Réussie |
| Gates SEO, performance, CSS, sécurité | Réussis |
| Budget de bundles | Échec |

Dernier build : JS agrégé 1 392,3 kB / limite 1 380 ; CSS+JS 2 415,7 kB / limite 2 405 ; entrée initiale 821,8 kB / limite 820. CSS agrégé 1 023,4 kB / limite 1 060. Le dépassement existait déjà à la fin du chantier audio (JS 1 387,3 ; total 2 412,1 ; entrée 822,1). La présente intervention ajoute du code de validation et retire du CSS inutilisé ; elle ne résout pas encore le budget JS global.

Le premier passage responsive a rencontré un timeout sur la préférence `noto-naskh-arabic` alors que des reconstructions du preview avaient lieu ; le retry a réussi, puis le test ciblé a réussi en 2 secondes sur le build stabilisé. Ce résultat est consigné comme flaky et non présenté comme un passage initial parfait.

Les douze largeurs Tajwid sont 280, 320, 360, 375, 384, 390, 414, 430, 768, 1024, 1 440 et 1 920 px. Les scénarios vérifient le texte, les dimensions et la police identiques ON/OFF, l’absence de peinture OFF, le guide, ses boutons, le retour de focus et l’absence de débordement horizontal. Les thèmes light/dark/sepia sont répartis dans la matrice ; FR et AR sont inclus, avec un scénario EN supplémentaire. Le plein écran est vérifié à 280 et 1 440 px.

Contrôle visuel effectivement effectué sur captures : mobile français 384 px, mobile arabe RTL 384 px, desktop français 1 440 px, thèmes clair et sombre, puis page 3 Hafs réelle en plein écran 384 px. Ce dernier contrôle a confirmé zéro mot numérique ajouté : les numéros apparaissent seulement dans les médaillons de présentation. Les fichiers locaux de preuves et journaux sont dans `.codex-artifacts/tajwid-audit/` et les sorties Playwright. Les vidéos WhatsApp fournies ont été inspectées via planches de captures : elles documentent le contexte 384 × 832, les thèmes, les paramètres et l’audio ; elles ne valident pas les règles ou les couleurs de récitation.

## Nettoyage et fichiers concernés

Retirés : détection regex de règles supposées, taxonomie Warsh non validée, parsing DOM dupliqué, rendu segmentaire inutilisé avec caractères de liaison, anciennes couleurs Warsh, hex dupliqués dans les tokens Tailwind, API morte `getPerWordTajweedColors`, libellés de règles dupliqués. Les 42 sélecteurs de l’ancienne légende `details` ont été supprimés après recherche de leurs consommateurs ; les branches de sélecteurs partagées avec d’autres composants ont été préservées.

Créés : `src/utils/hafsTajwidSource.js`, `tajwidWords.js`, `src/data/tajwidPalette.js`, `src/i18n/tajwidGuide.js`, `src/styles/tajwid-guide.css`, `src/services/warshTajweedService.js`, le script d’audit, ses fixtures et les tests d’intégrité/provenance/E2E.

Modifiés : `tajwidAnnotation.js`, `tajwidRules.js`, `SmartAyahRenderer`, `AyahTextRenderer`, `TajweedText`, `TajweedLegend`, les rendus de page Hafs/Warsh/flow, le plein écran, les points de montage du guide, la feuille UI, `quranComAPI.js`, les palettes de thème et les styles où l’ancienne légende vivait. Le script temporaire `scripts/tmp-warsh-verify.mjs`, apparu pendant les contrôles, a reçu uniquement deux corrections mécaniques de lint (import inutilisé et collection de diagnostic non déclarée). Ses règles expérimentales ne sont pas intégrées au rendu. Les nouveaux fichiers expérimentaux Warsh ont été préservés.

Les tests existants ont été ajustés aux règles exactes et au vrai dialogue accessible.

## Éléments restant à valider

- Une source validée pour les familles de règles propres à Warsh (imāla, taqlīl, naql, ibdāl, tafkhīm/tarqīr du rāʾ, longueurs de madd) : règles, sens, durée et offsets, validés par une autorité compétente. Le ḍabṭ de l'édition épinglée est déjà une source adoptée pour les sept règles ci-dessus ; il ne déclare pas ces familles, qui restent `NEEDS_QURANIC_VALIDATION`.
- ~~Étendre la dérivation hors du mushaf.~~ Fait : la coloration Warsh couvre désormais la feuille du mushaf, le plein écran, le mode sourate et la disposition « Liste » du mode pages. `SmartAyahRenderer` dérive la source du même texte imprimé qu'il affiche (`getWarshTajwidAnnotatedSource(baseCleanText)`) et `TajweedText` accepte `tajwidSource` pour les deux riwayas ; `withTajwidPresentationSuffix` reste la garde : si la source ne reproduit pas exactement le verset affiché, le verset reste nu. Contrôle rendu : mode sourate 10 versets peints (4 groupes), page 5 en mushaf 50/126 mots (6 groupes), page 5 en liste 5 versets peints, texte identique ON/OFF dans les trois cas, et zéro peinture avec Tajweed désactivé.
- Consolider cette couverture : la police Warsh dessine le ḍabṭ du wasl en U+06DF, forme que la dérivation accepte désormais pour l'article (5 mots du corpus épinglé, ex. ٱلَ 15:61). Les 276 autres occurrences de ce signe — waṣl et hamza qaṭʿ — restent non peintes par la forme, jamais par le code point. Toute nouvelle forme acceptée doit refaire le décompte global et rester couverte par un test de corpus.
- Vérifier visuellement le rendu Warsh coloré (compact et large, FR et AR/RTL, thèmes clair, sombre et sepia). Les contrôles automatisés couvrent les plages et les invariants ; l'inspection du rendu peint reste à faire sur un vrai moteur, car la peinture passe par un dégradé clippé au texte et les marques de ṣila sont des glyphes étroits.
- Fournir des annotations Hafs exactement compatibles avec chaque texte/police pour augmenter la couverture sans altérer le texte. Le champ Uthmani actuel ne couvre pas toutes les possibilités V4.
- Valider une composition et des glyphes QCF V4 réellement cohérents avec Mushaf 19 avant de réactiver ce chemin. Ne pas utiliser une palette supposée neutre comme preuve de OFF.
- Contrôler les glyphes et plages fines sur de vrais iPhone/Android, en particulier les marques superposées et le repli WebKit.
- Ramener le bundle global sous les budgets existants avant de déclarer tous les gates de livraison réussis.

La conformité du transport, l’égalité Unicode et les tests de navigateur ne constituent pas une certification religieuse de l’intégralité des annotations du fournisseur.
