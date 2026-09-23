# Publier le travail local sur Vercel

## Objectif et constats

- Publier les corrections locales sur le projet existant servant `https://mon-coran-kappa.vercel.app/`. Cette demande remplace la cible Netlify du rapport precedent.
- `vercel.json` configure deja Vite, `npm run build`, `dist`, les rewrites et les en-tetes de securite/cache.
- Le worktree contient de nombreuses modifications et de nouveaux fichiers : ne pas revenir a HEAD, ne rien supprimer, ne pas committer ni pousser sans demande.
- `.vercel/project.json` est absent. Le compte Vercel, ses droits et le projet proprietaire du domaine restent a verifier lors de l'execution. La connexion Netlify ne vaut pas connexion Vercel.
- Le rapport `docs/AUDIT_ET_CORRECTIONS_2026-09.md` consigne les tests precedents et le refus Netlify pour credits epuises ; il ne prouve pas un deploiement Vercel ni la validite du build actuel.

## Execution en mode implementation

1. Relever l'etat Git et verifier les exclusions d'envoi Vercel pour ne pas transmettre secrets, journaux, captures ou artefacts locaux. Conserver les sources modifiees et nouvelles necessaires au build.
2. Verifier l'identite avec la CLI Vercel ; lancer `npx vercel login` si necessaire et demander uniquement la validation navigateur requise. Inspecter le domaine/deploiement et les projets accessibles pour identifier exactement l'equipe et le projet existant. En cas de droits insuffisants ou de cible introuvable, s'arreter et demander l'acces, sans creer de projet de remplacement ni acheter une offre.
3. Lier le dossier au projet et a l'equipe verifies. Verifier la racine, la version Node, les variables de production necessaires et les parametres de build sans afficher les secrets. Relever le deploiement de production precedent pour permettre un retour arriere. Ne pas modifier Netlify ou les DNS.
4. Relire les instructions produit pour la validation. Executer `npm run test:security`, `npm run lint`, puis `npm run build:ci`. Executer les parcours cibles audio/accessibilite, lecture, recitation et audio hors ligne repertories dans le rapport. Ne pas relever les seuils pour masquer un echec. Corriger uniquement les blocages necessaires, puis reverifier.
5. Utiliser les parametres de production du projet avec `npx vercel pull --yes --environment=production`, puis `npx vercel build --prod`. Verifier les controles de sortie sur le build produit et publier avec `npx vercel deploy --prebuilt --prod`. Ne pas reutiliser aveuglement l'ancien dossier `dist`, ni deployer `dist` seul en perdant les regles de `vercel.json`.
6. Attendre le statut Ready et verifier que le domaine demande pointe effectivement sur ce deploiement. Controler HTTP, asset d'entree correspondant au nouveau build, liens directs lecteur, fichiers statiques, service worker et en-tetes effectifs (CSP et caches notamment).
7. Verifier le rendu dans un navigateur sur mobile et bureau : accueil, lecture Hafs/Warsh, FR/EN/AR et RTL, actions de recitation sur tablette, lecture audio et reprise hors ligne apres chargement/cache. Tester aussi la mise a jour d'une session existante sans effacer ses donnees. Distinguer les tests automatises des essais sur telephone physique non effectues.
8. En cas de regression critique, restaurer le deploiement precedent verifie du meme projet. En cas d'echec de publication, rapporter le motif exact sans annoncer la mise en ligne. En cas de succes, fournir le domaine public, l'identifiant/URL du deploiement et le bilan reel des controles.

## Limites et donnees

- Aucun changement editorial du Coran, refonte UI, migration backend, achat ou commit n'est requis.
- Le flux reste sources locales -> build Vite et post-traitements -> artefact Vercel -> domaine existant ; API/audio externes et stockage navigateur restent inchanges.
- Les donnees et caches Netlify ne migrent pas automatiquement vers Vercel, car les origines sont distinctes. Preserver les donnees deja presentes sur l'origine Vercel et ne pas promettre de transfert automatique.
- La publication est autorisee par la demande utilisateur ; l'authentification et la verification du projet sont des preconditions d'execution, pas une autorisation de creer ou remplacer arbitrairement un site.
