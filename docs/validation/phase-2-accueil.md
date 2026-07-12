# Validation - Phase 2 Accueil

Date : 2026-07-12
Branche : `refonte/frontend-cherif`

## Perimetre valide

- accueil moderne branche sur les donnees locales existantes ;
- reprise de lecture depuis la derniere position enregistree ;
- progression globale et nombre de sourates terminees ;
- trois lectures recentes dedupliquees ;
- recherche multilingue parmi les 114 sourates ;
- chargement progressif de la liste des sourates ;
- transfert explicite vers le lecteur legacy jusqu'a la phase 3 ;
- etats sans historique et sans resultat de recherche ;
- themes clair et sombre.

## Resultats automatises

| Controle | Resultat |
| --- | --- |
| Contrats et modele modernes | 18/18 verts |
| `npm run test:e2e:phase2` | 20/20 verts |
| `npm run test:e2e:a11y` | 1/1 vert |
| `npm run test:security` | 6/6 verts |
| `npm run build` | succes |
| Audit reseau | 3/3 sondes a 200 |
| `git diff --check` | succes |

La matrice E2E couvre 360, 390, 768 et 1440 px dans les themes clair et sombre. Elle controle les debordements, la disposition de navigation, les erreurs JavaScript, les erreurs console et les reponses reseau 4xx/5xx.

## Parcours navigateur executes

- chargement de l'accueil avec les donnees existantes ;
- recherche de `vache` et affichage unique d'Al-Baqara ;
- focus du champ depuis le bouton de recherche de l'en-tete ;
- affichage de l'etat sans resultat ;
- affichage de 12 puis 30 sourates ;
- reprise de lecture et ouverture de la route legacy correspondante ;
- rendu clair et sombre ;
- rendu mobile 390 x 844 ;
- verification de Scheherazade New sur les noms arabes ;
- console sans erreur ni avertissement ;
- absence de debordement horizontal.

## Anomalies detectees et corrigees

1. Champ de recherche sans nom accessible explicite.
2. Test de police supposant un unique texte arabe.
3. Navigation basse fixe recouvrant le contenu recent sur mobile et tablette.
4. Actions d'en-tete placees sur une troisieme ligne par la grille responsive.
5. Saturation ponctuelle des API legacy avec trois workers E2E, stabilisee a deux workers.

## Risques residuels hors phase

La commande globale `npm run test:unit` conserve les deux echecs audio historiques decrits dans le rapport de phase 1. Ils ne concernent pas l'accueil moderne.

Le bundle CSS legacy reste superieur a 500 kB. Le chunk CSS moderne demeure isole ; la reduction globale sera traitee lors de la migration des domaines et de la phase de durcissement.

## Conclusion

La phase 2 satisfait sa porte de validation fonctionnelle, visuelle, responsive, accessibilite, securite et build. Elle est prete pour la validation finale avant le lancement de la phase 3.
