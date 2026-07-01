# 08 - Accessibilite et responsive
> Surfaces : [WEB] Â· Statut : â¬œ Â· Build : develop @ â€” Â· Teste : â€”

## Preconditions
- [WEB] Tester au clavier uniquement puis avec souris/tactile.
- [WEB] Utiliser les viewports 375x812, 768x1024 et 1280x800.

## Scenarios

### 08.1 â€” [WEB] Navigation clavier globale
**Action** : Parcourir header, navigation, recherche, lecture et panneaux avec Tab/Shift+Tab/Enter/Escape.
**Attendu** : Le focus reste visible, l'ordre est logique, Escape ferme les overlays.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 08.2 â€” [WEB] Focus trap modales
**Action** : Ouvrir SearchModal, SettingsModal et autres dialogs majeurs, puis tabuler.
**Attendu** : Le focus reste dans la modale ouverte et revient a un element coherent a la fermeture.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 08.3 â€” [WEB] Labels accessibles
**Action** : Inspecter les boutons icones, controles audio, toggles et navigation prev/next.
**Attendu** : Chaque controle a un nom accessible, les etats actifs utilisent `aria-pressed`, `aria-selected` ou equivalent.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 08.4 â€” [WEB] Cibles tactiles mobile
**Action** : Tester les controles principaux sur viewport mobile.
**Attendu** : Les zones tactiles critiques atteignent environ 44px, restent cliquables et ne se chevauchent pas.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 08.5 â€” [WEB] RTL arabe
**Action** : Passer l'app en arabe et parcourir accueil, lecture, recherche, audio.
**Attendu** : Les textes arabes sont en RTL, les controles directionnels restent comprehensibles et les nombres/labels ne se melangent pas.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 08.6 â€” [WEB] Pas d'occlusion mobile
**Action** : Sur mobile, ouvrir MiniPlayer, menus, recherche, settings et lecture longue.
**Attendu** : Les overlays, barres fixes et players ne masquent pas les actions principales ou le dernier contenu.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”
