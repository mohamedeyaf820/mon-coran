# Corrections mobile et publication du 6 septembre 2026

## Correctifs

- Dictée : gestion des erreurs sans événement `end`, reprise après refus ou échec, exclusion des résultats tardifs d'une ancienne session, nettoyage à la fermeture et message HTTPS traduit en FR/EN/AR. Aucun enregistrement vocal n'est ajouté.
- Audio : déclaration de session native `playback` lorsque l'API existe, reprise du contexte audio suspendu lors d'une action de lecture, suivi des pauses/reprises natives et conservation du chemin audio natif pour l'égaliseur neutre. Un refus `NotAllowedError` laisse maintenant le lecteur en pause avec un message adapté, sans déclarer le récitateur indisponible ni changer de voix.
- Hors ligne : correction des plages HTTP audio (fin dépassant la taille, suffixe, plage invalide), conservation du corps complet en repli, téléchargement CORS prioritaire pour permettre la lecture partielle et recherche en cache indépendante de `Vary`. Un cache inaccessible ne bloque plus le streaming en ligne. Les tentatives audio répétées sont évitées lorsque le navigateur indique être hors ligne.
- Récupération du démarrage : les sondes HEAD contournent le service worker GET pour ne pas confondre une page en cache avec une connexion active avant une réparation.
- Responsive : les actions des versets gardent 44 px sur téléphone et tablette comme sur desktop ; les boutons et le déclencheur du bandeau mobile de sourate conservent également 44 px. Les icônes et la typographie restent adaptées à la largeur.
- CSS : suppression ciblée de 168 sélecteurs appartenant à d'anciens composants sans producteur dans le code actuel, puis retrait de règles redondantes de réduction des boutons. Aucun nettoyage global automatique des classes dynamiques ou des `!important`.

## Mesures

| Indicateur | Avant | Après |
| --- | ---: | ---: |
| Source CSS | 1 755,7 Kio | 1 732,6 Kio |
| CSS retenu par l'audit | 1 214,2 Kio | 1 207,1 Kio |
| CSS livré | 1 039,8 Kio | 1 034,2 Kio |
| Déclarations `!important` | 6 937 | 6 858 |
| Total JS + CSS livré | 2 218,9 Kio | 2 215,2 Kio |

## Vérifications

- ESLint, `build:ci`, budgets et `git diff --check` : réussis.
- Tests Node : 183/183 réussis, dont tests de plages HTTP, de refus de lecture et d'interruption native.
- Matrice navigateur : 185 scénarios exécutés ; 178 réussis dans la passe complète. Six assertions imposaient les anciennes petites tailles, et un scénario de succès simulait à tort un refus de lecture. Après correction de ces tests, les 27 scénarios de compatibilité/performance ont été relancés : 25 réussis, puis les 8 scénarios Firefox ont tous réussi en exécution isolée après deux incidents intermittents de navigation.
- Dictée, audio et PWA : scénarios dédiés réussis, y compris récupération après erreur sans `end` et lecture des plages HTTP depuis le vrai service worker hors ligne.
- Rendu inspecté à 375, 768 et 1 440 px. La matrice automatique couvre aussi les petits écrans, les thèmes, le RTL et les deux riwayas.

Ces vérifications ne simulent pas la mise en veille réelle d'iOS/Android. Le maintien de la récitation écran éteint et les permissions microphone doivent être confirmés sur les appareils ayant présenté le problème. Les CDN sans CORS conservent un repli opaque, avec les limites du navigateur pour la lecture partielle hors ligne.

## Publication

- Adresse demandée : https://mon-coran-kappa.vercel.app
- Projet vérifié : `amirous-projects/mon-coran`, `prj_xPG8EZ6oR1aNF9ANgZPwl4mCR3sn`.
- Déploiement : `dpl_4XynS7eRd7Y2TBGbTRLf3QStyDt1`, état `READY`, production.
- URL immuable : https://mon-coran-cywymkem3-amirous-projects.vercel.app
- Le build statique testé a été publié avec les en-têtes et réécritures Vercel du dépôt. Les autres sites n'ont pas été modifiés.
- Ancienne version, pour retour arrière si nécessaire : `dpl_AyuDsjR52s12bonSxrfVJfiV5o9b`.

Vérification après publication en cours ; résultats dans `.codex-artifacts/qa/logs/mobile-fixes-production.log`.
