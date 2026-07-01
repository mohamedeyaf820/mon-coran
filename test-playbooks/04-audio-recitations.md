# 04 - Audio et recitations
> Surfaces : [WEB] Â· Statut : â¬œ Â· Build : develop @ â€” Â· Teste : â€”

## Preconditions
- [WEB] Autoriser l'audio dans le navigateur si necessaire.
- [WEB] Connexion reseau disponible pour charger les fichiers de recitation.

## Scenarios

### 04.1 â€” [WEB] Choisir un recitateur
**Action** : Ouvrir la section recitations, chercher ou selectionner un recitateur.
**Attendu** : La fiche/liste du recitateur s'affiche, les actions de lecture sont accessibles et libellees.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 04.2 â€” [WEB] Lecture pause reprise
**Action** : Lancer une recitation, mettre en pause, reprendre.
**Attendu** : L'etat play/pause est exact, le son demarre, aucune double lecture ne se superpose.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 04.3 â€” [WEB] MiniPlayer persistant
**Action** : Lancer l'audio puis naviguer vers une autre zone de l'application.
**Attendu** : Le MiniPlayer reste visible, ne masque pas le contenu, et ses controles restent fonctionnels.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 04.4 â€” [WEB] Verset suivant et precedent
**Action** : Utiliser les controles suivant/precedent pendant la lecture.
**Attendu** : Le verset courant et la progression changent sans decalage UI/audio manifeste.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 04.5 â€” [WEB] Vitesse audio
**Action** : Modifier la vitesse si le controle est disponible.
**Attendu** : La vitesse change, l'etat reste visible, et la preference ne casse pas la lecture suivante.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 04.6 â€” [WEB] Fallback audio indisponible
**Action** : Simuler ou observer une URL audio indisponible.
**Attendu** : L'erreur est geree proprement, sans crash, avec fallback ou message comprehensible.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 04.7 â€” [WEB] Lecture audio et prefetch
**Action** : Lancer l'audio puis surveiller les requetes reseau pendant la navigation lecture.
**Attendu** : Les prefetchs lourds ne concurrencent pas inutilement la lecture audio active.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”
