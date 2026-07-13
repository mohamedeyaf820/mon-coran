# Correctif - Preferences en temps reel

## Probleme

Le panneau sauvegardait correctement les choix, mais le lecteur conservait certains reglages dans son etat React initial. La traduction, le tajwid et la riwaya ne changeaient donc qu'apres une nouvelle navigation.

## Correction

- Synchronisation du lecteur sur `modern-preferences-change`.
- Rechargement des donnees lors du changement de riwaya ou de langue de traduction.
- Synchronisation du provider audio lors du changement Hafs/Warsh.
- Mise a jour immediate de l'objectif du wird.
- Application reelle des modes Lecture concentree et Lecture de traduction.
- Retrait du controle Lecture audio continue, non pilote par le player moderne.

## Validation

- Reglage applique avant fermeture du panneau.
- Reglage conserve apres fermeture, navigation et rechargement.
- Verification reelle sur `localhost:3002`: texte 44 px, traduction masquee, palette Bordeaux, aucune erreur console.
- 64 tests unitaires, 6 tests de securite, build CI et 46 parcours E2E valides.
