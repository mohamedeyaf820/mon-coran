# Validation - Phase 1 Fondations

Date : 2026-07-12
Branche : `refonte/frontend-cherif`

## Perimetre valide

- separation des surfaces moderne et legacy ;
- conservation de `/legacy` pendant la navigation interne ;
- isolation des imports CSS legacy ;
- themes clair et sombre modernes ;
- typographies locales Literata et Scheherazade New ;
- coquille responsive et navigation accessible ;
- lien de comparaison vers la surface legacy ;
- CSP sans erreur console sur la surface moderne.

## Resultats automatises

| Controle | Resultat |
| --- | --- |
| Tests de contrats phase 1 | 14/14 verts |
| Navigation et stockage | 6/6 verts |
| `npm run test:e2e:phase1` | 10/10 verts |
| `npm run test:e2e:a11y` | 1/1 vert |
| `npm run test:security` | 6/6 verts |
| `npm run build` | succes |
| `git diff --check` | succes |

La matrice E2E couvre les largeurs 360, 390, 768 et 1440 px en themes clair et sombre. Elle verifie l'absence de debordement horizontal, le chargement de Scheherazade New, les erreurs JavaScript, les erreurs console et les reponses reseau 4xx/5xx.

## Validation navigateur manuelle

Les controles ont ete executes dans Chromium sur le serveur local :

- rendu desktop clair ;
- rendu mobile 390 x 844 clair ;
- rendu mobile 390 x 844 sombre ;
- bascule de theme par interaction reelle ;
- police arabe calculee `Scheherazade New` et chargee ;
- absence de debordement horizontal ;
- landmarks `header`, `nav` et `main` presents ;
- surface legacy chargee avec `.app-root` ;
- URL `/legacy` conservee apres initialisation de l'ancien synchroniseur ;
- aucune erreur ou alerte console sur la surface moderne.

## Anomalies detectees et corrigees

1. Build ES2020 incompatible avec un `await` au niveau racine.
2. CSP meta contenant `frame-ancestors` et bloquant un script inline.
3. Metadonnees HTML avec encodage corrompu.
4. Prechargements logo et police de titres inutilises sur la surface moderne.
5. Synchronisation legacy supprimant le prefixe `/legacy`.
6. Selecteurs du test d'accessibilite legacy devenus obsoletes.
7. Commande `test:security` non portable sous Windows.

## Risques residuels hors phase

La commande globale `npm run test:unit` execute 37 tests : 35 passent et 2 tests audio historiques echouent dans `tests/reciters-audio.test.mjs`. Ces echecs concernent les metadonnees de recitateurs et la construction d'URL audio existantes ; ils ne sont pas causes par l'isolation frontend de la phase 1.

L'audit de build signale egalement que le total CSS legacy reste superieur a 500 kB. La surface moderne est isolee dans son propre chunk CSS ; la reduction du bundle legacy sera traitee dans les phases de migration et de durcissement.

## Conclusion

La phase 1 satisfait sa porte de validation fonctionnelle, visuelle, responsive, accessibilite, securite et build. Elle est prete pour la validation finale avant le lancement de la phase 2.
