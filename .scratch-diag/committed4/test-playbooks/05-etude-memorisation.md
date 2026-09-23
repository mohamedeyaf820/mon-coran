# 05 — Étude et mémorisation
> Surfaces : [WEB] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [WEB] Application chargée sur une sourate courte (Al-Fatiha ou Al-Ikhlas).

## Scénarios

### 05.1 — [WEB] Activer le mode mémorisation
**Action** : Activer le mode mémorisation via `M` ou le bouton dans la toolbar.
**Attendu** : L'application quitte l'accueil si nécessaire, passe en vue lecture compatible, et masque/révèle les mots selon le mode. L'accueil et les douas sont désactivés pendant le mode.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 05.2 — [WEB] Révélation progressive
**Action** : Faire progresser la révélation des mots jusqu'à la fin d'un verset.
**Attendu** : Les mots se révèlent dans l'ordre. Le timer/compteur ne dépasse pas l'état final (aucune révélation supplémentaire après le dernier mot).
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 05.3 — [WEB] Sortie du mode mémorisation
**Action** : Quitter le mode mémorisation via `M` ou le bouton.
**Attendu** : La mise en page précédente est restaurée (Mushaf si on était en Mushaf, liste sinon). Aucun timer résiduel ne continue de s'exécuter.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 05.4 — [WEB] Word-by-word et mémorisation
**Action** : Activer word-by-word (`W`) puis mémorisation (`M`), puis l'inverse.
**Attendu** : Les deux modes ne créent pas d'état contradictoire. Activer WbW désactive la mémorisation. L'UI reste lisible dans les deux ordres.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 05.5 — [WEB] Karaoke — suivi mot-à-mot
**Action** : Activer WbW + lancer la lecture audio. Observer le surlignage pendant la lecture, puis faire un seek arrière.
**Attendu** : Le mot actif suit l'audio en temps réel. Un seek snape immédiatement au bon mot. Le surlignage se fige quand l'audio est en pause.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 05.6 — [WEB] Outils d'étude
**Action** : Ouvrir flashcards, quiz tajwid, khatma, wird ou outils équivalents depuis le hub.
**Attendu** : Chaque panneau s'ouvre et se ferme. Il affiche un contenu exploitable. Il ne bloque pas la lecture principale.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
