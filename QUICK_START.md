# Démarrage local

Installer Node.js compatible avec Vite 8, puis exécuter depuis la racine :

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite. Pour vérifier la version de production et
le service worker :

```sh
npm run build:ci
npm run preview
```

Les tests navigateur nécessitent `npx playwright install`.
La couverture est un rapport natif Node dans le terminal : `npm run test:coverage`.

Consulter le [README](README.md), l’[architecture](ARCHITECTURE.md) et
l’[index des documents](INDEX.md). L’ancien guide est conservé dans les
[archives](docs/archive/reports/QUICK_START.md).
