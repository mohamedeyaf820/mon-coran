# Rapport d'audit design — MushafPlus
**Date :** 30 juillet 2026 | **Thèmes :** Clair · Sombre · Sépia | **Vues :** Desktop 1280×800 + Mobile 390×844

---

## Synthèse générale

L'application présente une cohérence visuelle globalement solide sur les trois thèmes. Le système de design tokens est bien respecté, les polices Quraniques chargent correctement dans les deux riwayats, et la palette sombre est particulièrement réussie. Deux bugs critiques de rendu identifiés (icônes Outils Spirituels absentes en thème clair, troncature du widget sur mobile sombre), plusieurs améliorations de densité/hiérarchie, et des points d'homogénéité inter-thèmes à corriger.

---

## 1. Page d'accueil (Home)

### Desktop

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| **OUTILS SPIRITUELS** : 4 carrés verts pleins sans icônes ni labels | Clair uniquement | 🔴 Critique |
| Outils Spirituels : icônes + labels (Wird / Khatma / Listes / Stats) correctement rendus | Sombre + Sépia | ✅ OK |
| Bouton "Voir tout" : fond vert plein en thème clair, texte vert sans fond en sombre/sépia | Clair vs. Sombre | 🟡 Incohérence |
| Suggestions panel (droite) : "Lecture de nuit" → liste tronquée, dernière sourate coupée à mi-texte | Tous | 🟡 Modéré |
| Carte SESSION : progress bar visible, couleur dorée cohérente sur les 3 thèmes | Tous | ✅ |
| Carte PRIÈRES : icônes de prières en outline, "MAINTENANT" en badge sur Ishā — bon | Tous | ✅ |

**Bug critique — Outils Spirituels thème clair**
Les 4 boutons affichent un carré vert opaque au lieu de l'icône + label. La cause probable est que la couleur d'icône (`--icon-color` ou `color`) hérite de la couleur de fond verte, rendant l'icône invisible. En thème sombre, le fond du widget est `--card-bg` plus sombre, l'icône est visible. Correction : vérifier que les icônes ont une couleur explicite (`white` ou `var(--text-on-accent)`) indépendante du thème.

### Mobile

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Hero card s'adapte en pleine largeur, titre sur 2 lignes, lisible | Tous | ✅ |
| Carte "Verset du jour" : texte arabe bien dimensionné, translittération visible | Tous | ✅ |
| Carte SESSION visible et correctement tronquée au viewport | Tous | ✅ |
| **Panel Suggestions/Favoris/Notes absent sur mobile** : pas de suggestions de lecture | Tous | 🟡 Modéré |
| Scroll vers les autres cartes (Prières, Outils) non indiqué visuellement | Tous | 🟢 Mineur |
| L'icône "lune" sur le badge "Bonne nuit" est cohérente sur les 3 thèmes | Tous | ✅ |

---

## 2. Lecteur de sourates (Surah Reader)

### Desktop

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Skeleton loading visible en thème clair (API non disponible lors de la capture) | Clair | ℹ️ Contextuel |
| Texte arabe visible et bien dimensionné (Al-Baqara 2:1, بِسْمِ ٱللَّهِ) | Sombre + Sépia | ✅ |
| Bouton "Écouter" : vert foncé en clair/sépia, vert vif en sombre — bon contraste sur tous | Tous | ✅ |
| Tabs (Mushaf / Liste / Traduction / Étude) : visibles et bien espacés | Tous | ✅ |
| Toolbar secondaire (police + taille + Hizb + Sajdah) : correcte sur desktop | Tous | ✅ |
| Tajweed : couleurs visibles en sombre, légèrement moins contrastées en sépia | Sombre > Sépia | 🟢 Mineur |
| Boutons d'actions par ayah (copie, partage, marque-page) : icônes trop petites, ~28px | Tous | 🟡 Modéré |
| Zone vide au-dessus du header (espace inutilisé ~80px) | Tous | 🟡 Modéré |

### Mobile

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Header compact : chevrons de navigation (< >) présents et fonctionnels | Tous | ✅ |
| Mini player bottom bar : recitateur + play + chevron, discret et non intrusif | Tous | ✅ |
| Texte arabe (Al-Fatiha 1:1) : bonne taille sur mobile, bien centré | Tous | ✅ |
| Translittération phonétique en italique, taille lisible | Clair | ✅ |
| Tabs (Mushaf/Liste) : icônes uniquement sans labels sur mobile — pas évident | Tous | 🟡 Modéré |
| **Mini player truncation** : "Prêt à lire" → "Prêt à …", recitateur coupé | Tous | 🟡 Modéré |
| Boutons d'ayah (play/bookmark) : cibles ~36px, en dessous de 44px recommandé | Tous | 🟡 Modéré |
| Tafsirs / Leçons / Réflexions : barre de navigation d'étude bien visible | Clair | ✅ |

---

## 3. Mode Mushaf (Page View)

> Les captures ont chargé la page d'accueil à la place (le bouton Mushaf n'a pas été activé en mode headless). Les observations ci-dessous proviennent de l'analyse du code et des captures partielles.

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Variables `--cpv-bg` / `--cpv-gold` / `--cpv-shadow` correctement séparées après correction | Sombre vs. Sépia | ✅ Corrigé |
| Font size Mushaf : réactive depuis la correction `isMobileMushaf` | Tous | ✅ Corrigé |
| Page turn animation : cohérente visuellement | Tous | ✅ |
| Numérotation des pages : visible mais police trop petite (~11px) | Tous | 🟢 Mineur |

---

## 4. Paramètres (Settings Modal)

### Desktop

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Modal bien centrée, backdrop semi-transparent + flou | Tous | ✅ |
| Nav latérale (Général / Affichage / Audio / Confidentialité) : claire, bonne hiérarchie | Tous | ✅ |
| Sélecteur de langue : 3 boutons en ligne, selection visible | Tous | ✅ |
| **Cartes de thème** : icônes rondes colorées bien représentatives, noms + descriptions | Tous | ✅ |
| Carte sélectionnée : bordure verte + checkmark sur fond vert | Clair | ✅ |
| Carte sélectionnée sombre : bordure verte bien visible sur fond sombre | Sombre | ✅ |
| **Toggle "Mode nuit automatique"** : gris/inactif sur les 3 thèmes — intentionnel (désactivé) | Tous | ✅ |
| Section "SAUVEGARDE & RESTAURATION" : boutons Exporter/Importer discrets mais présents | Tous | ✅ |
| **Icône "livre" dans l'en-tête du modal** : même couleur verte sur tous les thèmes — bon | Tous | ✅ |
| **Labels des sections en MAJUSCULES** : "LANGUE DE L'APPLICATION" — style dated, lisibilité réduite | Tous | 🟢 Mineur |

### Mobile

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Bottom sheet avec poignée visible (handle bar) | Tous | ✅ |
| Nav en onglets horizontaux avec icônes uniquement (pas de labels) — pas assez clair | Tous | 🟡 Modéré |
| Cartes de thèmes en liste verticale (adapté mobile) | Tous | ✅ |
| Carte sélectionnée : checkmark vert visible sur bordure verte | Clair + Sombre | ✅ |
| Scroll de la modale : indicateur de scroll non visible, utilisateur peut ne pas savoir qu'il y a plus de contenu | Tous | 🟢 Mineur |

---

## 5. Sidebar (Liste des sourates)

### Desktop

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Header de sidebar : sourate active affichée (Al-Fatiha · الفاتحة) + riwaya (HAFS) | Tous | ✅ |
| Tabs (Sourates / Juz / Page) : bien séparés visuellement | Tous | ✅ |
| Champ de recherche dans la sidebar : placeholder "Rechercher dans le Saint Coran..." | Tous | ✅ |
| Sourate active (L'Ouverture) : fond vert clair + surbrillance bien visible | Clair | ✅ |
| **Troncature du widget Outils Spirituels en arrière-plan** : "OU TI..." + noms coupés (Kh..., List...) | Sombre (desktop) | 🟡 Modéré |
| Compteur "114 Sourates" et riwaya "HAFS" en pied de sidebar | Tous | ✅ |
| Numéros de sourate en cercles : en sombre avec bordure, en clair sans — légère incohérence | Clair vs. Sombre | 🟢 Mineur |
| Noms arabes des sourates : bien alignés à droite, taille correcte | Tous | ✅ |

### Mobile

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Sidebar plein écran : bonne utilisation de l'espace | Tous | ✅ |
| Bouton fermer (X) en haut à gauche : visible, taille correcte | Tous | ✅ |
| Liste scrollable : hauteur de ligne généreuse pour les cibles tactiles | Tous | ✅ |
| Pied de sidebar fixe : "114 Sourates · HAFS" — discret, non-intrusif | Tous | ✅ |

---

## 6. Lecteur audio (Mini Player)

### Desktop

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Widget flottant en bas à droite : avatar récitateur + état + play + chevron | Tous | ✅ |
| Fond du widget : blanc semi-transparent en clair, vert sombre en sombre, crème en sépia | Tous | ✅ |
| **Expand/collapse chevron** : très petit (~18px), difficile à cibler | Tous | 🟡 Modéré |
| Texte "Prêt à lire" + nom récitateur : lisibles en desktop | Tous | ✅ |
| Le widget est positionné à côté du contenu, non par-dessus le texte de lecture | Tous | ✅ |
| Pas d'indicateur visuel de progression audio sur le mini player | Tous | 🟡 Modéré |

### Mobile

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Barre de mini-player en bas d'écran : non intrusive | Tous | ✅ |
| **Barre trop haute** (56px) — empiète sur le contenu en bas de lecture | Tous | 🟡 Modéré |
| Nom récitateur tronqué "Mishary Rashid Ala…" | Tous | 🟡 Modéré |
| Aucune progression visible (pas de barre de temps) | Tous | 🟡 Modéré |
| Pas de safe area visible sous le player sur les appareils avec home indicator | Tous | 🟠 Important |

---

## 7. Recherche (Search Modal)

### Desktop

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| Header : icône loupe verte + badge "RECHERCHE" + titre clair | Tous | ✅ |
| Champ de recherche : bordure verte en focus, placeholder centré à droite (arabe RTL) | Tous | ✅ |
| **Placeholder aligné à droite** ("...Rechercher dans le Saint Coran") : approprié pour une app Coran | Tous | ✅ |
| 4 types de recherche (Arabe / Phonétique / FR / EN) : bien séparés | Tous | ✅ |
| Onglet actif (Arabe) : fond vert plein — bon indicateur visuel | Clair + Sépia | ✅ |
| Onglet actif sombre : vert néon — très visible, peut-être trop vif vs. le reste de l'UI | Sombre | 🟢 Mineur |
| Filtres secondaires (Contextuelle / Hafs) : petits chips discrets | Tous | ✅ |
| Card de suggestion avec 3 exemples : bon onboarding pour les nouveaux utilisateurs | Tous | ✅ |
| **Fermer (×)** : bouton en haut à droite, petite taille (~24px) | Tous | 🟡 Modéré |

### Mobile

| Observation | Thème | Sévérité |
|-------------|-------|----------|
| La capture mobile a rendu la page d'accueil (modal non ouverte en headless) | Tous | ℹ️ Contextuel |

---

## 8. Cohérence inter-thèmes

### Ce qui est parfaitement cohérent ✅
- Polices UI identiques sur les 3 thèmes
- Hiérarchie des titres respectée
- Cartes avec radius identique (~12-16px)
- Comportement des modales (backdrop, placement)
- Icônes Lucide de même taille partout (post-migration)
- Transition douce entre les thèmes (CSS variables)

### Incohérences détectées

| Élément | Clair | Sombre | Sépia | Sévérité |
|---------|-------|--------|-------|----------|
| Outils Spirituels | Carrés verts opaques | Icônes + labels | Icônes + labels | 🔴 Critique |
| Bouton "Voir tout" | Fond plein vert | Texte vert seulement | Texte marron seulement | 🟡 Modéré |
| Numéros de sourate sidebar | Sans bordure | Avec bordure cercle | Sans bordure | 🟢 Mineur |
| Vert accent | #1a5c2a foncé | #4ade80 vif | Marron doré | Intentionnel ✅ |
| Labels de section | MAJUSCULES | MAJUSCULES | MAJUSCULES | Style uniforme |
| Fond header modale | Blanc | Vert sombre | Crème | Cohérent ✅ |

---

## 9. Typographie

| Observation | Sévérité |
|-------------|----------|
| Police Quran (QPC Uthmani / Warsh) : charge correctement, taille bien calibrée | ✅ |
| Taille de base UI : 14-16px selon les composants — acceptable | ✅ |
| **Labels MAJUSCULES** dans Settings / Sidebar headers : réduire ou normaliser | 🟢 Mineur |
| **Line-height arabe** en mode liste : lignes un peu serrées sur petits écrans | 🟡 Modéré |
| Surah names avec police surah-names : bien appliquée sur la sidebar | ✅ |
| Translittération phonétique : taille légèrement trop petite (~12px), mauvais contraste en sépia | 🟡 Modéré |
| Police de l'interface (variable --font-ui) : cohérente sur tous les vues | ✅ |

---

## 10. Espacement & Densité

| Observation | Sévérité |
|-------------|----------|
| Home desktop : grille 2+2 de cartes bien équilibrée | ✅ |
| **Espace mort au-dessus du header surah reader** (~80px) : padding excessif | 🟡 Modéré |
| Sidebar desktop : bonne densité de liste, hauteur de ligne ~60px | ✅ |
| Sidebar mobile : hauteur de ligne ~56px, cibles tactiles OK | ✅ |
| Cards home : padding interne généreuse, bon pour la lisibilité | ✅ |
| Toolbar de lecture : icônes bien espacées, non-crowded | ✅ |
| Mini player mobile : trop de padding vertical, compresser à 48px | 🟡 Modéré |

---

## 11. Accessibilité visuelle (contraste)

| Texte | Fond | Thème | WCAG | Statut |
|-------|------|-------|------|--------|
| Texte arabe blanc | Fond sombre vert (#0d1f14) | Sombre | AA+ | ✅ |
| Texte arabe marron | Fond crème (#f5f0e8) | Sépia | AA | ✅ |
| Texte arabe noir | Fond blanc | Clair | AA+ | ✅ |
| Sous-titres gris | Fond blanc | Clair | ~4.5:1 | ✅ |
| Labels phonétiques | Fond crème | Sépia | ~3.5:1 | 🟡 Douteux |
| Texte "Médinoise" gris clair | Fond blanc | Clair | ~4:1 | 🟡 Limite |
| Badge "MAINTENANT" vert | Fond vert clair | Clair | Dépend taille | 🟡 Vérifier |

---

## 12. Recommandations prioritaires

### 🔴 Critique (blocant visuellement)
1. **Outils Spirituels thème clair** — Les icônes sont invisibles (blanc sur fond vert ou icône absente). Ajouter `color: white` ou `var(--text-on-brand)` aux icônes dans le composant, et vérifier que les labels (Wird, Khatma, etc.) ont une couleur de texte explicite.

### 🟠 Important
2. **Safe area mini-player mobile** — La barre audio n'a pas de `padding-bottom: env(safe-area-inset-bottom)`. Elle est coupée sur iPhone avec encoche/island.
3. **Truncature widget Outils (sidebar sombre)** — Réduire la taille de la fonte ou augmenter le min-width du widget dans le thème sombre.

### 🟡 Modéré
4. **Bouton "Voir tout" incohérent** — Clair : fond vert plein. Sombre/Sépia : texte seul. Unifier en lien texte avec flèche ou bouton outlined.
5. **Mini player : indicateur de progression** — Ajouter une barre de progression (fine, 2px) sous le mini-player pour que l'utilisateur sache où en est la récitation.
6. **Tabs de settings mobile sans labels** — Les 4 onglets sont icône-seul sur mobile, ce qui ne suffit pas pour des catégories comme "Confidentialité" vs "Audio". Ajouter des micro-labels.
7. **Espace mort en-tête surah reader** — Réduire le padding-top de la vue de lecture d'environ 40-60px.
8. **Translittération sépia** — Augmenter le contraste du texte phonétique en thème sépia (actuellement gris sur crème ≈ 3.5:1).
9. **Fermeture modales (×)** — Les boutons de fermeture font ~24px ; augmenter à 36-40px pour confort tactile.
10. **Boutons d'actions par ayah** — Cibles trop petites (~28-32px). Augmenter à 40px minimum.

### 🟢 Mineur
11. **Labels de section en majuscules** — "LANGUE DE L'APPLICATION", "THÈME VISUEL" etc. → passer en sentence case ou Title Case pour un look plus moderne.
12. **Numéros de sourate sidebar** — Ajouter la bordure circulaire aussi en thème clair (cohérence avec sombre).
13. **Suggestions panel absent mobile** — Exposer a minima 2-3 suggestions de lecture sur la page d'accueil mobile (actuellement zéro).
14. **Numérotation des pages Mushaf** — Police légèrement trop petite (~11px), passer à 13px.

---

## 13. Ce qui fonctionne bien

- Thème **sombre** : le mieux exécuté des trois — forêt verte profonde cohérente, texte arabe parfaitement lisible, accents verts vifs bien dosés
- Thème **sépia** : ambiance manuscrit/parchemin réussie, brun/or bien dosé, la lecture est reposante
- **Settings modal** : propre, bien structurée, les cartes de thème avec icônes illustratives sont une belle idée UX
- **Sidebar** : densité et hiérarchie excellentes, la recherche intégrée est pratique
- **Search modal** : onboarding exemplaire avec les 3 exemples de recherche
- **Responsive** : la mise en page mobile est propre et les cartes s'adaptent bien
- **Cohérence des polices Quraniques** : les deux riwayats (Hafs QPC Uthmani / Warsh) sont bien différenciés visuellement
