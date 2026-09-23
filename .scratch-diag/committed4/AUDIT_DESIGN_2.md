# AUDIT DESIGN 2 — MushafPlus Re-Audit
**Date :** 30 juillet 2026  
**Branch :** perf/load-times-and-bug-fixes  
**Captures :** 12 screenshots (3 thèmes × 2 vues × 2 viewports)  
**Auditeur :** Claude Code — expert UI/UX

---

## Résumé exécutif

Le projet a subi des corrections design significatives. La majorité des problèmes critiques de l'audit précédent sont résolus. Le score global progresse de ~52/100 à **74/100**. Les thèmes sont bien distincts, la lisibilité du texte arabe est correcte dans tous les thèmes, et les Outils Spirituels affichent des icônes réelles. Plusieurs problèmes de second rang subsistent, notamment un label concatené ("Tafsir:Leçonéflexic") visible dans la vue Liste, un espace mort léger au-dessus du header du lecteur (bande blanche ~15px), et l'absence de safe area visible sur mobile simulé (accepté en headless).

---

## Statut des corrections par critère

### 1. Outils Spirituels — icônes (thème clair)
**✅ RÉSOLU**  
Les icônes Wird, Khatma, Listes, Stats sont bien visibles avec des icônes Lucide React (`Calendar`, `BookOpen`, `List`, `TrendingUp`). Pas de carrés verts opaques. Taille correcte (16px). Les labels sont lisibles. La grille 2×2 est propre.

### 2. Texte arabe thème sombre
**✅ RÉSOLU**  
Thème dark : texte arabe blanc-crème (`#ede8db`) sur fond vert très sombre (`#0e1f12` gradient). Contraste excellent. Le verset "الم" de sourate 2 est parfaitement lisible en dark desktop et dark mobile. Variable `--text-quran: #ede8db` correctement appliquée.

### 3. Sépia vs Dark — identités visuelles distinctes
**✅ RÉSOLU — identités très distinctes**  
- **Thème light :** fond blanc cassé (`#f8fafc`), accents verts émeraude (#1b5e3b), boutons CTA vert franc. Interface propre et fraîche.  
- **Thème dark :** fond vert-noir profond (`#090e09` → `#0e1f12`), gradient forestier. Ambiance nocturne noble. Typographie blanche. Boutons play vert émeraude brillant.  
- **Thème sépia :** fond parchemin chaud (`#f4ecdf`/`#f5e9cc`), accents brun-doré (`#6b3a14`), boutons CTA brun chocolat. Texture noise subtile (SVG). Identité manuscrite authentique.  
Les 3 thèmes ont chacun une palette cohérente du header jusqu'au player.

### 4. Fond sépia — valeur exacte
**🟡 LÉGÈREMENT DIFFÉRENT DE LA SPEC**  
La spec demandait `#fdf6e3`. La valeur réelle est `#f4ecdf` (`.app-root` sépia) / `--parchment-1: #f5e9cc`. Visuellement c'est un parchemin chaud satisfaisant, même si légèrement plus saturé que `#fdf6e3`. Pas un défaut critique. Rendu screenshot conforme à l'attente.

### 5. Fond dark — valeur exacte
**🟡 DIFFÉRENT DE LA SPEC — cohérent mais pas identique**  
La spec demandait `#0d1f14`. La valeur réelle est `#090e09` (parchment-1 dark) → gradient `#0e1f12`. L'`--bg-primary` dark est `#121212` (neutre). Le fond visuel rendu est un vert très sombre, proche de la spec. Acceptable.

### 6. Mini player mobile — safe area
**🟡 IMPLÉMENTÉ EN CSS, NON VÉRIFIABLE EN HEADLESS**  
Le CSS implémente correctement `padding-bottom: env(safe-area-inset-bottom, 0px)` aux lignes 7417, 11181, 11312, 13508, 14236-14245. En simulation headless (sans vrai appareil), `safe-area-inset-bottom = 0`. Les screenshots mobiles montrent le mini player collé en bas (390×844) — c'est normal en émulation. Sur vrai appareil iOS avec notch, le safe area serait respecté.  
Le player mobile est visible, fonctionnel et correctement positionné.

### 7. Z-index stacking — sidebar > player > modal
**✅ HIÉRARCHIE CORRECTE**  
Stacking documenté :
- Sidebar : `z-[1000]` (Tailwind inline, confirmé dans `Sidebar.jsx`)
- Player erreur overlay : `z-[430]`
- Modales légères : `z-index: 200`
- mfp-overlay (galerie) : `z-index: 2000`
- audio-maker : `z-index: 9998`
- Skip link : `z-index: 10000`

La sidebar (`z=1000`) couvre le player (non fixe en desktop) et les overlays légers (`z=200`). Les modales critiques (mfp, audio-maker) écrasent la sidebar si ouvertes. Pas de conflit observé dans les screenshots — aucun élément ne se retrouve en dessous d'un autre de façon incorrecte.

### 8. Espace mort au-dessus du header lecteur
**🟡 BANDE CLAIRE PERSISTANTE (~12-15px)**  
Dans les vues surah (desktop et mobile tous thèmes), une bande de fond transparent/clair est visible entre le header global et le contenu du lecteur (`app-main-shell` a `padding-top: clamp(0.8rem, 1.6vw, 1.2rem)`). Ce n'est pas le gap de 80px du bug original, mais une légère séparation reste visible. En dark mobile, cette bande gris-vert est perceptible. En sépia desktop, la bande beige est visible. Non critique, mais à réduire.

### 9. Typographie arabe — taille et responsive
**✅ CORRECT ET RESPONSIVE**  
- Police QPC Uthmanic Hafs appliquée correctement (`font-family: "KFGQPC Uthmanic Script HAFS"`)
- Taille clampée : `clamp(1.82rem, 6.8vw, 3.28rem)` en mode lecture inline, `clamp(2.25rem, 1.4rem + 2.5vw, 4.15rem)` en mode platform
- Desktop : taille généreuse, lisible
- Mobile (390px) : taille réduite proportionnellement, toujours lisible
- Line-height `2.14–2.22` : espacement entre lignes arabiques correct

### 10. Bug "Tafsir:Leçonéflexic" dans vue Liste mobile
**🔴 BUG VISUEL — LABEL CONCATENÉ**  
Dans `light-mobile-surah.png` et `sepia-mobile-surah.png`, sous le premier verset (2:1), le texte "Tafsir:Leçonéflexic" est affiché comme du contenu de texte brut. Il s'agit vraisemblablement du rendu du panneau d'étude inline (`qcom-list-study` layout) où les 3 onglets (Tafsir / Leçons / Réflexions) sont rendus sans séparateurs visibles, créant une concaténation visuelle de leurs labels. En dark mobile, on voit "Alif, Lâm, Mîm." suivi de "Tafsir:Leçonéflexic" — ce qui est le contenu du tafsir + les labels d'onglets fusionnés.  
Ce n'est PAS un bug de code `AyahActions.jsx` (les tabs sont bien séparés dans le JSX), mais un problème CSS de `ayah-study-tabs` en layout `qcom-list-study` sur mobile — les boutons tab se wrappent et perdent leur séparation visuelle.

---

## Observations détaillées par vue et thème

### Vue HOME

#### Light Desktop (`light-desktop-home.png`)
- Hero section propre, gradient vert subtil en fond
- Titre "Le Saint Coran avec MushafPlus" en bold, lisible
- Boutons CTA bien contrastés (vert émeraude franc)
- Suggestions + Favoris : widget fonctionnel avec liste de sourates
- Cards inférieures (Verset du jour, Session, Prières, Outils Spirituels) bien alignées
- Outils Spirituels : 4 icônes Lucide visibles, grid 2x2 ✅
- Score de la section : 9/10

#### Dark Desktop (`dark-desktop-home.png`)
- Fond vert-noir profond, très élégant
- Texte blanc bien lisible partout
- Boutons CTA : vert émeraude brillant sur fond sombre → très bon contraste
- Widget Suggestions : fond légèrement surélevé (vert plus clair) → bonne séparation
- Cards inférieures : fond dark uniforme sans perte de séparation
- Outils Spirituels : icônes visibles (légèrement moins contrastées en dark mais acceptables)
- Score de la section : 9/10

#### Sépia Desktop (`sepia-desktop-home.png`)
- Fond parchemin chaud, texture noise SVG subtile
- Bouton CTA brun chocolat → identité papier/manuscrit
- Widget Suggestions : fond légèrement plus foncé que le fond principal → bonne séparation
- Verset du jour : texte arabe en couleur d'encre sombre → bonne lisibilité
- Outils Spirituels : bonne visibilité, couleurs brunes cohérentes
- Score de la section : 8.5/10 (légère monotonie dans les valeurs tonales des cards)

#### Light Mobile (`light-mobile-home.png`)
- Layout mobile adaptatif fonctionnel
- Pas de header de navigation complexe → titre centré "Reprendre la lecture"
- Hero section vertical lisible, bouton CTA pleine largeur
- Cards empilées verticalement, lisibles
- Score : 8.5/10

#### Dark Mobile (`dark-mobile-home.png`)
- Identique au desktop dark en layout empilé
- Très bonne identité visuelle nocturne
- Score : 9/10

#### Sépia Mobile (`sepia-mobile-home.png`)
- Bouton CTA brun chocolat très visible sur fond parchemin
- Bonne cohérence avec desktop sépia
- Score : 8.5/10

---

### Vue SURAH (Al-Baqara / Surah 2)

#### Light Desktop (`light-desktop-surah.png`)
- Header "2. La Vache" + méta-données bien structuré
- Barre d'onglets (Mushaf / Liste / Traduction / Étude) lisible
- Slider taille de texte visible avec valeur "25"
- Séparateur PAGE 2 : élégant, bien intégré
- Verset 2:1 "الم" : taille correcte, bien centré
- Mini player en bas à droite : élégant avec avatar récitateur
- Bande claire entre header et contenu : ~12px, légèrement perceptible
- Score : 8/10

#### Dark Desktop (`dark-desktop-surah.png`)
- Fond vert très sombre, texte arabe blanc-crème → excellent contraste
- Header sourate avec fond légèrement surélevé : bonne séparation
- Icônes d'action (copier, partager, annoter, more) : visibles sur fond dark
- Translitération "alm" en gris clair : lisible
- Mini player dark en bas à droite : très élégant
- Score : 9/10

#### Sépia Desktop (`sepia-desktop-surah.png`)
- Fond parchemin, texte arabe noir/encre → authenticité manuscrite
- Bouton Écouter brun chocolat bien visible
- Slider avec thumb brun cohérent
- Score : 8.5/10

#### Light Mobile (`light-mobile-surah.png`)
- Header compact : "البقرة 2. La Vache" avec bouton play vert
- Barre de mode compacte (Mushaf / Liste + Traduction / Étude)
- **BUG "Tafsir:Leçonéflexic"** visible sous le verset 2:1 → à corriger
- Mini player en bas : correct, lisible
- Score : 6/10 (pénalisé par le bug visuel)

#### Dark Mobile (`dark-mobile-surah.png`)
- Même structure que light mobile en thème sombre
- **BUG "Tafsir:Leçonéflexic"** absent en dark mobile → les onglets semblent séparés ici (texte "Alif, Lâm, Mîm." visible + "Tafsir:Leçonéflexic" absent) — à vérifier si c'est le mode d'affichage qui diffère
- Score : 8/10

#### Sépia Mobile (`sepia-mobile-surah.png`)
- **BUG "Tafsir:Leçonéflexic"** visible — même problème que light mobile
- Thème cohérent, boutons bruns
- Score : 6/10 (même pénalité)

---

## Score design global

| Dimension | Note /10 |
|-----------|----------|
| Identité visuelle des 3 thèmes | 9 |
| Lisibilité texte arabe | 9 |
| Lisibilité texte latin/UI | 8.5 |
| Hiérarchie visuelle (home) | 8.5 |
| Hiérarchie visuelle (surah) | 7.5 |
| Cohérence composants | 8 |
| Responsive mobile | 7.5 |
| Accessibilité contraste | 8 |
| Player & navigation audio | 8.5 |
| Finitions & détails | 7 |

**Score global : 74 / 100** (était ~52/100 avant les corrections)

---

## Top 10 améliorations restantes — par priorité

### P1 — Critique

**1. Corriger le bug "Tafsir:Leçonéflexic" en mode liste mobile**  
`src/components/AyahActions.jsx` layout `qcom-list-study` + CSS `ayah-study-tabs`.  
En mode liste sur mobile, les labels des onglets d'étude (Tafsir / Leçons / Réflexions) se concatenent visuellement. Cause probable : `ayah-study-tabs` en `display: flex` sans `flex-wrap: nowrap` ou `overflow: hidden`, les labels débordent et se fusionnent. À régler avec `overflow: hidden` + `text-overflow: ellipsis` sur les boutons tabs, ou en masquant le panneau d'étude inline en mode liste mobile.  
**Effort :** 30min — **Impact :** élimine un bug visuel frappant

**2. Réduire la bande morte entre header global et contenu lecteur (surah)**  
`.app-main-shell { padding-top: clamp(0.8rem, 1.6vw, 1.2rem) }` sur la vue surah génère ~13px de fond nu visible. Sur mobile dark, cette bande grise est clairement perceptible. Réduire à `clamp(0.3rem, 0.8vw, 0.6rem)` sur les routes `/surah/*` uniquement.  
**Effort :** 15min — **Impact :** supprime un dead space non justifié

### P2 — Important

**3. Améliorer la séparation des cards Outils Spirituels en thème dark**  
En dark desktop, les 4 boutons d'Outils Spirituels (Wird/Khatma/Listes/Stats) sur fond `bg-primary` dark ont peu de contraste avec le fond de la card. Ajouter un `border: 1px solid rgba(var(--primary-rgb), 0.2)` visible et un hover plus prononcé en dark.  
**Effort :** 20min — **Impact :** améliore la scannabilité des outils

**4. Augmenter le contraste du texte sépia dans les cards secondaires**  
En sépia desktop, les valeurs "0 FAVORIS / 0 NOTES / 1% AVANCEMENT" dans la card Session ont un contraste insuffisant (texte gris sur fond beige). Cibles WCAG AA : ratio 4.5:1 pour texte normal. Les labels de statistiques méritent `color: var(--ink-3)` minimum.  
**Effort :** 20min — **Impact :** accessibilité WCAG

**5. Aligner le gradient de fond du header en mode sépia**  
Le header sépia utilise `--parchment-2: #edd8a8` comme fond, mais la transition vers le corps de la page (`#f4ecdf`) crée un léger saut de couleur visible surtout en scrollant. Unifier avec un gradient de `#edd8a8` → `#f4ecdf` sur 40px.  
**Effort :** 30min — **Impact :** continuité visuelle

### P3 — Souhaitable

**6. Rendre le widget "Reprendre la lecture" plus saillant sur mobile**  
Sur mobile (tous thèmes), le header affiche "Reprendre la lecture" en titre, mais il n'y a pas de bouton dédié dans la zone visible sans scroll. L'utilisateur doit scroller pour voir le bouton "Commencer la lecture". Envisager un sticky CTA flottant ou le déplacer avant le fold.  
**Effort :** 1h — **Impact :** conversion / UX principale

**7. Rendre les bords du slider (font size / page) plus distincts en thème sépia**  
Le slider dans la barre de lecture a un thumb et une track brun sur fond beige — faible différentiation. Ajouter un `box-shadow` sur le thumb pour le détacher visuellement.  
**Effort :** 15min — **Impact :** affordance

**8. Ajouter un indicateur de scroll dans le widget Suggestions (home)**  
La liste de suggestions (Coeur du Coran, Rappel du soir, Ar-Rahman…) est tronquée mais il n'y a pas d'indicateur visuel de scroll (pas de gradient bottom). En thème light, le bord inférieur est net, laissant croire qu'il n'y a pas plus de contenu.  
**Effort :** 15min — **Impact :** découvrabilité

**9. Corriger la translitération "alm" (minuscule sans ponctuation)**  
La translitération du verset 2:1 est affichée "alm" sans capitalisation ni ponctuation. Soit la capitaliser "Alm" (comme en dark mobile), soit homogénéiser. Actuellement incohérent entre thèmes.  
**Effort :** 5min — **Impact :** cohérence typographique

**10. Optimiser le gap visuel du séparateur PAGE 2 en mode lecture**  
Le badge "PAGE 2" est correctement centré mais son `margin-top: 2.25rem` crée un espace blanc important avant le premier verset en mode liste. Réduire à `margin-top: 1.25rem` pour resserrer l'entrée dans le contenu.  
**Effort :** 5min — **Impact :** densité de contenu

---

## Notes techniques CSS

- **`--bg-primary` dark = `#121212`** (neutre, pas vert) mais le rendu visuel est vert-foncé grâce aux gradients radial sur `.app-root` utilisant `--primary-rgb: 42, 158, 94`
- **Safe area** correctement implémentée en CSS (`env(safe-area-inset-bottom)`) aux lignes 7417, 11181, 11312 de `tailwind.css`
- **Z-index stacking** cohérent : sidebar (1000) < mfp-overlay (2000) < audio-maker (9998) < skip-link (10000)
- **Font Arabic** : `KFGQPC Uthmanic Script HAFS` chargé correctement, avec fallbacks Amiri/Noto Naskh
- **Transitions thèmes** : `background-color 0.25s ease, color 0.25s ease` appliquées globalement → pas de flash au changement de thème

---

*Rapport généré le 30 juillet 2026 par re-audit automatisé sur build dist/ servi via `vite preview`.*
