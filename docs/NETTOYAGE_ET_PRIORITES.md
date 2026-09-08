# Nettoyage et priorités

Mis à jour le 8 septembre 2026. Voir le [rapport des corrections et limites](AUDIT_ET_CORRECTIONS_2026-09.md).

1. Chargement audio extrait, budget du service rétabli et chemins natifs de lecture corrigés. Les essais écran éteint sur appareils restent nécessaires.
2. Anciennes couches de lecteurs et doublons CSS retirés ; budgets CI rétablis. Continuer la réduction progressivement avec vérification du rendu et des classes dynamiques.
3. Avertissements `::highlight` résolus. L'échec initial des métadonnées n'a pas été reproduit de manière déterministe ; sondes améliorées.
4. Couverture native Node documentée, budgets CSS actualisés et anciens audits regroupés dans [les archives](archive/reports/README.md).
5. Dock audio et pages de récitation corrigés sur mobile/tablette ; stockage hors ligne, import QR et cycle du microphone renforcés.

Le rapport détaillé distingue les tests réussis, les instabilités diagnostiquées, les éléments non testés sur appareils et les validations coraniques requises.
