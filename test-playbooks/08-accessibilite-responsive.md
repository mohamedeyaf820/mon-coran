# 08 — Accessibilité et responsive
> Surfaces : [WEB] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [WEB] Tester au clavier uniquement (déconnecter la souris) puis avec souris/tactile.
- [WEB] Utiliser les viewports 375×812 (iPhone), 768×1024 (iPad), 1280×800 (desktop).
- [WEB] Activer NVDA (Windows) ou VoiceOver (macOS/iOS) pour les scénarios lecteur d'écran.

## Scénarios

### 08.1 — [WEB] Navigation clavier globale
**Action** : Parcourir header, navigation, recherche, lecture et panneaux avec `Tab`/`Shift+Tab`/`Enter`/`Escape`.
**Attendu** : Le focus reste visible sur tous les éléments. L'ordre est logique. `Escape` ferme les overlays. Aucun focus piégé hors modale.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 08.2 — [WEB] Focus trap dans les modales
**Action** : Ouvrir SearchModal, SettingsModal et autres dialogs majeurs, puis tabuler en boucle.
**Attendu** : Le focus reste dans la modale ouverte. À la fermeture (`Escape` ou bouton ✕), le focus retourne à l'élément déclencheur.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 08.3 — [WEB] Labels accessibles et états ARIA
**Action** : Inspecter les boutons icônes (play, bookmark, share), contrôles audio et toggles.
**Attendu** : Chaque contrôle a un nom accessible (`aria-label` en FR/EN/AR selon la langue). Les états actifs utilisent `aria-pressed`, `aria-selected` ou `aria-expanded` selon le rôle.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 08.4 — [WEB] Cibles tactiles ≥ 44 px
**Action** : Inspecter via DevTools la taille calculée des boutons play, bookmark, nav footer et contrôles MiniPlayer sur viewport 375 px.
**Attendu** : Chaque zone interactive mesure ≥ 44 × 44 px. Aucun chevauchement entre zones cliquables.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 08.5 — [WEB] RTL arabe
**Action** : Passer l'app en arabe et parcourir accueil, lecture, recherche et audio.
**Attendu** : `dir="rtl"` sur `<html>`. Layout miroir (sidebar, chevrons, alignement). Aucun texte arabe tronqué ou rendu LTR par erreur.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 08.6 — [WEB] Absence d'occlusion mobile
**Action** : Sur mobile (375 px), ouvrir MiniPlayer, menus, recherche, paramètres et faire défiler une longue sourate.
**Attendu** : Les overlays, barres fixes (header, footer, MiniPlayer) ne masquent pas les actions principales ni le dernier verset visible. Safe-area iOS respectée (barre home non occultée).
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 08.7 — [WEB] Contraste couleurs
**Action** : Utiliser l'outil Accessibilité de DevTools ou axe DevTools sur accueil + page de lecture en thème clair, sombre et sépia.
**Attendu** : Tous les textes corps passent WCAG AA (4,5:1). Les couleurs de tajwid passent le ratio 3:1 pour grand texte. Aucune régression entre thèmes.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
