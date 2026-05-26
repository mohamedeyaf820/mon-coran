---
name: AGENTS
description: "Registry of custom agents for the Mon Coran project. Lists the 3 combined agents, their dual missions, and the recommended execution workflow."
---

# Mon Coran Custom Agents (3 Agents)

Cette configuration contient exactement 3 agents combines.
Chaque agent couvre 2 missions principales.

## Workflow recommande (ordre optimal)

1. ProductEngineer
- Prioriser P0/P1/P2
- Implementer les ameliorations prioritaires

2. CodeReviewer
- Verifier qualite globale
- Durcir la securite et corriger les risques

3. PerformanceEngineer
- Optimiser performance si necessaire
- Valider quality gates et statuer Ready/Not Ready

## Prompts ultra-optimises (copier-coller)

### Prompt 1 - ProductEngineer
Role: ProductEngineer
Objectif: Fais un audit P0/P1/P2 du scope cible puis implemente les 3 quick wins a plus fort impact. Respecte l'architecture existante, evite les refactors hors perimetre, et termine avec validations executees + risques residuels.

### Prompt 2 - CodeReviewer
Role: CodeReviewer
Objectif: Audit qualite + securite en une passe sur le scope cible. Donne findings par severite (Critique, Eleve, Moyen, Faible), corrige Critique/Eleve en priorite, puis fournis checks anti-regression et risques residuels.

### Prompt 3 - PerformanceEngineer
Role: PerformanceEngineer
Objectif: Optimise performance (bundle/runtime/reseau/audio) sur le scope cible puis execute la passe release readiness. Retourne quality gates (build/tests/budgets), blockers, decision Ready/Not Ready, et actions finales.

## 1. ProductEngineer
Fichier: [product-engineer.agent.md](product-engineer.agent.md)

Missions:
- Audit de plateforme (priorites P0/P1/P2)
- Implementation end-to-end des ameliorations

Utiliser pour:
- Definir quoi ameliorer en premier
- Concevoir et livrer une amelioration complete
- Produire un plan puis executer dans le meme flux

## 2. CodeReviewer
Fichier: [code-reviewer.agent.md](code-reviewer.agent.md)

Missions:
- Revue qualite (bugs, dette, UX/a11y)
- Durcissement securite (XSS, injection, exposition donnees)

Utiliser pour:
- Corriger les problemes de code rapidement
- Faire une passe qualite + securite en une fois
- Sortir une liste de risques residuels claire

## 3. PerformanceEngineer
Fichier: [performance-engineer.agent.md](performance-engineer.agent.md)

Missions:
- Optimisation performance (bundle, runtime, reseau, audio)
- Validation release (quality gates + decision Ready/Not Ready)

Utiliser pour:
- Gagner en vitesse et stabilite
- Verifier si la version est prete a deployer
- Donner une decision go/no-go fondee sur des checks

## Decision Tree

1. Tu veux prioriser et construire une amelioration complete:
ProductEngineer

2. Tu veux corriger qualite + securite:
CodeReviewer

3. Tu veux optimiser perf + valider la release:
PerformanceEngineer

## Notes

- Cette structure remplace les agents specialises precedents.
- Objectif: moins d'agents, plus de clarte, plus de vitesse d'execution.
- Regle simple: un agent = 2 missions, pas plus.
- Si un besoin sort du cadre, relancer l'agent suivant dans le workflow.
- Toujours demander des preuves (checks, mesures, deltas) dans la sortie.
