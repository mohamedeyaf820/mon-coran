# Suivi des limites de validation

État au 6 septembre 2026. Les vérifications ci-dessous complètent le rapport QA ; elles ne constituent pas une certification religieuse ni une validation sur téléphone réel.

## Contrôles externes réellement exécutés

| Commande | Résultat | Portée |
| --- | --- | --- |
| `npm run audit:reciters` | Réussi : 59 profils | Métadonnées et échantillons audio accessibles |
| `npm run audit:warsh:audio` | Réussi : 100 URL, 0 indisponibilité, 0 erreur de métadonnées | Échantillons audio et identification officielle Warsh |
| `npm run audit:warsh:tajweed` | Réussi : 114 sourates, 6 214 ayahs, 52 401 balises | Concordance des deux sources Warsh et correspondance du texte Tajwid |

Relancer ces trois commandes avant une diffusion, depuis la racine du dépôt, et conserver la date et les sorties. Elles interrogent les fournisseurs réels : un échec peut venir du réseau ou du fournisseur. Vérifier alors la référence et l'URL signalées, puis retester depuis un second réseau. Leur réussite ne valide ni tous les services externes ni le contenu sonore de chaque fichier. Aucun suivi périodique n'est configuré.

## Validation sur appareils physiques — à exécuter

Utiliser une version de préproduction HTTPS avec la configuration de production, sur un iPhone/Safari et un Android/Chrome, puis dans la PWA installée. Un serveur HTTP sur le réseau local peut fausser les tests des API exigeant un contexte sécurisé. Utiliser uniquement des données de test.

Pour chaque essai, noter appareil, version du système, navigateur, version de l'application, mode navigateur/PWA, résultat et preuve. Un comportement indisponible doit être noté « non pris en charge », avec vérification du repli, jamais « réussi » sans essai.

| Parcours | Manipulation et résultat à contrôler | iPhone | Android |
| --- | --- | --- | --- |
| Microphone | Autoriser puis dicter une recherche ; contrôler le texte et les résultats. Refuser ensuite la permission : message compréhensible et recherche au clavier toujours utilisable. | Non testé | Non testé |
| Lecture audio | Démarrer Hafs puis Warsh, changer de verset et de récitateur ; vérifier la référence affichée et écouter le contenu. | Non testé | Non testé |
| Media Session | Pendant la lecture, verrouiller l'écran ; vérifier titre, pause/reprise et commandes effectivement proposées. Revenir dans l'app : état audio cohérent. | Non testé | Non testé |
| Interruption audio | Passer dans une autre application audio puis revenir ; vérifier qu'aucune double lecture ne démarre et que la reprise reste possible. | Non testé | Non testé |
| Partage natif | Partager un verset vers une destination de test ; contrôler texte, référence et image selon l'action choisie. Annuler la feuille de partage : l'app reste utilisable. | Non testé | Non testé |
| Presse-papiers | Copier puis coller dans une note de test. Si le système permet le refus, le provoquer et vérifier le retour d'erreur. Sinon consigner cette limite et conserver le test automatisé de refus. | Non testé | Non testé |
| Hors ligne | Consulter une sourate et télécharger un audio, activer le mode avion, fermer et rouvrir la PWA : texte identique et audio téléchargé lisible. Tester aussi un contenu non téléchargé. | Non testé | Non testé |
| Langues et affichage | FR, EN et AR/RTL ; portrait, paysage et grande taille de texte : lecture, menus et commandes accessibles sans contenu tronqué. | Non testé | Non testé |

Une erreur de texte/riwaya, une perte de données ou un parcours principal bloqué empêche de considérer la validation comme terminée. Joindre les étapes et la référence du verset au défaut constaté.

## Collation du texte

Le nombre de 6 236 ayahs ne doit pas être appliqué indistinctement aux deux jeux de données : le contrat de la source Warsh utilisée est de 6 214. Le rapprochement informatique réussi ne prouve pas l'indépendance des sources et ne remplace pas une revue qualifiée.

Pour une collation savante, figer les versions des sources et choisir avec un spécialiste une édition de référence propre à chaque riwaya et à sa numérotation. Tenir un registre par sourate/ayah : texte source, référence de l'édition, graphie, diacritiques, signes d'arrêt, résultat et nom/date du validateur. Consigner les différences sans normaliser ni remplacer automatiquement le texte coranique. Faire approuver séparément toute correction de contenu et sa correspondance audio. Ce travail reste à réaliser.

## Dette CSS

Après un build à jour, exécuter `npm run audit:css:ci -- --report`. Le fichier `.codex-artifacts/qa/css-maintenance.json` contient les mesures et les sélecteurs candidats par fichier, classés par écart entre source et CSS retenu. Ce fichier local est régénérable et ignoré par Git.

La purge de production retire déjà des règles : les 3 201 candidats ne constituent donc pas une économie supplémentaire garantie dans le bundle. Ne pas supprimer automatiquement des sélecteurs construits dynamiquement ni retirer globalement les `!important`.

Traiter un seul composant à la fois, en priorité les couches `reading-platform`, `home-audio-ux-refonte` et `reader-consolidation`. Pour chaque groupe candidat, rechercher son usage dans JSX/JS et les classes dynamiques, identifier la règle qui le remplace, puis contrôler le rendu avant/après : mobile/desktop, thèmes, FR/AR, Hafs/Warsh, dialogues et états d'erreur. Vérifier aussi si `tailwind.css` est généré avant d'en modifier la source.

Après chaque lot : tests concernés, build CI et comparaison des mesures. Enregistrer les tailles source, retenue et livrée séparément. Cette intervention ajoute le rapport de diagnostic ; elle ne réduit pas encore la feuille CSS et ne revendique aucun gain de performance.

## Périmètre serveur

L'absence de comptes, rôles et paiements est une caractéristique de l'application actuelle, pas un défaut à corriger. Si ces fonctions sont ajoutées, leur contrôle d'accès et leurs parcours serveur devront faire l'objet d'une nouvelle revue.
