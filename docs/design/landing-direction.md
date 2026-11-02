# Landing MushafPlus : direction artistique « Folio »

Auteure : Sofia (direction artistique). Date : 2026-11-02. Destinataire : Ibrahima (intégration).
Statut : proposée, rien n'est codé, rien n'est committé. Les assets listés plus bas sont déjà dans le worktree (non suivis par git).

Sources de vérité : app mobile Flutter `main` = `7845fd0` (0.1.0+2), téléphone Android (captures du 2026-11-02). Dépôt web : branche `feat/landing-page`, HEAD `71148d02`.

---

## 1. Verdict sur l'existant

Rendu de `127.0.0.1:3060` à 375 et 1440 px. Constats, pas des goûts :

| Constat | Pourquoi c'est « moyen » |
| --- | --- |
| Hero = grande carte verte avec motif d'étoiles et deux téléphones inclinés | Schéma SaaS générique. Le vert du hero n'est celui d'aucun des thèmes de l'app (Lueur du Fajr a un vert plus clair, Nuit de Médine un vert presque noir). |
| Bandeau de pastilles qui défile (« Hafs », « Warsh », « Hors ligne »…) puis 4 tuiles chiffrées | Deux bandes de preuve empilées avant tout contenu. Les tuiles chiffrées sont le cliché « stats » des landings. |
| Trois rangées image/texte alternées, chacune avec liste à coches et bouton plein | Trois fois la même mise en page : rien ne distingue Lire, Invocations et Écouter. |
| Les captures sont des images fixes dans un cadre de téléphone, sans lien avec le thème de la page | La page ne respire pas avec l'app. |
| La démo « comment ça marche » commence par la vidéo d'onboarding | Obsolète : depuis le commit mobile `ef6e3b9` l'onboarding finit sur la lecture, et la vidéo montre un parcours « en quatre étapes ». Voir §11. |
| `landing.css` : 586 lignes, `transition` sur propriétés nommées mais couleur de fond et bordure animées | Acceptable, mais aucun scénario d'ensemble : chaque bloc se révèle de la même façon. |

---

## 2. Benchmark : pages réellement ouvertes

Méthode : pages rendues dans un navigateur (Playwright, 1440 × 900, défilement), captures lues par moi. Inspiration, adaptation, copie interdite sont distinguées. Les captures sont dans le scratchpad (`bench/`).

| Référence | URL | Geste retenu (précis) | Statut |
| --- | --- | --- | --- |
| GoShuin (AE Studio, Awwwards Mobile Apps) | https://aestudio.studio/goshuin/en | La page est un **livre** : colonne de gauche en serif géant, filets fins, légendes en petites capitales espacées, couverture « à soulever », et un pied de page qui compte les pages (« Page 01 / 14 · Every Stamp, A Memory ») avec Précédent/Suivant. Un bouton « Pause motion » est visible en permanence. | **Inspiration** : le principe « le site est un livre foliotté ». Adaptation : le mushaf lui-même (cadre doré, repères de page et de juz de l'app) remplace le carnet japonais. Copie interdite : fond papier pointillé, motifs de vagues, mise en page 50/50 identique. |
| Grail | https://grail-app.com/ | Un mot display géant (« RECLAIM ») dont les lettres se dissolvent en opacité pendant que des cartes passent en profondeur : la typographie est une matière qui réagit au défilement. | **Adaptation** : un seul mot du titre change d'opacité avec le défilement. Écarté : fond noir, cartes 3D. |
| Mira Life | https://miralife.app/ | Un paragraphe « manifeste » dont les mots passent du gris au blanc à mesure qu'on défile : la lecture est rythmée par le geste. | **Adaptation** : une seule phrase de promesse, pas un paragraphe. Écarté : fond noir, orbe lumineux. |
| Tarteel | https://tarteel.ai/ | Contre-exemple utile : hero photo plein cadre d'un visage + carrousel de téléphones sur un fond orange sans rapport avec le produit. Retenu : un titre court et un seul bouton. | **Écarté** : pas de photographie de personnes (aucune dans l'app, droits non établis), pas de carrousel. |
| Spotify (accueil web) | https://www.spotify.com/fr/ (redirige vers le lecteur web) | Le produit EST la page : étagères de pochettes rondes pour les artistes, le chrome de l'app visible. | **Adaptation** : pour Écouter, les récitants en pastilles rondes (photos déjà dans la capture). |
| Headspace | https://www.headspace.com/ (texte seulement, pas de rendu) | « What kind of headspace are you looking for? » : l'entrée est une **intention**, pas une fonctionnalité. | **Adaptation** : les trois entrées sont formulées comme des intentions (« Je veux lire », « Je veux invoquer », « Je veux écouter »). Choix de verbe : « prier » renverrait à la salât et à l'onglet Prières, que la landing ne montre pas. |
| Awwwards, catégorie Mobile Apps | https://www.awwwards.com/websites/mobile-apps/ | Liste lue (texte) : a servi à trouver GoShuin, Grail, Mira Life. | Source de repérage. |

Non lues, déclarées : Dribbble (`https://dribbble.com/search/quran-app`, réponse HTTP 202 anti-bot, rien d'exploitable), Calm (`https://www.calm.com/`, 403), Linear (capturée mais non exploitée dans la décision).

Contrôle de pertinence (structure, pas style) pour les trois gestes porteurs :

| Geste | Structure (le « pourquoi ça marche ») | Verdict pour MushafPlus |
| --- | --- | --- |
| GoShuin, page foliottée | Le contenant (livre) dit la nature du produit (journal) ; la navigation est une pagination. | **Pertinent avec adaptation** : le produit est un mushaf, le contenant livre est littéral, pas une métaphore plaquée. |
| Grail, typo qui se dissout | L'attention est guidée par un seul élément qui change d'état. | **Pertinent avec adaptation** : à limiter à un mot, jamais sur du texte coranique (il n'y en a pas sur la page). |
| Mira Life, mots qui s'allument | Le rythme de lecture est contrôlé par le geste. | **Pertinent** pour une phrase de promesse de 8 à 12 mots. |

---

## 3. Direction retenue : « Folio »

**Idée.** La page est un mushaf feuilleté. Chaque section est un folio numéroté (I à V) cerclé d'un filet doré fin avec losanges d'angle, comme le cadre de la page de mushaf de l'app (visible sur `mob-reader-*.webp`). Et le geste signature : **la page prend la couleur du thème**. Un seul téléphone réel reste à l'écran ; en défilant, sa capture passe de Lueur du Fajr à Parchemin puis Nuit de Médine (les trois thèmes que le site web possède réellement), et le fond de toute la page se fond avec elle. Les deux thèmes qui n'existent que sur mobile (Rose de l'aube, Nuit océan) n'apparaissent qu'au Folio III, sous l'étiquette « application mobile » : le hero ne promet pas au visiteur web ce qu'il ne trouvera pas.

Pourquoi elle sert la décision du visiteur (doctrine conversion) : la première section cadre « qui, quoi » en une phrase et montre l'app réelle ; les trois entrées sont des intentions ; les thèmes sont la preuve de soin ; le bloc mobile ne promet que ce qui existe.

**Alternative écartée : « Veillée »** (hero nocturne plein cadre, photographie et récitants en gros plan, à la Tarteel). Écartée parce qu'elle exige de la photographie de personnes que ni l'app ni le dépôt ne fournissent, qu'elle est déjà le réflexe des apps coraniques, et qu'elle écrase le texte sous l'image, ce que le design system interdit en priorité (« keep the reading surface calm »).

### Contrôle anti-générique

| Question | Réponse |
| --- | --- |
| Retire-t-on les éléments du template ? | Oui : carte hero verte étoilée, bandeau de pastilles, tuiles chiffrées, rangées alternées à coches. |
| Les polices / icônes sont-elles dans `interdits.json` ? | Voir §4 : typo système imposée par le design system (aucune webfont déclarée) ; les icônes `lucide-react` de la landing actuelle **sont** dans `interdits.json` et sont remplacées par 7 SVG maison. |
| Dégradé violet/rose « IA », texte en dégradé ? | Aucun. La couleur de page vient des tokens des thèmes de l'app. Le rose de « Rose de l'aube » n'apparaît que comme teinte de fond pâle `#FBF3F6` pendant la phase du thème Rose, c'est une couleur du produit, pas un décor. |
| Placeholders, textes clichés ? | Aucun : toutes les images sont des captures réelles ; copie sans « Elevate », « Seamless »… |
| Reconnaissable au premier regard ? | Oui, par : le cadre doré à losanges, la numérotation en folios, le fond qui change avec le thème. Ces trois éléments ne sont dans aucune autre landing de lecture ou d'écoute que j'ai ouverte. |
| Anti-recyclage | Registre du coffre interrogé pour `type_projet` « landing » et « site-vitrine » : vide. Rien à exclure. |

---

## 4. Contraintes du design system (lues dans `docs/DESIGN_SYSTEM.md`) et décisions

| Contrainte | Source | Décision |
| --- | --- | --- |
| Police latine = pile système `--ux-font-ui`, aucune webfont livrée. Une webfont de marque exigerait : auto-hébergée, sous-ensemblée, budgétée, déclarée dans `index.html` ou `tailwind.css`. | DESIGN_SYSTEM.md, § Typography (décision 2026-09-24) | **Pas de dérogation demandée.** La signature vient de l'échelle (titre très grand, léger contraste de graisse 700 / 400), des filets et de la composition, pas d'un couple de polices. Note : la pile `--ux-font-ui` contient « Roboto » en repli de plateforme (Android), ce n'est pas un choix de marque ; `interdits.json` le liste mais le design system le rend inévitable. À signaler à Cherif, pas à corriger ici. |
| Arabe : `--ux-font-ar` (Noto Naskh Arabic, Scheherazade New). | tailwind.css:3281 | Utiliser cette variable pour tout texte arabe de la page. Aucun texte coranique n'est saisi : uniquement des captures. |
| Icônes : `lucide-react` partout dans l'app (67 fichiers), via `src/components/ui/icon.jsx`. | grep du worktree ; `anti_slop.py` rend 70 ERREURS sur le dépôt entier | **Décision pour la landing seule** : 7 SVG dessinés pour la page, dans un fichier `src/components/landing/landingIcons.jsx` (livre ouvert, casque, mains en prière, téléphone, flèche, lecture, coche), trait 1.6 px, rayon de bout rond, grille 24. La landing ne doit plus importer `lucide-react`. Le reste de l'app n'est pas touché : à trancher par Cherif (la liste ne se contourne pas, la modifier est sa décision). |
| Budget `LandingPage.jsx` ≤ 12 kB. | SCREEN_UX_BUDGETS.md | Les icônes inline et la logique d'animation vivent **hors** de ce fichier : `landingIcons.jsx`, `useLandingMotion.js`. |
| Tokens existants avant tout ajout. | AGENTS.md | Réutiliser `--bg-primary`, `--text-primary`, `--theme-border` ; n'ajouter que les `--landing-*` du §5. |
| Cibles tactiles 44 px, RTL natif, FR/EN/AR. | AGENTS.md | Voir §9 et §12. |
| Aucune URL de store inventée. | SCREEN_UX_BUDGETS.md | `site.config.json` `mobileApp.androidUrl` / `iosUrl` restent vides ; le bloc dit « Bientôt sur Android et iOS ». |
| Entrées : trois seulement (lire, invocations, écouter) + bloc mobile ; pas de prières, recherche, réglages. | SCREEN_UX_BUDGETS.md | Respecté. Le bouton principal continue la lecture (« Continuer · sourate v.N ») avant « Commencer la lecture ». |

---

## 5. Tokens

Page (CSS, à ajouter dans `src/styles/landing.css`, sous `.landing`) :

```css
.landing {
  /* mouvement */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --landing-dur-press: 140ms;
  --landing-dur-ui: 220ms;
  --landing-dur-reveal: 520ms;      /* éditorial, hors UI fréquente */
  --landing-stagger: 60ms;
  /* espacement (base 4) */
  --landing-gutter: 16px;           /* mobile ; 24px dès 768, 32px dès 1200 */
  --landing-section: clamp(72px, 12vw, 160px);
  --landing-measure: 62ch;          /* largeur de lecture du texte */
  /* rayons : une famille */
  --landing-r-frame: 28px;          /* cadre d'appareil et cartes */
  --landing-r-ctl: 14px;            /* boutons, champs */
  /* ombres */
  --landing-shadow-device: 0 40px 80px -32px rgb(0 0 0 / .45), 0 2px 0 rgb(255 255 255 / .06) inset;
  --landing-rule: 1px;              /* filet fin et filet du folio */
  /* type (pile système) */
  --landing-h1: clamp(2.5rem, 9vw, 5.5rem);   /* 40 px à 375, 88 px à 1440 */
  --landing-h2: clamp(1.75rem, 5vw, 3rem);
  --landing-lead: clamp(1.0625rem, 2.2vw, 1.25rem);
  --landing-kicker: 0.75rem;        /* petites capitales, letter-spacing .14em */
}
:where(button, [role="button"], a, label[for], summary) { cursor: pointer; }
```

Palette de page par thème : **valeurs lues dans `lib/design_system/tokens/app_palette.dart` du dépôt mobile** (même nom de rôle). Le fond de page prend `bg` du thème actif ; l'or sert aux filets et aux losanges seulement, jamais au texte sur fond clair.

| Thème (FR / EN / AR) | bg | surface | text | muted | primary (action) | or du cadre | Contraste mesuré texte/bg · muted/bg · primary/bg · or/bg |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lueur du Fajr / Fajr Glow / نور الفجر | `#F7F9F8` | `#FFFFFF` | `#17211C` | `#5D6C64` | `#0B6235` | `#B48732` | 15,63 · 5,23 · 7,06 · **3,08** |
| Parchemin du Mushaf / Mushaf Parchment / رق المصحف | `#F3E8CF` | `#FFF6E3` | `#241505` | `#6B502A` | `#7C4A17` | `#A9782F` | 14,57 · 6,15 · 6,06 · **3,19** |
| Rose de l'aube / Dawn Rose / وردة الفجر | `#FBF3F6` | `#FFFAFB` | `#2B1722` | `#6E5260` | `#A1255A` | `#B48732` | 15,42 · 6,34 · 6,58 · **2,98** |
| Nuit de Médine / Madinah Night / ليل المدينة | `#101412` | `#191F1C` | `#ECEAE3` | `#9CA69E` | `#43BD86` (primaryInk) | `#D0AD62` | 15,43 · 7,39 · 7,84 · 8,70 |
| Nuit océan / Ocean Night / ليل المحيط | `#0A111C` | `#121C2C` | `#E7EDF6` | `#93A2B8` | `#2A78B8` → **utiliser `#E0C070` (accent) pour le texte d'action** | `#D2B066` | 16,08 · 7,30 · **4,03 (échoue pour texte < 18 px)** · 9,14 |

Règles qui découlent des mesures : l'or du cadre sur les thèmes clairs fait 3:1 (décoratif seulement, jamais porteur de sens ni de texte) ; sur Nuit océan, le bleu `primary` ne s'emploie pas pour du texte courant ; bouton principal sur toutes les pages = fond `cta` `#F4DDA0` du thème, texte `onCta` `#153323` (contraste 10,26).

Source des noms de thème et du nombre (5) : `lib/features/preferences/domain/entities/app_preferences.dart:6` (`enum ThemeChoice { light, sepia, rose, dark, ocean }`) et `lib/l10n/app_{fr,en,ar}.arb` lignes 1150-1154 / 683-687. Les deux thèmes nouveaux sont **Rose de l'aube** et **Nuit océan** (commit `d8712cd`).

---

## 6. Sections, dans l'ordre

Décision d'ordre : la démo « comment ça marche » et les trois entrées disent la même chose (lire, écouter, invocations). Je les fusionne : **une seule section, un téléphone qui reste à l'écran et trois entrées qui le pilotent**. Cinq folios au total, pas six.

Mobile d'abord (375 px), ensuite desktop. Largeurs de capture : 720 px natifs (`.webp`), affichés à 260–300 px en mobile, 340–380 px en desktop.

### Folio I : Hero « La vraie app »

- **Mobile 375** : barre (marque, FR/EN/ع, Ouvrir). Kicker en petites capitales. Titre sur 3 lignes, `--landing-h1`. Une phrase d'appui. Bouton principal (continuer ou commencer), lien secondaire « Ouvrir MushafPlus ». Puis le téléphone, **coupé par le bas de l'écran** (on voit les deux tiers : l'invitation à défiler). Enfin le colophon : une ligne de faits séparés par filets (pas de tuiles).
- **Desktop 1440** : titre à gauche (colonne 5/12), téléphone à droite (colonne 7/12) à cheval sur le filet du folio ; colophon en bas de la hauteur de fenêtre. Pas de carte colorée : le fond est celui du thème actif.
- **Image** : `mob-home-fajr.webp`, `mob-home-parchemin.webp`, `mob-home-medine.webp` empilées dans le cadre (un seul `<img>` au chargement : `mob-home-fajr`, les deux autres en lazy). **Pas** `mob-home-rose` ni `mob-home-ocean` dans le hero.
- **Titre / copie** : voir §8.

### Folio II : Trois entrées (démo)

- **Mobile 375** : trois cartes empilées. Chaque carte : numéro de folio, intention (« Je veux lire »), une phrase, le bouton vers l'app, puis la vidéo en cadre de téléphone (poster d'abord). Pas de listes à coches.
- **Desktop ≥ 1024** : colonne gauche collante = téléphone (vidéo de l'entrée active), colonne droite = les trois entrées qui défilent ; l'entrée visible pilote la vidéo.
- **Entrée Lire** : `mob-reader-scroll.mp4` (poster `.jpg`). En repli sans vidéo : `mob-reader-fajr.webp`.
- **Entrée Invocations** : `mob-duas-scroll.mp4`. Repli : `mob-duas-hub.webp`.
- **Entrée Écouter** : `mob-listen-player.mp4`. Repli : `mob-listen.webp`. Sous la vidéo, ligne des récitants en pastilles rondes (déjà dans la capture ; ne pas ajouter de photos de récitants hors de celles déjà servies par l'app).
- **Hiérarchie** : une action principale par entrée (le bouton vers l'écran correspondant, mêmes cibles qu'aujourd'hui : `openReading`, `openDuas`, `openAudio`).

### Folio III : Cinq thèmes

- **Message** : la page reflète ce que l'app permet. Attention : **le site web n'a que 3 thèmes** (`src/data/themes.js` : clair, sépia, nuit ; `ocean` y est un alias hérité de `dark`). La section parle donc de **l'application mobile** : « Cinq thèmes dans l'application mobile » et signale les deux nouveaux (Rose de l'aube, Nuit océan).
- **Mobile 375** : titre, puis rail horizontal à accroche (`scroll-snap-type: x mandatory`) de cinq vignettes `mob-home-<thème>.webp` à 220 px, légende sous chacune avec le nom du thème (FR/EN/AR) ; les deux nouveaux portent une étiquette « Nouveau ». Dessous : la vidéo `mob-themes.mp4` (le geste réel de choix du thème, 17 s).
- **Desktop 1440** : les cinq téléphones côte à côte (un par colonne de 5), recouvrement léger, le survol (pointeur fin) remonte celui visé de 8 px ; la vidéo est remplacée par `mob-themes-picker-a/b.webp` côte à côte (le sélecteur des réglages).
- **Comportement signature** : au passage d'une vignette au centre (mobile) ou au survol/focus (desktop), la page se teinte du fond du thème. Implémentation par calques de fond empilés dont on change l'opacité (trois dans le hero, cinq au Folio III ; pas d'animation de `background-color`). **Pour Ibrahima** : le défilement de la landing se fait dans `.landing` (`position: fixed; overflow-y: auto`), pas dans la fenêtre : le `root` de chaque `IntersectionObserver` et l'ancêtre de tout `position: sticky` doivent viser ce conteneur, comme le fait déjà `useLandingMotion`.

### Folio IV : Sur mobile

- **Message honnête** : « Bientôt sur Android et iOS ». Aucun bouton de store (les deux URL de `site.config.json` sont vides ; `storeUrl()` continue de n'afficher un bouton que pour une URL `https://`).
- **Contenu vérifié** : même lecture, place retrouvée, téléchargements pour écouter sans connexion, 5 thèmes, radios thématiques (4 stations visibles dans la capture).
- **Image** : `mob-radio.webp` (Radio 4) et `mob-player.webp` (lecteur) en deux cadres décalés ; sur mobile un seul visible (`mob-player`).

### Folio V : Pied

- Marque, promesse (« Gratuit, sans compte, sans publicité » : **à re-vérifier avant publication**, voir §12), liens À propos / Confidentialité / Sources, chacun à 44 px de haut.

---

## 7. Scénario d'animation

Rappel de la grille (skill `animate`) : fréquence **rare / première visite** pour tout ce qui est éditorial, donc budget de plaisir autorisé, mais sur `transform` et `opacity` uniquement. Aucune animation sur une action fréquente (boutons de langue, liens).

| # | Animation | Raison nommée | Outil | Propriétés | Courbe / durée |
| --- | --- | --- | --- | --- | --- |
| 1 | Titre du hero : chaque ligne monte de 16 px en entrant | État initial, préserver l'attention | CSS (`@starting-style` ou classe posée au premier rendu) | `transform`, `opacity` | `--ease-out`, 520 ms, décalage 60 ms par ligne |
| 2 | Un seul mot du titre passe de 35 % à 100 % d'opacité au défilement (geste Grail) | Guider l'attention | `IntersectionObserver` + variable CSS par `rAF` | `opacity` | linéaire (suit le scroll) |
| 3 | Fond de page qui change avec le thème | Explication (le produit a plusieurs thèmes) | Calques `position:absolute` (3 dans le hero, 5 au Folio III), un seul `opacity:1` à la fois | `opacity` | `--ease-out`, 600 ms |
| 4 | Capture du téléphone : fondu croisé entre deux thèmes | Prévenir un changement brusque | Deux `<img>` superposées | `opacity` (+ `transform: scale(.985→1)` sur l'entrante) | `--ease-out`, 400 ms |
| 5 | Révélation des blocs au défilement (une fois) | Éviter l'apparition brute | `IntersectionObserver`, classe `is-in` | `transform: translateY(12px→0)`, `opacity` | `--ease-out`, 520 ms, décalage 60 ms |
| 6 | Filet doré du folio qui « se trace » : quatre segments (haut, bas, gauche, droite) | Délice, rare | CSS, un `<span>` par segment | `transform: scaleX(0→1)` ou `scaleY(0→1)`, `transform-origin` posé sur l'angle de départ | `--ease-in-out`, 700 ms, une seule fois |
| 7 | Vidéo de la section Entrées : lecture quand elle est à 60 % visible, pause sinon | État | `IntersectionObserver` | n/a | n/a |
| 8 | Hover des cartes et du bouton principal : lift de 2 px | Retour | CSS | `transform` | `ease`, 160 ms |
| 9 | Pression d'un bouton | Retour | CSS `:active` | `transform: scale(.97)` | 140 ms |

Règles de livraison, toutes obligatoires :

- **Jamais** `transition: all`. Toujours les propriétés nommées.
- **Jamais** `scale(0)`. Entrées : `translateY` + `opacity`, ou `scale(.97)` + `opacity`.
- Hover uniquement sous `@media (hover: hover) and (pointer: fine)`.
- `@media (prefers-reduced-motion: reduce)` : **aucune animation et aucun autoplay**. Les calques de fond se réduisent à un seul (le thème système), les vidéos affichent leur poster avec **contrôles natifs**, les révélations sont instantanées, le filet doré est tracé d'emblée. Pas de variante « plus douce » : zéro.
- Vidéos : `muted`, `playsinline`, `preload="none"`, `poster` obligatoire, et **contrôles natifs visibles dès que l'autoplay est désactivé** (reduced motion, ou lecture bloquée). Un bouton « Pause » visible quand l'autoplay est actif (leçon de GoShuin : « Pause motion »).
- Le scénario ne doit **jamais** retarder le contenu : le texte est lisible sans JavaScript d'animation (classe `landing--motion` ajoutée seulement si l'API est disponible, comme aujourd'hui).
- À faire sentir à l'œil (non jugeable sur le code) : le fondu croisé #4 et le tracé du filet #6 ; les rejouer à 3× de durée dans l'inspecteur d'animations.

---

## 8. Copie proposée (FR / EN / AR)

Règles : phrases courtes, aucune affirmation hors du §11, aucun texte coranique, aucune promesse de store.

### Hero

| | FR | EN | AR |
| --- | --- | --- | --- |
| Kicker | Coran · Invocations · Récitations | Quran · Supplications · Recitations | القرآن · الأدعية · التلاوات |
| Titre | Le Coran, tel que vous le lisez. | The Quran, the way you read it. | القرآن، كما تقرؤه أنت. |
| Appui | Hafs ou Warsh, 54 récitateurs, la Citadelle du musulman. Gratuit, même hors ligne. | Hafs or Warsh, 54 reciters, the Fortress of the Muslim. Free, even offline. | حفص أو ورش، ٥٤ قارئًا، وحصن المسلم. مجاني، وحتى دون اتصال. |
| Bouton | Continuer · {sourate} v.{n} / Commencer la lecture | Continue · {surah} v.{n} / Start reading | متابعة · {surah} آية {n} / ابدأ القراءة |
| Lien | Ouvrir MushafPlus | Open MushafPlus | افتح مصحف بلس |
| Colophon | 2 lectures · 54 récitateurs · 267 invocations · FR · EN · AR | 2 readings · 54 reciters · 267 supplications · FR · EN · AR | روايتان · ٥٤ قارئًا · ٢٦٧ دعاءً · عربي · فرنسي · إنجليزي |

Note : le titre actuel (« Le Coran dans la lecture que vous suivez ») est conservé dans les métadonnées SEO tant que Cherif n'a pas validé le nouveau.

### Entrées

| | FR | EN | AR |
| --- | --- | --- | --- |
| Lire | **Je veux lire.** Pages de mushaf à cadre doré, ou verset par verset avec traduction et translittération. Votre place est gardée. | **I want to read.** Mushaf pages with a golden frame, or verse by verse with translation and transliteration. Your place is kept. | **أريد أن أقرأ.** صفحات المصحف بإطار ذهبي، أو آية آية مع الترجمة والنقل الصوتي. مكانك محفوظ. |
| Invocations | **Je veux invoquer.** La Citadelle du musulman : 132 chapitres, 267 invocations, avec leurs sources. | **I want to supplicate.** The Fortress of the Muslim: 132 chapters, 267 supplications, with their sources. | **أريد أن أدعو.** حصن المسلم: ١٣٢ بابًا، ٢٦٧ دعاءً، مع مصادرها. |
| Écouter | **Je veux écouter.** Choisissez une voix : la sourate entière ou verset par verset, avec le lecteur qui suit. | **I want to listen.** Pick a voice: the whole surah or verse by verse, with the player following along. | **أريد أن أستمع.** اختر صوتًا: السورة كاملة أو آية آية، والمشغّل يتابع معك. |
| Boutons | Lire le Coran / Ouvrir les invocations / Écouter | Read the Quran / Open the supplications / Listen | اقرأ القرآن / افتح الأدعية / استمع |

### Thèmes

| | FR | EN | AR |
| --- | --- | --- | --- |
| Titre | Cinq thèmes dans l'application mobile. | Five themes in the mobile app. | خمسة مظاهر في تطبيق الجوال. |
| Texte | Du jour clair à la nuit bleue. Rose de l'aube et Nuit océan sont les deux derniers arrivés. | From bright day to blue night. Dawn Rose and Ocean Night are the two newest. | من النهار الساطع إلى الليل الأزرق. وردة الفجر وليل المحيط أحدث مظهرين. |
| Étiquette | Nouveau | New | جديد |

### Mobile

| | FR | EN | AR |
| --- | --- | --- | --- |
| Kicker | Sur mobile | On mobile | على الجوال |
| Titre | La même lecture, dans la poche. | The same reading, in your pocket. | القراءة نفسها، في جيبك. |
| Texte | Votre place retrouvée, des radios thématiques, les téléchargements par sourate pour écouter hors connexion. | Your place kept, themed radio stations, downloads by surah to listen offline. | مكانك محفوظ، وإذاعات موضوعية، وتنزيل بحسب السورة للاستماع دون اتصال. |
| État | Bientôt sur Android et iOS | Coming soon on Android and iOS | قريبًا على أندرويد وآيفون |

---

## 9. Traitement des appareils et cadres

- **Un seul cadre d'appareil**, un rectangle à `--landing-r-frame` avec une bordure de 6 px de la couleur `text` du thème à 92 % et un encoche discrète ; pas de téléphone réaliste 3D, pas d'inclinaison. Les captures sont déjà **rognées de la barre d'état** (pas de notification, d'heure ni d'opérateur ; voir §10).
- Ratio de capture : 720 × 1503 (webp), vidéo 540 × 1128. Attributs `width`/`height` fixés pour zéro saut de mise en page.
- Ombre `--landing-shadow-device` ; sur les thèmes sombres l'ombre est remplacée par un liseré clair de 1 px (`rgb(255 255 255 / .06)`).
- Le **cadre doré du folio** est un SVG à quatre filets et quatre losanges d'angle (même géométrie que le cadre du mushaf dans l'app : filet double fin, losange plein de 10 px dans chaque angle). Il entoure le contenu de chaque folio, pas la page.
- Le texte coranique n'est jamais saisi : il n'apparaît que dans les captures.

---

## 10. Assets livrés (déposés dans le worktree, non suivis par git)

Aucun fichier existant n'est remplacé : la page actuelle ne change donc pas tant que tu ne fais pas la bascule. Noms stables, préfixe `mob-`.

### Images : `public/images/landing/` (webp, 720 px de large, top de l'écran rogné de la barre d'état)

| Fichier | Contenu | Section | Poids |
| --- | --- | --- | --- |
| `mob-home-fajr.webp` | Accueil, Lueur du Fajr | I (hero), III | 52 Ko |
| `mob-home-parchemin.webp` | Accueil, Parchemin du Mushaf | I, III | 52 Ko |
| `mob-home-rose.webp` | Accueil, Rose de l'aube (nouveau) | III (mobile uniquement) | 53 Ko |
| `mob-home-medine.webp` | Accueil, Nuit de Médine | I, III | 50 Ko |
| `mob-home-ocean.webp` | Accueil, Nuit océan (nouveau) | III (mobile uniquement) | 54 Ko |
| `mob-reader-fajr.webp`, `-parchemin`, `-rose`, `-medine`, `-ocean` | Lecture en pages de mushaf, sourate Al-Baqara, un fichier par thème | II (repli), III | ~90 Ko chacun |
| `mob-reader-list.webp` | Lecture verset par verset (traduction, translittération), Nuit de Médine | II (repli) | 60 Ko |
| `mob-listen.webp` | Bibliothèque audio, onglet Récitations | II (repli) | 54 Ko |
| `mob-radio.webp` | Onglet Radio (4 stations) | IV | 50 Ko |
| `mob-player.webp` | Lecteur audio ouvert | IV | 40 Ko |
| `mob-duas-hub.webp` | Hub Invocations (Citadelle : 132 chapitres · 267 invocations) | II (repli) | 41 Ko |
| `mob-duas-chapter.webp` | Chapitre « Adhkar du matin et du soir » | II | 52 Ko |
| `mob-themes-picker-a.webp` | Réglages, sélecteur de thèmes (Fajr, Parchemin, Rose) | III desktop | 37 Ko |
| `mob-themes-picker-b.webp` | Réglages, sélecteur (Rose, Médine, Océan) | III desktop | 35 Ko |

### Vidéos : `public/videos/landing/` (mp4 H.264 main, sans audio, `faststart`, 540 × 1128, 24 i/s) + poster `.jpg`

| Fichier | Contenu | Durée | Poids mp4 | Section |
| --- | --- | --- | --- | --- |
| `mob-themes.mp4` / `.jpg` | Menu, Paramètres, choix des cinq thèmes (la capture passe de l'un à l'autre) | 16,9 s | 443 Ko | III |
| `mob-reader-scroll.mp4` / `.jpg` | Lecture verset par verset, défilement | 12,0 s | 735 Ko | II (Lire) |
| `mob-listen-player.mp4` / `.jpg` | Lecteur audio ouvert, verset suivi, « En lecture » | 9,2 s | 210 Ko | II (Écouter) |
| `mob-duas-scroll.mp4` / `.jpg` | Chapitre d'invocations, défilement avec points de repère | 9,5 s | 510 Ko | II (Invocations) |

Tous ≤ 1 Mo. Empreintes dans `scratchpad/sha1-assets.txt` (`sha1sum` de chaque fichier déposé).

**Vérification des données personnelles** (faite sur les fichiers finaux) : barre d'état rognée (140 px du haut sur 2244) ; contrôle visuel de chaque image ; contrôle de planches de contact (1 image toutes les 0,8 s) de chaque vidéo : aucune notification, aucune heure de l'appareil, aucune ville, aucun nom. L'écran Prières n'a pas été capturé (il porterait la ville).

**Traitement des captures** : (1) la carte « Prochaine prière » et la ligne de date des cinq captures d'accueil, ainsi que le début de `mob-themes.mp4`, sont floutées (l'heure de la prochaine prière donne une indication de lieu) ; (2) le bloc « Récemment écouté » de `mob-radio.webp`, `mob-player.webp` et `mob-listen-player.mp4` est flouté (il reflète un historique d'écoute réel) ; `mob-listen.webp` n'est pas utilisée ; (3) le lecteur ouvert montre un récitant choisi pour la capture.

**Onboarding non refilmé** (règle : pas d'effacement des données de l'app). Recommandation : **retirer l'étape « Un démarrage en quatre étapes »** et la vidéo `app-onboarding.mp4` de la démo (voir §11). Constat utile : le menu Réglages de l'app contient une ligne « Revoir l'introduction » ; elle permettrait de refilmer l'onboarding **sans effacer** quoi que ce soit, mais elle fait traverser les demandes de permission (position, notifications), donc je ne l'ai pas utilisée sans accord de Cherif.

---

## 11. Faits à n'afficher que s'ils sont vérifiés (avec source)

| Affirmation | Statut | Source |
| --- | --- | --- |
| 54 récitateurs (46 Hafs, 8 Warsh) | Vérifié | `README.md` du worktree, lignes 9 et 42 |
| 267 invocations de la Citadelle, 132 chapitres | Vérifié, recompté | `public/data/hisn/hisn.json` : somme des `items` de 132 chapitres = 267 (`stats.items`) ; l'app mobile affiche « 132 chapitres · 267 invocations » (capture `mob-duas-hub.webp`) |
| 2 lectures (Hafs, Warsh) | Vérifié | README web ; `Changer de riwaya : Hafs / Warsh` dans l'app |
| 3 langues FR / EN / AR | Vérifié | `site.config.json` `supportedLocales` ; `lib/l10n/app_{fr,en,ar}.arb` |
| Cinq thèmes **dans l'app mobile** | Vérifié | `app_preferences.dart:6`, `app_{fr,en,ar}.arb` ; sélecteur capturé |
| Le **web** n'a que trois thèmes | Vérifié | `src/data/themes.js` (`THEME_ORDER = ["light","sepia","dark"]`) |
| Rose de l'aube et Nuit océan sont les deux nouveaux thèmes | Vérifié | commit mobile `d8712cd` « two new themes » |
| Logo par thème, icônes d'app portant le nom | Vérifié | `lib/design_system/components/brand_logo.dart:15-30` (`assetFor` par palette) ; commit `625af2d` |
| L'app s'appelle « Mushaf Plus » sur mobile | Vérifié | `AndroidManifest.xml:16` (`android:label="Mushaf Plus"`), `ios/Runner/Info.plist:9,17`, `app_fr.arb:29` (`appTitle`). **Écart de marque** : le web s'écrit « MushafPlus » (`site.config.json`). Je ne tranche pas la marque. |
| Onboarding terminé sur la lecture | Vérifié (message de commit) | commit `ef6e3b9` « Onboarding ends on the reading » |
| Plus de 240 récitations dans l'app mobile | Vérifié | `README.md` mobile ligne 17 ; l'écran affiche « Récitations 243 ». **Unité différente de « 54 récitateurs »** : ne pas mélanger sur la même ligne. |
| Radios thématiques | Vérifié | capture : onglet « Radio 4 » (Récitations populaires, Al-Kahf en boucle, Juz Amma, Récitation du soir) |
| Téléchargement par sourate, écoute hors ligne | Vérifié | `README.md` mobile, tableau « Hors ligne » |
| Android Auto | **Déclaré dans le code, non vérifié en voiture** : à ne pas afficher | `AndroidManifest.xml:45-46`, `res/xml/automotive_app_desc.xml` (`<uses name="media"/>`), `lib/features/audio/presentation/car_browser.dart` |
| CarPlay | **Faux aujourd'hui** : ne pas mentionner | `docs/carplay/README.md` : « rien n'est actif dans l'app » |
| TestFlight / iOS | **Pas public** : ne pas mentionner de lien ni de disponibilité | `docs/ROADMAP.md:58` (item), commit `8a78d68` (PR #5) ; aucun lien public |
| Écoute en arrière-plan, commandes sur l'écran verrouillé | **Recette native incomplète** : ne pas affirmer | `docs/verification/2026-10-26-background-audio/verification.md` (« résultats à compléter ») ; `docs/carplay/README.md` : non vérifié sur iPhone |
| « Gratuit, sans compte, sans publicité » | Vrai pour ce worktree, **à re-vérifier avant mise en ligne** | `README.md` web (« no backend and no account »). Le dépôt principal contient du travail de compte en cours (branche `codex/api-independence`) : si un compte devient réel, la promesse change |

Aucune URL de store n'est écrite nulle part.

---

## 12. Composition par largeur, RTL

| Largeur | Règle |
| --- | --- |
| 320 | Titre 2,5 rem sur 4 lignes max, gouttière 16 px, un seul téléphone à 240 px, colophon en deux lignes, aucun scroll horizontal (le rail des thèmes est le seul défilement horizontal, interne à sa zone). |
| 375 (référence de conception) | Mise en page décrite au §6. |
| 768 | Gouttière 24 px, hero toujours en pile mais téléphone à 320 px ; Folio II en deux colonnes (texte / téléphone). |
| 1024 | Folio II : téléphone collant. Folio III : cinq téléphones en ligne. |
| 1440 | Largeur utile 72 rem ; titre `--landing-h1` à ~88 px. |

RTL natif (arabe) : `dir="rtl"` sur la racine, **propriétés logiques uniquement** (`margin-inline`, `padding-inline`, `inset-inline`, `text-align: start`). Le téléphone passe à gauche du texte, les flèches de bouton se retournent (`Arrow` déjà choisi par langue). Les chiffres du colophon arabe sont en chiffres arabes-indiens comme dans la copie ci-dessus. Les captures ne sont **jamais** retournées en miroir (elles sont déjà en français). Le cadre doré est symétrique, donc inchangé.

---

## 13. Critères vérifiables (pour Cherif QA)

1. Contraste : texte courant ≥ 4,5:1 sur chaque fond de thème (voir tableau §5) ; or du cadre non porteur de sens ; bouton principal 10,26:1. Mesure : `npm run` des tests e2e responsive puis axe sur les cinq états de fond.
2. Responsive : 320, 375, 768, 1024, 1440, FR/EN/AR, **aucun scroll horizontal** hors du rail des thèmes ; cibles ≥ 44 px (boutons de langue, liens du pied, vignettes du rail).
3. États : `hover` (sous `(hover:hover) and (pointer:fine)`), `focus-visible`, `active`, `disabled` sur chaque contrôle ; `cursor: pointer` posé une fois.
4. Mouvement : `prefers-reduced-motion: reduce` ⇒ **zéro** animation et aucun autoplay, vidéos avec contrôles natifs ; pas de `transition: all` (`grep`) ; uniquement `transform` / `opacity`, sans exception.
5. Performance : une seule image en `loading="eager"` + `fetchpriority="high"` (le hero), toutes les autres `lazy` ; vidéos `preload="none"` avec poster ; poids total des assets de la page ≤ 3,5 Mo ; `LandingPage.jsx` ≤ 12 kB (`npm run audit:screen-budget`).
6. Provenance : toutes les images sont des captures de l'app réelle (mobile `7845fd0`) ; aucune donnée personnelle (vérifié : voir §10) ; photos de récitants = celles que l'app sert déjà, pas d'ajout. Ajouter une ligne `CREDITS.md` : « Captures de l'application Mushaf Plus 0.1.0+2, téléphone Android, 2026-11-02 ».
7. Anti-générique : relancer `anti_slop.py` sur `src/components/landing` et `src/styles/landing.css` : zéro ERREUR attendue après remplacement de `lucide-react` (les 70 erreurs actuelles viennent du reste de l'app).
8. Aucune mention d'Android Auto, CarPlay, TestFlight, ni de lien de store.

---

## 14. Écarts et points ouverts

- **Nombre de thèmes** : le paquet de mission listait « Fajr, Parchemin, Rose, Nuit de Médine + 2 nouveaux ». Le code montre **5 thèmes au total**, les deux nouveaux **étant** Rose de l'aube et Nuit océan.
- **Web vs mobile** : le web a 3 thèmes ; la section thèmes doit dire « mobile ». À décider par Cherif : passer le web à 5 thèmes (travail produit) ou laisser l'écart.
- **Marque** : « Mushaf Plus » (mobile) vs « MushafPlus » (web).
- **Icônes** : `lucide-react` partout dans l'app ; dérogation limitée à la landing (SVG maison).
- **Onboarding** : à retirer de la démo tant qu'il n'est pas refilmé.
- **Android Auto / CarPlay / TestFlight / arrière-plan** : non affirmables (voir §11).
