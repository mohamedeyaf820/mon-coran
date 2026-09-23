# 04 — Audio et récitations
> Surfaces : [WEB] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [WEB] Autoriser l'audio dans le navigateur si nécessaire.
- [WEB] Connexion réseau disponible pour charger les fichiers de récitation.

## Scénarios

### 04.1 — [WEB] Choisir un récitateur
**Action** : Ouvrir la section récitations, chercher puis sélectionner un récitateur.
**Attendu** : La fiche récitateur s'affiche avec badge riwaya (Hafs/Warsh). Les actions de lecture sont accessibles et libellées dans la langue courante.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 04.2 — [WEB] Lecture, pause, reprise
**Action** : Lancer une récitation, mettre en pause, reprendre.
**Attendu** : L'état play/pause est exact. Le son démarre dans ≤ 2 s. Aucune double lecture ne se superpose.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 04.3 — [WEB] MiniPlayer persistant
**Action** : Lancer l'audio puis naviguer vers une autre zone de l'application.
**Attendu** : Le MiniPlayer reste visible en bas d'écran. Il ne masque pas le contenu. Ses contrôles (play/pause, suivant, précédent, fermer) restent fonctionnels. La barre de progression se remplit en temps réel.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 04.4 — [WEB] Verset suivant et précédent
**Action** : Utiliser les contrôles suivant/précédent pendant la lecture.
**Attendu** : Le verset courant et la progression changent sans décalage UI/audio manifeste. Le titre dans le MiniPlayer se met à jour.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 04.5 — [WEB] Vitesse audio
**Action** : Modifier la vitesse de lecture (0.75×, 1×, 1.5×, 2×).
**Attendu** : La vitesse change auditivement. L'état reste visible dans l'interface. La préférence persiste sur le verset suivant.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 04.6 — [WEB] Fallback audio indisponible
**Action** : Simuler une URL audio indisponible (DevTools → bloquer le domaine audio) puis lancer la lecture.
**Attendu** : L'erreur est gérée proprement. Aucun crash. Message ou fallback compréhensible affiché.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 04.7 — [WEB] Lecture audio et prefetch réseau
**Action** : Lancer l'audio puis surveiller l'onglet Réseau pendant la navigation lecture.
**Attendu** : Les prefetchs lourds (riwaya alternative, sourate voisine) ne démarrent pas pendant la lecture active. Ils reprennent quand l'audio est en pause.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 04.8 — [WEB] Contrôles lock screen (MediaSession)
**Action** : Lancer la lecture, verrouiller l'écran (mobile) ou utiliser les touches média du clavier.
**Attendu** : Le nom de la sourate et du récitateur apparaissent sur l'écran de verrouillage. Les boutons play/pause/suivant/précédent fonctionnent sans rouvrir l'application.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
