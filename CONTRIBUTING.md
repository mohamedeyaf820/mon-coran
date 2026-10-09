# Contribuer à MushafPlus

Merci de votre intérêt. MushafPlus est une application de lecture du Coran : la correction du texte, le respect des riwayat, la continuité de lecture et l'accessibilité passent avant la nouveauté visuelle.

## Règles propres à ce projet

1. **Ne jamais modifier le texte coranique.** Aucun code ne doit réécrire, normaliser ou « corriger » une lettre ou un signe pour faire fonctionner une fonctionnalité. Les couleurs de Tajwid déplacent des intervalles ; elles ne touchent pas au texte (voir `src/utils/tajwidAlignment.js` et ses tests).
2. **Ne jamais deviner une règle de Tajwid.** La couleur vient d'une annotation fournie (Quran.com pour le Hafs, le Dabt de l'édition pour le Warsh), jamais d'une détection par motifs.
3. **Hafs et Warsh restent séparés** : numérotation, polices et règles ne se mélangent pas.
4. **Français, anglais, arabe** : toute chaîne visible passe par `src/i18n/` ; l'arabe doit rester correct en RTL natif.
5. **Zones tactiles ≥ 44 px**, contrastes vérifiés, fonctionnement hors-ligne préservé.

## Mise en place

```bash
git clone https://github.com/mohamedeyaf820/mon-coran.git
cd mon-coran
npm install
npm run dev          # http://localhost:3002
```

Node.js 22+ requis.

## Avant d'ouvrir une pull request

```bash
npm run lint
npm run test:security          # tests unitaires et contrats
npm run build
npm run test:e2e:smoke         # puis les specs concernées par votre changement
npm run build:ci               # budgets, audit CSS, en-têtes (comme la CI)
```

- Lancez d'abord **le test le plus étroit** qui couvre votre changement, puis élargissez.
- Un changement visible se vérifie **dans le navigateur**, sur un petit et un grand écran, en français et en arabe si le texte ou la mise en page change, et en Hafs et Warsh si le texte coranique, les polices ou le Tajwid sont touchés.
- Un changement de CSS qui ne devrait rien changer se prouve : `scripts/snapshot-computed-styles.mjs` compare le style calculé de chaque élément entre deux builds.

## Style de commits

Commits atomiques, au format [Conventional Commits](https://www.conventionalcommits.org/) : `feat(tajwid): …`, `fix(reader): …`, `perf(css): …`, `docs(readme): …`. Expliquez le **pourquoi** dans le corps du message.

## Où chercher

| Sujet | Référence |
|---|---|
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Design system et composants | [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), `src/components/ui/` |
| Budgets d'écran | [SCREEN_UX_BUDGETS.md](SCREEN_UX_BUDGETS.md) |
| Sécurité et vie privée | [docs/SECURITY_PRIVACY.md](docs/SECURITY_PRIVACY.md) |
| Tajwid Hafs / Warsh | [docs/TAJWID_HAFS_WARSH_AUDIT.md](docs/TAJWID_HAFS_WARSH_AUDIT.md) |

## Signaler un problème

Utilisez les [modèles d'issue](https://github.com/mohamedeyaf820/mon-coran/issues/new/choose). Pour une faille de sécurité, suivez [SECURITY.md](SECURITY.md) plutôt qu'une issue publique.

## Licence

Le dépôt ne déclare pas encore de licence de redistribution. En proposant une contribution, vous acceptez qu'elle soit intégrée au projet ; une licence explicite sera à définir avec le mainteneur.
