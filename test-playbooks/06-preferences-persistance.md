# 06 — Préférences et persistance
> Surfaces : [WEB] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [WEB] Avoir accès à localStorage dans DevTools → Application → Stockage.
- [WEB] Tester avec une session propre puis avec une session contenant déjà des préférences.

## Scénarios

### 06.1 — [WEB] Persistance langue et thème
**Action** : Changer langue → AR et thème → sombre, puis recharger la page.
**Attendu** : La langue et le thème choisis sont conservés après reload.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 06.2 — [WEB] Persistance riwaya et police arabe
**Action** : Changer riwaya → Warsh, police → QCF4, taille +2 crans, puis recharger.
**Attendu** : La riwaya et les préférences de lecture sont conservées et appliquées au texte.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 06.3 — [WEB] Position de lecture
**Action** : Naviguer vers Al-Imran verset 50, puis recharger.
**Attendu** : L'application rouvre à Al-Imran:50. L'URL reflète la position correcte.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 06.4 — [WEB] Favoris et signets
**Action** : Ajouter un favori sur un verset, recharger, puis le supprimer.
**Attendu** : L'état visuel (étoile pleine) persiste après reload. Le panneau Signets liste l'entrée. Après suppression, l'étoile redevient vide.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 06.5 — [WEB] Historique de lecture
**Action** : Lire plusieurs sourates puis ouvrir l'historique.
**Attendu** : Les entrées récentes correspondent aux lectures effectuées et permettent de revenir au bon endroit.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 06.6 — [WEB] Stockage corrompu
**Action** : Injecter une valeur localStorage invalide pour les préférences principales (`localStorage.setItem('settings', 'invalid json')`) puis recharger.
**Attendu** : L'application retombe sur des defaults sûrs sans écran blanc ni exception bloquante.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
