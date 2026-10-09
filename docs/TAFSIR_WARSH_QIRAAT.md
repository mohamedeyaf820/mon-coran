# Tafsir pour la riwaya Warsh : quelles sources citent les lectures (Qirāʾāt) ?

Recherche du 2026-10-07. Question : le conseil affiché aux lecteurs Warsh dans le tafsir (« privilégiez les sources marquées Qirāʾāt : Al-Qurtubi, Al-Tabari, Al-Baghawi », clé `tafsir.warshHint`) est-il fondé, et manque-t-il une source ?

Statuts : **VÉRIFIÉ** (mesuré, reproductible avec `scripts/audit-tafsir-qiraat.mjs`), **RAPPORTÉ** (lu sur une page, non recoupé), **NON VÉRIFIÉ**.

## 1. Résumé

1. **Le conseil est fondé, avec une nuance sur Al-Tabari.** Sur les 6 236 versets de chaque tafsir arabe de Quran.com, Al-Qurtubi, Al-Baghawi et Al-Tabari sont les trois qui citent le plus les lectures ; Al-Muyassar et Al-Saadi n'en citent presque jamais. [VÉRIFIÉ]
2. **Al-Qurtubi est de loin le meilleur pour Warsh** : 229 versets où il écrit « قرأ نافع … » (lecture de Nāfiʿ, dont Warsh et Qālūn transmettent), 19 où il nomme Warsh ou Qālūn. Al-Baghawi suit (98 et 15). [VÉRIFIÉ]
3. **Al-Tabari ne dit presque jamais « Nāfiʿ » (22 versets)** : il nomme les lecteurs par région, « قراء أهل المدينة » (253 versets), ce qui désigne Nāfiʿ et Abū Jaʿfar. Il reste utile, mais le lecteur doit savoir le lire ainsi. [VÉRIFIÉ]
4. **Aucun de ces tafsirs ne s'appuie sur la numérotation Warsh.** Ils sont indexés sur les versets Hafs ; l'application remappe le verset Warsh sur la coordonnée Hafs avant de les interroger. Pour 11:82 et 56:52, où un verset Warsh recouvre deux versets Hafs, la table du projet n'en retient qu'un : un seul des deux commentaires s'affiche. [RAPPORTÉ : constat d'une recherche voisine sur la table de correspondance, non refait ici]
5. **Pièges de méthode** : « نافع » signifie aussi « utile » (un simple comptage du mot donnerait 241 versets à Al-Saadi, qui n'en cite en réalité aucun) ; les tafsirs citent Nāfiʿ, rarement Warsh seul. Les chiffres ci-dessous exigent un verbe de lecture à côté du nom.

## 2. Résultats (tafsirs arabes de Quran.com)

Mesure du 2026-10-07, API `GET /api/v4/tafsirs/{id}/by_chapter/{n}` sur les 114 sourates. Colonnes en nombre de versets dont le commentaire contient :

| Tafsir (id) | Versets | « قرأ نافع… » (Nāfiʿ) | Warsh ou Qālūn nommés | Lecteurs de Madinah | Une lecture quelconque |
|---|---|---|---|---|---|
| **Al-Qurtubi (90)** | 6 236 | **229** | **19** | 93 | 2 143 (34 %) |
| **Al-Baghawi (94)** | 6 236 | **98** | **15** | 152 | 1 312 (21 %) |
| **Al-Tabari (15)** | 6 196 | 22 | 0 | **253** | 1 699 (27 %) |
| Al-Wasit, Tantawi (93) | 6 236 | 51 | 1 | 8 | 578 (9 %) |
| Ibn Kathir, arabe (14) | 6 205 | 8 | 0 | 5 | 868 (14 %) |
| Al-Saadi (91) | 6 177 | 1 | 0 | 0 | 49 (1 %) |
| Al-Muyassar (16) | 5 278 | 0 | 0 | 0 | 39 (1 %) |

Notes : certains tafsirs ont moins de 6 236 lignes probablement parce que l'API regroupe des versets dans un même passage (Al-Tabari, Al-Muyassar ; non vérifié) ; une sourate de l'API n'a pas répondu pour Ibn Kathir lors de la première passe et a été retrouvée à la seconde. Exemple vérifié : sur 3:133, Al-Qurtubi écrit « قرأ نافع وابن عامر « سارعوا » بغير واو », la lecture de Nāfiʿ (Warsh) contre « وسارعوا » en Hafs.

## 3. Ce que cela change pour l'application

- **Conserver le conseil et les badges** `Qirāʾāt` sur Al-Qurtubi, Al-Tabari et Al-Baghawi : les trois sont bien les sources de lecture parmi celles que l'API sert. L'ordre actuel (sources avec lectures en tête du groupe arabe) est le bon. Al-Wasit et Ibn Kathir (arabe) ne méritent pas le badge : ils citent des lectures mais pas systématiquement (9 % et 14 % des versets) ; le badge affirme que la source cite les lecteurs, il doit rester réservé aux trois.
- **Préciser le conseil** si l'on veut aider davantage : « Al-Qurtubi cite explicitement Nāfiʿ ; Al-Tabari parle des lecteurs de Madinah ». Une note courte suffirait, sans nouvelle donnée.
- **Piste produit, non réalisée** : un index d'une centaine de clés de versets (les 229 d'Al-Qurtubi et les 98 d'Al-Baghawi) permettrait d'afficher, en riwaya Warsh, « une lecture de Nāfiʿ est citée pour ce verset » avec un accès direct à la source. Ce sont des faits (des numéros de versets), sans reprise du texte des tafsirs, donc sans question de licence ; il faudrait le regénérer avec le script lors d'une mise à jour des sources.

## 4. Sources absentes de l'API Quran.com qui conviendraient à Warsh

- **Ibn ʿAṭiyya, *Al-Muḥarrar al-Wajīz*** (andalou, malikite, école où Warsh domine) et **Ibn Juzayy, *Al-Tasḥīl*** (andalou, chaque sourate s'ouvre sur ses lectures) : tradition naturellement proche de Warsh. [RAPPORTÉ pour Ibn ʿAṭiyya : « recueille les lectures » ([Wikipedia](https://en.wikipedia.org/wiki/Tafsir_Ibn_Atiyya)) ; Ibn Juzayy : contenu non lu]
- **Ibn ʿĀshūr, *Al-Taḥrīr wa al-Tanwīr*** (tunisien, malikite) : disponible dans QUL (ressource 25) avec les lectures commentées. [RAPPORTÉ]
- **Disponibilité** : QUL (Tarteel) liste *Al-Taḥrīr*, *Ibn Juzayy*, *Al-Rāzī* parmi ses tafsirs arabes (JSON et SQLite) mais **n'affiche aucune licence** pour ces ressources ([qul.tarteel.ai](https://qul.tarteel.ai/resources/tafsir)). Même réserve que dans `docs/TAFSIR_FR_SOURCES.md` : ne pas les intégrer avant d'avoir une licence écrite ou de passer par une source qui en déclare une. [VÉRIFIÉ pour l'absence de licence affichée]
- Non mesuré ici : la proportion de versets où ces trois ouvrages citent Warsh ou Qālūn par leur nom, faute de données récupérables avec licence.

## 5. Reproduire

```bash
node scripts/audit-tafsir-qiraat.mjs 90 94 15     # Al-Qurtubi, Al-Baghawi, Al-Tabari
node scripts/audit-tafsir-qiraat.mjs              # les sept tafsirs arabes de Quran.com
```

Environ quatre minutes par tafsir. Les motifs exigent un verbe de lecture (« قرأ », « قراءة », « قرئ »…) à côté du nom : « نافع » seul est ignoré parce que le mot veut aussi dire « utile ». Limites : une lecture citée sans verbe (« وهي قراءة نافع » suivie d'un nom éloigné) peut échapper au motif, donc les chiffres sont des planchers ; ils comparent les sources entre elles, ils ne comptent pas toutes les lectures de Nāfiʿ du Coran.
