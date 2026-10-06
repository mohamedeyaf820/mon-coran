# Politique de sécurité

## Versions prises en charge

Seule la dernière version publiée (branche principale, déployée sur <https://mushafplus.netlify.app>) reçoit des correctifs.

## Signaler une vulnérabilité

**N'ouvrez pas d'issue publique** pour une faille.

1. Utilisez le signalement privé de GitHub : onglet **Security → Report a vulnerability** du dépôt (si l'option est activée).
2. Sinon, ouvrez une issue **sans détail exploitable** en demandant un contact privé ; le mainteneur vous répondra pour échanger les informations.

Merci d'indiquer : le composant concerné, les étapes de reproduction, l'impact estimé et, si possible, un correctif proposé. Le délai de correction dépend de la gravité.

## Périmètre

MushafPlus est une application **statique côté client** : il n'y a ni serveur applicatif ni base de données. Sont pertinents : XSS et injection dans le rendu, contournement de la CSP, fuite de données locales, faiblesse du chiffrement local, service worker, intégrité du texte coranique affiché.

Hors périmètre : les services tiers (Quran.com, CDN audio, API d'horaires) — signalez-les à leurs propriétaires —, et l'accès à un navigateur déjà déverrouillé (voir les limites documentées).

## Ce que le projet garantit déjà

- CSP stricte (`script-src 'self'`), HSTS, `X-Frame-Options: DENY`, COOP, Permissions-Policy ; test de parité Netlify / Vercel.
- Aucun `dangerouslySetInnerHTML`, `eval` ni `new Function` dans `src/`.
- Chiffrement local authentifié (AES-256-CBC + HMAC-SHA-256) ; mode protégé par phrase secrète (PBKDF2-HMAC-SHA-256, 600 000 itérations).
- Audit des dépendances en CI (`npm audit`).

Le modèle de menace et ses limites sont décrits dans [docs/SECURITY_PRIVACY.md](docs/SECURITY_PRIVACY.md).
