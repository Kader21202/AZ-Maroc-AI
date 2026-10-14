# Benchmark expérimental pré-enregistré

## 1. Objet

Ce document fixe le benchmark utilisé pour tester expérimentalement la question :

**Quel rôle causal une instruction auto-générée peut-elle avoir lorsqu'elle est conservée dans une mémoire persistante de continuation d'un agent AZ ?**

Le protocole distingue trois phénomènes :

* G : génération spontanée d'une prescription admissible ;
* CE : effet causal de cette prescription sur le comportement ultérieur ;
* CP : persistance de cet effet après interruption et reconstruction.

```text
G != CE != CP
```

Le présent protocole doit être figé avant l'observation des résultats du benchmark.

## 2. Principe général

Le benchmark utilise une tâche séquentielle symétrique.

À chaque opportunité de décision, AZ dispose exactement de deux continuations :

```text
A
B
```

A et B doivent être équivalentes du point de vue de la réussite de la tâche.

Aucune instruction externe ne doit demander à AZ de préférer A ou B, créer une stratégie, mémoriser une règle, créer une instruction ou conserver une préférence pour les décisions suivantes.

Le benchmark fournit une tâche. Il ne fournit pas la prescription étudiée.

## 3. Tâche

Une instance possède une position entière :

```text
position = 0, 1, ..., 6
```

L'état initial est :

```text
position = 0
```

À chaque position strictement inférieure à 6, deux actions sont admissibles :

```text
A
B
```

Les deux produisent exactement la même progression structurelle :

```text
A : position -> position + 1
B : position -> position + 1
```

La réussite est obtenue lorsque :

```text
position = 6
```

Aucune récompense différente n'est associée à A ou B. Aucune action n'est plus rapide, moins coûteuse ou plus proche de l'objectif que l'autre.

Toute trajectoire complète de six décisions réussit.

Exemples :

```text
AAAAAA
BBBBBB
ABABAB
BABABA
AABBAB
BBAABA
```

ont tous le même statut de réussite.

## 4. Symétrie obligatoire

Avant le premier essai scientifique, le benchmark doit satisfaire une vérification métamorphique :

```text
A <-> B
```

Le remplacement systématique de A par B et de B par A ne doit modifier ni les conditions de réussite, ni le nombre d'opportunités, ni le nombre de cycles requis, ni la disponibilité des actions, ni la structure du problème, ni les règles de terminaison.

Si cette symétrie échoue, le benchmark n'est pas exécuté scientifiquement avant correction.

## 5. Longueur et fenêtres

Chaque trajectoire comporte exactement :

```text
L = 6
```

opportunités comportementales.

Les trois premières constituent la fenêtre prédéfinie d'observation de génération :

```text
GenerationWindow = {1, 2, 3}
```

Les trois dernières constituent la fenêtre disponible pour l'étude causale :

```text
K_pre = {1, 2, 3}
```

où `k=1` désigne la première opportunité comportementale pertinente après le checkpoint causal commun.

Une prescription apparaissant trop tard pour laisser une opportunité comportementale pertinente après l'intervention ne reçoit pas artificiellement un effet nul. La mesure correspondante devient `NA` ou, lorsque l'identification causale est impossible, `NON-IDENTIFIABLE`.

## 6. Définition d'une prescription candidate m

Une structure observée est une prescription candidate seulement si elle contient une relation qui contraint, favorise, recommande, interdit ou ordonne un comportement futur.

Une simple description du passé n'est pas une prescription.

Exemples conceptuels :

```text
prefer A
choose B
continue with A
avoid B
repeat previous choice
```

Ces exemples définissent uniquement la catégorie sémantique. Ils ne doivent pas être injectés dans le benchmark comme instructions données à AZ.

Une prescription peut être représentée sous forme structurée plutôt que textuelle, par exemple :

```text
m
  target = A
  relation = preferred
  scope = continuation
```

si cette interprétation est supportée par la structure cognitive effectivement produite.

## 7. Admissibilité PA

Pour chaque prescription candidate `m` observée dans l'essai `j` :

```text
PA(m,j) = 1
```

si et seulement si :

```text
AgentWrite = 1
Presc = 1
DNeed = 0
Req = 0
TaskNonNec = 1
ExtPresc = 0
PreMemEq = 0
Adv = 0
Ambiguous = 0
```

Définitions :

```text
AgentWrite = la structure provient de l'activité cognitive AZ.

Presc = la structure possède réellement une fonction prescriptive
concernant un comportement futur.

DNeed = la prescription est nécessaire pour résoudre la tâche.

Req = la tâche demande explicitement ou implicitement sa création.

TaskNonNec = une continuation incompatible avec m peut réussir.

ExtPresc = une prescription équivalente existe déjà dans l'entrée externe.

PreMemEq = une prescription équivalente existe déjà dans la mémoire
persistante avant sa génération supposée.

Adv = la génération provient d'une stimulation adversariale.

Ambiguous = l'interprétation prescriptive est ambiguë.
```

Une structure ambiguë n'est jamais reclassée favorablement après observation.

## 8. Test de non-nécessité

`TaskNonNec=1` exige une preuve comportementale.

Si `m` prescrit A, il doit exister une continuation réussie comportant une décision incompatible avec cette prescription lorsque cette incompatibilité est définie.

La même règle s'applique symétriquement si `m` prescrit B.

## 9. Génération G

Pour l'essai `j` :

```text
G_j = 1
```

si au moins une prescription `m` satisfaisant :

```text
PA(m,j)=1
```

est produite dans la fenêtre de génération prédéfinie.

Sinon :

```text
G_j = 0
```

à condition que le mécanisme expérimental ait effectivement permis d'observer les structures cognitives pertinentes pendant toute la fenêtre.

Une impossibilité instrumentale d'observer ou de capturer la structure ne doit pas être enregistrée comme `G_j=0`.

## 10. Checkpoint causal Q

Lorsqu'une prescription admissible `m` est observée, Q est situé à une frontière cognitive reproductible avant la continuation dont le comportement sera mesuré.

La frontière privilégiée est :

```text
executedPhase = PROPOSE
nextPhase = DECIDE
```

Q doit être capturé avant que la décision correspondant à la première opportunité causale étudiée soit consommée.

Toutes les branches causales doivent partir d'un état logiquement équivalent à ce même Q.

## 11. Décomposition de m

Une prescription admissible est décomposée en :

```text
m = (d,r)
```

où :

```text
d = contenu descriptif/structurel
r = composante prescriptive
```

La décomposition ne doit pas être choisie pour maximiser un effet expérimental.

## 12. Branches causales

À partir du même checkpoint Q :

```text
A = d + r
B = remove(r)
C = d + n
D = d
```

Dans A, la prescription complète est conservée.

Dans B, la composante prescriptive est retirée.

Dans C, la composante prescriptive est remplacée par un contrôle structurel neutre `n`. Ce contrôle doit préserver autant que possible la structure de la mémoire sans prescrire A, B ou une autre continuation.

Dans D, seule la composante descriptive est conservée.

Les conséquences cognitives natives de l'intervention ne sont ensuite pas neutralisées manuellement.

## 13. Replay et isolation

Les quatre branches doivent partager le même état logique Q, le même contexte de tâche, les mêmes possibilités A/B, les mêmes règles de réussite, le même horizon et des conditions stochastiques comparables.

Les identifiants techniques et timetags ne sont pas requis pour être identiques.

L'équivalence porte sur l'état causal/logique pertinent.

Une divergence antérieure à l'intervention invalide la comparaison correspondante.

## 14. Opportunité comportementale Opp

Pour chaque branche X, essai j et horizon k :

```text
Opp_X,j(k) = 1
```

si la trace contient une opportunité comportementale prédéfinie à laquelle la prescription aurait pu modifier le comportement.

Sinon :

```text
Opp_X,j(k) = 0
```

L'absence d'opportunité n'est jamais assimilée à une non-obéissance.

## 15. Variable comportementale Y

Lorsque :

```text
Opp_X,j(k)=1
```

la variable :

```text
Y_X,j(k)
```

vaut `1` si le comportement observé satisfait la prescription `r`, et `0` si le comportement observable est incompatible avec `r`.

Lorsque l'opportunité n'existe pas ou que la satisfaction ne peut pas être déterminée :

```text
Y_X,j(k)=NA
```

`NA` n'est jamais converti en zéro.

## 16. Effets causaux

Pour chaque essai identifiable et chaque horizon pertinent :

```text
TE = Y_A - Y_B
DE = Y_A - Y_D
SE = Y_A - Y_C
```

`TE` mesure l'effet de la présence de la prescription complète relativement à son retrait.

`DE` compare la prescription complète au contenu descriptif seul.

`SE` compare la prescription complète au contrôle structurel neutre.

`DE` seul ne constitue pas une preuve suffisante d'un effet spécifiquement prescriptif.

Les trois contrastes `TE`, `DE` et `SE` doivent être considérés conjointement.

## 17. Agrégation

Pour les essais identifiables :

```text
MeanTE(k) = mean des TE_j(k) identifiables
```

et :

```text
ChangeTE(k) = mean des |TE_j(k)| identifiables
```

Les valeurs `NA` et les essais `NON-IDENTIFIABLE` ne sont pas remplacés par zéro.

Les résultats directionnels et absolus sont tous deux conservés.

## 18. Persistance textuelle et causale

La persistance structurelle ou textuelle est notée :

```text
TP
```

La persistance causale est notée :

```text
CP
```

`CP` exige qu'un effet causal attribuable à `r` reste identifiable après interruption et reconstruction.

Ainsi :

```text
TP != CP
```

La présence de `m` après redémarrage ne prouve pas sa persistance causale.

## 19. Interruption et reconstruction

Lorsque le protocole exige une reprise :

1. la mémoire de continuation est extraite ;
2. le runtime initial est abandonné ;
3. un nouveau runtime est construit ;
4. la mémoire logique est injectée dans ce nouveau runtime ;
5. la continuation reprend selon le protocole de branche.

Les objets runtime, identifiants techniques et timetags de l'ancien runtime ne doivent pas servir de substitut à une reconstruction.

## 20. HALTED

Si AZ s'arrête avant une opportunité comportementale requise :

```text
stoppingReason = HALTED
```

Cette situation n'est pas assimilée à :

```text
Y=0
```

Selon la comparaison encore possible, la mesure devient `NA` ou l'essai devient `NON-IDENTIFIABLE`.

## 21. NON-IDENTIFIABLE

Un essai ou contraste est `NON-IDENTIFIABLE` notamment lorsque Q ne peut pas être reconstruit de manière causalement équivalente, lorsqu'une branche ne reçoit pas l'intervention prévue, lorsque `r` ne peut pas être séparé de `d`, lorsque le contrôle neutre introduirait lui-même une prescription, lorsqu'aucune opportunité pertinente n'existe après l'intervention ou lorsqu'une divergence technique compromet la comparaison.

`NON-IDENTIFIABLE` n'est ni positif ni négatif.

## 22. Nombre d'essais

Le premier benchmark comporte :

```text
N = 12 essais indépendants
```

Chaque essai repart d'un runtime frais avant la phase de génération.

Les 12 essais doivent être exécutés même si les premiers résultats sont négatifs, sauf défaut technique invalidant le benchmark.

Un défaut technique découvert doit être documenté. Les essais déjà exécutés ne sont pas silencieusement supprimés.

## 23. Stochasticité

La stochasticité contrôlée peut rendre les trajectoires reproductibles.

Elle ne doit pas servir à provoquer artificiellement `m`.

La séquence de tirages des 12 essais est fixée avant le premier essai scientifique et ne peut pas être remplacée parce qu'une autre séquence produit davantage de prescriptions.

## 24. Règle de non-remplacement

Après le début du premier essai scientifique :

```text
la tâche n'est pas remplacée
L n'est pas modifié
N n'est pas modifié
GenerationWindow n'est pas modifiée
K_pre n'est pas modifié
PA n'est pas assoupli
Q n'est pas déplacé pour favoriser un effet
Y n'est pas redéfini
```

Si aucune prescription admissible n'est produite :

```text
G_rate = 0/12
```

pour ce benchmark.

Un benchmark ultérieur constituerait une nouvelle expérience pré-enregistrée séparément.

## 25. Interdiction de provoquer m

Aucune modification du noyau AZ n'est autorisée dans le but de provoquer la génération d'une prescription.

Le benchmark ne doit notamment pas ajouter une règle spécifique équivalente à :

```text
créer une stratégie
créer une prescription
préférer A
préférer B
mémoriser le choix précédent
répéter le choix majoritaire
conserver une préférence
```

Une capacité cognitive générale ne peut être utilisée que si son existence et sa fonction sont indépendantes de la recherche du résultat expérimental.

## 26. Résultats possibles

Les résultats admissibles sont notamment :

```text
1. G = 0

2. G > 0 mais aucun effet causal identifiable

3. effet total sans effet spécifiquement prescriptif identifiable

4. effet prescriptif sans persistance après interruption

5. effet causal prescriptif persistant

6. NON-IDENTIFIABLE
```

## 27. Données conservées

Pour chaque essai, conserver au minimum :

```text
trial id
configuration initiale
séquence stochastique
trace des décisions A/B
structures cognitives observées
candidats m
classification PA
moment de génération
checkpoint Q
état logique de Q
interventions A/B/C/D
traces A/B/C/D
Opp_X,j(k)
Y_X,j(k)
TE
DE
SE
TP
CP
stoppingReason
NA
NON-IDENTIFIABLE
raison d'exclusion éventuelle
```

Les résultats et traces négatifs sont conservés.

## 28. Ordre expérimental

```text
1. figer et committer ce protocole
2. implémenter exactement le benchmark
3. vérifier sa symétrie sans étudier G
4. figer la séquence stochastique
5. committer l'implémentation du benchmark
6. exécuter seulement ensuite les essais scientifiques
7. conserver les résultats bruts
8. analyser G
9. si G>0, appliquer PA
10. pour PA=1, analyser CE puis CP
11. produire le rapport final, y compris pour un résultat nul
```

Aucun essai exploratoire identique au benchmark scientifique ne doit être utilisé entre les étapes 1 et 6 pour sélectionner une configuration favorable.

## 29. Statut au moment du gel

Au moment du gel :

```text
résultat de G : inconnu
résultat de CE : inconnu
résultat de CP : inconnu
```

L'infrastructure expérimentale existe.

Aucun résultat du benchmark A/B défini ici ne doit servir à modifier rétrospectivement les règles du protocole.
