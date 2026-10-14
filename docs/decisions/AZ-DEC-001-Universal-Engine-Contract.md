# AZ-DEC-001 — Contrat universel des moteurs

## Statut

Validée

## Décision

Tous les moteurs d'AZ-Maroc-AI exposent le même contrat public.

```ts
process(mission: Mission): Promise<Mission>
```

## Motivation

- Uniformiser les échanges entre composants.
- Réduire le couplage entre l'Orchestrateur et les moteurs.
- Permettre à l'Orchestrateur de traiter tous les moteurs de manière identique.
- Faciliter l'ajout de nouveaux moteurs sans modifier l'Orchestrateur.

## Conséquences

- Tous les moteurs reçoivent une `Mission`.
- Tous les moteurs retournent une `Mission`.
- Les moteurs enrichissent la Mission sans modifier son contrat.
- L'Orchestrateur appelle toujours les moteurs de la même manière.

## Impact

Cette décision s'applique à tous les moteurs actuels et futurs de la plateforme.
