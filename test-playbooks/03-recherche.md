# 03 - Recherche
> Surfaces : [WEB] Â· Statut : â¬œ Â· Build : develop @ â€” Â· Teste : â€”

## Preconditions
- [WEB] Application chargee.
- [WEB] Index de recherche disponible apres chargement initial.

## Scenarios

### 03.1 â€” [WEB] Ouvrir et fermer la recherche
**Action** : Ouvrir la recherche depuis le header ou raccourci clavier, puis fermer avec Escape et bouton de fermeture.
**Attendu** : La modale s'ouvre, le focus est dans le champ, Escape ferme sans casser le scroll ou l'etat precedent.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 03.2 â€” [WEB] Recherche arabe
**Action** : Saisir un mot arabe connu.
**Attendu** : Des resultats pertinents apparaissent avec texte arabe lisible et references sourate:verset.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 03.3 â€” [WEB] Recherche traduction
**Action** : Saisir un mot de traduction francais ou anglais.
**Attendu** : Les resultats en traduction apparaissent et indiquent clairement la sourate et le verset.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 03.4 â€” [WEB] Aucun resultat
**Action** : Saisir une requete volontairement inexistante.
**Attendu** : Un etat vide clair apparait, sans erreur console et sans liste fantome.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 03.5 â€” [WEB] Ouvrir un resultat
**Action** : Cliquer un resultat puis verifier la page de lecture ouverte.
**Attendu** : L'application navigue vers le bon verset, la recherche se ferme, le verset cible est visible ou mis en evidence.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 03.6 â€” [WEB] Navigation clavier dans les resultats
**Action** : Utiliser fleches haut/bas et Entree dans la liste de resultats.
**Attendu** : `aria-activedescendant` ou l'etat actif suit la selection, Entree ouvre le resultat actif.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”
