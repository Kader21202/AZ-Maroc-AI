# AZ-Maroc-AI — État de référence de l'audit

Date de consolidation : 13 octobre 2026
Statut : documentation technique provisoire, à confronter au dépôt source et aux journaux d'exécution.

## Objet

Établir une description reproductible de l'architecture cognitive, de ses mécanismes d'exécution, de ses validations et de ses limites. Le dossier distingue les faits observés dans le code, les assertions de tests, les résultats d'exécution rapportés et les hypothèses de recherche.

## Référence technique

- Dépôt local examiné : AZ-Maroc-AI, branche `master`.
- Assemblage central : `src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly.ts`.
- Composants examinés : contrôle d'exécution, phases cognitives, convergence d'élaboration, décision de contexte, politique de profondeur, création des contextes inférieurs.
- Vérifications rapportées : `npm run typecheck` réussi ; 194 tests d'intégration compilés réussis sur 194. Ces résultats ne démontrent pas, à eux seuls, la correspondance entre les artefacts compilés et l'état courant des sources.
- Éléments locaux non suivis à préserver : `README.ancien.md` et `az-persistent-prescription-G-N12-raw.txt`.

## Règles de l'audit

1. Examen du code source et des tests sans modification du noyau ni des protocoles.
2. Conservation des résultats négatifs et des écarts observés.
3. Aucune conclusion de nouveauté scientifique sans analyse d'antériorité et expérimentation spécifique.
4. Chaque constat doit pouvoir être relié à un fichier, un test ou un journal de validation.

## Prochaine vérification

Étudier `AZWorkingMemoryChangesApplier` et les assertions entourant la limite de profondeur afin de déterminer les conséquences exactes d'un arrêt déclenché après la création d'un sous-objectif.
