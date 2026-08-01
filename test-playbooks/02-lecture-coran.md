# 02 — Lecture du Coran
> Surfaces : [WEB] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [WEB] Application chargée.
- [WEB] Connexion réseau disponible pour les données Warsh/Quran.com.

## Scénarios

### 02.1 — [WEB] Afficher une sourate complète
**Action** : Ouvrir Al-Fatiha (7 versets) puis Al-Baqarah (286 versets).
**Attendu** : Les versets, numéros, bismillah quand applicable et contrôles de lecture s'affichent correctement sans erreur console.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 02.2 — [WEB] Navigation verset/sourate
**Action** : Utiliser précédent/suivant, changer de sourate, puis revenir à la sourate précédente via le bouton Back.
**Attendu** : Le contenu suit la navigation sans duplication, perte de scroll incohérente ou crash. L'URL reflète la position.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 02.3 — [WEB] Modes liste, page (Mushaf), juz
**Action** : Activer chaque mode de lecture : liste/surah, page/Mushaf, juz. Vérifier la persistance après reload.
**Attendu** : Le mode actif change l'affichage sans casser les contrôles. Le mode persiste après reload.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 02.4 — [WEB] Traduction, word-by-word, tajwid
**Action** : Activer/désactiver traduction (`T`), mot-à-mot (`W`) et tajwid (`J`) indépendamment.
**Attendu** : Chaque option modifie uniquement son affichage sans masquer le texte arabe ni casser l'alignement RTL.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 02.5 — [WEB] Hafs vers Warsh
**Action** : Basculer de Hafs vers Warsh puis revenir à Hafs sur une même sourate.
**Attendu** : Le texte change selon la riwaya. Le chargement ne bloque pas l'UI. Le badge WarshNotice s'affiche puis disparaît. Le second changement est rapide (cache chaud ≤ 1 s).
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 02.6 — [WEB] Signes waqf en mode tajwid
**Action** : Ouvrir Al-Baqarah en mode tajwid et faire défiler plusieurs versets contenant des signes waqf (ۖ ۗ ۘ).
**Attendu** : Les signes restent visibles à chaque occurrence et ne disparaissent pas une fois sur deux (garde contre le bug regex stateful `/[ۖ-ۜ]/g`).
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 02.7 — [WEB] Police arabe et contrôles de taille
**Action** : Modifier la police (QCF4, Uthmani…) et la taille via les paramètres, puis recharger.
**Attendu** : Le texte adopte la police choisie. La taille augmente proportionnellement. Les deux préférences persistent après reload.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
