# Archive Warsh fournie par l'utilisateur

Audit du 3 octobre 2026 de `quran_warsh_tajweed_complet.zip`.

SHA-256 : `2220d07c480ff216c139a4723c83d89511232d2ae7cfefae561bd7480a6c6613`.

## Résultat et usage

Cette archive est adoptée pour les annotations Warsh à la demande explicite de
l’utilisateur. Elle ne remplace pas le texte Quranique épinglé dans l’app.
Le générateur raccorde la numérotation Hafs/Kufi à Warsh Madinah puis aligne
les lettres des mots en conservant les caractères et signes du corpus local.
Les plages sont projetées sur les offsets UTF-16 du texte effectivement affiché.
Une différence de vocalisation ou de notation ne réécrit jamais le texte.

6 207 versets sont alignés, avec 62 489 mots annotés ; 7 versets non alignés
conservent la coloration des signes du mushaf.

Correction du 6 octobre 2026 : 434 versets, ceux qui s’ouvrent sur le marqueur
de début de rub (۞, U+06DE), étaient écartés (5 773 alignés, 55 496 mots). Ce
signe est un mot du texte imprimé sans lettre : l’archive n’en a pas et le
raccord exigeait une correspondance mot à mot. Il reste désormais hors du
raccord et garde une liste de plages vide ; `registerWarshArchive` l’écarte
aussi du côté de l'exécution. Test : `warsh-user-archive` (versets d'ouverture
de rub). Des formulations répétées avec
des annotations contradictoires sont également refusées au rendu. Le pack
local est vérifié par SHA-256, chargé uniquement pour Warsh et conservé dans
IndexedDB pour les visites hors ligne. En cas d’absence ou de corruption,
la lecture reste disponible avec les signes du mushaf.

Les vues sourate, page, liste, plein écran et mot utilisent le même moteur.
Les 20 règles du fichier partagent les groupes de couleur Hafs ; les madd
badal, arid et lin restent des règles distinctes avec le groupe madd permis.
La légende FR/EN/AR explique chaque groupe de couleur (règles incluses) et cite
la source des couleurs, Quran.com. Les limites de l'archive (non revue par un
spécialiste, sans imāla, taqlīl ni naql) figurent dans le registre de la page
Sources.
Les règles absentes du fichier, dont imala, taqlil et naql, ne sont pas inventées.

L'audit des 114 fichiers de sourates trouve 6 236 clés de verset uniques et
98 153 segments, dans huit catégories. Aucun écart n'a été trouvé entre le
texte des segments et leurs positions, ni entre le texte arabe et le HTML
débarrassé de ses balises. Les bornes sont ordonnées, sans chevauchement et
dans les limites de chaque chaîne. Ces contrôles prouvent la cohérence du
format, pas l'exactitude religieuse de ses règles.

Le README déclare une numérotation Hafs/Kufi. Le corpus Warsh Madinah livré
par MushafPlus compte 6 214 versets : une clé de l'archive ne peut donc pas
être utilisée directement comme numéro de verset Warsh. Par exemple, son
`1:1` est la basmala, tandis que le `1:1` du corpus local commence par
`اِ۬لْحَمْدُ`. Le propriétaire de la correspondance est
`src/data/warshHafsNumbering.js` ; ses divisions et regroupements doivent être
respectés.

Le script `build.py`, lu sans exécution, déclare un texte provenant de
`fawazahmed0/quran-api`, édition `ara-quranwarsh`, dont l'origine n'est pas
vérifiée, et un moteur `M97Chahboun/ahkam_tajweed` avec corrections locales.
Le README mentionne des couleurs approximatives mesurées sur un scan,
l'absence de validation par un enseignant ayant une ijâza en Warsh, et des
lacunes pour naql, tasheel, badal après naql, taqlîl, taghlîth du lam, ibdâl
et sakt. Ce sont les déclarations de l'archive, pas des validations externes.

## Contrats de l’intégration

- Aligner le texte exact sur l'édition Warsh épinglée après correspondance
  de numérotation ; refuser les segments dont le texte ne correspond pas.
- Convertir les offsets en points de code Unicode vers les offsets UTF-16
  attendus par les peintres de MushafPlus. Aucun caractère supplémentaire
  n'a été trouvé dans cette archive, mais le contrat reste différent.
- Conserver les règles individuelles du moteur. Les catégories regroupent
  plusieurs règles : `ghunna_ikhfa` contient par exemple ghunnah, ikhfa,
  iqlab et des idgham. Une catégorie ne suffit pas à identifier une règle.
- Utiliser `src/data/tajwidPalette.js` et les tokens des thèmes pour partager
  les couleurs Hafs/Warsh des mêmes règles ; ne pas importer `tajweed.css`.
- Ne pas injecter `text_tajweed_html` dans le DOM. Passer par des segments
  validés et conserver tous les caractères du texte canonique.
- Garder les règles Warsh encore non validées dans leur statut actuel.
  Un contrôle de structure ou une couleur issue d'un scan ne constitue pas
  une validation d'une annotation.

## Reproduire l'audit

```powershell
./scripts/audit-warsh-tajweed-archive.ps1 -ArchivePath "C:\Users\amirou\Downloads\quran_warsh_tajweed_complet.zip"
```

Le rapport détaillé est écrit dans
`.codex-artifacts/warsh-user-archive-audit.json`. L'outil lit les fichiers
JSON directement dans le ZIP et n'exécute pas son script de génération.

## Vérification de l’intégration

Les tests parcourent toutes les lignes générées, vérifient leur présence dans
le corpus local, les bornes sans chevauchement, la palette et la restitution
exacte du texte. Le chargeur refuse un fichier dont le SHA-256 ne correspond
pas, limite les tentatives après échec et conserve le fichier vérifié en cache.
Les rendus réels ont été contrôlés sur 390 px (FR), 820 px en liste (FR) et
1 440 px (AR/RTL), avec des couleurs visibles et un rechargement depuis
IndexedDB quand la requête des annotations est bloquée. Le chargement en
arrière-plan ne bloque pas le texte ; les peintres se mettent à jour lors
de l’arrivée des annotations.

La compilation produit l’app, mais le garde-fou global de taille des bundles
reste en échec ; ses limites n’ont pas été augmentées pour cette intégration.
