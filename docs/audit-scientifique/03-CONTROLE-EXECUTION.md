# Contrôle d'exécution et profondeur des objectifs

Statut : synthèse d'audit partielle, établie à partir d'extraits de code et de tests examinés.

## Phases cognitives

Le cycle observé suit `INPUT → PROPOSE → DECIDE → APPLY → OUTPUT → INPUT`. Le moteur natif utilise des bornes d'exécution (100 cycles de décision et 1 000 élaborations par phase PROPOSE/APPLY dans la configuration examinée). Le contrôle d'arrêt est notamment consulté après la phase OUTPUT.

## Contrôle d'arrêt

`AZDefaultCognitiveRunControl` conserve un indicateur d'arrêt et une raison. L'appel `halt(reason)` positionne l'indicateur et remplace la raison précédente ; aucune réinitialisation n'a été identifiée dans la classe examinée. La fonction RHS `halt` prend zéro argument et enregistre la raison `halt`.

Des arrêts ont été identifiés dans le moteur natif (non-progression), dans `AZContextSlotDecider` (profondeur) et dans la fonction RHS `halt`.

## Politique de profondeur

Fichier : `src/engines/cognitive/az/core/state/AZGoalDepthPolicy.ts`.

L'interface `AZGoalDepthPolicy` expose `isAllowed(level: number): boolean`. `AZBoundedGoalDepthPolicy` impose une limite entière strictement positive et autorise un niveau lorsque `level <= maxGoalDepth`. L'assemblage central construit la politique avec la valeur `100`.

Le test `tests/integration/az-context-slot-decider.test.ts` vérifie qu'un nouveau contexte `NO_CHANGE` au niveau 100 n'arrête pas l'exécution, qu'une impasse `TIE` au niveau 101 n'entraîne pas cet arrêt dans le scénario testé, et qu'un nouveau contexte `NO_CHANGE` au niveau 101 déclenche `Max goal depth exceeded.`.

## Création d'un contexte inférieur

Fichier : `src/engines/cognitive/az/core/state/AZLowerContextCreator.ts`.

`create(parent, attributeOfImpasse, impasseType)` :

1. Rejette `NONE`, `ONC` et `SNC` ; vérifie l'appartenance du parent à la pile des objectifs.
2. Crée un identifiant d'état et initialise son niveau à `parentLevel + 1`.
3. Enregistre l'impasse et les propriétés structurelles associées. `NO_CHANGE` est représenté structurellement par `ONC`.
4. Construit six WME : `type`, `superstate`, `attribute`, `impasse`, `choices`, `quiescence`.
5. Programme l'ajout de ces WME et ajoute le contexte aux piles de contextes et d'états.

## Frontière d'arrêt à examiner

Dans le chemin `NO_CHANGE` examiné de `AZContextSlotDecider`, la création du contexte précède la vérification de profondeur et l'appel à `runControl.halt('Max goal depth exceeded.')`. Les structures du contexte sont donc initialisées avant la demande d'arrêt. Les WME sont programmés pour insertion ; leur application effective reste à vérifier.

Dans `AZDecisionRuntime.execute()`, `contextSlotsDecider.decideAll(...)` est suivi de `workingMemoryChangesApplier.apply(...)`, sans vérification explicite de `isHalted()` entre les deux appels dans l'extrait examiné.

**Question ouverte :** le contexte de niveau 101 peut-il être effectivement matérialisé en mémoire ou influencer une étape ultérieure avant la terminaison ? Le comportement ne doit pas être qualifié de défaut sans vérification ciblée.

## Tests examinés

- `az-halt-zero-argument-semantics.test.ts`
- `cognitive-growing-onc-interruption.test.ts`
- `az-generic-runtime-end-to-end.test.ts`
- `az-experimental-branch-halt.test.ts`
- `az-elaboration-convergence.test.ts`
- `az-context-slot-decider.test.ts`

Les assertions précises et leur portée doivent être documentées avec les références de lignes à partir de l'état du dépôt retenu pour la publication.
