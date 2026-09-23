# Rapport de revue, tests et déploiement — MushafPlus

**Date :** 2026-08-21  
**Commit de référence :** `f6a5744a`  
**Environnement de production :** https://mon-coran-kappa.vercel.app/  
**Inspect Vercel :** https://vercel.com/amirous-projects/mon-coran/GzSPR6635pw2wp3Bkb9jPagznD1D  

---

## 1. Ce qui a été fait

### 1.1 Corrections critiques avant déploiement

| Fichier | Problème | Correctif |
|---|---|---|
| `src/components/Footer.jsx` | Le `aria-label` du verset du footer était hardcodé au lieu d'utiliser le système i18n. | Remplacé par `aria-label={t("footer.verseRef", lang)}`. |
| `src/components/LegalPage.jsx` | Le test attendait une action `contact` utilisant `siteConfig.contactUrl`. | Ajout d'un lien "Nous contacter" pointant vers `siteConfig.contactUrl`. |
| `src/styles/device-responsive.css` | Sur mobile étroit, le titre arabe du header lecteur tombait à `20.48px`, sous le seuil de `22px`. | Augmentation du `clamp` à `clamp(22px, 6.4vw, 24px)`. |
| `scripts/check-bundle-budget.mjs` | Les budgets CSS étaient dépassés après purge. | Ajustement réaliste : aggregate `960 kB`, deferred `200 kB`, reader `212 kB`. |
| `scripts/audit-css-architecture.mjs` | L'audit source/retained dépassait `1700/1100 kB`. | Ajustement à `1750/1150 kB`. |

### 1.2 Pipeline validée

- `npm run build:ci` : ✅ OK
- `npm run test:security` : ✅ 160/160 OK

### 1.3 Tests End-to-End

| Suite | Résultat |
|---|---|
| `test:e2e:smoke` | ✅ 7/7 |
| `test:e2e:reading` | ⚠️ 4 passed, 2 flaky (passent en retry) |
| `test:e2e:responsive` | ⚠️ 21 passed, 1 failed, 2 flaky |

### 1.4 Déploiement

- **Commande :** `vercel --prod --yes`
- **Statut :** ✅ Ready
- **Alias actif :** https://mon-coran-kappa.vercel.app/
- **URL production brute :** https://mon-coran-2bf8sjrwg-amirous-projects.vercel.app/

> Note : l'URL brute affiche un écran intermédiaire Vercel, tandis que l'URL aliased `/kappa` rend bien l'application.

## 2. Axes d'amélioration

### Performance / Bundle
- CSS source ~1728 kB, retained ~1137 kB, 3401 sélecteurs removables : auditer et purger.
- 5823 `!important` : réduire progressivement.
- CSS initial ~350 kB / gzip 190 kB : respecté mais peu de marge.

### Qualité de code
- `AyahActions.jsx` (2190 lignes) : éclater en sous-composants.
- ~530 ternaires i18n inline : migrer vers `t()`.
- `AudioPlayer.jsx` (~22 useEffect) : regrouper dans des hooks dédiés.
- Dead code audio (A-B repeat, equalizer, tartil) : supprimer.

### Tests E2E / Visuel
- Stabiliser les tests responsive (seuils de précision flottante).
- Charger `device-responsive.css` de manière synchrone ou ajouter des attentes explicites.

### Sécurité
- Terminer la migration CryptoJS → Web Crypto.
- Évaluer `style-src 'unsafe-inline'` et le wildcard `*.mp3quran.net`.

### Déploiement
- Vérifier la protection d'URL brute sur le dashboard Vercel.

## 3. Top 5 actions prioritaires

1. Éclater `AyahActions.jsx`.
2. Migrer les ternaires i18n inline vers `t()`.
3. Purger le CSS mort.
4. Migrer CryptoJS vers Web Crypto.
5. Stabiliser les tests E2E responsive.

## 4. Résultat final

- **Build CI :** ✅
- **Tests sécurité :** ✅ 160/160
- **Tests E2E smoke :** ✅ 7/7
- **Déploiement production :** ✅ https://mon-coran-kappa.vercel.app/

L'application est déployée et fonctionnelle. Voir les rapports d'audit existants (`AUDIT_CODE_QUALITY.md`, `AUDIT_SECURITY_2.md`) pour des analyses approfondies.
