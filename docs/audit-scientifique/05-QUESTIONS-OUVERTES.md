# Questions ouvertes et contrôles complémentaires

## Q-001 — Cohérence après dépassement de profondeur

**Observation :** le contexte de niveau 101 est créé avant que la politique de profondeur provoque une demande d'arrêt pour une impasse `NO_CHANGE`.

**À déterminer :** état des piles, des registres, des WME programmés et de la mémoire effective au moment de la terminaison.

**Méthode envisagée :** lecture de `AZWorkingMemoryChangesApplier`, puis conception d'un test ciblé et non intrusif après validation du protocole.

**Statut :** ouvert ; aucun défaut démontré.

## Q-002 — Sémantique de l'arrêt selon le point d'entrée

**Observation :** les vérifications de `isHalted()` n'interviennent pas aux mêmes frontières dans le moteur natif, le gestionnaire d'élaboration et le lanceur de branches expérimentales.

**À déterminer :** invariants d'exécution après arrêt et conséquences des appels directs à certains composants.

**Statut :** ouvert.

## Q-003 — Reproductibilité des validations

**Observation :** 194 tests d'intégration compilés ont été rapportés comme réussis ; la correspondance des fichiers compilés avec les sources actuelles n'est pas établie par ce seul résultat.

**À déterminer :** révision Git de référence, procédure de compilation et de test non destructive, archivage des journaux et empreintes.

**Statut :** ouvert.
