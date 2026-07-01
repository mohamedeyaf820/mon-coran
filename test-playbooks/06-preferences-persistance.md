# 06 - Preferences et persistance
> Surfaces : [WEB] Â· Statut : â¬œ Â· Build : develop @ â€” Â· Teste : â€”

## Preconditions
- [WEB] Avoir acces a localStorage/sessionStorage dans le navigateur.
- [WEB] Tester avec une session propre puis avec une session contenant deja des preferences.

## Scenarios

### 06.1 â€” [WEB] Persistance langue et theme
**Action** : Changer langue et theme, recharger la page.
**Attendu** : La langue et le theme choisis sont conserves apres reload.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 06.2 â€” [WEB] Persistance riwaya et police arabe
**Action** : Changer riwaya et taille/style de police arabe, recharger.
**Attendu** : La riwaya et les preferences de lecture sont conservees et appliquees au texte.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 06.3 â€” [WEB] Favoris et signets
**Action** : Ajouter puis retirer un favori/signets sur un verset ou recitateur.
**Attendu** : L'etat visuel change, persiste apres reload, puis disparait apres suppression.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 06.4 â€” [WEB] Historique de lecture
**Action** : Lire plusieurs sourates/versets puis ouvrir l'historique si disponible.
**Attendu** : Les entrees recentes correspondent aux lectures effectuees et permettent de revenir au bon endroit.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 06.5 â€” [WEB] Stockage corrompu
**Action** : Injecter une valeur localStorage invalide pour les preferences principales puis recharger.
**Attendu** : L'application retombe sur des defaults surs sans ecran blanc ni exception bloquante.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”
