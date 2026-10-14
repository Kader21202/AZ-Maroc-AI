# AZ-Maroc-AI
Architecture cognitive autonome expérimentale
Auteur : Abdelkader Azzouzi
Statut : Projet de recherche indépendant
Langage principal : TypeScript
## 1. Présentation
AZ-Maroc-AI est un projet de recherche consacré à la conception, au développement et à l'évaluation d'une architecture cognitive autonome.
Le projet vise à construire un noyau logiciel capable de représenter des informations, d'exécuter des règles de production, de gérer des contextes cognitifs, de sélectionner des opérateurs et de prendre des décisions.
L'objectif est de disposer d'une architecture dont les mécanismes internes peuvent être étudiés, modifiés et évalués expérimentalement.
Le noyau cognitif est développé avec ses propres composants logiciels. Son fonctionnement ne nécessite pas de service commercial de grand modèle de langage.
Le développement est réalisé progressivement, avec des tests automatisés, des expériences contrôlées et un historique des modifications conservé dans Git.
## 2. Architecture actuelle
Le noyau AZ-Maroc-AI comprend les mécanismes suivants.
Mémoire de travail
Représentation et gestion des éléments de mémoire de travail (WME), des symboles et des identifiants.
La mémoire de travail constitue l'espace dans lequel les productions consultent et modifient les informations utilisées pendant l'exécution cognitive.
Réseau de productions
Un réseau RETE assure la correspondance entre les conditions des règles de production et les éléments présents en mémoire de travail.
Le moteur prend en charge l'instanciation et l'exécution des productions.
Élaboration cognitive
Les productions permettent de dériver de nouvelles informations à partir de l'état cognitif courant.
Préférences et décisions
Le noyau prend en charge la proposition d'opérateurs, la gestion des préférences, la sélection des opérateurs et l'application des décisions.
Contextes cognitifs
Gestion des états, des objectifs et des sous-états nécessaires à l'organisation de l'exécution cognitive.
Contrôle d'exécution
Organisation des cycles cognitifs, contrôle des phases et gestion des conditions d'arrêt.
Provenance causale
Enregistrement des relations entre éléments de mémoire, instanciations de productions et préférences.
Ces mécanismes permettent d'étudier l'origine de certains éléments cognitifs et de reconstruire leurs dépendances.
Lignage cognitif
Reconstruction des dépendances directes et transitives entre les éléments intervenant dans l'exécution.
Entrées et sorties
Mécanismes permettant au noyau d'interagir avec son environnement d'exécution.
## 3. Développement expérimental de la mémoire
Un programme expérimental est consacré à la mémoire épisodique et à son utilisation dans les processus cognitifs.
Les travaux réalisés comprennent notamment les étapes M2, M3.1 et M3.2-A.
Les expériences récentes ont porté sur le traitement et l'accumulation d'épisodes dans la mémoire de travail.
Accumulation épisodique B3-C4
Trois configurations ont été validées :
Nombre d'épisodes
Résultat attendu
Résultat
5
5 épisodes traités
Réussi
10
10 épisodes traités
Réussi
20
20 épisodes traités
Réussi

Les tests vérifient le nombre d'épisodes traités, leur identification et la cohérence du compteur final.
Cette expérimentation a également permis d'identifier un problème lié à la programmation répétée de la suppression d'un même élément de mémoire.
Une correction a été apportée au mécanisme de suppression dans AZWorkingMemory.ts.
Des tests de non-régression ont été ajoutés pour vérifier le comportement de la mémoire lors de suppressions répétées et d'opérations d'ajout et de suppression au sein d'un même tampon de modifications.
Commit de référence : 1c8112f
Ces résultats établissent le fonctionnement des scénarios testés. Ils ne constituent pas encore une démonstration de l'utilité décisionnelle de la mémoire à long terme.
## 4. Programme de développement cognitif
Le programme de recherche porte sur six capacités.
4.1. Mémoire à long terme
État : en cours de développement.
Objectif : permettre au système de conserver des expériences, de retrouver les informations pertinentes et de les utiliser dans de nouvelles décisions.
La prochaine étape expérimentale consiste à mesurer l'influence effective des expériences mémorisées sur la sélection des décisions.
4.2. Apprentissage autonome
État : à développer.
Objectif : permettre au système d'adapter son comportement à partir des résultats de ses expériences, sans intervention manuelle sur chaque décision.
4.3. Planification et simulation interne
État : à développer.
Objectif : représenter plusieurs actions possibles, anticiper leurs conséquences et sélectionner une séquence d'actions adaptée à un objectif.
4.4. Métacognition
État : à développer.
Objectif : permettre au système d'observer certains aspects de son propre fonctionnement, de détecter des difficultés et d'ajuster ses stratégies.
4.5. Raisonnement causal
État : mécanismes existants à auditer et à étendre.
Le noyau dispose déjà de mécanismes de provenance causale.
Les travaux futurs devront déterminer dans quelle mesure ces mécanismes peuvent servir de base à un raisonnement sur les relations de cause à effet.
4.6. Gestion de l'incertitude
État : à développer.
Objectif : permettre au système de représenter et de prendre en compte des informations incomplètes, contradictoires ou incertaines dans ses décisions.
## 5. Stratégie de recherche
Le programme est organisé en trois phases.
Phase 1 - Développement des capacités
Développer les six capacités cognitives jusqu'à obtenir, pour chacune, un fonctionnement démontré par des expériences reproductibles.
La priorité est donnée à la réalisation des mécanismes nécessaires et à la vérification de leur utilité.
Phase 2 - Consolidation
Reprendre les six capacités individuellement pour améliorer leur fiabilité, leur robustesse, leur persistance lorsque nécessaire, leurs performances et leur intégration.
Phase 3 - Évaluation comparative
Comparer les capacités d'AZ-Maroc-AI avec celles d'architectures cognitives et de systèmes d'intelligence artificielle de référence.
Les comparaisons devront utiliser des tâches définies, des critères mesurables et des protocoles expérimentaux documentés.
## 6. Validation technique
Les développements sont accompagnés de tests unitaires, de tests d'intégration et d'expériences spécifiques.
Une validation locale réalisée le 11 octobre 2026 a rapporté 194 tests d'intégration réussis sur 194.
Depuis cette validation, de nouveaux tests ont été ajoutés dans le cadre de l'expérimentation B3-C4.
Les vérifications ciblées réalisées après cette correction ont réussi, ainsi que la compilation TypeScript.
Les résultats de validation correspondent aux versions et aux environnements dans lesquels les tests ont été exécutés. Ils ne constituent pas une certification externe.
Reproduire la validation
Prérequis : Node.js et npm.
git clone https://github.com/Kader21202/AZ-Maroc-AI.git
cd AZ-Maroc-AI
npm ci
npm run validate
La procédure de validation est définie dans :
scripts/validate-platform.cjs
Le message de réussite attendu est :
AZ-Maroc-AI platform validation: SUCCESS
## 7. Organisation du dépôt
src/ : composants logiciels et noyau cognitif.
tests/ : tests automatisés et expériences.
scripts/ : scripts d'exécution et de validation.
docs/ : documentation technique et expérimentale.
README.md : présentation générale du projet.
## 8. Méthode de travail
Le développement suit une procédure progressive :
Définition d'un objectif technique ou expérimental.
Examen des mécanismes existants.
Définition des critères de réussite.
Développement ou expérimentation.
Exécution des tests.
Analyse des résultats.
Enregistrement des modifications validées dans Git.
Les résultats négatifs sont conservés lorsqu'ils apportent des informations utiles à l'étude du système.
Les modifications du noyau doivent répondre à une nécessité technique identifiée.
## 9. Limites actuelles
AZ-Maroc-AI est une architecture cognitive expérimentale en développement.
Les résultats disponibles concernent des mécanismes et des scénarios déterminés.
Les six capacités du programme ne sont pas encore toutes implémentées.
La mémoire à long terme fait actuellement l'objet de travaux destinés à établir son utilité décisionnelle.
Les performances générales de l'architecture n'ont pas encore fait l'objet d'une évaluation comparative complète et indépendante.
## 10. Orientation du projet
L'objectif à terme est de disposer d'une architecture cognitive autonome intégrant mémoire, apprentissage, planification, métacognition, raisonnement causal et gestion de l'incertitude.
Le développement de ces capacités sera suivi d'un programme de consolidation, puis d'une évaluation comparative avec des systèmes de référence.
Les résultats expérimentaux et les mécanismes effectivement validés serviront de base aux étapes ultérieures du programme de recherche.
