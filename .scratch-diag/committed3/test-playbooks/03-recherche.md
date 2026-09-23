# 03 — Recherche
> Surfaces : [WEB] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [WEB] Application chargée, index de recherche disponible.

## Scénarios

### 03.1 — [WEB] Ouvrir et fermer la recherche
**Action** : Ouvrir la recherche via `/` ou l'icône header, puis fermer avec `Escape` et le bouton de fermeture.
**Attendu** : La modale s'ouvre avec le focus dans le champ. `Escape` ferme sans casser le scroll ou l'état précédent. La région aria-live annonce le nombre de résultats.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 03.2 — [WEB] Recherche par numéro et nom de sourate
**Action** : Saisir `2`, puis `vache` (FR), `cow` (EN), `البقرة` (AR).
**Attendu** : Al-Baqarah apparaît dans tous les cas. La recherche en arabe est insensible aux diacritiques (taper `بقرة` sans shadda retourne aussi Al-Baqarah).
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 03.3 — [WEB] Recherche de récitateur
**Action** : Onglet Récitations → saisir `abdel` dans le champ de recherche.
**Attendu** : Les récitateurs correspondants apparaissent. Filtrer par Warsh n'affiche que les récitateurs Warsh.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 03.4 — [WEB] État vide
**Action** : Saisir une requête volontairement inexistante (`zzzzz`).
**Attendu** : Un état vide clair apparaît, traduit dans la langue courante, sans erreur console ni liste fantôme.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 03.5 — [WEB] Ouvrir un résultat
**Action** : Cliquer sur un résultat de recherche.
**Attendu** : L'application navigue vers le bon verset. La recherche se ferme. Le verset cible est visible ou mis en évidence.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 03.6 — [WEB] Navigation clavier dans les résultats
**Action** : Utiliser `↑`/`↓` puis `Entrée` dans la liste de résultats.
**Attendu** : La sélection clavier suit les résultats. `Entrée` ouvre le résultat actif. `Escape` ferme la modale.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
